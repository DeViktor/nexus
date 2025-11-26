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
    let authUserId: string | null = null;
    let authEmail: string | null = null;
    if (!signInError && signInData?.user) {
      authUserId = signInData.user.id;
      authEmail = signInData.user.email ?? email.toLowerCase();
    } else {
      const admin = getServerSupabase();
      const { data: userRow } = await admin
        .schema('auth')
        .from('users')
        .select('id,email,encrypted_password,role')
        .eq('email', email.toLowerCase())
        .limit(1);
      const row = Array.isArray(userRow) ? userRow[0] : null;
      const hash = row?.encrypted_password as string | undefined;
      let ok = false;
      if (hash) {
        try {
          ok = await bcrypt.compare(password, hash);
        } catch {}
        if (!ok) {
          try {
            ok = await argon2.verify(hash, password);
          } catch {}
        }
      }
      if (!row || !ok) {
        const message = signInError?.message || 'Credenciais inválidas';
        return NextResponse.json({ ok: false, error: message }, { status: 401 });
      }
      authUserId = String(row.id);
      authEmail = String(row.email);
    }

    const admin = getServerSupabase();
    let role: string | undefined = undefined;
    const { data: profileById, error: byIdError } = await admin
      .schema('auth')
      .from('users')
      .select('id,email,role,user_metadata,raw_user_meta_data')
      .eq('id', authUserId as string)
      .limit(1);
    if (byIdError) {
      const { data: profileByEmail } = await admin
        .schema('auth')
        .from('users')
        .select('id,email,role')
        .eq('email', (authEmail ?? email).toLowerCase())
        .limit(1);
      role = profileByEmail?.[0]?.role as any;
    } else if (profileById && profileById[0]) {
      role = (profileById[0] as any)?.role as any;
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
