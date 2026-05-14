export const runtime = 'nodejs'

import { type NextRequest, NextResponse } from 'next/server'
import { query, querySingle } from '@/lib/db'
import crypto from 'crypto'

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

function buildWhere(filters: any[]) {
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

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const { table, operation, select, options, data, filters, order, limit, upsert } = payload

    const tableName = sanitizeIdentifier(table)
    const where = buildWhere(filters || [])
    const values: unknown[] = [...where.values]

    if (operation === 'select') {
      if (options?.head && options?.count === 'exact') {
        const countRow = await querySingle<{ count: number }>(
          `SELECT COUNT(*) AS count FROM ${tableName} ${where.clause}`,
          where.values,
        )
        return NextResponse.json({ data: null, count: countRow?.count ?? 0, error: null })
      }

      let sql = `SELECT ${sanitizeSelect(select || '*')} FROM ${tableName} ${where.clause}`
      if (order?.column) {
        sql += ` ORDER BY ${sanitizeIdentifier(order.column)} ${order.ascending === false ? 'DESC' : 'ASC'}`
      }
      if (limit) {
        const numLimit = Number(limit)
        if (!isNaN(numLimit) && numLimit > 0) {
          sql += ' LIMIT ?'
          values.push(numLimit)
        }
      }

      const rows = await query<any[]>(sql, values)
      if (options?.single || options?.maybeSingle) {
        const row = Array.isArray(rows) ? rows[0] ?? null : null
        return NextResponse.json({ data: row, error: null })
      }
      return NextResponse.json({ data: rows, error: null })
    }

    const normalizeRecord = (record: Record<string, unknown>) => {
      const normalized: Record<string, unknown> = {}
      for (const key of Object.keys(record)) {
        if (!SAFE_IDENTIFIER.test(key)) continue
        normalized[key] = record[key]
      }
      return normalized
    }

    const records = Array.isArray(data) ? data.map(normalizeRecord) : [normalizeRecord(data)]

    if (records.length === 0) {
      return NextResponse.json({ data: null, error: 'No records provided' }, { status: 400 })
    }

    const rowsValues: unknown[] = []
    const insertedRows: any[] = []

    for (const record of records) {
      const row: any = { ...record }
      if (!row.id) {
        row.id = crypto.randomUUID()
      }
      insertedRows.push(row)
      // We'll collect values after determining columns
    }

    const columns = Array.from(
      new Set(insertedRows.flatMap((row) => Object.keys(row))),
    ).filter((col) => SAFE_IDENTIFIER.test(col))

    if (columns.length === 0) {
      return NextResponse.json({ data: null, error: 'Invalid record keys' }, { status: 400 })
    }

    // Now collect values
    for (const row of insertedRows) {
      for (const column of columns) {
        rowsValues.push(row[column] ?? null)
      }
    }

    const placeholders = columns.map(() => '?').join(', ')

    if (operation === 'insert' || operation === 'upsert') {
      const insertColumns = columns.map(sanitizeIdentifier).join(', ')
      const valuePlaceholders = records
        .map(() => `(${placeholders})`)
        .join(', ')
      const sql = `INSERT INTO ${tableName} (${insertColumns}) VALUES ${valuePlaceholders}`
      const insertValues = rowsValues

      if (operation === 'upsert') {
        if (!upsert?.onConflict || typeof upsert.onConflict !== 'string') {
          return NextResponse.json({ data: null, error: 'Missing upsert conflict key' }, { status: 400 })
        }

        const updateColumns = columns
          .filter((column) => column !== upsert.onConflict)
          .map((column) => `${sanitizeIdentifier(column)} = VALUES(${sanitizeIdentifier(column)})`)

        if (updateColumns.length === 0) {
          return NextResponse.json({ data: null, error: 'Nothing to update for upsert' }, { status: 400 })
        }

        const upsertSql = `${sql} ON DUPLICATE KEY UPDATE ${updateColumns.join(', ')}`
        await query(upsertSql, insertValues)
      } else {
        await query(sql, insertValues)
      }

      const projectedRows = select && select !== '*' ? insertedRows.map((row) => projectRow(row, select)) : insertedRows
      const result = options?.single ? projectedRows[0] ?? null : options?.maybeSingle ? projectedRows[0] ?? null : projectedRows
      return NextResponse.json({ data: result, error: null })
    }

    if (operation === 'update') {
      const updateData = normalizeRecord(data)
      const updateColumns = Object.keys(updateData).filter((key) => SAFE_IDENTIFIER.test(key))
      if (updateColumns.length === 0) {
        return NextResponse.json({ data: null, error: 'No updatable columns provided' }, { status: 400 })
      }

      const updateClause = updateColumns.map((column) => `${sanitizeIdentifier(column)} = ?`).join(', ')
      const updateValues = updateColumns.map((column) => updateData[column] ?? null)
      const sql = `UPDATE ${tableName} SET ${updateClause} ${where.clause}`

      await query(sql, [...updateValues, ...where.values])

      if (select) {
        const selectSql = `SELECT ${sanitizeSelect(select)} FROM ${tableName} ${where.clause}`
        const rows = await query<any[]>(selectSql, where.values)
        if (options?.single || options?.maybeSingle) {
          return NextResponse.json({ data: rows[0] ?? null, error: null })
        }
        return NextResponse.json({ data: rows, error: null })
      }

      return NextResponse.json({ data: null, error: null })
    }

    if (operation === 'delete') {
      const sql = `DELETE FROM ${tableName} ${where.clause}`
      await query(sql, where.values)
      return NextResponse.json({ data: null, error: null })
    }

    return NextResponse.json({ data: null, error: 'Unsupported operation' }, { status: 400 })
  } catch (error) {
    console.error('DB handler error:', error)
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}


