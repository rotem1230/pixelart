
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Shield, 
  Mail, 
  Phone, 
  Calendar,
  Settings,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkHoursReport from "../components/team/WorkHoursReport";

export default function TeamManagement() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, currentUserData] = await Promise.all([
        User.getAll(),
        User.getCurrentUser()
      ]);
      
      console.log("Current user data:", currentUserData);
      console.log("Users data:", usersData);
      
      // If no users exist, initialize with current user
      if (usersData.length === 0 && currentUserData) {
        const initialUser = {
          id: currentUserData.id || Date.now().toString(),
          name: currentUserData.name || currentUserData.full_name,
          full_name: currentUserData.full_name || currentUserData.name,
          email: currentUserData.email,
          role: currentUserData.role || 'admin',
          phone: '',
          position: currentUserData.role === 'admin' ? 'מנהל מערכת' : 'עובד',
          hire_date: new Date().toISOString().split('T')[0],
          is_approved: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          last_login: new Date().toISOString(),
          permissions: currentUserData.permissions || {}
        };
        
        localStorage.setItem('systemUsers', JSON.stringify([initialUser]));
        setUsers([initialUser]);
      } else {
        setUsers(usersData);
      }
      
      setCurrentUser(currentUserData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const saveUserPermissions = async (userId) => {
    if (!editingPermissions[userId]) return;
    
    setSavingUserId(userId);
    try {
      // Create a permissions object that includes all keys, setting undefined to false
      const permissionsToSave = {
        can_create_events: editingPermissions[userId].can_create_events || false,
        can_edit_events: editingPermissions[userId].can_edit_events || false,
        can_delete_events: editingPermissions[userId].can_delete_events || false,
        can_create_tasks: editingPermissions[userId].can_create_tasks || false,
        can_edit_tasks: editingPermissions[userId].can_edit_tasks || false,
        can_delete_tasks: editingPermissions[userId].can_delete_tasks || false,
        can_view_all_work_hours: editingPermissions[userId].can_view_all_work_hours || false,
        can_approve_work_hours: editingPermissions[userId].can_approve_work_hours || false,
        can_delete_comments: editingPermissions[userId].can_delete_comments || false,
        can_delete_own_comments: editingPermissions[userId].can_delete_own_comments !== false, // default to true
      };

      await User.update(userId, { permissions: permissionsToSave });
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, permissions: permissionsToSave } : user
      ));
      
      setEditingPermissions(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      
      alert("הרשאות עודכנו בהצלחה!");
      
    } catch (error) {
      console.error("Error updating permissions:", error);
      alert("שגיאה בעדכון הרשאות");
    }
    setSavingUserId(null);
  };

  const handlePermissionChange = (userId, permission, value) => {
    const user = users.find(u => u.id === userId);
    const currentPermissions = editingPermissions[userId] || user.permissions || {};
    
    setEditingPermissions(prev => ({
      ...prev,
      [userId]: {
        ...currentPermissions,
        [permission]: value
      }
    }));
  };

  const cancelPermissionChanges = (userId) => {
    setEditingPermissions(prev => {
      const updated = { ...prev };
      delete updated[userId];
      return updated;
    });
  };

  const getDisplayPermissions = (user) => {
    return editingPermissions[user.id] || user.permissions || {};
  };

  const hasUnsavedChanges = (userId) => {
    return !!editingPermissions[userId];
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8" dir="rtl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no current user data, show error
  if (!currentUser) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">שגיאה בטעינת נתוני המשתמש</h1>
        <p className="text-gray-600">לא ניתן לטעון את פרטי המשתמש הנוכחי.</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          רענן דף
        </Button>
      </div>
    );
  }

  // Check if user has admin permissions
  const isAdmin = currentUser?.role === 'admin' || currentUser?.is_admin === true;
  
  if (!isAdmin && currentUser) {
    return (
      <div className="p-8 text-center" dir="rtl">
        <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold">אין לך הרשאת גישה</h1>
        <p className="text-gray-600">עמוד זה זמין למנהלי מערכת בלבד.</p>
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
          <p>משתמש נוכחי: {currentUser.full_name || currentUser.name || currentUser.email}</p>
          <p>תפקיד: {currentUser.role || 'לא מוגדר'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            ניהול צוות
          </h1>
          <p className="text-gray-600">
            נהל משתמשים, הרשאות ודוחות שעות עבודה.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{users.length} משתמשים במערכת</span>
        </div>
      </div>

      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mr-auto">
          <TabsTrigger value="work_hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            דוחות שעות
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            ניהול הרשאות
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="permissions" className="mt-6">
          {/* Users Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {users.map(user => (
              <Card key={user.id} className={`transition-all duration-200 ${hasUnsavedChanges(user.id) ? "border-orange-200 bg-orange-50/30 shadow-md" : "hover:shadow-md"}`}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {user.full_name ? user.full_name.charAt(0) : 'מ'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg flex items-center gap-2 truncate">
                          {user.full_name || "משתמש"}
                          {hasUnsavedChanges(user.id) && (
                            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600 truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}>
                        {user.role === 'admin' ? 'מנהל' : 'עובד'}
                      </Badge>
                      {user.is_approved ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          מאושר
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          ממתין
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* User Info */}
                  <div className="grid md:grid-cols-2 gap-x-6 gap-y-8">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        פרטי משתמש
                      </h4>
                      <div className="space-y-2 text-sm">
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {user.position && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span>{user.position}</span>
                          </div>
                        )}
                        {user.hire_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>תאריך קבלה: {format(new Date(user.hire_date), "d בMMMM yyyy", { locale: he })}</span>
                          </div>
                        )}
                        {user.last_login && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>כניסה אחרונה: {format(new Date(user.last_login), "d בMMMM, HH:mm", { locale: he })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          הרשאות מערכת
                        </h4>
                        
                        {hasUnsavedChanges(user.id) && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => cancelPermissionChanges(user.id)}
                              className="h-7 px-2 text-xs"
                            >
                              <X className="w-3 h-3 mr-1" />
                              ביטול
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveUserPermissions(user.id)}
                              disabled={savingUserId === user.id}
                              className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              {savingUserId === user.id ? "שומר..." : "שמור"}
                            </Button>
                          </div>
                        )}
                      </div>

                      {hasUnsavedChanges(user.id) && (
                        <div className="bg-orange-100 border border-orange-200 rounded-md p-2 mb-3">
                          <div className="flex items-center gap-2 text-sm text-orange-800">
                            <AlertTriangle className="w-4 h-4" />
                            <span>יש שינויים שלא נשמרו</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        {[
                          { key: 'can_create_events', label: 'יצירת אירועים' },
                          { key: 'can_edit_events', label: 'עריכת אירועים' },
                          { key: 'can_delete_events', label: 'מחיקת/ארכוב אירועים' },
                          { key: 'can_create_tasks', label: 'יצירת משימות' },
                          { key: 'can_edit_tasks', label: 'עריכת משימות' },
                          { key: 'can_delete_tasks', label: 'מחיקת משימות' },
                          { key: 'can_view_all_work_hours', label: 'צפייה בכל שעות העבודה' },
                          { key: 'can_approve_work_hours', label: 'אישור שעות עבודה' },
                          { key: 'can_delete_comments', label: 'מחיקת כל התגובות' },
                          { key: 'can_delete_own_comments', label: 'מחיקת התגובות שלו' }
                        ].map(permission => (
                          <div key={permission.key} className="flex items-center justify-between">
                            <Label htmlFor={`${user.id}-${permission.key}`} className="text-sm cursor-pointer">
                              {permission.label}
                            </Label>
                            <Switch
                              id={`${user.id}-${permission.key}`}
                              checked={getDisplayPermissions(user)[permission.key] || false}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(user.id, permission.key, checked)
                              }
                              disabled={user.id === currentUser?.id || user.role === 'admin'}
                            />
                          </div>
                        ))}
                      </div>
                      {user.id === currentUser?.id && (
                        <p className="text-xs text-gray-500 mt-2">
                          לא ניתן לערוך את ההרשאות שלך
                        </p>
                      )}
                      {user.role === 'admin' && user.id !== currentUser?.id && (
                         <p className="text-xs text-gray-500 mt-2">
                          למנהלים יש את כל ההרשאות
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="work_hours" className="mt-6">
          <WorkHoursReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
