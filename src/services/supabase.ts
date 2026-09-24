import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env[key];
  }
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project')
);

/**
 * Fallback client used when Supabase credentials are missing or during tests/offline dev.
 * Provides safe no-op auth methods to prevent uncaught runtime errors.
 */
export const createFallbackClient = (): SupabaseClient => {
  return {
    auth: {
      getSession: async () => ({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: (_callback: any) => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error(
          'Supabase no está configurado (faltan variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)'
        ),
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error(
          'Supabase no está configurado (faltan variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)'
        ),
      }),
      signOut: async () => ({
        error: null,
      }),
    },
  } as unknown as SupabaseClient;
};

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : createFallbackClient();
