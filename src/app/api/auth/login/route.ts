import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { signSession } from '@/lib/auth/session';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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

    const admin = getServerSupabase();
    
    // Buscar usuário na tabela public.users
    const { data: userData, error: userError } = await admin
      .from('users')
      .select('id,email,password_hash,role')
      .eq('email', email.toLowerCase())
      .limit(1);
      
    if (userError || !userData || userData.length === 0) {
      return NextResponse.json({ ok: false, error: 'Credenciais inválidas' }, { status: 401 });
    }
    
    const user = userData[0];
    
    // Verificar senha com bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password_hash || '');
    if (!isValidPassword) {
      return NextResponse.json({ ok: false, error: 'Credenciais inválidas' }, { status: 401 });
    }
    
    const authUserId = user.id;
    const authEmail = user.email;
    const userRole = user.role;

    // Usar o role obtido diretamente do usuário
    const role = userRole || undefined;

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
