// server.js - Rabbit Kindling Tracker with License Key System and Persistent Database
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin-password-change-this';

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// Create data directory for persistent storage
const dataDir = process.env.RENDER ? '/opt/render/project/src/data' : './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database setup with persistent path
const dbPath = path.join(dataDir, 'rabbit_tracker.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database successfully');
  }
});

// Create tables
db.serialize(() => {
  // Users table with license_key field
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      license_key TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // License keys table
  db.run(`
    CREATE TABLE IF NOT EXISTS license_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      email TEXT,
      used BOOLEAN DEFAULT 0,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )
  `);

  // Records table
  db.run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      breeding_date DATE NOT NULL,
      doe_name TEXT NOT NULL,
      buck_name TEXT,
      notes TEXT,
      litter_size INTEGER,
      male_count INTEGER,
      female_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];
  
  if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  next();
};

// Routes

// Check if license key is required
app.get('/api/license-required', (req, res) => {
  // You can set this to false if you want to allow free registrations
  res.json({ required: true });
});

// Register with license key
app.post('/api/register', async (req, res) => {
  const { email, password, licenseKey } = req.body;
  
  console.log('Registration attempt:', { email, licenseKey });
  
  // First check if license key is valid and unused
  db.get(
    'SELECT * FROM license_keys WHERE key = ? AND used = 0',
    [licenseKey],
    async (err, license) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!license) {
        console.log('License key not found or already used:', licenseKey);
        return res.status(400).json({ error: 'Invalid or already used license key' });
      }
      
      console.log('Valid license found:', license);
      
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        db.run(
          'INSERT INTO users (email, password, license_key) VALUES (?, ?, ?)',
          [email, hashedPassword, licenseKey],
          function(err) {
            if (err) {
              console.error('Error creating user:', err);
              if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Email already exists' });
              }
              return res.status(500).json({ error: 'Registration failed' });
            }
            
            const userId = this.lastID;
            console.log('User created with ID:', userId);
            
            // Mark license as used
            db.run(
              'UPDATE license_keys SET used = 1, used_at = CURRENT_TIMESTAMP, email = ? WHERE key = ?',
              [email, licenseKey],
              (err) => {
                if (err) {
                  console.error('Error updating license:', err);
                  // Rollback user creation if license update fails
                  db.run('DELETE FROM users WHERE id = ?', [userId]);
                  return res.status(500).json({ error: 'Failed to activate license' });
                }
                
                console.log('License marked as used');
                const token = jwt.sign({ id: userId, email }, JWT_SECRET);
                res.json({ token, userId });
              }
            );
          }
        );
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
      }
    }
  );
});

// Login (unchanged)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      res.json({ token, userId: user.id });
    }
  );
});

// Get all records for user
app.get('/api/records', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM records WHERE user_id = ? ORDER BY breeding_date DESC',
    [req.user.id],
    (err, records) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch records' });
      }
      res.json({ records });
    }
  );
});

// Add new record
app.post('/api/records', authenticateToken, (req, res) => {
  const {
    breeding_date,
    doe_name,
    buck_name,
    notes,
    litter_size,
    male_count,
    female_count
  } = req.body;
  
  db.run(
    `INSERT INTO records (user_id, breeding_date, doe_name, buck_name, notes, 
     litter_size, male_count, female_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, breeding_date, doe_name, buck_name, notes, 
     litter_size, male_count, female_count],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add record' });
      }
      res.json({ id: this.lastID, message: 'Record added successfully' });
    }
  );
});

// Update record (litter info)
app.put('/api/records/:id', authenticateToken, (req, res) => {
  const { litter_size, male_count, female_count } = req.body;
  
  db.run(
    `UPDATE records SET litter_size = ?, male_count = ?, female_count = ? 
     WHERE id = ? AND user_id = ?`,
    [litter_size, male_count, female_count, req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update record' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.json({ message: 'Record updated successfully' });
    }
  );
});

// Delete record
app.delete('/api/records/:id', authenticateToken, (req, res) => {
  db.run(
    'DELETE FROM records WHERE id = ? AND user_id = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete record' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.json({ message: 'Record deleted successfully' });
    }
  );
});

// Admin Routes

// Generate new license keys
app.post('/api/admin/generate-keys', authenticateAdmin, (req, res) => {
  const { count = 1, notes } = req.body;
  const keys = [];
  
  const crypto = require('crypto');
  
  function generateLicenseKey() {
    return crypto.randomBytes(16).toString('hex')
      .toUpperCase()
      .match(/.{4}/g)
      .join('-');
  }
  
  let generated = 0;
  
  for (let i = 0; i < count; i++) {
    const key = generateLicenseKey();
    
    db.run(
      'INSERT INTO license_keys (key, notes) VALUES (?, ?)',
      [key, notes || null],
      function(err) {
        if (!err) {
          keys.push(key);
          console.log('Generated key:', key);
        } else {
          console.error('Error generating key:', err);
        }
        
        generated++;
        if (generated === count) {
          res.json({ 
            success: true, 
            keys,
            message: `Generated ${keys.length} license keys`
          });
        }
      }
    );
  }
});

// Get all license keys
app.get('/api/admin/license-keys', authenticateAdmin, (req, res) => {
  db.all(
    'SELECT * FROM license_keys ORDER BY created_at DESC',
    (err, keys) => {
      if (err) {
        console.error('Error fetching keys:', err);
        return res.status(500).json({ error: 'Failed to fetch keys' });
      }
      console.log(`Found ${keys.length} license keys`);
      res.json({ keys });
    }
  );
});

// Get all users
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
  db.all(
    `SELECT u.id, u.email, u.license_key, u.created_at,
     COUNT(r.id) as record_count
     FROM users u
     LEFT JOIN records r ON u.id = r.user_id
     GROUP BY u.id
     ORDER BY u.created_at DESC`,
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch users' });
      }
      res.json({ users });
    }
  );
});

// Revoke a license key
app.post('/api/admin/revoke-license', authenticateAdmin, (req, res) => {
  const { licenseKey } = req.body;
  
  db.run(
    'UPDATE license_keys SET used = 1, notes = ? WHERE key = ?',
    ['Revoked by admin', licenseKey],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to revoke license' });
      }
      res.json({ success: true });
    }
  );
});

// Admin stats
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  db.get(
    `SELECT 
     (SELECT COUNT(*) FROM users) as totalUsers,
     (SELECT COUNT(*) FROM license_keys) as totalKeys,
     (SELECT COUNT(*) FROM license_keys WHERE used = 1) as usedKeys,
     (SELECT COUNT(*) FROM records) as totalRecords`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch stats' });
      }
      res.json(stats);
    }
  );
});

// Debug route to check database
app.get('/api/admin/debug', authenticateAdmin, (req, res) => {
  db.all('SELECT * FROM license_keys LIMIT 10', (err, keys) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ 
      dbPath: dbPath,
      keysCount: keys.length,
      keys: keys
    });
  });
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database location: ${dbPath}`);
});