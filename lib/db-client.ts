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

type QueryPayload = {
  table: string
  operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert'
  select?: string
  options?: QueryOptions
  data?: unknown
  filters?: QueryFilter[]
  order?: QueryOrder
  limit?: number
  upsert?: { onConflict?: string }
}

class DBQuery implements PromiseLike<any> {
  table: string
  operation: QueryPayload['operation'] = 'select'
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
    const payload: QueryPayload = {
      table: this.table,
      operation: this.operation,
      select: this.selectColumns,
      options: this.options,
      data: this.data,
      filters: this.filters,
      order: this.orderBy,
      limit: this.limitValue,
      upsert: this.upsertOptions,
    }

    const response = await fetch('/api/db', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.json()
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected)
  }
}

async function authFetch(path: string, method: string, body?: unknown) {
  const response = await fetch(path, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return response.json()
}

export function createClient() {
  return {
    from: (table: string) => new DBQuery(table),
    auth: {
      signInWithPassword: (credentials: { email: string; password: string }) =>
        authFetch('/api/auth/login', 'POST', credentials),
      signOut: () => authFetch('/api/auth/logout', 'POST'),
      getUser: () => authFetch('/api/auth/me', 'GET'),
      updateUser: (payload: { data?: Record<string, unknown>; password?: string }) =>
        authFetch('/api/auth/update', 'PATCH', payload),
    },
  }
}

