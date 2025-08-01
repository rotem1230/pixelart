/**
 * Cloud Sync Service
 * Handles synchronization of IndexedDB data across devices using cloud storage
 */

import { dbManager } from './IndexedDBManager.js';

class CloudSyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.syncQueue = [];
    this.lastSyncTime = null;
    this.syncInterval = null;
    this.conflictResolutionStrategy = 'latest_wins'; // 'latest_wins', 'manual', 'merge'
    
    // Cloud storage configuration - can be switched between providers
    this.cloudProvider = null; // 'firebase', 'supabase', 'custom' - start with null to check configuration
    this.cloudConfig = {
      firebase: {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || null,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || null,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || null,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || null,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || null,
        appId: import.meta.env.VITE_FIREBASE_APP_ID || null
      },
      supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || null,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || null
      },
      custom: {
        baseUrl: import.meta.env.VITE_CUSTOM_API_URL || 'http://localhost:3001/api',
        apiKey: import.meta.env.VITE_CUSTOM_API_KEY || null
      },
      github: {
        token: import.meta.env.VITE_GITHUB_TOKEN || null,
        username: import.meta.env.VITE_GITHUB_USERNAME || null
      }
    };

    this.userId = null;
    this.deviceId = this._generateDeviceId();

    // Determine which cloud provider to use based on configuration
    this.cloudProvider = this._determineCloudProvider();

    // Check if cloud sync is properly configured
    this.isConfigured = this._checkConfiguration();
    this.isInitialized = false;
    this.initializationFailed = false;
    this.initializationInProgress = true;

    this._initializeNetworkListeners();
    this._initializeCloudProvider();
  }

  /**
   * Determine which cloud provider to use based on environment configuration
   */
  _determineCloudProvider() {
    // Check Supabase configuration first (preferred)
    if (this.cloudConfig.supabase.url && this.cloudConfig.supabase.anonKey) {
      return 'supabase';
    }

    // Check GitHub configuration (for automatic backup)
    if (this.cloudConfig.github.token && this.cloudConfig.github.username) {
      return 'github';
    }

    // Check Firebase configuration
    if (this.cloudConfig.firebase.apiKey && this.cloudConfig.firebase.authDomain && this.cloudConfig.firebase.projectId) {
      return 'firebase';
    }

    // Check Custom API configuration
    if (this.cloudConfig.custom.baseUrl !== 'http://localhost:3001/api' && this.cloudConfig.custom.apiKey) {
      return 'custom';
    }

    // No cloud provider configured
    return null;
  }

  /**
   * Check if cloud sync is properly configured
   */
  _checkConfiguration() {
    return !!this.cloudProvider;
  }

  /**
   * Initialize network status listeners
   */
  _initializeNetworkListeners() {
    // Initial network status check
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      console.log('Network: Online - resuming sync operations');
      this.isOnline = true;

      // Show user notification
      this._showNetworkNotification('חזרת לרשת - מסנכרן נתונים...', 'success');

      // Process queued operations
      this._processSyncQueue();

      // Trigger full sync
      if (!this.initializationFailed && this.cloudProvider && this.cloudProvider !== 'disabled' && this.userId) {
        this.syncAll().catch(error => {
          console.warn('Sync after coming online failed:', error);
        });
      }
    });

    window.addEventListener('offline', () => {
      console.log('Network: Offline - queuing operations');
      this.isOnline = false;

      // Show user notification
      this._showNetworkNotification('אין חיבור לרשת - עובד במצב אופליין', 'warning');
    });

    // Periodic sync when online
    this.syncInterval = setInterval(() => {
      if (!this.initializationFailed && this.cloudProvider && this.cloudProvider !== 'disabled' && this.isOnline && this.userId && !this.syncInProgress) {
        this.syncAll().catch(error => {
          console.warn('Periodic sync failed:', error);
        });
      }
    }, 30000); // Sync every 30 seconds

    // Periodic network connectivity check
    setInterval(() => {
      this._checkNetworkConnectivity();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Initialize cloud provider
   */
  async _initializeCloudProvider() {
    // If no cloud provider is configured, skip initialization
    if (!this.cloudProvider) {
      this.cloudProvider = 'disabled';
      this.isInitialized = false;
      this.initializationFailed = true;
      this.initializationInProgress = false;
      console.log('No server running - using IndexedDB for local storage only');

      // Log final status
      console.log('CloudSyncService Final Status:', {
        cloudProvider: this.cloudProvider,
        initializationFailed: this.initializationFailed,
        isCloudSyncAvailable: this.isCloudSyncAvailable()
      });
      return;
    }

    try {
      switch (this.cloudProvider) {
        case 'github':
          await this._initializeGitHub();
          break;
        case 'firebase':
          await this._initializeFirebase();
          break;
        case 'supabase':
          await this._initializeSupabase();
          break;
        case 'custom':
          await this._initializeCustomAPI();
          break;
        default:
          throw new Error('Unknown cloud provider');
      }
      this.isInitialized = true;
      this.initializationInProgress = false;
      console.log('✅ Server connected - automatic sync enabled between devices');
    } catch (error) {
      console.error('Failed to initialize cloud provider:', error);
      // Fallback to local-only mode
      this.cloudProvider = 'disabled';
      this.isInitialized = false;
      this.initializationFailed = true;
      this.initializationInProgress = false;
      console.log('Cloud sync disabled - using IndexedDB for local storage');
    }

    // Log final status
    console.log('CloudSyncService Final Status:', {
      cloudProvider: this.cloudProvider,
      initializationFailed: this.initializationFailed,
      isCloudSyncAvailable: this.isCloudSyncAvailable()
    });
  }

  /**
   * Initialize GitHub
   */
  async _initializeGitHub() {
    if (!this.cloudConfig.github.token || !this.cloudConfig.github.username) {
      throw new Error('GitHub configuration missing');
    }

    try {
      // Test GitHub API access
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${this.cloudConfig.github.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('GitHub API access failed');
      }

      console.log('GitHub initialized for automatic backup');
    } catch (error) {
      throw new Error(`GitHub initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize Firebase
   */
  async _initializeFirebase() {
    if (!this.cloudConfig.firebase.apiKey) {
      throw new Error('Firebase configuration missing');
    }

    // Firebase initialization would go here
    // For now, we'll use a mock implementation
    console.log('Firebase initialized (mock)');
  }

  /**
   * Initialize Supabase
   */
  async _initializeSupabase() {
    if (!this.cloudConfig.supabase.url || !this.cloudConfig.supabase.anonKey) {
      throw new Error('Supabase configuration missing');
    }

    try {
      // Import Supabase client
      const { createClient } = await import('@supabase/supabase-js');

      // Create Supabase client
      this.supabaseClient = createClient(
        this.cloudConfig.supabase.url,
        this.cloudConfig.supabase.anonKey
      );

      // Test connection by trying to fetch from a system table
      const { error } = await this.supabaseClient
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is OK
        throw new Error(`Supabase connection test failed: ${error.message}`);
      }

      console.log('✅ Supabase initialized successfully');
    } catch (error) {
      throw new Error(`Supabase initialization failed: ${error.message}`);
    }
  }

  /**
   * Initialize Custom API
   */
  async _initializeCustomAPI() {
    const baseUrl = this.cloudConfig.custom.baseUrl;

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Only add Authorization header if API key is provided
      if (this.cloudConfig.custom.apiKey) {
        headers['Authorization'] = `Bearer ${this.cloudConfig.custom.apiKey}`;
      }

      const response = await fetch(`${baseUrl}/health`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Custom API not available');
      }

      const data = await response.json();
      console.log('Custom API initialized:', data.message || 'Server connected');
    } catch (error) {
      throw new Error(`Custom API initialization failed: ${error.message}`);
    }
  }

  /**
   * Set user ID for sync operations
   */
  setUserId(userId) {
    this.userId = userId;
    console.log(`Cloud sync enabled for user: ${userId}`);
  }

  /**
   * Sync all entities
   */
  async syncAll() {
    if (this.initializationFailed || !this.cloudProvider || this.cloudProvider === 'disabled' || !this.userId || !this.isOnline || this.syncInProgress || !this.isConfigured) {
      console.log('Sync skipped:', {
        initializationFailed: this.initializationFailed,
        userId: !!this.userId,
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress,
        isConfigured: this.isConfigured,
        cloudProvider: this.cloudProvider
      });
      return;
    }

    this.syncInProgress = true;
    console.log('Starting full sync...');

    try {
      const entities = ['events', 'tasks', 'clients', 'workHours', 'systemUsers', 'seasonalClients', 'tags', 'comments', 'personalMessages', 'chats', 'canvas'];
      
      for (const entityName of entities) {
        await this.syncEntity(entityName);
      }

      this.lastSyncTime = new Date().toISOString();
      await this._updateSyncMetadata();
      
      console.log('Full sync completed successfully');

      // Trigger global UI refresh after full sync
      this._triggerGlobalUIRefresh();
    } catch (error) {
      console.error('Full sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a specific entity
   */
  async syncEntity(entityName) {
    // If initialization is still in progress, skip sync
    if (this.initializationInProgress) {
      return;
    }

    // If initialization failed, don't attempt sync
    if (this.initializationFailed || !this.cloudProvider || this.cloudProvider === 'disabled') {
      return;
    }

    if (!this.userId || !this.isOnline) {
      console.log(`Skipping sync for ${entityName} - user not logged in or offline`);
      await this._queueSyncOperation(entityName, 'sync');
      return;
    }

    try {
      // Get local data
      const localData = await dbManager.getAll(entityName);
      
      // Get cloud data
      const cloudData = await this._getCloudData(entityName);
      
      // Merge data
      const mergedData = await this._mergeData(localData, cloudData);
      
      // Update local database
      await this._updateLocalData(entityName, mergedData.local);
      
      // Update cloud database
      if (mergedData.cloud.length > 0) {
        await this._updateCloudData(entityName, mergedData.cloud);
      }
      
      console.log(`Synced ${entityName}: ${mergedData.local.length} local, ${mergedData.cloud.length} cloud updates`);

      // Debug: Log the actual data
      if (mergedData.local.length > 0) {
        console.log(`Local updates for ${entityName}:`, mergedData.local.map(item => ({ id: item.id, name: item.name || item.description })));
      }

      // Trigger UI refresh if there were cloud updates
      if (mergedData.local.length > 0) {
        console.log(`Triggering UI refresh for ${entityName}`);
        this._triggerUIRefresh(entityName);
      }
    } catch (error) {
      console.error(`Failed to sync ${entityName}:`, error);
      await this._queueSyncOperation(entityName, 'sync');
    }
  }

  /**
   * Get data from cloud storage
   */
  async _getCloudData(entityName) {
    if (!this.cloudProvider || this.cloudProvider === 'disabled') {
      return [];
    }

    switch (this.cloudProvider) {
      case 'github':
        return this._getGitHubData(entityName);
      case 'firebase':
        return this._getFirebaseData(entityName);
      case 'supabase':
        return this._getSupabaseData(entityName);
      case 'custom':
        return this._getCustomAPIData(entityName);
      default:
        return [];
    }
  }

  /**
   * Get data from GitHub Gist
   */
  async _getGitHubData(entityName) {
    try {
      const gistId = await this._getOrCreateGistId();
      if (!gistId) return [];

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
          'Authorization': `token ${this.cloudConfig.github.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const gist = await response.json();
      const filename = `${this.userId}_${entityName}.json`;

      if (gist.files[filename]) {
        return JSON.parse(gist.files[filename].content);
      }

      return [];
    } catch (error) {
      console.error(`Failed to get ${entityName} from GitHub:`, error);
      return [];
    }
  }

  /**
   * Get data from Firebase
   */
  async _getFirebaseData(entityName) {
    // Mock implementation - replace with actual Firebase calls
    const mockData = JSON.parse(localStorage.getItem(`firebase_${entityName}_${this.userId}`) || '[]');
    return mockData;
  }

  /**
   * Get data from Supabase
   */
  async _getSupabaseData(entityName) {
    try {
      const { data, error } = await this.supabaseClient
        .from('user_data')
        .select('entity_id, data')
        .eq('user_id', this.userId)
        .eq('entity_name', entityName);

      if (error) {
        console.error(`Failed to get ${entityName} from Supabase:`, error);
        return [];
      }

      return (data || []).map(row => JSON.parse(row.data));
    } catch (error) {
      console.error(`Failed to get ${entityName} from Supabase:`, error);
      return [];
    }
  }

  /**
   * Get data from Custom API
   */
  async _getCustomAPIData(entityName) {
    const baseUrl = this.cloudConfig.custom.baseUrl;
    const apiKey = this.cloudConfig.custom.apiKey;

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Only add Authorization header if API key is provided
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${baseUrl}/sync/${entityName}/${this.userId}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error(`Failed to get ${entityName} from custom API:`, error);
      return [];
    }
  }

  /**
   * Update cloud data
   */
  async _updateCloudData(entityName, items) {
    if (!this.cloudProvider || this.cloudProvider === 'disabled') {
      return;
    }

    switch (this.cloudProvider) {
      case 'github':
        return this._updateGitHubData(entityName, items);
      case 'firebase':
        return this._updateFirebaseData(entityName, items);
      case 'supabase':
        return this._updateSupabaseData(entityName, items);
      case 'custom':
        return this._updateCustomAPIData(entityName, items);
      default:
        return;
    }
  }

  /**
   * Update GitHub Gist data
   */
  async _updateGitHubData(entityName, items) {
    try {
      const gistId = await this._getOrCreateGistId();
      const filename = `${this.userId}_${entityName}.json`;

      const updateData = {
        files: {
          [filename]: {
            content: JSON.stringify(items, null, 2)
          }
        }
      };

      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.cloudConfig.github.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      console.log(`Updated ${items.length} items in GitHub Gist for ${entityName}`);
    } catch (error) {
      console.error(`Failed to update ${entityName} in GitHub:`, error);
      throw error;
    }
  }

  /**
   * Update Firebase data
   */
  async _updateFirebaseData(entityName, items) {
    // Mock implementation - replace with actual Firebase calls
    const existing = JSON.parse(localStorage.getItem(`firebase_${entityName}_${this.userId}`) || '[]');
    const updated = this._mergeArrays(existing, items);
    localStorage.setItem(`firebase_${entityName}_${this.userId}`, JSON.stringify(updated));
  }

  /**
   * Update Supabase data
   */
  async _updateSupabaseData(entityName, items) {
    try {
      for (const item of items) {
        if (item.id) {
          const { error } = await this.supabaseClient
            .from('user_data')
            .upsert({
              user_id: this.userId,
              entity_name: entityName,
              entity_id: item.id,
              data: JSON.stringify(item)
            }, {
              onConflict: 'user_id,entity_name,entity_id'
            });

          if (error) {
            console.error(`Failed to update ${entityName} in Supabase:`, error);
            throw error;
          }
        }
      }

      console.log(`Updated ${items.length} items in Supabase for ${entityName}`);
    } catch (error) {
      console.error(`Failed to update ${entityName} in Supabase:`, error);
      throw error;
    }
  }

  /**
   * Update Custom API data
   */
  async _updateCustomAPIData(entityName, items) {
    const baseUrl = this.cloudConfig.custom.baseUrl;
    const apiKey = this.cloudConfig.custom.apiKey;

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      // Only add Authorization header if API key is provided
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${baseUrl}/sync/${entityName}/${this.userId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          items,
          deviceId: this.deviceId,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log(`Updated ${items.length} items in cloud for ${entityName}`);
    } catch (error) {
      console.error(`Failed to update ${entityName} in custom API:`, error);
      throw error;
    }
  }

  /**
   * Merge local and cloud data
   */
  async _mergeData(localData, cloudData) {
    const localUpdates = [];
    const cloudUpdates = [];

    console.log(`Merging data - Local: ${localData.length}, Cloud: ${cloudData.length}`);

    const localMap = new Map(localData.map(item => [item.id, item]));
    const cloudMap = new Map(cloudData.map(item => [item.id, item]));

    // Check cloud items against local
    for (const cloudItem of cloudData) {
      const localItem = localMap.get(cloudItem.id);
      
      if (!localItem) {
        // Item exists only in cloud, add to local
        console.log(`New item from cloud: ${cloudItem.id}`);
        localUpdates.push(cloudItem);
      } else {
        // Item exists in both, check which is newer
        const localTime = new Date(localItem.updated_at || localItem.created_at);
        const cloudTime = new Date(cloudItem.updated_at || cloudItem.created_at);
        
        if (cloudTime > localTime) {
          // Cloud version is newer, update local
          localUpdates.push(cloudItem);
        }
      }
    }

    // Check local items against cloud
    for (const localItem of localData) {
      const cloudItem = cloudMap.get(localItem.id);
      
      if (!cloudItem) {
        // Item exists only locally, add to cloud
        cloudUpdates.push(localItem);
      } else {
        // Item exists in both, check which is newer
        const localTime = new Date(localItem.updated_at || localItem.created_at);
        const cloudTime = new Date(cloudItem.updated_at || cloudItem.created_at);
        
        if (localTime > cloudTime) {
          // Local version is newer, update cloud
          cloudUpdates.push(localItem);
        }
      }
    }

    console.log(`Merge result - Local updates: ${localUpdates.length}, Cloud updates: ${cloudUpdates.length}`);

    return {
      local: localUpdates,
      cloud: cloudUpdates
    };
  }

  /**
   * Update local data
   */
  async _updateLocalData(entityName, items) {
    for (const item of items) {
      try {
        const existing = await dbManager.get(entityName, item.id);
        if (existing) {
          await dbManager.update(entityName, item.id, { ...item, _synced: true });
        } else {
          await dbManager.create(entityName, { ...item, _synced: true });
        }
      } catch (error) {
        console.error(`Failed to update local ${entityName} item ${item.id}:`, error);
      }
    }
  }

  /**
   * Queue sync operation for when online
   */
  async _queueSyncOperation(entityName, operation, data = null) {
    const queueItem = {
      id: this._generateId(),
      entity: entityName,
      operation,
      data,
      created_at: new Date().toISOString(),
      priority: operation === 'delete' ? 1 : 0 // Deletions have higher priority
    };

    this.syncQueue.push(queueItem);
    
    // Also store in IndexedDB for persistence
    try {
      await dbManager.create('_syncQueue', queueItem);
    } catch (error) {
      console.error('Failed to queue sync operation:', error);
    }
  }

  /**
   * Process queued sync operations
   */
  async _processSyncQueue() {
    if (!this.isOnline || this.syncInProgress) return;

    try {
      // Get queued operations from IndexedDB
      const queuedOps = await dbManager.getAll('_syncQueue');
      
      if (queuedOps.length === 0) return;

      console.log(`Processing ${queuedOps.length} queued sync operations...`);

      // Sort by priority and creation time
      queuedOps.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      for (const op of queuedOps) {
        try {
          switch (op.operation) {
            case 'sync':
              await this.syncEntity(op.entity);
              break;
            case 'create':
            case 'update':
            case 'delete':
              await this._processCRUDOperation(op);
              break;
          }

          // Remove from queue after successful processing
          await dbManager.delete('_syncQueue', op.id);
        } catch (error) {
          console.error(`Failed to process queued operation ${op.id}:`, error);
          // Keep in queue for retry
        }
      }

      console.log('Finished processing sync queue');
    } catch (error) {
      console.error('Failed to process sync queue:', error);
    }
  }

  /**
   * Process CRUD operation from queue
   */
  async _processCRUDOperation(operation) {
    // Implementation depends on the specific operation
    // This would handle create/update/delete operations that were queued while offline
    console.log(`Processing ${operation.operation} for ${operation.entity}`);
  }

  /**
   * Generate device ID
   */
  _generateDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Update sync metadata
   */
  async _updateSyncMetadata() {
    const metadata = {
      key: 'lastSync',
      value: this.lastSyncTime,
      deviceId: this.deviceId,
      userId: this.userId,
      updated_at: new Date().toISOString()
    };

    try {
      const existing = await dbManager.get('_metadata', 'lastSync');
      if (existing) {
        await dbManager.update('_metadata', 'lastSync', metadata);
      } else {
        await dbManager.create('_metadata', metadata);
      }
    } catch (error) {
      console.error('Failed to update sync metadata:', error);
    }
  }

  /**
   * Merge two arrays of objects by ID
   */
  _mergeArrays(existing, updates) {
    const existingMap = new Map(existing.map(item => [item.id, item]));
    
    for (const update of updates) {
      existingMap.set(update.id, update);
    }
    
    return Array.from(existingMap.values());
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      queuedOperations: this.syncQueue.length,
      userId: this.userId,
      deviceId: this.deviceId,
      cloudProvider: this.cloudProvider
    };
  }

  /**
   * Force sync now
   */
  async forcSync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.syncAll();
  }

  /**
   * Clear all sync data
   */
  async clearSyncData() {
    this.syncQueue = [];
    await dbManager.getAll('_syncQueue').then(items => {
      return Promise.all(items.map(item => dbManager.delete('_syncQueue', item.id)));
    });

    this.lastSyncTime = null;
    await dbManager.delete('_metadata', 'lastSync').catch(() => {});

    console.log('Sync data cleared');
  }

  /**
   * Check network connectivity
   */
  async _checkNetworkConnectivity() {
    const wasOnline = this.isOnline;

    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });

      this.isOnline = true;
    } catch (error) {
      this.isOnline = false;
    }

    // If status changed, trigger appropriate actions
    if (wasOnline !== this.isOnline) {
      if (this.isOnline) {
        console.log('Network connectivity restored');
        this._processSyncQueue();
      } else {
        console.log('Network connectivity lost');
      }
    }
  }

  /**
   * Show network status notification to user
   */
  _showNetworkNotification(message, type = 'info') {
    // Create a simple toast notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'warning' ? 'bg-yellow-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      'bg-blue-500 text-white'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Get or create GitHub Gist ID for user data
   */
  async _getOrCreateGistId() {
    const gistKey = `github_gist_${this.userId}`;
    let gistId = localStorage.getItem(gistKey);

    if (gistId) {
      // Verify gist still exists
      try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
          headers: {
            'Authorization': `token ${this.cloudConfig.github.token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (response.ok) {
          return gistId;
        }
      } catch (error) {
        console.warn('Existing gist not found, creating new one');
      }
    }

    // Create new gist
    try {
      const createData = {
        description: `Pixel Art VJ - User Data Backup (${this.userId})`,
        public: false,
        files: {
          'README.md': {
            content: `# Pixel Art VJ - User Data Backup\n\nThis gist contains automatic backup data for user: ${this.userId}\nCreated: ${new Date().toISOString()}`
          }
        }
      };

      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.cloudConfig.github.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create gist: ${response.status}`);
      }

      const gist = await response.json();
      gistId = gist.id;

      // Store gist ID
      localStorage.setItem(gistKey, gistId);
      console.log('Created new GitHub Gist for user data backup:', gistId);

      return gistId;
    } catch (error) {
      console.error('Failed to create GitHub Gist:', error);
      throw error;
    }
  }

  /**
   * Check if cloud sync is available
   */
  isCloudSyncAvailable() {
    return !this.initializationFailed && this.cloudProvider && this.cloudProvider !== 'disabled';
  }

  /**
   * Get detailed sync statistics
   */
  async getSyncStatistics() {
    try {
      const queuedOps = await dbManager.getAll('_syncQueue');
      const metadata = await dbManager.getAll('_metadata');

      return {
        isOnline: this.isOnline,
        syncInProgress: this.syncInProgress,
        lastSyncTime: this.lastSyncTime,
        queuedOperations: queuedOps.length,
        userId: this.userId,
        deviceId: this.deviceId,
        cloudProvider: this.cloudProvider,
        metadata: metadata.length,
        syncQueue: queuedOps.map(op => ({
          entity: op.entity,
          operation: op.operation,
          created_at: op.created_at,
          priority: op.priority
        }))
      };
    } catch (error) {
      console.error('Failed to get sync statistics:', error);
      return this.getSyncStatus();
    }
  }

  /**
   * Trigger UI refresh for specific entity
   */
  _triggerUIRefresh(entityName) {
    // Dispatch custom event to notify UI components
    const event = new CustomEvent('cloudSyncUpdate', {
      detail: { entityName, timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);

    // Also trigger storage event for backward compatibility
    const storageEvent = new StorageEvent('storage', {
      key: entityName,
      newValue: JSON.stringify({ updated: true, timestamp: Date.now() }),
      storageArea: localStorage
    });
    window.dispatchEvent(storageEvent);
  }

  /**
   * Trigger global UI refresh after full sync
   */
  _triggerGlobalUIRefresh() {
    // Dispatch global refresh event
    const event = new CustomEvent('cloudSyncComplete', {
      detail: { timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);

    // Trigger storage events for all main entities
    const entities = ['events', 'tasks', 'clients', 'workHours', 'systemUsers'];
    entities.forEach(entityName => {
      const storageEvent = new StorageEvent('storage', {
        key: entityName,
        newValue: JSON.stringify({ updated: true, timestamp: Date.now() }),
        storageArea: localStorage
      });
      window.dispatchEvent(storageEvent);
    });
  }
}

// Create and export singleton instance
export const cloudSync = new CloudSyncService();

export default cloudSync;
