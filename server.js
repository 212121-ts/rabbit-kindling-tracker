// server.js - Rabbit Kindling Tracker with PostgreSQL Database
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin-password-change-this';

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.stack);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Create tables
async function initializeDatabase() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        license_key TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // License keys table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS license_keys (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        email TEXT,
        used BOOLEAN DEFAULT false,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      )
    `);

    // Records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        breeding_date DATE NOT NULL,
        doe_name TEXT NOT NULL,
        buck_name TEXT,
        notes TEXT,
        litter_size INTEGER,
        male_count INTEGER,
        female_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Initialize database on startup
initializeDatabase();

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
  res.json({ required: true });
});

// Register with license key
app.post('/api/register', async (req, res) => {
  const { email, password, licenseKey } = req.body;
  
  console.log('Registration attempt:', { email, licenseKey });
  
  try {
    // Check if license key is valid and unused
    const licenseResult = await pool.query(
      'SELECT * FROM license_keys WHERE key = $1 AND used = false',
      [licenseKey]
    );
    
    if (licenseResult.rows.length === 0) {
      console.log('License key not found or already used:', licenseKey);
      return res.status(400).json({ error: 'Invalid or already used license key' });
    }
    
    console.log('Valid license found');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (email, password, license_key) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, licenseKey]
    );
    
    const userId = userResult.rows[0].id;
    console.log('User created with ID:', userId);
    
    // Mark license as used
    await pool.query(
      'UPDATE license_keys SET used = true, used_at = CURRENT_TIMESTAMP, email = $1 WHERE key = $2',
      [email, licenseKey]
    );
    
    console.log('License marked as used');
    
    const token = jwt.sign({ id: userId, email }, JWT_SECRET);
    res.json({ token, userId });
    
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, userId: user.id });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get all records for user
app.get('/api/records', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM records WHERE user_id = $1 ORDER BY breeding_date DESC',
      [req.user.id]
    );
    res.json({ records: result.rows });
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Add new record
app.post('/api/records', authenticateToken, async (req, res) => {
  const {
    breeding_date,
    doe_name,
    buck_name,
    notes,
    litter_size,
    male_count,
    female_count
  } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO records (user_id, breeding_date, doe_name, buck_name, notes, 
       litter_size, male_count, female_count) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [req.user.id, breeding_date, doe_name, buck_name, notes, 
       litter_size, male_count, female_count]
    );
    
    res.json({ id: result.rows[0].id, message: 'Record added successfully' });
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).json({ error: 'Failed to add record' });
  }
});

// Update record (litter info)
app.put('/api/records/:id', authenticateToken, async (req, res) => {
  const { litter_size, male_count, female_count } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE records SET litter_size = $1, male_count = $2, female_count = $3 
       WHERE id = $4 AND user_id = $5`,
      [litter_size, male_count, female_count, req.params.id, req.user.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json({ message: 'Record updated successfully' });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// Delete record
app.delete('/api/records/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM records WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Admin Routes

// Generate new license keys
app.post('/api/admin/generate-keys', authenticateAdmin, async (req, res) => {
  const { count = 1, notes } = req.body;
  const keys = [];
  
  function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        key += '-';
      }
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }
  
  try {
    for (let i = 0; i < count; i++) {
      const key = generateLicenseKey();
      
      try {
        await pool.query(
          'INSERT INTO license_keys (key, notes) VALUES ($1, $2)',
          [key, notes || null]
        );
        keys.push(key);
        console.log('Generated key:', key);
      } catch (err) {
        console.error('Error generating key:', err);
      }
    }
    
    res.json({ 
      success: true, 
      keys,
      message: `Generated ${keys.length} license keys`
    });
  } catch (error) {
    console.error('Error in key generation:', error);
    res.status(500).json({ error: 'Failed to generate keys' });
  }
});

// Get all license keys
app.get('/api/admin/license-keys', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM license_keys ORDER BY created_at DESC'
    );
    console.log(`Found ${result.rows.length} license keys`);
    res.json({ keys: result.rows });
  } catch (error) {
    console.error('Error fetching keys:', error);
    res.status(500).json({ error: 'Failed to fetch keys' });
  }
});

// Get all users
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.license_key, u.created_at,
      COUNT(r.id) as record_count
      FROM users u
      LEFT JOIN records r ON u.id = r.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Revoke a license key
app.post('/api/admin/revoke-license', authenticateAdmin, async (req, res) => {
  const { licenseKey } = req.body;
  
  try {
    await pool.query(
      'UPDATE license_keys SET used = true, notes = $1 WHERE key = $2',
      ['Revoked by admin', licenseKey]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error revoking license:', error);
    res.status(500).json({ error: 'Failed to revoke license' });
  }
});

// Admin stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = {};
    
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    stats.totalUsers = parseInt(usersResult.rows[0].count);
    
    const keysResult = await pool.query('SELECT COUNT(*) FROM license_keys');
    stats.totalKeys = parseInt(keysResult.rows[0].count);
    
    const usedKeysResult = await pool.query('SELECT COUNT(*) FROM license_keys WHERE used = true');
    stats.usedKeys = parseInt(usedKeysResult.rows[0].count);
    
    const recordsResult = await pool.query('SELECT COUNT(*) FROM records');
    stats.totalRecords = parseInt(recordsResult.rows[0].count);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Admin route to reset user password
app.post('/api/admin/reset-password', authenticateAdmin, async (req, res) => {
  const { email, newPassword } = req.body;
  
  try {
    // Generate new password hash
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user's password
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Using PostgreSQL database');
});