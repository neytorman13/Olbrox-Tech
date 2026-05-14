const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function createContentBlocksTable() {
  let connection;

  try {
    const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    const dbConfig = databaseUrl
      ? (() => {
          const parsed = new URL(databaseUrl);
          return {
            host: parsed.hostname,
            user: parsed.username || 'root',
            password: parsed.password || '',
            database: parsed.pathname?.replace(/^\//, ''),
          };
        })()
      : {
          host: process.env.MYSQL_HOST || '127.0.0.1',
          user: process.env.MYSQL_USER || 'root',
          password: process.env.MYSQL_PASSWORD || '',
          database: process.env.MYSQL_DATABASE || 'olbrox_db',
        };

    connection = await mysql.createConnection(dbConfig);

    console.log('Connected to MySQL');

    // Drop table if exists
    await connection.execute('DROP TABLE IF EXISTS content_blocks');

    // Create table
    await connection.execute(`
      CREATE TABLE content_blocks (
        id CHAR(36) NOT NULL PRIMARY KEY,
        block_identifier TEXT NOT NULL,
        block_name TEXT NOT NULL,
        block_type ENUM('hero','text','cta','stats','features','custom') NOT NULL DEFAULT 'text',
        content JSON NOT NULL,
        is_published BOOLEAN NOT NULL DEFAULT TRUE,
        updated_by CHAR(36),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY uk_content_blocks_identifier (block_identifier(191)),
        CONSTRAINT fk_content_blocks_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('content_blocks table created successfully');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createContentBlocksTable();