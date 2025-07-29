class CustomSDK {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api'; // או כל URL שתרצה
    this.currentUser = null;
  }

  // Authentication methods
  auth = {
    getCurrentUser: async () => {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    },
    
    login: async (credentials) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get users from localStorage (created by admin)
      const systemUsers = localStorage.getItem('systemUsers');
      let validCredentials = [
        { email: 'pixelartvj@gmail.com', password: 'yvj{89kN$2.8', name: 'Pixel Art VJ', role: 'admin' },
        { email: 'pixeloffice2025@gmail.com', password: 'b)W17,>1@Z2C', name: 'Pixel Office 2025', role: 'user' }
      ];
      
      // If system users exist, merge them with default users
      if (systemUsers) {
        const users = JSON.parse(systemUsers);
        // Keep default users and add new ones
        const newUsers = users.filter(user => 
          !validCredentials.some(cred => cred.email === user.email)
        );
        validCredentials = [
          ...validCredentials,
          ...newUsers.map(user => ({
            email: user.email,
            password: user.password || 'defaultPassword123',
            name: user.name,
            role: user.role
          }))
        ];
      }
      
      const validUser = validCredentials.find(
        cred => cred.email === credentials.email && cred.password === credentials.password
      );
      
      if (!validUser) {
        throw new Error('פרטי ההתחברות שגויים');
      }
      
      const user = {
        id: Date.now().toString(),
        name: validUser.name,
        full_name: validUser.name,
        email: validUser.email,
        active_timer_id: null,
        role: validUser.role || 'user',
        loginTime: new Date().toISOString(),
        permissions: validUser.role === 'admin' ? {
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
        } : validUser.role === 'operator' ? {
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
        }
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUser = user;
      return user;
    },
    
    logout: async () => {
      localStorage.removeItem('currentUser');
      this.currentUser = null;
      return true;
    },
    
    isAuthenticated: async () => {
      const user = await this.getCurrentUser();
      return !!user;
    }
  };

  // Create entity methods
  createEntity(entityName) {
    return {
      getAll: async () => {
        const data = localStorage.getItem(entityName);
        return data ? JSON.parse(data) : [];
      },
      
      get: async (id) => {
        const data = localStorage.getItem(entityName);
        const items = data ? JSON.parse(data) : [];
        return items.find(item => item.id === id);
      },
      
      create: async (item) => {
        const data = localStorage.getItem(entityName);
        const items = data ? JSON.parse(data) : [];
        const newItem = { 
          ...item, 
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        items.push(newItem);
        localStorage.setItem(entityName, JSON.stringify(items));
        return newItem;
      },
      
      update: async (id, updates) => {
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
      },
      
      delete: async (id) => {
        const data = localStorage.getItem(entityName);
        const items = data ? JSON.parse(data) : [];
        const filtered = items.filter(item => item.id !== id);
        localStorage.setItem(entityName, JSON.stringify(filtered));
        return true;
      }
    };
  }

  // Entities
  entities = {
    Event: this.createEntity('events'),
    Task: this.createEntity('tasks'),
    WorkHours: this.createEntity('workHours'),
    Chat: this.createEntity('chats'),
    Canvas: this.createEntity('canvas'),
    PersonalMessage: this.createEntity('personalMessages'),
    Tag: this.createEntity('tags'),
    Client: this.createEntity('clients'),
    SeasonalClient: this.createEntity('seasonalClients'),
    Comment: this.createEntity('comments')
  };

  // Integrations
  integrations = {
    Core: {
      UploadFile: async (file) => {
        // Mock file upload
        return {
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
