import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { signSession } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import argon2 from 'argon2';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email: string | undefined = body?.email;
    const password: string | undefined = body?.password;
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Credenciais ausentes' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
    if (!url || !anon) {
      return NextResponse.json({ ok: false, error: 'Ambiente Supabase inválido' }, { status: 500 });
    }

    const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
    
    if (signInError || !signInData?.user) {
      const message = signInError?.message || 'Credenciais inválidas';
      return NextResponse.json({ ok: false, error: message }, { status: 401 });
    }
    
    const authUserId = signInData.user.id;
    const authEmail = signInData.user.email ?? email.toLowerCase();

    const admin = getServerSupabase();
    let role: string | undefined = undefined;
    
    // Buscar role da tabela public.users em vez do schema auth
    const { data: userData, error: userError } = await admin
      .from('users')
      .select('role')
      .eq('id', authUserId)
      .limit(1);
      
    if (!userError && userData && userData[0]) {
      role = userData[0].role || undefined;
    }

    const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const token = await signSession({ userId: authUserId as string, email: authEmail as string, role, exp });

    const res = NextResponse.json({ ok: true, user: { id: authUserId, email: authEmail, role } });
    res.cookies.set('app_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Erro ao autenticar' }, { status: 500 });
  }
}
