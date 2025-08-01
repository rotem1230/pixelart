/**
 * Cross-Device Authentication Service
 * Handles authentication that works across multiple devices with cloud sync
 */

import { cloudSync } from './CloudSyncService.js';
import { encryptionService } from './EncryptionService.js';

class CrossDeviceAuthService {
  constructor() {
    this.authTokenKey = 'auth_token';
    this.deviceIdKey = 'device_id';
    this.userSessionKey = 'user_session';
    this.syncedUsersKey = 'synced_users';
    
    // Generate or get device ID
    this.deviceId = this.getOrCreateDeviceId();
    
    // Session management
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.refreshInterval = null;
    
    this.initializeSessionManagement();
  }

  /**
   * Initialize session management
   */
  initializeSessionManagement() {
    // Check for existing session on startup
    this.validateExistingSession();
    
    // Set up periodic session validation
    this.refreshInterval = setInterval(() => {
      this.validateExistingSession();
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    // Listen for storage changes (multi-tab support)
    window.addEventListener('storage', (e) => {
      if (e.key === this.userSessionKey) {
        this.handleSessionChange(e.newValue);
      }
    });
  }

  /**
   * Enhanced login with cross-device support
   */
  async login(credentials) {
    try {
      // First, try to authenticate with local users
      const localUser = await this.authenticateLocal(credentials);
      
      if (localUser) {
        // Create session
        const session = await this.createUserSession(localUser);
        
        // Initialize cloud sync for this user
        cloudSync.setUserId(localUser.id);
        
        // Try to sync user data from cloud
        await this.syncUserDataFromCloud(localUser);
        
        // Store session
        this.storeUserSession(session);
        
        return session.user;
      }
      
      // If local auth fails, try cloud authentication
      const cloudUser = await this.authenticateCloud(credentials);
      
      if (cloudUser) {
        // Store user locally for offline access
        await this.storeUserLocally(cloudUser);
        
        // Create session
        const session = await this.createUserSession(cloudUser);
        
        // Initialize cloud sync
        cloudSync.setUserId(cloudUser.id);
        
        // Store session
        this.storeUserSession(session);
        
        return session.user;
      }
      
      throw new Error('Invalid credentials');
      
    } catch (error) {
      console.error('Cross-device login failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate with local storage
   */
  async authenticateLocal(credentials) {
    try {
      // Get local users (from localStorage or IndexedDB)
      const localUsers = await this.getLocalUsers();

      // Find matching user
      const user = localUsers.find(u => u.email === credentials.email);

      if (!user) {
        return null;
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(credentials.password, user.password);

      if (!isValidPassword) {
        return null;
      }
      
      return {
        ...user,
        lastLoginDevice: this.deviceId,
        lastLoginTime: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Local authentication failed:', error);
      return null;
    }
  }

  /**
   * Authenticate with cloud service
   */
  async authenticateCloud(credentials) {
    try {
      // This would integrate with your cloud provider
      // For now, we'll simulate cloud authentication
      
      if (!navigator.onLine) {
        return null; // Can't authenticate with cloud when offline
      }
      
      // Simulate cloud API call
      const cloudUser = await this.mockCloudAuth(credentials);
      
      return cloudUser;
      
    } catch (error) {
      console.error('Cloud authentication failed:', error);
      return null;
    }
  }

  /**
   * Mock cloud authentication (replace with real implementation)
   */
  async mockCloudAuth(credentials) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock cloud users database
    const cloudUsers = [
      {
        id: 'cloud_user_1',
        email: 'user@example.com',
        password: await encryptionService.hashPassword('password123'),
        name: 'Cloud User',
        role: 'user',
        devices: [this.deviceId],
        created_at: new Date().toISOString()
      }
    ];
    
    const user = cloudUsers.find(u => u.email === credentials.email);
    
    if (!user) {
      return null;
    }
    
    const isValidPassword = await encryptionService.verifyPassword(credentials.password, user.password);
    
    if (!isValidPassword) {
      return null;
    }
    
    // Add current device if not already added
    if (!user.devices.includes(this.deviceId)) {
      user.devices.push(this.deviceId);
      // In real implementation, update cloud database
    }
    
    return user;
  }

  /**
   * Create user session
   */
  async createUserSession(user) {
    const session = {
      user: {
        ...user,
        password: undefined // Don't include password in session
      },
      deviceId: this.deviceId,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString(),
      authToken: this.generateAuthToken()
    };
    
    return session;
  }

  /**
   * Store user session
   */
  storeUserSession(session) {
    localStorage.setItem(this.userSessionKey, JSON.stringify(session));
    localStorage.setItem('currentUser', JSON.stringify(session.user));
  }

  /**
   * Get current session
   */
  getCurrentSession() {
    try {
      const sessionData = localStorage.getItem(this.userSessionKey);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData);
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Failed to get current session:', error);
      return null;
    }
  }

  /**
   * Validate existing session
   */
  async validateExistingSession() {
    const session = this.getCurrentSession();
    
    if (!session) {
      return false;
    }
    
    // Check if session is still valid
    const timeUntilExpiry = new Date(session.expiresAt) - new Date();
    
    if (timeUntilExpiry < 0) {
      // Session expired
      this.clearSession();
      return false;
    }
    
    // If session expires in less than 1 hour, try to refresh
    if (timeUntilExpiry < 60 * 60 * 1000) {
      await this.refreshSession(session);
    }
    
    return true;
  }

  /**
   * Refresh session
   */
  async refreshSession(session) {
    try {
      // Extend session expiry
      const refreshedSession = {
        ...session,
        expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString(),
        authToken: this.generateAuthToken()
      };
      
      this.storeUserSession(refreshedSession);
      
      console.log('Session refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh session:', error);
    }
  }

  /**
   * Handle session changes (multi-tab support)
   */
  handleSessionChange(newSessionData) {
    if (!newSessionData) {
      // Session was cleared in another tab
      this.clearSession();
      window.location.reload(); // Redirect to login
    } else {
      // Session was updated in another tab
      const session = JSON.parse(newSessionData);
      if (session.user) {
        // Update current user
        localStorage.setItem('currentUser', JSON.stringify(session.user));
      }
    }
  }

  /**
   * Sync user data from cloud
   */
  async syncUserDataFromCloud(user) {
    try {
      if (!navigator.onLine) {
        console.log('Offline - skipping cloud sync');
        return;
      }

      console.log(`Starting cloud sync for user: ${user.id}`);

      // Initialize cloud sync for this user
      cloudSync.setUserId(user.id);

      // Wait a bit for cloud sync to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Trigger full sync
      await cloudSync.syncAll();

      console.log('User data synced from cloud successfully');

      // Force UI refresh after sync
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceUIRefresh'));
      }, 500);

    } catch (error) {
      console.warn('Failed to sync user data from cloud:', error);
    }
  }

  /**
   * Store user locally for offline access
   */
  async storeUserLocally(user) {
    try {
      const localUsers = await this.getLocalUsers();
      
      // Check if user already exists locally
      const existingIndex = localUsers.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        // Update existing user
        localUsers[existingIndex] = user;
      } else {
        // Add new user
        localUsers.push(user);
      }
      
      // Store updated users list
      localStorage.setItem('systemUsers', JSON.stringify(localUsers));
      
    } catch (error) {
      console.error('Failed to store user locally:', error);
    }
  }

  /**
   * Get local users
   */
  async getLocalUsers() {
    try {
      const localData = localStorage.getItem('systemUsers');
      let users = localData ? JSON.parse(localData) : [];

      // Add default admin users if none exist
      if (users.length === 0) {
        const defaultUsers = [
          {
            id: this.generateConsistentUserId('pixelartvj@gmail.com'),
            email: 'pixelartvj@gmail.com',
            password: await encryptionService.hashPassword('yvj{89kN$2.8'),
            name: 'Pixel Art VJ',
            role: 'admin',
            created_at: new Date().toISOString()
          },
          {
            id: this.generateConsistentUserId('pixeloffice2025@gmail.com'),
            email: 'pixeloffice2025@gmail.com',
            password: await encryptionService.hashPassword('b)W17,>1@Z2C'),
            name: 'Pixel Office 2025',
            role: 'user',
            created_at: new Date().toISOString()
          }
        ];

        // Store the default users
        localStorage.setItem('systemUsers', JSON.stringify(defaultUsers));
        return defaultUsers;
      }

      // Check if existing users have passwords, if not, add default passwords
      // Also update all user IDs to consistent IDs based on email
      let needsUpdate = false;
      for (let user of users) {
        // Update all user IDs to consistent IDs based on email
        const consistentId = this.generateConsistentUserId(user.email);
        if (user.id !== consistentId) {
          console.log(`Updating user ID from ${user.id} to ${consistentId} for ${user.email}`);
          user.id = consistentId;
          needsUpdate = true;
        }

        if (!user.password) {
          // Add default password based on email
          if (user.email === 'pixelartvj@gmail.com') {
            user.password = await encryptionService.hashPassword('yvj{89kN$2.8');
            needsUpdate = true;
          } else if (user.email === 'pixeloffice2025@gmail.com') {
            user.password = await encryptionService.hashPassword('b)W17,>1@Z2C');
            needsUpdate = true;
          } else {
            // For other users without passwords, set a default password
            user.password = await encryptionService.hashPassword('defaultPassword123');
            needsUpdate = true;
          }
        }
      }

      // Update localStorage if passwords were added
      if (needsUpdate) {
        localStorage.setItem('systemUsers', JSON.stringify(users));
      }

      return users;
    } catch (error) {
      console.error('Failed to get local users:', error);
      return [];
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(inputPassword, storedPassword) {
    // Handle undefined or null stored password
    if (!storedPassword) {
      console.warn('Stored password is undefined or null');
      return false;
    }

    // If stored password is not hashed (legacy), hash it first
    if (!storedPassword.includes('=') || storedPassword.length < 20) {
      return inputPassword === storedPassword;
    }

    // Use encryption service to verify hashed password
    return await encryptionService.verifyPassword(inputPassword, storedPassword);
  }

  /**
   * Logout
   */
  async logout() {
    try {
      const session = this.getCurrentSession();
      
      if (session) {
        // Clear cloud sync
        cloudSync.setUserId(null);
        
        // Clear session
        this.clearSession();
      }
      
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  /**
   * Clear session
   */
  clearSession() {
    localStorage.removeItem(this.userSessionKey);
    localStorage.removeItem('currentUser');
  }

  /**
   * Generate consistent user ID based on email
   * This ensures the same email always gets the same ID across devices
   */
  generateConsistentUserId(email) {
    // Create a simple hash of the email for consistent ID generation
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to positive number and add prefix
    const positiveHash = Math.abs(hash);
    return `user_${positiveHash}`;
  }

  /**
   * Generate auth token
   */
  generateAuthToken() {
    return 'auth_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get or create device ID
   */
  getOrCreateDeviceId() {
    let deviceId = localStorage.getItem(this.deviceIdKey);
    
    if (!deviceId) {
      deviceId = 'device_' + Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(this.deviceIdKey, deviceId);
    }
    
    return deviceId;
  }

  /**
   * Get device info
   */
  getDeviceInfo() {
    return {
      deviceId: this.deviceId,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const session = this.getCurrentSession();
    return !!session;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    const session = this.getCurrentSession();
    return session ? session.user : null;
  }

  /**
   * Cleanup on destroy
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    window.removeEventListener('storage', this.handleSessionChange);
  }
}

// Create and export singleton instance
export const crossDeviceAuth = new CrossDeviceAuthService();
export default crossDeviceAuth;
