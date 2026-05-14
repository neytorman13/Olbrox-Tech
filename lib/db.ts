import pool from '@/lib/mysql'

export async function query<T = any>(sql: string, values: unknown[] = []): Promise<T> {
  const [rows] = await pool.execute(sql, values as any[]);
  return rows as T;
}

export async function querySingle<T = any>(sql: string, values: unknown[] = []): Promise<T | null> {
  const rows = await query<T[]>(sql, values);
  if (Array.isArray(rows)) {
    return rows[0] ?? null;
  }
  return null;
}

