import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  HardDrive, 
  Cloud, 
  Wifi, 
  WifiOff,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DatabaseManager() {
  const [stats, setStats] = useState({});
  const [syncStatus, setSyncStatus] = useState({});
  const [backupStats, setBackupStats] = useState({});
  const [migrationStatus, setMigrationStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [autoBackups, setAutoBackups] = useState([]);

  useEffect(() => {
    loadStats();
    loadSyncStatus();
    loadBackupStats();
    loadMigrationStatus();
    loadAutoBackups();

    // Update sync status every 10 seconds
    const interval = setInterval(() => {
      loadSyncStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const dbStats = await base44.database.getStats();
      setStats(dbStats);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const status = base44.database.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const loadBackupStats = async () => {
    try {
      const stats = await base44.database.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error('Failed to load backup stats:', error);
    }
  };

  const loadMigrationStatus = async () => {
    try {
      const status = base44.database.getMigrationProgress();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Failed to load migration status:', error);
    }
  };

  const loadAutoBackups = () => {
    try {
      const backups = base44.database.getAutoBackups();
      setAutoBackups(backups);
    } catch (error) {
      console.error('Failed to load auto backups:', error);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const backup = await base44.database.createBackup({
        includeMetadata: true,
        includeUserData: true,
        includeSystemData: true,
        compress: true
      });

      const filename = `pixelart-backup-${new Date().toISOString().split('T')[0]}.json`;
      await base44.database.exportBackup(backup, filename);

      setMessage({
        type: 'success',
        text: `גיבוי נוצר בהצלחה: ${backup.stats.totalItems} פריטים נשמרו`
      });

      loadBackupStats();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `שגיאה ביצירת גיבוי: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const backup = await base44.database.importBackup(file);
      const result = await base44.database.restoreBackup(backup, {
        clearExisting: false,
        mergeStrategy: 'latest_wins'
      });

      setMessage({
        type: 'success',
        text: `גיבוי שוחזר בהצלחה: ${result.restoredCount} פריטים שוחזרו`
      });

      loadStats();
      loadBackupStats();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `שגיאה בשחזור גיבוי: ${error.message}`
      });
    } finally {
      setIsLoading(false);
      event.target.value = '';
    }
  };

  const handleForceSync = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await base44.database.forceSync();
      setMessage({
        type: 'success',
        text: 'סנכרון הושלם בהצלחה'
      });
      loadSyncStatus();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `שגיאה בסנכרון: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים? פעולה זו לא ניתנת לביטול!')) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await base44.database.clearAll();
      setMessage({
        type: 'success',
        text: 'כל הנתונים נמחקו בהצלחה'
      });
      loadStats();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `שגיאה במחיקת נתונים: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAutoBackup = async () => {
    setIsLoading(true);
    try {
      await base44.database.createAutoBackup();
      setMessage({
        type: 'success',
        text: 'גיבוי אוטומטי נוצר בהצלחה'
      });
      loadAutoBackups();
      loadBackupStats();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `שגיאה ביצירת גיבוי אוטומטי: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreAutoBackup = async (timestamp) => {
    if (!window.confirm('האם אתה בטוח שברצונך לשחזר גיבוי זה?')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await base44.database.restoreAutoBackup(timestamp);
      setMessage({
        type: 'success',
        text: `גיבוי שוחזר בהצלחה: ${result.restoredCount} פריטים`
      });
      loadStats();
    } catch (error) {
      setMessage({
        type: 'error',
        text: `שגיאה בשחזור גיבוי: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('he-IL');
  };

  const getSyncStatusIcon = () => {
    if (!syncStatus.isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (syncStatus.syncInProgress) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  const getSyncStatusText = () => {
    if (!syncStatus.isOnline) return 'לא מחובר';
    if (syncStatus.syncInProgress) return 'מסנכרן...';
    return 'מחובר';
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">ניהול מסד נתונים</h2>
        <div className="flex items-center gap-2">
          {getSyncStatusIcon()}
          <span className="text-sm text-gray-600">{getSyncStatusText()}</span>
        </div>
      </div>

      {/* Cross-device sync info */}
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <div>
              <strong>סנכרון אוטומטי בין מחשבים:</strong>
            </div>
            <div className="text-sm">
              • <strong>ללא הגדרה:</strong> השתמש בגיבוי ידני (צור גיבוי כאן ושחזר במחשב השני)
            </div>
            <div className="text-sm">
              • <strong>עם GitHub Token:</strong> הוסף <code>VITE_GITHUB_TOKEN</code> ו-<code>VITE_GITHUB_USERNAME</code> לקובץ .env לסנכרון אוטומטי
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {message && (
        <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Database Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            סטטיסטיקות מסד נתונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats).map(([entity, count]) => (
              <div key={entity} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600">{entity}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Migration Status */}
      {migrationStatus && (migrationStatus.isRunning || migrationStatus.currentVersion !== migrationStatus.targetVersion) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className={`w-5 h-5 ${migrationStatus.isRunning ? 'animate-spin' : ''}`} />
              סטטוס מיגרציה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">גרסה נוכחית:</span>
                <Badge variant="outline">{migrationStatus.currentVersion}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">גרסת יעד:</span>
                <Badge variant="outline">{migrationStatus.targetVersion}</Badge>
              </div>
              {migrationStatus.progress !== undefined && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">התקדמות:</span>
                    <span className="text-sm font-medium">{Math.round(migrationStatus.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${migrationStatus.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              {migrationStatus.error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    שגיאה במיגרציה: {migrationStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            סטטוס סנכרון
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
                {syncStatus.isOnline ? 'מחובר' : 'לא מחובר'}
              </Badge>
              <span className="text-sm text-gray-600">סטטוס רשת</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={syncStatus.lastSyncTime ? 'default' : 'secondary'}>
                {syncStatus.lastSyncTime ? formatDate(syncStatus.lastSyncTime) : 'לא סונכרן'}
              </Badge>
              <span className="text-sm text-gray-600">סנכרון אחרון</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {syncStatus.queuedOperations || 0}
              </Badge>
              <span className="text-sm text-gray-600">פעולות בתור</span>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={handleForceSync} 
              disabled={isLoading || !syncStatus.isOnline}
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              סנכרון כעת
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            ניהול גיבויים
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCreateBackup} disabled={isLoading}>
                <Download className="w-4 h-4 mr-2" />
                יצירת גיבוי
              </Button>
              
              <Button onClick={handleCreateAutoBackup} disabled={isLoading} variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                גיבוי אוטומטי
              </Button>
              
              <label className="cursor-pointer">
                <Button variant="outline" disabled={isLoading} asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    שחזור גיבוי
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
              
              <Button 
                onClick={handleClearData} 
                disabled={isLoading} 
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                מחיקת כל הנתונים
              </Button>
            </div>

            {/* Auto Backups List */}
            {autoBackups.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">גיבויים אוטומטיים</h4>
                <div className="space-y-2">
                  {autoBackups.map((backup) => (
                    <div key={backup.timestamp} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="font-medium">{formatDate(backup.timestamp)}</div>
                          <div className="text-sm text-gray-600">
                            {backup.stats?.totalItems || 0} פריטים
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreAutoBackup(backup.timestamp)}
                        disabled={isLoading}
                      >
                        שחזר
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>מעבד...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
