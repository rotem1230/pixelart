/**
 * Backup and Restore Service
 * Handles data backup, restore, and migration across devices
 */

import { dbManager } from './IndexedDBManager.js';
import { cloudSync } from './CloudSyncService.js';

class BackupService {
  constructor() {
    this.backupVersion = '2.0';
    this.compressionEnabled = true;
  }

  /**
   * Create a full backup of all data
   */
  async createBackup(options = {}) {
    const {
      includeMetadata = true,
      includeUserData = true,
      includeSystemData = true,
      compress = this.compressionEnabled
    } = options;

    try {
      console.log('Creating backup...');
      
      const backup = {
        version: this.backupVersion,
        timestamp: new Date().toISOString(),
        deviceId: localStorage.getItem('deviceId'),
        userId: this._getCurrentUserId(),
        options: { includeMetadata, includeUserData, includeSystemData },
        data: {}
      };

      // Get all entity data
      const entities = this._getEntitiesToBackup(includeUserData, includeSystemData);
      
      for (const entityName of entities) {
        try {
          const data = await dbManager.getAll(entityName);
          backup.data[entityName] = data;
          console.log(`Backed up ${data.length} ${entityName} items`);
        } catch (error) {
          console.warn(`Failed to backup ${entityName}:`, error);
          backup.data[entityName] = [];
        }
      }

      // Include metadata if requested
      if (includeMetadata) {
        try {
          backup.metadata = await dbManager.getAll('_metadata');
          backup.syncQueue = await dbManager.getAll('_syncQueue');
        } catch (error) {
          console.warn('Failed to backup metadata:', error);
        }
      }

      // Add backup statistics
      backup.stats = {
        totalEntities: Object.keys(backup.data).length,
        totalItems: Object.values(backup.data).reduce((sum, items) => sum + items.length, 0),
        backupSize: JSON.stringify(backup).length
      };

      // Compress if enabled
      if (compress) {
        backup.compressed = true;
        backup.data = await this._compressData(backup.data);
      }

      console.log(`Backup created: ${backup.stats.totalItems} items across ${backup.stats.totalEntities} entities`);
      return backup;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Restore data from backup
   */
  async restoreBackup(backup, options = {}) {
    const {
      clearExisting = false,
      mergeStrategy = 'latest_wins', // 'latest_wins', 'backup_wins', 'keep_both'
      validateData = true
    } = options;

    try {
      console.log('Restoring backup...');

      // Validate backup format
      if (!this._validateBackup(backup)) {
        throw new Error('Invalid backup format');
      }

      // Decompress if needed
      let backupData = backup.data;
      if (backup.compressed) {
        backupData = await this._decompressData(backup.data);
      }

      // Clear existing data if requested
      if (clearExisting) {
        console.log('Clearing existing data...');
        await dbManager.clearAll();
      }

      let restoredCount = 0;
      const errors = [];

      // Restore each entity
      for (const [entityName, items] of Object.entries(backupData)) {
        try {
          console.log(`Restoring ${items.length} ${entityName} items...`);
          
          for (const item of items) {
            try {
              if (validateData && !this._validateItem(entityName, item)) {
                console.warn(`Invalid item in ${entityName}:`, item);
                continue;
              }

              if (clearExisting) {
                // Direct create since we cleared everything
                await dbManager.create(entityName, item);
                restoredCount++;
              } else {
                // Check if item exists and apply merge strategy
                const existing = await dbManager.get(entityName, item.id);
                
                if (!existing) {
                  await dbManager.create(entityName, item);
                  restoredCount++;
                } else {
                  const shouldUpdate = this._shouldUpdateItem(existing, item, mergeStrategy);
                  if (shouldUpdate) {
                    await dbManager.update(entityName, item.id, item);
                    restoredCount++;
                  }
                }
              }
            } catch (itemError) {
              console.warn(`Failed to restore ${entityName} item:`, itemError);
              errors.push({ entityName, item: item.id, error: itemError.message });
            }
          }
        } catch (entityError) {
          console.error(`Failed to restore ${entityName}:`, entityError);
          errors.push({ entityName, error: entityError.message });
        }
      }

      // Restore metadata if available
      if (backup.metadata) {
        try {
          for (const metaItem of backup.metadata) {
            await dbManager.create('_metadata', metaItem);
          }
        } catch (error) {
          console.warn('Failed to restore metadata:', error);
        }
      }

      // Trigger sync after restore
      const currentUser = this._getCurrentUserId();
      if (currentUser) {
        cloudSync.setUserId(currentUser);
        cloudSync.syncAll().catch(error => {
          console.warn('Sync after restore failed:', error);
        });
      }

      const result = {
        success: true,
        restoredCount,
        totalItems: Object.values(backupData).reduce((sum, items) => sum + items.length, 0),
        errors,
        backupInfo: {
          version: backup.version,
          timestamp: backup.timestamp,
          deviceId: backup.deviceId,
          userId: backup.userId
        }
      };

      console.log(`Restore completed: ${restoredCount} items restored, ${errors.length} errors`);
      return result;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * Export backup to file
   */
  async exportBackupToFile(backup, filename) {
    try {
      const backupJson = JSON.stringify(backup, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `pixelart-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log(`Backup exported to file: ${link.download}`);
      return { filename: link.download, size: blob.size };
    } catch (error) {
      console.error('Failed to export backup:', error);
      throw error;
    }
  }

  /**
   * Import backup from file
   */
  async importBackupFromFile(file) {
    try {
      const text = await this._readFileAsText(file);
      const backup = JSON.parse(text);
      
      if (!this._validateBackup(backup)) {
        throw new Error('Invalid backup file format');
      }
      
      console.log(`Backup file imported: ${file.name}`);
      return backup;
    } catch (error) {
      console.error('Failed to import backup file:', error);
      throw error;
    }
  }

  /**
   * Create automatic backup
   */
  async createAutoBackup() {
    try {
      const backup = await this.createBackup({
        includeMetadata: false, // Skip metadata for auto backups
        compress: true
      });
      
      // Store in localStorage with rotation
      const autoBackups = this._getAutoBackups();
      autoBackups.push({
        timestamp: backup.timestamp,
        backup: backup
      });
      
      // Keep only last 5 auto backups
      if (autoBackups.length > 5) {
        autoBackups.splice(0, autoBackups.length - 5);
      }
      
      localStorage.setItem('autoBackups', JSON.stringify(autoBackups));
      console.log('Auto backup created');
      
      return backup;
    } catch (error) {
      console.error('Failed to create auto backup:', error);
    }
  }

  /**
   * Get list of auto backups
   */
  getAutoBackups() {
    return this._getAutoBackups().map(item => ({
      timestamp: item.timestamp,
      stats: item.backup.stats
    }));
  }

  /**
   * Restore from auto backup
   */
  async restoreAutoBackup(timestamp) {
    const autoBackups = this._getAutoBackups();
    const backupItem = autoBackups.find(item => item.timestamp === timestamp);
    
    if (!backupItem) {
      throw new Error('Auto backup not found');
    }
    
    return await this.restoreBackup(backupItem.backup);
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      const stats = await dbManager.getStats();
      const autoBackups = this.getAutoBackups();
      
      return {
        database: stats,
        autoBackups: {
          count: autoBackups.length,
          latest: autoBackups.length > 0 ? autoBackups[autoBackups.length - 1].timestamp : null
        },
        syncStatus: cloudSync.getSyncStatus()
      };
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return {};
    }
  }

  // Private methods

  _getCurrentUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      return user?.id || null;
    } catch {
      return null;
    }
  }

  _getEntitiesToBackup(includeUserData, includeSystemData) {
    const userEntities = ['events', 'tasks', 'workHours', 'comments', 'personalMessages', 'chats', 'canvas'];
    const systemEntities = ['systemUsers', 'clients', 'seasonalClients', 'tags'];
    
    let entities = [];
    if (includeUserData) entities.push(...userEntities);
    if (includeSystemData) entities.push(...systemEntities);
    
    return entities;
  }

  _validateBackup(backup) {
    return backup && 
           backup.version && 
           backup.timestamp && 
           backup.data && 
           typeof backup.data === 'object';
  }

  _validateItem(entityName, item) {
    return item && 
           item.id && 
           (item.created_at || item.updated_at);
  }

  _shouldUpdateItem(existing, backup, strategy) {
    switch (strategy) {
      case 'backup_wins':
        return true;
      case 'keep_both':
        return false;
      case 'latest_wins':
      default:
        const existingTime = new Date(existing.updated_at || existing.created_at);
        const backupTime = new Date(backup.updated_at || backup.created_at);
        return backupTime > existingTime;
    }
  }

  _getAutoBackups() {
    try {
      const data = localStorage.getItem('autoBackups');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async _compressData(data) {
    // Simple compression using JSON stringify with reduced whitespace
    // In a real implementation, you might use a compression library
    return JSON.stringify(data);
  }

  async _decompressData(compressedData) {
    // Simple decompression
    return typeof compressedData === 'string' ? JSON.parse(compressedData) : compressedData;
  }

  _readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
}

// Create and export singleton instance
export const backupService = new BackupService();
export default backupService;
