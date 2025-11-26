import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/client';
import { verifySession } from '@/lib/auth/session';

export async function GET(req: Request) {
  try {
    const cookieHeader = (req as any).headers?.get?.('cookie') as string | undefined;
    // Fallback for Next.js Request: use standard cookie parsing from the runtime
    const appSession = cookieHeader
      ?.split(';')
      .map(s => s.trim())
      .find(s => s.startsWith('app_session='))
      ?.split('=')[1];

    if (!appSession) {
      return NextResponse.json({ ok: false, error: 'Sem sessão' }, { status: 401 });
    }

    const payload = await verifySession(appSession);
    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Sessão inválida' }, { status: 401 });
    }

    const admin = getServerSupabase();
    const { data, error } = await admin
      .schema('auth')
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .limit(1);
    if (error) throw error;

    const row: any | undefined = Array.isArray(data) ? data[0] : undefined;

    const name = row?.user_metadata?.name || row?.raw_user_meta_data?.name || null;
    const avatar_url = row?.user_metadata?.avatar_url || row?.raw_user_meta_data?.avatar_url || null;
    const role = (payload.role ?? row?.role) as string | undefined;

    const user = {
      id: payload.userId,
      email: payload.email,
      displayName: name || payload.email,
      photoURL: avatar_url || null,
      role,
    };

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Erro' }, { status: 500 });
  }
}

