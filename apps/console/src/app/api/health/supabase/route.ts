import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/x402/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const started = Date.now();
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('a2a_jobs').select('id', { count: 'exact', head: true });
    if (error) {
      return NextResponse.json({ ok: false, service: 'supabase', error: error.message, latencyMs: Date.now() - started }, { status: 500 });
    }
    return NextResponse.json({ ok: true, service: 'supabase', latencyMs: Date.now() - started, checkedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ ok: false, service: 'supabase', error: err instanceof Error ? err.message : 'unknown_error', latencyMs: Date.now() - started }, { status: 500 });
  }
}
