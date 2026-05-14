const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function setupSQLite() {
  try {
    // Create database file
    const dbPath = path.join(__dirname, '..', 'olbrox.db');
    const db = new Database(dbPath);

    console.log('SQLite database created at:', dbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create tables (simplified version for testing)
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        raw_user_meta_data TEXT,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    const createAdminProfilesTable = `
      CREATE TABLE IF NOT EXISTS admin_profiles (
        id TEXT PRIMARY KEY,
        full_name TEXT,
        avatar_url TEXT,
        role TEXT NOT NULL DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
      );
    `;

    const createPageSeoTable = `
      CREATE TABLE IF NOT EXISTS page_seo (
        id TEXT PRIMARY KEY,
        page_identifier TEXT UNIQUE NOT NULL,
        page_name TEXT NOT NULL,
        meta_title_es TEXT,
        meta_title_en TEXT,
        meta_title_pt TEXT,
        meta_description_es TEXT,
        meta_description_en TEXT,
        meta_description_pt TEXT,
        og_image TEXT,
        keywords TEXT,
        canonical_url TEXT,
        no_index INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createContentBlocksTable = `
      CREATE TABLE IF NOT EXISTS content_blocks (
        id TEXT PRIMARY KEY,
        block_identifier TEXT UNIQUE NOT NULL,
        block_name TEXT NOT NULL,
        block_type TEXT NOT NULL DEFAULT 'text',
        content TEXT NOT NULL DEFAULT '{}',
        is_published INTEGER NOT NULL DEFAULT 1,
        updated_by TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );
    `;

    // Execute table creation
    db.exec(createUsersTable);
    db.exec(createSessionsTable);
    db.exec(createAdminProfilesTable);
    db.exec(createPageSeoTable);
    db.exec(createContentBlocksTable);

    console.log('Tables created successfully');

    // Insert admin user
    const adminId = crypto.randomUUID();
    const adminPassword = 'Admin@123456';
    const passwordHash = crypto.createHash('sha256').update(adminPassword).digest('hex');

    const insertAdmin = db.prepare(`
      INSERT OR REPLACE INTO users (id, email, full_name, password_hash, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    insertAdmin.run(adminId, 'admin@olbrox.tech', 'Administrador', passwordHash, 'super_admin');

    console.log('Admin user created with email: admin@olbrox.tech');
    console.log('Password hash:', passwordHash);

    // Verify admin user
    const getAdmin = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?');
    const admin = getAdmin.get('admin@olbrox.tech');
    console.log('Admin user verification:', admin ? 'EXISTS' : 'NOT FOUND');

    db.close();
    console.log('SQLite setup completed successfully');

  } catch (error) {
    console.error('SQLite setup error:', error);
  }
}

setupSQLite();