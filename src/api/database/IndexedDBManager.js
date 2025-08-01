/**
 * IndexedDB Database Manager
 * Handles all database operations, schema management, and data persistence
 */

class IndexedDBManager {
  constructor() {
    this.dbName = 'PixelArtDB';
    this.dbVersion = 2; // Increased version for new schema
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
    
    // Define all entity schemas
    this.entities = {
      events: {
        keyPath: 'id',
        indexes: [
          { name: 'date', keyPath: 'date', unique: false },
          { name: 'status', keyPath: 'status', unique: false },
          { name: 'client_id', keyPath: 'client_id', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false },
          { name: 'updated_at', keyPath: 'updated_at', unique: false },
          { name: 'user_id', keyPath: 'user_id', unique: false }
        ]
      },
      tasks: {
        keyPath: 'id',
        indexes: [
          { name: 'event_id', keyPath: 'event_id', unique: false },
          { name: 'status', keyPath: 'status', unique: false },
          { name: 'priority', keyPath: 'priority', unique: false },
          { name: 'due_date', keyPath: 'due_date', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false },
          { name: 'updated_at', keyPath: 'updated_at', unique: false },
          { name: 'assigned_to', keyPath: 'assigned_to', unique: false }
        ]
      },
      clients: {
        keyPath: 'id',
        indexes: [
          { name: 'name', keyPath: 'name', unique: false },
          { name: 'email', keyPath: 'email', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false },
          { name: 'updated_at', keyPath: 'updated_at', unique: false }
        ]
      },
      workHours: {
        keyPath: 'id',
        indexes: [
          { name: 'event_id', keyPath: 'event_id', unique: false },
          { name: 'user_id', keyPath: 'user_id', unique: false },
          { name: 'date', keyPath: 'date', unique: false },
          { name: 'status', keyPath: 'status', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false },
          { name: 'updated_at', keyPath: 'updated_at', unique: false }
        ]
      },
      systemUsers: {
        keyPath: 'id',
        indexes: [
          { name: 'email', keyPath: 'email', unique: true },
          { name: 'role', keyPath: 'role', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false },
          { name: 'updated_at', keyPath: 'updated_at', unique: false }
        ]
      },
      seasonalClients: {
        keyPath: 'id',
        indexes: [
          { name: 'event_month', keyPath: 'event_month', unique: false },
          { name: 'check_status', keyPath: 'check_status', unique: false },
          { name: 'next_contact_date', keyPath: 'next_contact_date', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false },
          { name: 'updated_at', keyPath: 'updated_at', unique: false }
        ]
      },
      tags: {
        keyPath: 'id',
        indexes: [
          { name: 'name', keyPath: 'name', unique: false },
          { name: 'color', keyPath: 'color', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false }
        ]
      },
      comments: {
        keyPath: 'id',
        indexes: [
          { name: 'entity_type', keyPath: 'entity_type', unique: false },
          { name: 'entity_id', keyPath: 'entity_id', unique: false },
          { name: 'user_id', keyPath: 'user_id', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false }
        ]
      },
      personalMessages: {
        keyPath: 'id',
        indexes: [
          { name: 'user_id', keyPath: 'user_id', unique: false },
          { name: 'is_read', keyPath: 'is_read', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false }
        ]
      },
      chats: {
        keyPath: 'id',
        indexes: [
          { name: 'user_id', keyPath: 'user_id', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false }
        ]
      },
      canvas: {
        keyPath: 'id',
        indexes: [
          { name: 'user_id', keyPath: 'user_id', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false },
          { name: 'updated_at', keyPath: 'updated_at', unique: false }
        ]
      },
      // Metadata store for sync information
      _metadata: {
        keyPath: 'key',
        indexes: [
          { name: 'updated_at', keyPath: 'updated_at', unique: false }
        ]
      },
      // Sync queue for offline operations
      _syncQueue: {
        keyPath: 'id',
        indexes: [
          { name: 'entity', keyPath: 'entity', unique: false },
          { name: 'operation', keyPath: 'operation', unique: false },
          { name: 'created_at', keyPath: 'created_at', unique: false },
          { name: 'priority', keyPath: 'priority', unique: false }
        ]
      }
    };
  }

  /**
   * Initialize the database
   */
  async init() {
    if (this.isInitialized) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initDatabase();
    return this.initPromise;
  }

  /**
   * Private method to initialize the database
   */
  async _initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('Upgrading IndexedDB schema...');

        // Create or update object stores
        Object.entries(this.entities).forEach(([entityName, schema]) => {
          let store;
          
          if (db.objectStoreNames.contains(entityName)) {
            // Store exists, we might need to update indexes
            // For now, we'll delete and recreate (in production, you'd want more sophisticated migration)
            db.deleteObjectStore(entityName);
          }
          
          // Create the object store
          store = db.createObjectStore(entityName, { keyPath: schema.keyPath });
          
          // Create indexes
          schema.indexes.forEach(index => {
            try {
              store.createIndex(index.name, index.keyPath, { unique: index.unique });
            } catch (error) {
              console.warn(`Failed to create index ${index.name} on ${entityName}:`, error);
            }
          });
        });

        console.log('IndexedDB schema upgrade completed');
      };
    });
  }

  /**
   * Get all records from an entity
   */
  async getAll(entityName) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([entityName], 'readonly');
      const store = transaction.objectStore(entityName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error(`Error getting all ${entityName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a single record by ID
   */
  async get(entityName, id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([entityName], 'readonly');
      const store = transaction.objectStore(entityName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error(`Error getting ${entityName} with id ${id}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Create a new record
   */
  async create(entityName, data) {
    await this.init();
    
    const record = {
      ...data,
      id: data.id || this._generateId(),
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _synced: false, // Mark as needing sync
      _version: 1
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([entityName], 'readwrite');
      const store = transaction.objectStore(entityName);
      const request = store.add(record);

      request.onsuccess = () => {
        console.log(`Created ${entityName} with id:`, record.id);
        resolve(record);
      };

      request.onerror = () => {
        console.error(`Error creating ${entityName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update an existing record
   */
  async update(entityName, id, updates) {
    await this.init();
    
    // First get the existing record
    const existing = await this.get(entityName, id);
    if (!existing) {
      throw new Error(`Record with id ${id} not found in ${entityName}`);
    }

    const updatedRecord = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updated_at: new Date().toISOString(),
      _synced: false, // Mark as needing sync
      _version: (existing._version || 1) + 1
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([entityName], 'readwrite');
      const store = transaction.objectStore(entityName);
      const request = store.put(updatedRecord);

      request.onsuccess = () => {
        console.log(`Updated ${entityName} with id:`, id);
        resolve(updatedRecord);
      };

      request.onerror = () => {
        console.error(`Error updating ${entityName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a record
   */
  async delete(entityName, id) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([entityName], 'readwrite');
      const store = transaction.objectStore(entityName);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`Deleted ${entityName} with id:`, id);
        resolve(true);
      };

      request.onerror = () => {
        console.error(`Error deleting ${entityName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generate a unique ID
   */
  _generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Clear all data from the database
   */
  async clearAll() {
    await this.init();
    
    const entityNames = Object.keys(this.entities).filter(name => !name.startsWith('_'));
    
    for (const entityName of entityNames) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([entityName], 'readwrite');
        const store = transaction.objectStore(entityName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
    
    console.log('All data cleared from IndexedDB');
  }

  /**
   * Get database statistics
   */
  async getStats() {
    await this.init();
    
    const stats = {};
    const entityNames = Object.keys(this.entities).filter(name => !name.startsWith('_'));
    
    for (const entityName of entityNames) {
      const count = await new Promise((resolve) => {
        const transaction = this.db.transaction([entityName], 'readonly');
        const store = transaction.objectStore(entityName);
        const request = store.count();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      
      stats[entityName] = count;
    }
    
    return stats;
  }
}

// Create and export singleton instance
export const dbManager = new IndexedDBManager();
export default dbManager;
