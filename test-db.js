const Database = require('better-sqlite3');
const path = require('path');

function testDB() {
  try {
    const dbPath = path.join(__dirname, 'olbrox.db');
    const db = new Database(dbPath);

    console.log('Testing database connection...');

    // Check users
    const users = db.prepare('SELECT id, email, password_hash FROM users').all();
    console.log('Users in DB:', users.length);
    users.forEach(user => {
      console.log('User:', user.email, 'Hash present:', !!user.password_hash);
    });

    // Check sessions table
    const sessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
    console.log('Sessions in DB:', sessions.count);

    db.close();
  } catch (error) {
    console.error('DB test error:', error);
  }
}

testDB();