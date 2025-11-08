// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Valores padrão para desenvolvimento (não use em produção)
const FALLBACK_URL = 'https://xyzcompany.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Obter valores das variáveis de ambiente ou usar fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;

// Verificar se estamos em modo de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

// Criar cliente com validação
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

try {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  
  if (isDevelopment) {
    console.log('Supabase client inicializado. Nota: Configure suas variáveis de ambiente em .env.local');
  }
} catch (error) {
  if (isDevelopment) {
    console.error('Erro ao inicializar o cliente Supabase:', error);
    console.warn('Usando cliente Supabase com funcionalidade limitada. Configure suas variáveis de ambiente em .env.local');
  }
  
  // Em desenvolvimento, criamos um cliente mock para evitar quebrar a aplicação
  supabaseClient = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as any;
}

export const supabase = supabaseClient!;

// Server-side client for API routes
import { createClient as createServerClient } from '@supabase/supabase-js';

export const getServerSupabase = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_KEY;
    
    return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (error) {
    if (isDevelopment) {
      console.error('Erro ao inicializar o cliente Supabase do servidor:', error);
    }
    
    // Retornar cliente mock para evitar quebrar a aplicação em desenvolvimento
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    } as any;
  }
};