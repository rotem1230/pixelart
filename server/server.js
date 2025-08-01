import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import os from 'os';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://keiiudanuwfjoartssdr.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlaWl1ZGFudXdmam9hcnRzc2RyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDE4OTYsImV4cCI6MjA2OTYxNzg5Nn0.U-8p5tIxAgm4ZezPCYqamux64r7huVcWhAqqfRgcomc';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

// Create Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize database and create tables
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing Supabase tables...');

    // Check if tables exist, if not create them via SQL
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('Tables check failed, they might not exist yet. This is normal for first run.');
    }

    // Create users table if it doesn't exist
    const { error: usersError } = await supabase.rpc('create_users_table');
    if (usersError && !usersError.message.includes('already exists')) {
      console.log('Users table creation result:', usersError.message);
    }

    // Create user_data table if it doesn't exist
    const { error: dataError } = await supabase.rpc('create_user_data_table');
    if (dataError && !dataError.message.includes('already exists')) {
      console.log('User data table creation result:', dataError.message);
    }

    // Function to generate consistent user ID based on email
    const generateConsistentUserId = (email) => {
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return `user_${Math.abs(hash)}`;
    };

    // Create default admin users
    const defaultUsers = [
      {
        id: generateConsistentUserId('pixelartvj@gmail.com'),
        email: 'pixelartvj@gmail.com',
        password: 'yvj{89kN$2.8',
        name: 'Pixel Art VJ',
        role: 'admin'
      },
      {
        id: generateConsistentUserId('pixeloffice2025@gmail.com'),
        email: 'pixeloffice2025@gmail.com',
        password: 'b)W17,>1@Z2C',
        name: 'Pixel Office 2025',
        role: 'user'
      }
    ];

    // Try to create default users
    for (const user of defaultUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Check if user exists
        const { data: existingUser } = await supabase
          .from('users')
          .select('email')
          .eq('email', user.email)
          .single();

        if (!existingUser) {
          const { error } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              password: hashedPassword,
              name: user.name,
              role: user.role
            });

          if (error) {
            console.log(`Failed to create user ${user.email}:`, error.message);
          } else {
            console.log(`✅ Created user: ${user.email}`);
          }
        }
      } catch (error) {
        console.log(`User ${user.email} setup error:`, error.message);
      }
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Initialize database on startup
initializeDatabase();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pixel Art VJ Server is running' });
});

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all data for a specific entity and user
app.get('/api/sync/:entity/:userId', async (req, res) => {
  const { entity, userId } = req.params;

  // Log the request for debugging
  console.log(`📥 GET /api/sync/${entity}/${userId}`);

  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('entity_id, data')
      .eq('user_id', userId)
      .eq('entity_name', entity);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    const items = (data || []).map(row => JSON.parse(row.data));
    res.json({ items });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update data for a specific entity and user
app.post('/api/sync/:entity/:userId', async (req, res) => {
  const { entity, userId } = req.params;
  const { items } = req.body;

  // Log the request for debugging
  console.log(`📤 POST /api/sync/${entity}/${userId} - ${items?.length || 0} items`);

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }

  try {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const item of items) {
        if (item.id) {
          await client.query(
            `INSERT INTO user_data (user_id, entity_name, entity_id, data)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, entity_name, entity_id)
             DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
            [userId, entity, item.id, JSON.stringify(item)]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ success: true, count: items.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Get all entities for a user (for full sync)
app.get('/api/sync/all/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const client = await pool.connect();
    const result = await client.query(
      'SELECT entity_name, entity_id, data FROM user_data WHERE user_id = $1',
      [userId]
    );
    client.release();

    const data = {};
    result.rows.forEach(row => {
      if (!data[row.entity_name]) {
        data[row.entity_name] = [];
      }
      data[row.entity_name].push(JSON.parse(row.data));
    });

    res.json({ data });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete specific item
app.delete('/api/sync/:entity/:userId/:itemId', async (req, res) => {
  const { entity, userId, itemId } = req.params;

  try {
    const client = await pool.connect();
    const result = await client.query(
      'DELETE FROM user_data WHERE user_id = $1 AND entity_name = $2 AND entity_id = $3',
      [userId, entity, itemId]
    );
    client.release();

    res.json({ success: true, deleted: result.rowCount > 0 });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Pixel Art VJ Server running on port ${PORT}`);
  console.log(`📊 Local access: http://localhost:${PORT}/api/health`);

  // Show network IP addresses for other devices
  const networkInterfaces = os.networkInterfaces();

  console.log('\n🌐 Network access from other devices:');
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(netInterface => {
      if (netInterface.family === 'IPv4' && !netInterface.internal) {
        console.log(`   http://${netInterface.address}:${PORT}/api/health`);
      }
    });
  });
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await pool.end();
    console.log('✅ PostgreSQL connection pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
  process.exit(0);
});
