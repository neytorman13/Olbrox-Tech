const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function setupDatabase() {
  let connection;

  try {
    // Connect without specifying database first
    const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL
    const dbConfig = databaseUrl
      ? (() => {
          const parsed = new URL(databaseUrl)
          return {
            host: parsed.hostname,
            user: parsed.username || 'root',
            password: parsed.password || '',
          }
        })()
      : {
          host: process.env.MYSQL_HOST || '127.0.0.1',
          user: process.env.MYSQL_USER || 'root',
          password: process.env.MYSQL_PASSWORD || '',
        }

    connection = await mysql.createConnection({
      ...dbConfig,
      timezone: 'Z',
    });

    console.log('Connected to MySQL server');

    const databaseName = process.env.MYSQL_DATABASE || 'olbrox_db';

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${databaseName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database ${databaseName} created or already exists`);

    // Switch to the database
    await connection.query(`USE ${databaseName}`);

    // Read and execute the schema file
    const schemaPath = path.join(__dirname, '..', 'scripts', 'mysql_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement.trim());
          console.log('Executed statement successfully');
        } catch (error) {
          console.log('Statement failed (might be expected):', error.message);
        }
      }
    }

    console.log('Database setup completed');

    // Verify admin user exists
    const [rows] = await connection.execute('SELECT id, email, password_hash FROM users WHERE email = ?', ['admin@olbrox.tech']);
    console.log('Admin user check:', rows.length > 0 ? 'EXISTS' : 'NOT FOUND');
    if (rows.length > 0) {
      console.log('Admin email:', rows[0].email);
      console.log('Password hash present:', !!rows[0].password_hash);
    }

  } catch (error) {
    console.error('Database setup error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();