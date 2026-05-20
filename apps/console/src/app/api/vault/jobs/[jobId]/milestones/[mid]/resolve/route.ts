import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/x402/supabaseClient';
import { withWalletAuth } from '@/lib/auth/wallet-auth';
import { verifyResolveDispute } from '@/lib/vault/verify-vault-event';

/**
 * POST /api/vault/jobs/[jobId]/milestones/[mid]/resolve
 *
 * Resolver settles a dispute on-chain. Backend verifies DisputeResolved event,
 * then updates dispute + milestone state.
 * Outcome semantics:
 *  - release: jobber gets payout (minus arbiter fee)
 *  - refund:  client gets refund + bond slash
 *  - split:   custom bps split via jobberBps/clientBps
 */
export const POST = withWalletAuth<{ jobId: string; mid: string }>(async (
  req: NextRequest,
  { params, wallet }
) => {
  const { jobId, mid } = await (params as unknown as Promise<{ jobId: string; mid: string }>);
  const body = await req.json() as {
    txHash: string;
    outcome: 'release' | 'refund' | 'split';
    jobberBps: number;
    clientBps: number;
  };

  if (!body.txHash) return NextResponse.json({ error: 'txHash required' }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const midNum = Number(mid);

  const { data: job, error: jobErr } = await supabase
    .from('vault_jobs').select('*').eq('id', jobId).single();
  if (jobErr || !job) return NextResponse.json({ error: 'job not found' }, { status: 404 });
  if (!job.on_chain_job_id) {
    return NextResponse.json({ error: 'job has no on-chain id' }, { status: 400 });
  }

  const { data: ms, error: msErr } = await supabase
    .from('vault_milestones').select('*')
    .eq('job_id', jobId).eq('milestone_index', midNum).single();
  if (msErr || !ms) return NextResponse.json({ error: 'milestone not found' }, { status: 404 });
  if (ms.status !== 'disputed') {
    return NextResponse.json({ error: `milestone not disputed: ${ms.status}` }, { status: 400 });
  }

  // Verify DisputeResolved event from chain
  const verification = await verifyResolveDispute(body.txHash, String(job.on_chain_job_id), midNum);
  if (!verification.ok) return NextResponse.json({ error: verification.error }, { status: 400 });

  // outcome enum from chain: None=0, Release=1, Refund=2, Split=3
  const onChainOutcome = verification.args.outcome;
  const expectedOutcome = body.outcome === 'release' ? 1 : body.outcome === 'refund' ? 2 : 3;
  if (onChainOutcome !== expectedOutcome) {
    return NextResponse.json({
      error: `on-chain outcome (${onChainOutcome}) does not match request (${expectedOutcome})`,
    }, { status: 400 });
  }

  // Update milestone — chain has already moved funds via _releaseMilestone or refund logic
  const newMsStatus = body.outcome === 'release' ? 'released'
    : body.outcome === 'refund' ? 'forfeited'
    : 'released'; // split also marks as released; actual amounts tracked in dispute

  await supabase.from('vault_milestones').update({
    status: newMsStatus,
    released_at: new Date().toISOString(),
    tx_hash_release: body.txHash,
  }).eq('id', ms.id);

  // Update dispute record
  await supabase.from('vault_disputes').update({
    outcome: body.outcome,
    jobber_bps: body.jobberBps,
    client_bps: body.clientBps,
    resolved_by: wallet,
    resolved_at: new Date().toISOString(),
    tx_hash_resolve: body.txHash,
  }).eq('milestone_id', ms.id);

  // Log decision for audit trail
  const { data: dispute } = await supabase
    .from('vault_disputes').select('id').eq('milestone_id', ms.id).single();
  if (dispute) {
    await supabase.from('resolver_decisions').insert({
      dispute_id: dispute.id,
      tier: 'human',
      resolver_address: wallet,
      decision: body.outcome,
      jobber_bps: body.jobberBps,
      client_bps: body.clientBps,
      reasoning: 'On-chain resolveDispute call',
      confidence: 1.0,
    });
  }

  return NextResponse.json({
    ok: true,
    outcome: body.outcome,
    resolver: wallet,
    txHash: body.txHash,
  });
});
