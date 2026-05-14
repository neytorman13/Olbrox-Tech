import { cookies } from 'next/headers'
import { query, querySingle } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

const SAFE_IDENTIFIER = /^[a-zA-Z0-9_]+$/

function sanitizeIdentifier(value: string) {
  if (!SAFE_IDENTIFIER.test(value)) {
    throw new Error(`Invalid identifier: ${value}`)
  }
  return `\`${value}\``
}

function sanitizeSelect(columns: string) {
  const parts = columns.split(',').map((part) => part.trim())
  return parts
    .map((part) => {
      if (part === '*') return '*'
      if (part.includes('.')) {
        return part
          .split('.')
          .map((segment) => sanitizeIdentifier(segment))
          .join('.')
      }
      return sanitizeIdentifier(part)
    })
    .join(', ')
}

function buildWhere(filters: Array<{ operator: string; field: string; value: unknown }>) {
  const clauses: string[] = []
  const values: unknown[] = []

  for (const filter of filters || []) {
    const field = sanitizeIdentifier(filter.field)
    switch (filter.operator) {
      case 'eq':
        clauses.push(`${field} = ?`)
        values.push(filter.value)
        break
      case 'neq':
        clauses.push(`${field} <> ?`)
        values.push(filter.value)
        break
      case 'like':
        clauses.push(`${field} LIKE ?`)
        values.push(filter.value)
        break
      case 'gte':
        clauses.push(`${field} >= ?`)
        values.push(filter.value)
        break
      case 'lte':
      case 'lt':
        clauses.push(`${field} <= ?`)
        values.push(filter.value)
        break
      case 'in':
        if (!Array.isArray(filter.value) || filter.value.length === 0) {
          clauses.push('FALSE')
        } else {
          const placeholders = filter.value.map(() => '?').join(', ')
          clauses.push(`${field} IN (${placeholders})`)
          values.push(...filter.value)
        }
        break
      default:
        if (filter.operator.startsWith('not:')) {
          const operator = filter.operator.slice(4)
          if (operator === 'is' && filter.value === null) {
            clauses.push(`${field} IS NOT NULL`)
          } else if (operator === 'is') {
            clauses.push(`${field} IS NOT ?`)
            values.push(filter.value)
          } else {
            clauses.push(`${field} NOT ${operator} ?`)
            values.push(filter.value)
          }
          break
        }
        throw new Error(`Unsupported filter operator: ${filter.operator}`)
    }
  }

  return {
    clause: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  }
}

function projectRow(row: any, selectColumns?: string) {
  if (!selectColumns || selectColumns === '*' || !row) {
    return row
  }

  const columns = selectColumns
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/`/g, ''))

  const projected: any = {}
  for (const column of columns) {
    if (column === '*') {
      return row
    }
    if (Object.prototype.hasOwnProperty.call(row, column)) {
      projected[column] = row[column]
    }
  }
  return projected
}

type QueryFilter = {
  operator: 'eq' | 'neq' | 'like' | 'gte' | 'lte' | 'lt' | 'in' | `not:${string}`
  field: string
  value: unknown
}

type QueryOrder = {
  column: string
  ascending?: boolean
}

type QueryOptions = {
  head?: boolean
  count?: 'exact'
  single?: boolean
  maybeSingle?: boolean
}

class DBQuery implements PromiseLike<any> {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  selectColumns = '*'
  options: QueryOptions = {}
  data: unknown = null
  filters: QueryFilter[] = []
  orderBy?: QueryOrder
  limitValue?: number
  upsertOptions?: { onConflict?: string }

  constructor(table: string) {
    this.table = table
  }

  select(columns = '*', options: QueryOptions = {}) {
    this.operation = 'select'
    this.selectColumns = columns
    this.options = options
    return this
  }

  insert(data: unknown) {
    this.operation = 'insert'
    this.data = data
    return this
  }

  upsert(data: unknown, options: { onConflict?: string } = {}) {
    this.operation = 'upsert'
    this.data = data
    this.upsertOptions = options
    return this
  }

  update(data: unknown) {
    this.operation = 'update'
    this.data = data
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push({ operator: 'eq', field, value })
    return this
  }

  neq(field: string, value: unknown) {
    this.filters.push({ operator: 'neq', field, value })
    return this
  }

  like(field: string, value: string) {
    this.filters.push({ operator: 'like', field, value })
    return this
  }

  gte(field: string, value: unknown) {
    this.filters.push({ operator: 'gte', field, value })
    return this
  }

  lte(field: string, value: unknown) {
    this.filters.push({ operator: 'lte', field, value })
    return this
  }

  lt(field: string, value: unknown) {
    this.filters.push({ operator: 'lt', field, value })
    return this
  }

  not(field: string, operator: string, value: unknown) {
    this.filters.push({ operator: `not:${operator}`, field, value })
    return this
  }

  in(field: string, values: unknown[]) {
    this.filters.push({ operator: 'in', field, value: values })
    return this
  }

  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderBy = { column, ascending: options.ascending }
    return this
  }

  limit(value: number) {
    this.limitValue = value
    return this
  }

  single() {
    this.options.single = true
    return this
  }

  maybeSingle() {
    this.options.maybeSingle = true
    return this
  }

  async execute() {
    const tableName = sanitizeIdentifier(this.table)
    const where = buildWhere(this.filters)

    if (this.operation === 'select') {
      if (this.options.head && this.options.count === 'exact') {
        const countRow = await querySingle<{ count: number }>(
          `SELECT COUNT(*) AS count FROM ${tableName} ${where.clause}`,
          where.values,
        )
        return { data: null, count: countRow?.count ?? 0, error: null }
      }

      let sql = `SELECT ${sanitizeSelect(this.selectColumns)} FROM ${tableName} ${where.clause}`
      const values = [...where.values]
      if (this.orderBy?.column) {
        sql += ` ORDER BY ${sanitizeIdentifier(this.orderBy.column)} ${this.orderBy.ascending === false ? 'DESC' : 'ASC'}`
      }
      if (this.limitValue) {
        sql += ' LIMIT ?'
        values.push(this.limitValue)
      }

      const rows = await query<any[]>(sql, values)
      if (this.options.single || this.options.maybeSingle) {
        return { data: Array.isArray(rows) ? rows[0] ?? null : null, error: null }
      }

      return { data: rows, error: null }
    }

    const normalizeRecord = (record: Record<string, unknown>) => {
      const normalized: Record<string, unknown> = {}
      for (const key of Object.keys(record)) {
        if (!SAFE_IDENTIFIER.test(key)) continue
        normalized[key] = record[key]
      }
      return normalized
    }

    const records = Array.isArray(this.data)
      ? (this.data as Record<string, unknown>[]).map(normalizeRecord)
      : [normalizeRecord(this.data as Record<string, unknown>)]

    if (records.length === 0) {
      return { data: null, error: 'No records provided' }
    }

    const columns = Array.from(
      new Set(records.flatMap((record) => Object.keys(record))),
    ).filter((col) => SAFE_IDENTIFIER.test(col))

    if (columns.length === 0) {
      return { data: null, error: 'Invalid record keys' }
    }

    const insertSql = () => {
      const insertColumns = columns.map(sanitizeIdentifier).join(', ')
      const placeholders = columns.map(() => '?').join(', ')
      const rowPlaceholders = records.map(() => `(${placeholders})`).join(', ')
      const values: unknown[] = []
      const rows: any[] = []

      for (const record of records) {
        const row = { ...record }
        if (!row.id) {
          row.id = crypto.randomUUID()
        }
        rows.push(row)
        for (const column of columns) {
          values.push(row[column] ?? null)
        }
      }

      const sql = `INSERT INTO ${tableName} (${insertColumns}) VALUES ${rowPlaceholders}`
      return { sql, values, rows }
    }

    if (this.operation === 'insert' || this.operation === 'upsert') {
      const { sql, values, rows } = insertSql()

      if (this.operation === 'upsert') {
        if (!this.upsertOptions?.onConflict) {
          return { data: null, error: 'Missing upsert conflict key' }
        }

        const updateColumns = columns
          .filter((column) => column !== this.upsertOptions?.onConflict)
          .map((column) => `${sanitizeIdentifier(column)} = VALUES(${sanitizeIdentifier(column)})`)

        if (updateColumns.length === 0) {
          return { data: null, error: 'Nothing to update for upsert' }
        }

        await query(`${sql} ON DUPLICATE KEY UPDATE ${updateColumns.join(', ')}`, values)
      } else {
        await query(sql, values)
      }

      const result = this.selectColumns !== '*' ? rows.map((row) => projectRow(row, this.selectColumns)) : rows
      if (this.options.single || this.options.maybeSingle) {
        return { data: result[0] ?? null, error: null }
      }
      return { data: result, error: null }
    }

    if (this.operation === 'update') {
      const updateData = normalizeRecord(this.data as Record<string, unknown>)
      const updateColumns = Object.keys(updateData).filter((key) => SAFE_IDENTIFIER.test(key))
      if (updateColumns.length === 0) {
        return { data: null, error: 'No updatable columns provided' }
      }

      const updateClause = updateColumns.map((column) => `${sanitizeIdentifier(column)} = ?`).join(', ')
      const values = updateColumns.map((column) => updateData[column] ?? null)
      const sql = `UPDATE ${tableName} SET ${updateClause} ${where.clause}`

      await query(sql, [...values, ...where.values])

      if (this.selectColumns) {
        const selectSql = `SELECT ${sanitizeSelect(this.selectColumns)} FROM ${tableName} ${where.clause}`
        const rows = await query<any[]>(selectSql, where.values)
        return { data: Array.isArray(rows) ? rows[0] ?? null : null, error: null }
      }

      return { data: null, error: null }
    }

    if (this.operation === 'delete') {
      const sql = `DELETE FROM ${tableName} ${where.clause}`
      await query(sql, where.values)
      return { data: null, error: null }
    }

    return { data: null, error: 'Unsupported operation' }
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

export async function createClient() {
  const currentUser = await getAuthUser()

  return {
    from: (table: string) => new DBQuery(table),
    auth: {
      getUser: async () => ({ data: { user: currentUser }, error: null }),
      signOut: async () => ({ data: null, error: null }),
      updateUser: async () => ({ data: null, error: null }),
    },
  }
}

