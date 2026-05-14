import mysql from 'mysql2/promise'
import Database from 'better-sqlite3'
import path from 'path'

interface MySqlConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

interface QueryPool {
  execute(sql: string, values?: unknown[]): Promise<[any, any]>
}

interface SqlitePool extends QueryPool {
  execute(sql: string, values?: unknown[]): Promise<[any, any]>
}

interface MysqlPool extends QueryPool {
  execute(sql: string, values?: unknown[]): Promise<[any, any]>
}

function parseDatabaseUrl(url: string): Partial<MySqlConfig> {
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 3306),
      user: parsed.username,
      password: parsed.password,
      database: parsed.pathname?.replace(/^\//, ''),
    }
  } catch (error) {
    throw new Error(`Invalid database URL: ${url}`)
  }
}

const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL
const urlConfig = databaseUrl ? parseDatabaseUrl(databaseUrl) : {}

const mysqlPool = mysql.createPool({
  host: urlConfig.host || process.env.MYSQL_HOST || '127.0.0.1',
  port: urlConfig.port || Number(process.env.MYSQL_PORT || 3306),
  user: urlConfig.user || process.env.MYSQL_USER || 'root',
  password: urlConfig.password ?? process.env.MYSQL_PASSWORD ?? '',
  database: urlConfig.database || process.env.MYSQL_DATABASE || 'olbrox_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_MAX_CONNECTIONS || 10),
  queueLimit: 0,
  timezone: 'Z',
})

const sqliteDbPath = path.join(process.cwd(), 'olbrox.db')
const sqliteDb = new Database(sqliteDbPath, { fileMustExist: false })
sqliteDb.pragma('foreign_keys = ON')

let activePool: QueryPool | null = null
const sqliteFallbackPool = createSqlitePool()
const mysqlConfigured = Boolean(databaseUrl || process.env.MYSQL_HOST || process.env.MYSQL_DATABASE || process.env.MYSQL_USER)

async function testMysqlConnection(pool: mysql.Pool): Promise<void> {
  const connection = await pool.getConnection()
  connection.release()
}

function createSqlitePool(): QueryPool {
  return {
    execute: async (sql: string, values: unknown[] = []) => {
      const statement = sqliteDb.prepare(sql)

      // Convert values to SQLite-compatible types
      const sanitizedValues = values.map(value => {
        if (value === null || value === undefined) return null
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'bigint' || Buffer.isBuffer(value)) {
          return value
        }
        // Convert objects/arrays to JSON strings
        return JSON.stringify(value)
      })

      const normalizedSql = sql.trim().toUpperCase()
      if (normalizedSql.startsWith('SELECT')) {
        const rows = statement.all(...sanitizedValues)
        return [rows, []]
      }
      const result = statement.run(...sanitizedValues)
      return [result, []]
    },
  }
}

async function getPool(): Promise<QueryPool> {
  if (activePool) {
    return activePool
  }

  try {
    await testMysqlConnection(mysqlPool)
    activePool = {
      execute: async (sql: string, values: unknown[] = []) => {
        return mysqlPool.query(sql, values as any[])
      }
    } as MysqlPool
    return activePool
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn('MySQL connection failed, falling back to SQLite:', errorMessage)

    // If MySQL is configured, keep retrying on future calls instead of
    // permanently pinning this process to SQLite after one transient failure.
    if (mysqlConfigured) {
      return sqliteFallbackPool
    }

    activePool = sqliteFallbackPool
    return activePool
  }
}

const pool: QueryPool = {
  execute: async (sql: string, values: unknown[] = []) => {
    const client = await getPool()
    return client.execute(sql, values)
  },
}

export default pool

