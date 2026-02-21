/**
 * Supabase client mock for unit tests.
 * Provides chainable query builder and auth/functions stubs.
 */

const mockQueryBuilder = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  then: jest.fn().mockResolvedValue({ data: [], error: null }),
});

export const mockSupabaseAuth = {
  getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
  signInWithPassword: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signInWithIdToken: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signInWithOAuth: jest.fn().mockResolvedValue({ data: { url: null }, error: null }),
  signUp: jest.fn().mockResolvedValue({ data: { session: null, user: null }, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
};

export const mockSupabaseFunctions = {
  invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
};

export const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: jest.fn().mockImplementation(() => mockQueryBuilder()),
  functions: mockSupabaseFunctions,
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }),
  removeChannel: jest.fn(),
};

/**
 * Reset all mock implementations to their defaults.
 * Call in beforeEach() or afterEach().
 */
export const resetSupabaseMocks = (): void => {
  mockSupabaseAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  mockSupabaseAuth.signInWithPassword.mockResolvedValue({ data: { session: null }, error: null });
  mockSupabaseAuth.signOut.mockResolvedValue({ error: null });
  mockSupabaseFunctions.invoke.mockResolvedValue({ data: null, error: null });
};
