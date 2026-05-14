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

type MySqlSslConfig =
  | {
      rejectUnauthorized: boolean
    }
  | undefined

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

function envFlag(value: string | undefined, defaultValue = false) {
  if (value == null) return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function shouldEnableManagedSsl(host: string | undefined) {
  if (!host) return false
  return (
    host.endsWith('.rlwy.net') ||
    host.endsWith('.railway.internal') ||
    host.includes('proxy.rlwy.net')
  )
}

function resolveSslConfig(): MySqlSslConfig {
  const sslEnabled = envFlag(process.env.MYSQL_SSL, shouldEnableManagedSsl(urlConfig.host))
  if (!sslEnabled) {
    return undefined
  }

  return {
    rejectUnauthorized: envFlag(process.env.MYSQL_SSL_REJECT_UNAUTHORIZED, false),
  }
}

const databaseUrl = process.env.MYSQL_URL || process.env.DATABASE_URL
const urlConfig = databaseUrl ? parseDatabaseUrl(databaseUrl) : {}
const mysqlSsl = resolveSslConfig()
const isProduction = process.env.NODE_ENV === 'production'
const envHost = process.env.MYSQL_HOST
const envUser = process.env.MYSQL_USER
const envDatabase = process.env.MYSQL_DATABASE
const hasExplicitMysqlParts = Boolean(envHost && envUser && envDatabase)
const mysqlConfigured = Boolean(databaseUrl || hasExplicitMysqlParts)

const mysqlPool = mysql.createPool({
  host: urlConfig.host || envHost || '127.0.0.1',
  port: urlConfig.port || Number(process.env.MYSQL_PORT || 3306),
  user: urlConfig.user || envUser || 'root',
  password: urlConfig.password ?? process.env.MYSQL_PASSWORD ?? '',
  database: urlConfig.database || envDatabase || 'olbrox_db',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_MAX_CONNECTIONS || 10),
  queueLimit: 0,
  timezone: 'Z',
  connectTimeout: Number(process.env.MYSQL_CONNECT_TIMEOUT || 10000),
  ssl: mysqlSsl,
})

let activePool: QueryPool | null = null
let sqliteFallbackPool: QueryPool | null = null

async function testMysqlConnection(pool: mysql.Pool): Promise<void> {
  const connection = await pool.getConnection()
  connection.release()
}

function createSqlitePool(): QueryPool {
  const sqliteDbPath = path.join(process.cwd(), 'olbrox.db')
  const sqliteDb = new Database(sqliteDbPath, { fileMustExist: false })
  sqliteDb.pragma('foreign_keys = ON')

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

function getSqliteFallbackPool() {
  if (!sqliteFallbackPool) {
    sqliteFallbackPool = createSqlitePool()
  }
  return sqliteFallbackPool
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
    if (mysqlConfigured && isProduction) {
      throw new Error(`MySQL connection failed in production: ${errorMessage}`)
    }

    console.warn('MySQL connection failed, falling back to SQLite:', errorMessage)

    // If MySQL is configured, keep retrying on future calls instead of
    // permanently pinning this process to SQLite after one transient failure.
    if (mysqlConfigured) {
      return getSqliteFallbackPool()
    }

    activePool = getSqliteFallbackPool()
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

