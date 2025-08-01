/**
 * Automatic Data Migration Service
 * Handles automatic migration of data from localStorage to IndexedDB
 * and manages schema updates without user intervention
 */

import { dbManager } from './IndexedDBManager.js';

class MigrationService {
  constructor() {
    this.currentVersion = '2.0';
    this.migrationKey = 'migration_status';
    this.backupKey = 'pre_migration_backup';
    this.isRunning = false;
    
    // Define migration steps
    this.migrations = [
      {
        version: '1.0',
        description: 'Initial localStorage to IndexedDB migration',
        handler: this.migrateFromLocalStorage.bind(this)
      },
      {
        version: '1.1',
        description: 'Add encryption metadata',
        handler: this.addEncryptionMetadata.bind(this)
      },
      {
        version: '2.0',
        description: 'Update schema for cloud sync',
        handler: this.updateCloudSyncSchema.bind(this)
      }
    ];
  }

  /**
   * Run automatic migration check and execution
   */
  async runAutoMigration() {
    if (this.isRunning) {
      console.log('Migration already in progress');
      return;
    }

    try {
      this.isRunning = true;
      console.log('Starting automatic migration check...');

      const migrationStatus = this.getMigrationStatus();
      const currentVersion = migrationStatus.version || '0.0';

      // Check if migration is needed
      if (this.compareVersions(currentVersion, this.currentVersion) >= 0) {
        console.log('No migration needed - system is up to date');
        return;
      }

      console.log(`Migration needed: ${currentVersion} -> ${this.currentVersion}`);

      // Create backup before migration
      await this.createPreMigrationBackup();

      // Run migrations in sequence
      for (const migration of this.migrations) {
        if (this.compareVersions(currentVersion, migration.version) < 0) {
          console.log(`Running migration: ${migration.description}`);
          
          try {
            await migration.handler();
            this.updateMigrationStatus(migration.version, 'completed');
            console.log(`Migration ${migration.version} completed successfully`);
          } catch (error) {
            console.error(`Migration ${migration.version} failed:`, error);
            this.updateMigrationStatus(migration.version, 'failed', error.message);
            
            // For critical migrations, we might want to restore backup
            if (migration.version === '1.0') {
              await this.restorePreMigrationBackup();
              throw new Error(`Critical migration failed: ${error.message}`);
            }
          }
        }
      }

      // Update final version
      this.updateMigrationStatus(this.currentVersion, 'completed');
      console.log('All migrations completed successfully');

      // Clean up old backup after successful migration
      this.cleanupOldBackups();

    } catch (error) {
      console.error('Migration process failed:', error);
      this.updateMigrationStatus(null, 'failed', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Migration 1.0: Move data from localStorage to IndexedDB
   */
  async migrateFromLocalStorage() {
    const entities = [
      'events', 'tasks', 'systemUsers', 'clients', 'tags', 
      'workHours', 'comments', 'personalMessages', 'chats', 
      'canvas', 'seasonalClients'
    ];

    let totalMigrated = 0;
    const migrationLog = [];

    for (const entityName of entities) {
      try {
        const localData = localStorage.getItem(entityName);
        if (!localData) {
          migrationLog.push(`${entityName}: No data to migrate`);
          continue;
        }

        const items = JSON.parse(localData);
        if (!Array.isArray(items) || items.length === 0) {
          migrationLog.push(`${entityName}: No valid data to migrate`);
          continue;
        }

        // Check if data already exists in IndexedDB
        const existingData = await dbManager.getAll(entityName);
        if (existingData.length > 0) {
          migrationLog.push(`${entityName}: Data already exists in IndexedDB, merging...`);
          
          // Merge data - prefer IndexedDB data for conflicts
          const mergedData = this.mergeEntityData(existingData, items);
          
          // Clear and re-add merged data
          await this.replaceEntityData(entityName, mergedData);
          totalMigrated += mergedData.length;
          migrationLog.push(`${entityName}: Merged ${mergedData.length} items`);
        } else {
          // Direct migration
          for (const item of items) {
            try {
              // Ensure proper structure
              const migratedItem = this.normalizeItem(item);
              await dbManager.create(entityName, migratedItem);
              totalMigrated++;
            } catch (error) {
              console.warn(`Failed to migrate ${entityName} item:`, error);
            }
          }
          migrationLog.push(`${entityName}: Migrated ${items.length} items`);
        }

        // Keep localStorage data as backup for now
        localStorage.setItem(`${entityName}_backup`, localData);
        
      } catch (error) {
        console.error(`Failed to migrate ${entityName}:`, error);
        migrationLog.push(`${entityName}: Migration failed - ${error.message}`);
      }
    }

    // Store migration log
    localStorage.setItem('migration_log_1.0', JSON.stringify({
      timestamp: new Date().toISOString(),
      totalMigrated,
      log: migrationLog
    }));

    console.log(`Migration 1.0 completed: ${totalMigrated} items migrated`);
  }

  /**
   * Migration 1.1: Add encryption metadata to existing records
   */
  async addEncryptionMetadata() {
    const entities = ['systemUsers', 'clients', 'personalMessages', 'comments', 'workHours'];
    
    for (const entityName of entities) {
      try {
        const items = await dbManager.getAll(entityName);
        
        for (const item of items) {
          // Add encryption metadata if not present
          if (!item.hasOwnProperty('_encrypted')) {
            await dbManager.update(entityName, item.id, {
              _encrypted: false,
              _migration_1_1: true
            });
          }
        }
        
        console.log(`Added encryption metadata to ${items.length} ${entityName} items`);
      } catch (error) {
        console.error(`Failed to add encryption metadata to ${entityName}:`, error);
      }
    }
  }

  /**
   * Migration 2.0: Update schema for cloud sync
   */
  async updateCloudSyncSchema() {
    const entities = Object.keys(dbManager.entities).filter(name => !name.startsWith('_'));
    
    for (const entityName of entities) {
      try {
        const items = await dbManager.getAll(entityName);
        
        for (const item of items) {
          const updates = {};
          
          // Add sync metadata if not present
          if (!item.hasOwnProperty('_synced')) {
            updates._synced = false;
          }
          
          if (!item.hasOwnProperty('_version')) {
            updates._version = 1;
          }
          
          if (!item.hasOwnProperty('updated_at') && item.created_at) {
            updates.updated_at = item.created_at;
          }
          
          // Update if needed
          if (Object.keys(updates).length > 0) {
            await dbManager.update(entityName, item.id, {
              ...updates,
              _migration_2_0: true
            });
          }
        }
        
        console.log(`Updated cloud sync schema for ${items.length} ${entityName} items`);
      } catch (error) {
        console.error(`Failed to update cloud sync schema for ${entityName}:`, error);
      }
    }
  }

  /**
   * Create backup before migration
   */
  async createPreMigrationBackup() {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        version: this.getMigrationStatus().version || '0.0',
        localStorage: {},
        indexedDB: {}
      };

      // Backup localStorage data
      const entities = [
        'events', 'tasks', 'systemUsers', 'clients', 'tags',
        'workHours', 'comments', 'personalMessages', 'chats',
        'canvas', 'seasonalClients', 'currentUser'
      ];

      for (const key of entities) {
        const data = localStorage.getItem(key);
        if (data) {
          backup.localStorage[key] = data;
        }
      }

      // Backup IndexedDB data
      try {
        const dbEntities = Object.keys(dbManager.entities).filter(name => !name.startsWith('_'));
        for (const entityName of dbEntities) {
          const data = await dbManager.getAll(entityName);
          if (data.length > 0) {
            backup.indexedDB[entityName] = data;
          }
        }
      } catch (error) {
        console.warn('Failed to backup IndexedDB data:', error);
      }

      // Store backup
      localStorage.setItem(this.backupKey, JSON.stringify(backup));
      console.log('Pre-migration backup created');
      
    } catch (error) {
      console.error('Failed to create pre-migration backup:', error);
      throw error;
    }
  }

  /**
   * Restore from pre-migration backup
   */
  async restorePreMigrationBackup() {
    try {
      const backupData = localStorage.getItem(this.backupKey);
      if (!backupData) {
        throw new Error('No backup found');
      }

      const backup = JSON.parse(backupData);
      console.log('Restoring from pre-migration backup...');

      // Restore localStorage data
      for (const [key, value] of Object.entries(backup.localStorage)) {
        localStorage.setItem(key, value);
      }

      // Clear IndexedDB and restore if needed
      if (backup.indexedDB && Object.keys(backup.indexedDB).length > 0) {
        await dbManager.clearAll();
        
        for (const [entityName, items] of Object.entries(backup.indexedDB)) {
          for (const item of items) {
            try {
              await dbManager.create(entityName, item);
            } catch (error) {
              console.warn(`Failed to restore ${entityName} item:`, error);
            }
          }
        }
      }

      console.log('Pre-migration backup restored successfully');
    } catch (error) {
      console.error('Failed to restore pre-migration backup:', error);
      throw error;
    }
  }

  /**
   * Merge entity data from different sources
   */
  mergeEntityData(indexedDBData, localStorageData) {
    const merged = new Map();
    
    // Add IndexedDB data first (higher priority)
    indexedDBData.forEach(item => {
      merged.set(item.id, item);
    });
    
    // Add localStorage data if not exists or if newer
    localStorageData.forEach(item => {
      const existing = merged.get(item.id);
      if (!existing) {
        merged.set(item.id, this.normalizeItem(item));
      } else {
        // Check which is newer
        const existingTime = new Date(existing.updated_at || existing.created_at || 0);
        const itemTime = new Date(item.updated_at || item.created_at || 0);
        
        if (itemTime > existingTime) {
          merged.set(item.id, this.normalizeItem(item));
        }
      }
    });
    
    return Array.from(merged.values());
  }

  /**
   * Replace all data for an entity
   */
  async replaceEntityData(entityName, items) {
    // Get all existing items
    const existing = await dbManager.getAll(entityName);
    
    // Delete all existing items
    for (const item of existing) {
      await dbManager.delete(entityName, item.id);
    }
    
    // Add new items
    for (const item of items) {
      await dbManager.create(entityName, item);
    }
  }

  /**
   * Normalize item structure
   */
  normalizeItem(item) {
    return {
      ...item,
      id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || item.created_at || new Date().toISOString(),
      _synced: false,
      _version: 1
    };
  }

  /**
   * Get migration status
   */
  getMigrationStatus() {
    try {
      const status = localStorage.getItem(this.migrationKey);
      return status ? JSON.parse(status) : { version: '0.0', status: 'pending' };
    } catch {
      return { version: '0.0', status: 'pending' };
    }
  }

  /**
   * Update migration status
   */
  updateMigrationStatus(version, status, error = null) {
    const migrationStatus = {
      version: version || this.getMigrationStatus().version,
      status,
      timestamp: new Date().toISOString(),
      error
    };
    
    localStorage.setItem(this.migrationKey, JSON.stringify(migrationStatus));
  }

  /**
   * Compare version strings
   */
  compareVersions(version1, version2) {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part < v2Part) return -1;
      if (v1Part > v2Part) return 1;
    }
    
    return 0;
  }

  /**
   * Clean up old backups
   */
  cleanupOldBackups() {
    try {
      // Remove pre-migration backup after successful migration
      localStorage.removeItem(this.backupKey);
      
      // Clean up old entity backups (keep for 7 days)
      const entities = [
        'events', 'tasks', 'systemUsers', 'clients', 'tags',
        'workHours', 'comments', 'personalMessages', 'chats',
        'canvas', 'seasonalClients'
      ];
      
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const migrationStatus = this.getMigrationStatus();
      const migrationTime = new Date(migrationStatus.timestamp).getTime();
      
      if (migrationTime < sevenDaysAgo) {
        entities.forEach(entity => {
          localStorage.removeItem(`${entity}_backup`);
        });
        console.log('Cleaned up old migration backups');
      }
      
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Check if migration is needed
   */
  isMigrationNeeded() {
    const migrationStatus = this.getMigrationStatus();
    return this.compareVersions(migrationStatus.version || '0.0', this.currentVersion) < 0;
  }

  /**
   * Get migration progress
   */
  getMigrationProgress() {
    const status = this.getMigrationStatus();
    const completedMigrations = this.migrations.filter(m => 
      this.compareVersions(status.version || '0.0', m.version) >= 0
    ).length;
    
    return {
      isRunning: this.isRunning,
      currentVersion: status.version || '0.0',
      targetVersion: this.currentVersion,
      progress: (completedMigrations / this.migrations.length) * 100,
      status: status.status,
      error: status.error
    };
  }
}

// Create and export singleton instance
export const migrationService = new MigrationService();
export default migrationService;
