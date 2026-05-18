import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/x402/supabaseClient';

// GET /api/vault/jobs — list jobs for connected wallet
// POST /api/vault/jobs — create a new job (V1 deposit)
export async function GET(req: NextRequest) {
  const wallet = req.headers.get('x-arc-wallet')?.toLowerCase();
  if (!wallet) return NextResponse.json({ error: 'missing wallet' }, { status: 401 });

  const role = req.nextUrl.searchParams.get('role') || 'client'; // client | jobber | all
  const status = req.nextUrl.searchParams.get('status'); // optional filter

  const supabase = getSupabaseAdmin();
  let query = supabase.from('vault_jobs').select('*');

  if (role === 'client') {
    query = query.ilike('client_address', wallet);
  } else if (role === 'jobber') {
    query = query.ilike('jobber_address', wallet);
  } else {
    query = query.or(`client_address.ilike.${wallet},jobber_address.ilike.${wallet}`);
  }

  if (status) query = query.eq('status', status);
  query = query.order('created_at', { ascending: false }).limit(50);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

export async function POST(req: NextRequest) {
  const wallet = req.headers.get('x-arc-wallet')?.toLowerCase();
  if (!wallet) return NextResponse.json({ error: 'missing wallet' }, { status: 401 });

  const body = await req.json() as {
    totalAmount: number;
    specHash: string;
    specJson: unknown;
    milestones: Array<{ title: string; amount: number; deadlineSubmit: string }>;
    jobDeadline: string;
    durationTier?: string;
    txHash?: string;
  };

  // Validate
  if (!body.totalAmount || !body.specHash || !body.milestones?.length) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }
  if (body.milestones.length > 10) {
    return NextResponse.json({ error: 'max 10 milestones' }, { status: 400 });
  }

  const sum = body.milestones.reduce((s, m) => s + m.amount, 0);
  if (Math.abs(sum - body.totalAmount) > 0.01) {
    return NextResponse.json({ error: 'milestone amounts must sum to totalAmount' }, { status: 400 });
  }

  // Check min 10% per milestone
  for (const m of body.milestones) {
    const pct = (m.amount / body.totalAmount) * 10000;
    if (pct < 1000) {
      return NextResponse.json({ error: `milestone "${m.title}" is below 10% minimum` }, { status: 400 });
    }
  }

  // Determine duration tier
  let durationTier = body.durationTier || 'single_payout';
  if (body.milestones.length > 1) durationTier = 'milestone';

  const supabase = getSupabaseAdmin();

  // Insert job
  const { data: job, error: jobErr } = await supabase.from('vault_jobs').insert({
    client_address: wallet,
    total_amount: body.totalAmount,
    milestone_count: body.milestones.length,
    duration_tier: durationTier,
    status: 'open_pool',
    spec_hash: body.specHash,
    spec_json: body.specJson,
    deadline: body.jobDeadline,
    tx_hash_create: body.txHash || null,
  }).select().single();

  if (jobErr) return NextResponse.json({ error: jobErr.message }, { status: 500 });

  // Insert milestones
  const milestoneRows = body.milestones.map((m, i) => ({
    job_id: job.id,
    milestone_index: i,
    amount: m.amount,
    percentage_bps: Math.round((m.amount / body.totalAmount) * 10000),
    title: m.title,
    deadline_submit: m.deadlineSubmit,
    status: 'created',
  }));

  const { error: msErr } = await supabase.from('vault_milestones').insert(milestoneRows);
  if (msErr) return NextResponse.json({ error: msErr.message }, { status: 500 });

  return NextResponse.json({ job, milestones: milestoneRows }, { status: 201 });
}
