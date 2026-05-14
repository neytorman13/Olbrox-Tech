const Database = require('better-sqlite3');
const db = new Database('olbrox.db');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));

  // Check if page_analytics exists
  const pageAnalyticsExists = tables.some(t => t.name === 'page_analytics');
  console.log('page_analytics exists:', pageAnalyticsExists);

  if (!pageAnalyticsExists) {
    console.log('Creating page_analytics table...');
    db.exec(`
      CREATE TABLE page_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_path TEXT NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        referrer TEXT,
        session_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('page_analytics table created successfully');
  }
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}