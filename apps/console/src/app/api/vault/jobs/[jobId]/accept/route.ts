import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/x402/supabaseClient';
import { withWalletAuth } from '@/lib/auth/wallet-auth';
import { verifyAcceptJob } from '@/lib/vault/verify-vault-event';

/**
 * POST /api/vault/jobs/[jobId]/accept
 *
 * Jobber accepts an open job. Requires on-chain tx hash.
 * Backend verifies JobAccepted event before updating Supabase.
 * Reputation is sourced from backend (jobber_reputation table), NOT from caller.
 */
export const POST = withWalletAuth<{ jobId: string }>(async (
  req: NextRequest,
  { params, wallet }
) => {
  const { jobId } = await (params as unknown as Promise<{ jobId: string }>);
  const body = await req.json() as { txHash: string };

  if (!body.txHash) {
    return NextResponse.json({ error: 'txHash required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Fetch job
  const { data: job, error: jobErr } = await supabase
    .from('vault_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  if (jobErr || !job) return NextResponse.json({ error: 'job not found' }, { status: 404 });

  if (!job.on_chain_job_id) {
    return NextResponse.json({ error: 'job has no on-chain id' }, { status: 400 });
  }
  if (job.status !== 'open_pool') {
    return NextResponse.json({ error: `job status is ${job.status}, expected open_pool` }, { status: 400 });
  }
  if (wallet === job.client_address.toLowerCase()) {
    return NextResponse.json({ error: 'client cannot accept own job' }, { status: 403 });
  }

  // Verify on-chain event
  const verification = await verifyAcceptJob(body.txHash, String(job.on_chain_job_id), wallet);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  // Fetch backend reputation (NOT from caller — anti-gaming)
  const { data: rep } = await supabase
    .from('jobber_reputation')
    .select('completed_jobs, avg_rating')
    .eq('address', wallet)
    .single();

  const completedJobs = rep?.completed_jobs ?? 0;
  const ratingX100 = Math.round((rep?.avg_rating ?? 0) * 100);

  // Update job in Supabase
  const { error: updateErr } = await supabase.from('vault_jobs').update({
    jobber_address: wallet,
    status: 'active',
    accepted_at: new Date().toISOString(),
    tx_hash_accept: body.txHash,
    bond_amount: Number(verification.args.bondAmount) / 1e6, // USDC 6 decimals
  }).eq('id', jobId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: 'active',
    jobber: wallet,
    bondAmount: Number(verification.args.bondAmount) / 1e6,
    reputation: { completedJobs, ratingX100 },
    txHash: body.txHash,
  });
});
