import { supabase } from './client';
import type { Database } from './database.types';
import type { UserProfile } from '@/lib/types';

export type UserRow = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export function mapUserRowToUserProfile(row: UserRow): UserProfile {
  const fullName = row.name || '';
  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');
  const role = (row.role || 'student') as UserProfile['userType'];

  return {
    id: row.id,
    firstName: firstName || fullName || 'Usuário',
    lastName: lastName || '',
    email: row.email,
    userType: role,
    profilePictureUrl: row.avatar_url,
    summary: row.bio,
    company: row.company,
  };
}

export async function getUserById(id: string): Promise<UserRow | null> {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) throw error;
    return data ?? null;
  } catch (e) {
    console.error('Erro ao buscar usuário:', e);
    return null;
  }
}

export async function upsertUser(user: UserInsert): Promise<UserRow | null> {
  try {
    const { data, error } = await supabase.from('users').upsert(user).select().single();
    if (error) throw error;
    return data ?? null;
  } catch (e) {
    console.error('Erro ao inserir/atualizar usuário:', e);
    return null;
  }
}

export async function updateUserRow(id: string, updates: UserUpdate): Promise<UserRow | null> {
  try {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data ?? null;
  } catch (e) {
    console.error('Erro ao atualizar usuário:', e);
    return null;
  }
}