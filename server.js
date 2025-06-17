// server.js - Complete Express server for Rabbit Kindling Tracker
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// Database setup
const db = new sqlite3.Database('./rabbit_tracker.db');

// Create tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Helper function to get the spreadsheet
function getSpreadsheet() {
  try {
    // First try to get the active spreadsheet (for bound scripts)
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    // If that fails, try to open by ID
    if (SHEET_ID && SHEET_ID !== 'YOUR_GOOGLE_SHEETS_ID_HERE') {
      return SpreadsheetApp.openById(SHEET_ID);
    }
    throw new Error('Could not access spreadsheet. Please ensure the script is bound to a spreadsheet or provide a valid SHEET_ID.');
  }
}

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

// Routes

// Register
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }
        
        const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET);
        res.json({ token, userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
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

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});