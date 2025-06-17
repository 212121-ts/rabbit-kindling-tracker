// generate-keys.js - Standalone script to generate license keys
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

// Parse command line arguments
const args = process.argv.slice(2);
const count = parseInt(args[0]) || 5;
const notes = args[1] || 'Batch generated';

console.log(`Generating ${count} license keys...`);

// Connect to database
const db = new sqlite3.Database('./rabbit_tracker.db');

// Ensure license_keys table exists
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

function generateLicenseKey() {
  // Generate exactly 16 characters (4 groups of 4)
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

const keys = [];
let generated = 0;

// Generate the keys
for (let i = 0; i < count; i++) {
  const key = generateLicenseKey();
  
  db.run(
    'INSERT INTO license_keys (key, notes) VALUES (?, ?)',
    [key, notes],
    function(err) {
      if (err) {
        console.error('Error generating key:', err.message);
      } else {
        keys.push(key);
        console.log(`✓ Generated: ${key}`);
      }
      
      generated++;
      
      // When all keys are processed
      if (generated === count) {
        console.log('\n=== SUMMARY ===');
        console.log(`Successfully generated ${keys.length} keys`);
        console.log(`Failed: ${count - keys.length}`);
        
        if (keys.length > 0) {
          console.log('\n=== LICENSE KEYS ===');
          keys.forEach(key => console.log(key));
          
          // Save to file
          const fs = require('fs');
          const filename = `license-keys-${Date.now()}.txt`;
          const content = `License Keys Generated on ${new Date().toISOString()}\n` +
                         `Notes: ${notes}\n` +
                         `=====================================\n\n` +
                         keys.join('\n');
          
          fs.writeFileSync(filename, content);
          console.log(`\n✓ Keys saved to ${filename}`);
        }
        
        db.close();
      }
    }
  );
}

// Usage instructions
console.log('\nUsage: node generate-keys.js [count] [notes]');
console.log('Example: node generate-keys.js 10 "Early bird special"');