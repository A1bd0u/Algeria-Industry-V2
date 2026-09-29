import { vi } from 'vitest';

// Mock chaînable du client Supabase. Chaque requête enregistre la table,
// l'opération, les filtres et le payload, puis se résout via un handler
// déclaré par table : handlers[table](query) -> { data, error, count }.

export interface MockQuery {
  table: string;
  op: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  columns?: string;
  payload?: any;
  filters: { method: string; args: any[] }[];
  single: boolean;
}

type Result = { data?: any; error?: any; count?: number | null };
export type Handler = (q: MockQuery) => Result | undefined;

const FILTER_METHODS = [
  'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'not', 'or',
  'contains', 'textSearch', 'order', 'limit', 'range', 'match', 'filter',
];

export const filterValue = (q: MockQuery, method: string, column?: string) =>
  q.filters.find((f) => f.method === method && (column === undefined || f.args[0] === column))?.args;

export function createSupabaseMock(handlers: Record<string, Handler> = {}) {
  const queries: MockQuery[] = [];

  const makeBuilder = (table: string) => {
    const query: MockQuery = { table, op: 'select', filters: [], single: false };
    queries.push(query);

    const resolve = (): Promise<Result> => {
      const handler = handlers[table];
      const result = (handler && handler(query)) || { data: query.single ? null : [], error: null };
      return Promise.resolve({ error: null, count: null, ...result });
    };

    const builder: any = {
      select(columns?: string) {
        // select() après insert/update/upsert ne change pas l'opération.
        if (query.op === 'select') query.columns = columns;
        else query.columns = columns;
        return builder;
      },
      insert(payload: any) { query.op = 'insert'; query.payload = payload; return builder; },
      update(payload: any) { query.op = 'update'; query.payload = payload; return builder; },
      upsert(payload: any) { query.op = 'upsert'; query.payload = payload; return builder; },
      delete() { query.op = 'delete'; return builder; },
      single() { query.single = true; return resolve(); },
      maybeSingle() { query.single = true; return resolve(); },
      then(onFulfilled: any, onRejected: any) { return resolve().then(onFulfilled, onRejected); },
    };
    for (const method of FILTER_METHODS) {
      builder[method] = (...args: any[]) => { query.filters.push({ method, args }); return builder; };
    }
    return builder;
  };

  const storageBucket = {
    upload: vi.fn().mockResolvedValue({ data: { path: 'x' }, error: null }),
    getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://cdn.test/${path}` } })),
    createSignedUrl: vi.fn((path: string, ttl: number) =>
      Promise.resolve({ data: { signedUrl: `https://signed.test/${path}?ttl=${ttl}` }, error: null })
    ),
  };

  const client = {
    from: vi.fn((table: string) => makeBuilder(table)),
    storage: { from: vi.fn(() => storageBucket) },
  };

  return { client, queries, storageBucket };
}

// Ligne users renvoyée par le middleware d'authentification.
export const sessionRow = (overrides: Record<string, any> = {}) => ({
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Test User',
  email: 'user@example.com',
  company: 'Test SARL',
  company_id: '22222222-2222-4222-8222-222222222222',
  role: 'fournisseur',
  token_version: 1,
  email_verified: true,
  kyc_status: 'approved',
  ...overrides,
});

// Handler users : répond à la requête de session (sélection des colonnes de
// session) avec `session`, et délègue le reste à `rest`.
export const usersHandler = (session: Record<string, any> | null, rest?: Handler): Handler => (q) => {
  if (q.op === 'select' && q.columns?.includes('token_version') && q.columns?.includes('kyc_status')) {
    return { data: session };
  }
  return rest ? rest(q) : undefined;
};
