import { dbManager } from './database/IndexedDBManager.js';
import { cloudSync } from './database/CloudSyncService.js';
import { backupService } from './database/BackupService.js';
import { encryptionService } from './database/EncryptionService.js';
import { migrationService } from './database/MigrationService.js';
import { crossDeviceAuth } from './database/CrossDeviceAuthService.js';

class CustomSDK {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api';
    this.currentUser = null;
    this.syncEnabled = true; // Enable cloud sync
    this.syncInterval = null;
    this.dbManager = dbManager;
    this.cloudSync = cloudSync;
    this.backupService = backupService;
    this.encryptionService = encryptionService;
    this.migrationService = migrationService;
    this.crossDeviceAuth = crossDeviceAuth;
    this.encryptionPassword = null;
    this.initDatabase();
  }

  // Initialize database and cloud sync
  async initDatabase() {
    try {
      // Initialize IndexedDB
      await this.dbManager.init();
      console.log('Database initialized successfully');

      // Run automatic migration (silent, no user intervention)
      await this.runAutoMigration();

      // Initialize cloud sync
      this.initCloudSync();

    } catch (error) {
      console.error('Database initialization failed:', error);
      // Fallback to localStorage if IndexedDB fails
      this.fallbackToLocalStorage = true;
    }
  }

  // Run automatic migration
  async runAutoMigration() {
    try {
      // Check if migration is needed
      if (this.migrationService.isMigrationNeeded()) {
        console.log('Running automatic data migration...');

        // Show subtle loading indicator (optional)
        this.showMigrationIndicator();

        // Run migration silently
        await this.migrationService.runAutoMigration();

        console.log('Automatic migration completed successfully');

        // Hide loading indicator
        this.hideMigrationIndicator();

        // Show success notification (brief, non-intrusive)
        this.showMigrationSuccess();
      }
    } catch (error) {
      console.error('Automatic migration failed:', error);

      // Hide loading indicator
      this.hideMigrationIndicator();

      // Show error notification (brief)
      this.showMigrationError(error.message);

      // Continue with fallback to localStorage
      this.fallbackToLocalStorage = true;
    }
  }

  // Initialize cloud synchronization
  initCloudSync() {
    // Sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.currentUser) {
        this.cloudSync.syncAll();
      }
    });

    // Save and sync before page unload
    window.addEventListener('beforeunload', () => {
      if (this.currentUser) {
        // Quick sync of critical data
        this.cloudSync.syncEntity('events');
        this.cloudSync.syncEntity('tasks');
      }
    });
  }

  // Legacy migration method - now handled by MigrationService
  async migrateLocalStorageData() {
    // This is now handled automatically by MigrationService
    console.log('Legacy migration method called - using MigrationService instead');
  }

  // Migration UI helpers (non-intrusive)
  showMigrationIndicator() {
    // Create a subtle loading indicator
    const indicator = document.createElement('div');
    indicator.id = 'migration-indicator';
    indicator.className = 'fixed top-4 left-4 z-50 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2';
    indicator.innerHTML = `
      <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>מעדכן מסד נתונים...</span>
    `;
    document.body.appendChild(indicator);
  }

  hideMigrationIndicator() {
    const indicator = document.getElementById('migration-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  showMigrationSuccess() {
    this.showNotification('מסד הנתונים עודכן בהצלחה', 'success', 3000);
  }

  showMigrationError(message) {
    this.showNotification(`שגיאה בעדכון מסד נתונים: ${message}`, 'error', 5000);
  }

  showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg max-w-sm text-sm ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
  }

  // Legacy sync method - now handled by CloudSyncService
  async syncWithIndexedDB() {
    if (this.currentUser && this.syncEnabled) {
      return await this.cloudSync.syncAll();
    }
  }

  // Legacy methods - now handled by IndexedDBManager and CloudSyncService

  // Authentication methods
  auth = {
    getCurrentUser: async () => {
      try {
        // Use cross-device authentication service
        const user = this.crossDeviceAuth.getCurrentUser();

        if (user) {
          this.currentUser = user;

          // Initialize encryption password if not already set
          if (!this.encryptionPassword && user.id && user.email) {
            this.encryptionPassword = this.encryptionService.generateEncryptionPassword(user.id, user.email);
          }

          // Initialize cloud sync if not already set
          if (user.id && this.cloudSync.userId !== user.id) {
            this.cloudSync.setUserId(user.id);
          }

          return user;
        }

        return null;
      } catch (error) {
        console.error('Get current user error:', error);
        return null;
      }
    },

    login: async (credentials) => {
      try {
        // Use cross-device authentication service
        const user = await this.crossDeviceAuth.login(credentials);

        // Set current user
        this.currentUser = user;

        // Initialize encryption password
        this.encryptionPassword = this.encryptionService.generateEncryptionPassword(user.id, user.email);

        // Add permissions based on role
        user.permissions = user.role === 'admin' ? {
          can_create_events: true,
          can_edit_events: true,
          can_delete_events: true,
          can_archive_events: true,
          can_create_tasks: true,
          can_edit_tasks: true,
          can_delete_tasks: true,
          can_manage_users: true,
          can_view_reports: true,
          can_manage_clients: true,
          can_access_archive: true,
          can_manage_settings: true
        } : user.role === 'operator' ? {
          can_create_events: true,
          can_edit_events: true,
          can_delete_events: false,
          can_archive_events: false,
          can_create_tasks: false,
          can_edit_tasks: false,
          can_delete_tasks: false,
          can_manage_users: false,
          can_view_reports: false,
          can_manage_clients: false,
          can_access_archive: false,
          can_manage_settings: false
        } : {
          can_create_events: false,
          can_edit_events: false,
          can_delete_events: false,
          can_archive_events: false,
          can_create_tasks: true,
          can_edit_tasks: false,
          can_delete_tasks: false,
          can_manage_users: false,
          can_view_reports: false,
          can_manage_clients: false,
          can_access_archive: false,
          can_manage_settings: false
        };

        // Update stored user with permissions
        localStorage.setItem('currentUser', JSON.stringify(user));

        return user;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    logout: async () => {
      try {
        // Use cross-device authentication service
        const result = await this.crossDeviceAuth.logout();

        // Clear current user
        this.currentUser = null;

        // Clear encryption password
        this.encryptionPassword = null;

        return result;
      } catch (error) {
        console.error('Logout error:', error);
        return false;
      }
    },

    isAuthenticated: async () => {
      return this.crossDeviceAuth.isAuthenticated();
    },

    // Cross-device auth methods
    getDeviceInfo: () => {
      return this.crossDeviceAuth.getDeviceInfo();
    },

    validateSession: async () => {
      return await this.crossDeviceAuth.validateExistingSession();
    }
  };

  // Database management methods
  database = {
    // Get sync status
    getSyncStatus: () => {
      return this.cloudSync.getSyncStatus();
    },

    // Force sync all data
    forceSync: async () => {
      if (!this.currentUser) {
        throw new Error('User must be logged in to sync');
      }
      return await this.cloudSync.forcSync();
    },

    // Get database statistics
    getStats: async () => {
      return await this.getDatabaseStats();
    },

    // Clear all data
    clearAll: async () => {
      return await this.clearAllData();
    },

    // Export all data
    exportData: async () => {
      try {
        const entities = ['events', 'tasks', 'systemUsers', 'clients', 'tags', 'workHours', 'comments', 'personalMessages', 'chats', 'canvas', 'seasonalClients'];
        const exportData = {
          timestamp: new Date().toISOString(),
          version: '2.0',
          userId: this.currentUser?.id,
          data: {}
        };

        for (const entityName of entities) {
          if (this.fallbackToLocalStorage) {
            const data = localStorage.getItem(entityName);
            exportData.data[entityName] = data ? JSON.parse(data) : [];
          } else {
            exportData.data[entityName] = await this.dbManager.getAll(entityName);
          }
        }

        return exportData;
      } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
      }
    },

    // Import data
    importData: async (importData) => {
      try {
        if (!importData.data) {
          throw new Error('Invalid import data format');
        }

        const entities = Object.keys(importData.data);
        let importedCount = 0;

        for (const entityName of entities) {
          const items = importData.data[entityName];
          if (Array.isArray(items)) {
            for (const item of items) {
              try {
                if (this.fallbackToLocalStorage) {
                  this._createInLocalStorage(entityName, item);
                } else {
                  await this.dbManager.create(entityName, item);
                }
                importedCount++;
              } catch (error) {
                console.warn(`Failed to import ${entityName} item:`, error);
              }
            }
          }
        }

        // Trigger sync after import
        if (this.currentUser && this.syncEnabled) {
          this.cloudSync.syncAll().catch(error => {
            console.warn('Sync after import failed:', error);
          });
        }

        return { importedCount };
      } catch (error) {
        console.error('Error importing data:', error);
        throw error;
      }
    },

    // Create backup
    createBackup: async (options) => {
      return await this.backupService.createBackup(options);
    },

    // Restore backup
    restoreBackup: async (backup, options) => {
      return await this.backupService.restoreBackup(backup, options);
    },

    // Export backup to file
    exportBackup: async (backup, filename) => {
      return await this.backupService.exportBackupToFile(backup, filename);
    },

    // Import backup from file
    importBackup: async (file) => {
      return await this.backupService.importBackupFromFile(file);
    },

    // Get backup statistics
    getBackupStats: async () => {
      return await this.backupService.getBackupStats();
    },

    // Auto backup management
    createAutoBackup: async () => {
      return await this.backupService.createAutoBackup();
    },

    getAutoBackups: () => {
      return this.backupService.getAutoBackups();
    },

    restoreAutoBackup: async (timestamp) => {
      return await this.backupService.restoreAutoBackup(timestamp);
    },

    // Migration management
    getMigrationStatus: () => {
      return this.migrationService.getMigrationStatus();
    },

    getMigrationProgress: () => {
      return this.migrationService.getMigrationProgress();
    },

    isMigrationNeeded: () => {
      return this.migrationService.isMigrationNeeded();
    },

    runMigration: async () => {
      return await this.migrationService.runAutoMigration();
    }
  };

  // Create entity methods
  createEntity(entityName) {
    return {
      getAll: async () => {
        try {
          if (this.fallbackToLocalStorage) {
            const data = localStorage.getItem(entityName);
            return data ? JSON.parse(data) : [];
          }

          // Get data from IndexedDB
          const items = await this.dbManager.getAll(entityName);

          // Decrypt sensitive fields if needed
          let decryptedItems = items;
          if (this.encryptionPassword && this.encryptionService.hasSensitiveFields(entityName)) {
            decryptedItems = await this.encryptionService.decryptArray(items, entityName, this.encryptionPassword);
          }

          // Trigger background sync if user is logged in
          if (this.currentUser && this.syncEnabled) {
            this.cloudSync.syncEntity(entityName).catch(error => {
              console.warn(`Background sync failed for ${entityName}:`, error);
            });
          }

          return decryptedItems;
        } catch (error) {
          console.error(`Error getting all ${entityName}:`, error);
          // Fallback to localStorage
          const data = localStorage.getItem(entityName);
          return data ? JSON.parse(data) : [];
        }
      },

      get: async (id) => {
        try {
          if (this.fallbackToLocalStorage) {
            const data = localStorage.getItem(entityName);
            const items = data ? JSON.parse(data) : [];
            return items.find(item => item.id === id);
          }

          return await this.dbManager.get(entityName, id);
        } catch (error) {
          console.error(`Error getting ${entityName} with id ${id}:`, error);
          // Fallback to localStorage
          const data = localStorage.getItem(entityName);
          const items = data ? JSON.parse(data) : [];
          return items.find(item => item.id === id);
        }
      },

      create: async (item) => {
        try {
          if (this.fallbackToLocalStorage) {
            return this._createInLocalStorage(entityName, item);
          }

          // Encrypt sensitive fields if needed
          let itemToStore = item;
          if (this.encryptionPassword && this.encryptionService.hasSensitiveFields(entityName)) {
            itemToStore = await this.encryptionService.encryptObject(item, entityName, this.encryptionPassword);
          }

          // Create in IndexedDB
          const newItem = await this.dbManager.create(entityName, itemToStore);

          // Trigger cloud sync if user is logged in
          if (this.currentUser && this.syncEnabled) {
            this.cloudSync.syncEntity(entityName).catch(error => {
              console.warn(`Cloud sync failed after create:`, error);
            });
          }

          // Return decrypted version to the caller
          if (this.encryptionPassword && this.encryptionService.hasSensitiveFields(entityName)) {
            return await this.encryptionService.decryptObject(newItem, entityName, this.encryptionPassword);
          }

          return newItem;
        } catch (error) {
          console.error(`Error creating ${entityName}:`, error);
          // Fallback to localStorage
          return this._createInLocalStorage(entityName, item);
        }
      },

      update: async (id, updates) => {
        try {
          if (this.fallbackToLocalStorage) {
            return this._updateInLocalStorage(entityName, id, updates);
          }

          // Update in IndexedDB
          const updatedItem = await this.dbManager.update(entityName, id, updates);

          // Trigger cloud sync if user is logged in
          if (this.currentUser && this.syncEnabled) {
            this.cloudSync.syncEntity(entityName).catch(error => {
              console.warn(`Cloud sync failed after update:`, error);
            });
          }

          return updatedItem;
        } catch (error) {
          console.error(`Error updating ${entityName}:`, error);
          // Fallback to localStorage
          return this._updateInLocalStorage(entityName, id, updates);
        }
      },

      delete: async (id) => {
        try {
          if (this.fallbackToLocalStorage) {
            return this._deleteInLocalStorage(entityName, id);
          }

          // Delete from IndexedDB
          const result = await this.dbManager.delete(entityName, id);

          // Trigger cloud sync if user is logged in
          if (this.currentUser && this.syncEnabled) {
            this.cloudSync.syncEntity(entityName).catch(error => {
              console.warn(`Cloud sync failed after delete:`, error);
            });
          }

          return result;
        } catch (error) {
          console.error(`Error deleting ${entityName}:`, error);
          // Fallback to localStorage
          return this._deleteInLocalStorage(entityName, id);
        }
      }
    };
  }

  // Fallback methods for localStorage
  _createInLocalStorage(entityName, item) {
    const data = localStorage.getItem(entityName);
    const items = data ? JSON.parse(data) : [];
    const newItem = {
      ...item,
      id: item.id || Date.now().toString(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem(entityName, JSON.stringify(items));
    return newItem;
  }

  _updateInLocalStorage(entityName, id, updates) {
    const data = localStorage.getItem(entityName);
    const items = data ? JSON.parse(data) : [];
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(entityName, JSON.stringify(items));
      return items[index];
    }
    return null;
  }

  _deleteInLocalStorage(entityName, id) {
    const data = localStorage.getItem(entityName);
    const items = data ? JSON.parse(data) : [];
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem(entityName, JSON.stringify(filtered));
    return true;
  }

  // Get database statistics
  async getDatabaseStats() {
    try {
      if (this.fallbackToLocalStorage) {
        const entities = ['events', 'tasks', 'systemUsers', 'clients', 'tags', 'workHours', 'comments', 'personalMessages', 'chats', 'canvas', 'seasonalClients'];
        const stats = {};

        entities.forEach(entityName => {
          const data = localStorage.getItem(entityName);
          const items = data ? JSON.parse(data) : [];
          stats[entityName] = items.length;
        });

        return stats;
      }

      return await this.dbManager.getStats();
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }

  // Clear all data
  async clearAllData() {
    try {
      if (this.fallbackToLocalStorage) {
        const entities = ['events', 'tasks', 'systemUsers', 'clients', 'tags', 'workHours', 'comments', 'personalMessages', 'chats', 'canvas', 'seasonalClients'];
        entities.forEach(entityName => {
          localStorage.removeItem(entityName);
        });
        return;
      }

      await this.dbManager.clearAll();

      // Also clear cloud sync data
      if (this.currentUser) {
        await this.cloudSync.clearSyncData();
      }
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  }

  // Entities
  entities = {
    Event: this.createEntity('events'),
    Task: this.createEntity('tasks'),
    WorkHours: {
      ...this.createEntity('workHours'),
      list: async (sortBy = '') => {
        const data = localStorage.getItem('workHours');
        let items = data ? JSON.parse(data) : [];

        // Sort by date if requested
        if (sortBy === '-date') {
          items.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return items;
      },
      // Ensure all CRUD operations are available
      getAll: async () => {
        const data = localStorage.getItem('workHours');
        return data ? JSON.parse(data) : [];
      }
    },
    Chat: this.createEntity('chats'),
    Canvas: this.createEntity('canvas'),
    PersonalMessage: this.createEntity('personalMessages'),
    Tag: this.createEntity('tags'),
    Client: this.createEntity('clients'),
    SeasonalClient: this.createEntity('seasonalClients'),
    Comment: this.createEntity('comments'),
    User: {
      ...this.createEntity('systemUsers'),
      list: async () => {
        const data = localStorage.getItem('systemUsers');
        return data ? JSON.parse(data) : [];
      },
      getAll: async () => {
        const data = localStorage.getItem('systemUsers');
        return data ? JSON.parse(data) : [];
      },
      getCurrentUser: async () => {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
      }
    }
  };

  // Integrations
  integrations = {
    Core: {
      UploadFile: async ({ file }) => {
        // Validate file input
        if (!file || !(file instanceof File)) {
          throw new Error('Invalid file provided');
        }

        // Mock file upload
        return {
          file_url: URL.createObjectURL(file),
          url: URL.createObjectURL(file),
          filename: file.name,
          size: file.size,
          type: file.type
        };
      },

      InvokeLLM: async (prompt) => {
        // Mock LLM response
        return {
          response: `תגובה אוטומטית ל: ${prompt}`,
          timestamp: new Date().toISOString()
        };
      },

      SendEmail: async (emailData) => {
        // Mock email sending
        console.log('שליחת אימייל:', emailData);
        return { success: true, messageId: Date.now().toString() };
      },

      GenerateImage: async (prompt) => {
        // Mock image generation
        return {
          url: `https://via.placeholder.com/400x300?text=${encodeURIComponent(prompt)}`,
          prompt
        };
      },

      ExtractDataFromUploadedFile: async (fileUrl) => {
        // Mock data extraction
        return {
          extractedText: 'טקסט שחולץ מהקובץ',
          metadata: { pages: 1, words: 100 }
        };
      }
    }
  };
}

// Create and export the SDK instance
export const base44 = new CustomSDK();
