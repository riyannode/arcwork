import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/x402/supabaseClient';
import { runAiResolver } from '@/lib/vault/ai-resolver';
import { withWalletAuth } from '@/lib/auth/wallet-auth';
import {
  verifySubmitMilestone,
  verifyApproveMilestone,
  verifyRejectMilestone,
  verifyOpenDispute,
  verifyAutoRelease,
} from '@/lib/vault/verify-vault-event';

/**
 * Milestone lifecycle endpoint — every action requires an on-chain tx hash
 * and is verified against the ArcVault event before any Supabase update.
 *
 * Pattern: contract tx → receipt → verify event → update Supabase → return.
 * NO DB-only mutations. If the chain didn't confirm, the DB doesn't move.
 */
type Action = 'submit' | 'approve' | 'reject' | 'dispute' | 'autoRelease';

export const POST = withWalletAuth<{ jobId: string; mid: string }>(async (
  req: NextRequest,
  { params, wallet }
) => {
  const { jobId, mid } = await (params as unknown as Promise<{ jobId: string; mid: string }>);
  const body = await req.json() as {
    action: Action;
    txHash: string;
    deliverableUri?: string;
    feedbackUri?: string;
    reasonUri?: string;
    tier?: number;
  };

  if (!body.txHash) {
    return NextResponse.json({ error: 'txHash required for every lifecycle action' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const midNum = Number(mid);

  // Fetch job + milestone
  const { data: job, error: jobErr } = await supabase
    .from('vault_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  if (jobErr || !job) return NextResponse.json({ error: 'job not found' }, { status: 404 });
  if (!job.on_chain_job_id) {
    return NextResponse.json({ error: 'job has no on-chain id — cannot verify' }, { status: 400 });
  }

  const { data: ms, error: msErr } = await supabase
    .from('vault_milestones')
    .select('*')
    .eq('job_id', jobId)
    .eq('milestone_index', midNum)
    .single();
  if (msErr || !ms) return NextResponse.json({ error: 'milestone not found' }, { status: 404 });

  const onChainJobId = String(job.on_chain_job_id);
  const isClient = wallet === job.client_address.toLowerCase();
  const isJobber = job.jobber_address && wallet === job.jobber_address.toLowerCase();

  switch (body.action) {
    // ─── SUBMIT ─────────────────────────────────────────────────────────
    case 'submit': {
      if (!isJobber) return NextResponse.json({ error: 'not jobber' }, { status: 403 });
      if (!['created', 'rejected'].includes(ms.status)) {
        return NextResponse.json({ error: `bad status: ${ms.status}` }, { status: 400 });
      }
      const verification = await verifySubmitMilestone(body.txHash, onChainJobId, midNum);
      if (!verification.ok) return NextResponse.json({ error: verification.error }, { status: 400 });

      const now = new Date();
      const approveDeadline = new Date(now.getTime() + 48 * 3600 * 1000);
      const { error } = await supabase.from('vault_milestones').update({
        status: 'submitted',
        submitted_at: now.toISOString(),
        approve_deadline: approveDeadline.toISOString(),
        deliverable_uri: body.deliverableUri,
        tx_hash_submit: body.txHash,
      }).eq('id', ms.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, status: 'submitted', approveDeadline, txHash: body.txHash });
    }

    // ─── APPROVE ────────────────────────────────────────────────────────
    case 'approve': {
      if (!isClient) return NextResponse.json({ error: 'not client' }, { status: 403 });
      if (ms.status !== 'submitted') {
        return NextResponse.json({ error: `bad status: ${ms.status}` }, { status: 400 });
      }
      const verification = await verifyApproveMilestone(body.txHash, onChainJobId, midNum);
      if (!verification.ok) return NextResponse.json({ error: verification.error }, { status: 400 });

      const payout = Number(verification.args.payout) / 1e6; // USDC 6 decimals
      const { error } = await supabase.from('vault_milestones').update({
        status: 'released',
        released_at: new Date().toISOString(),
        tx_hash_release: body.txHash,
      }).eq('id', ms.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      await supabase.from('vault_jobs').update({
        released_to_jobber: Number(job.released_to_jobber || 0) + payout,
      }).eq('id', job.id);

      return NextResponse.json({ ok: true, status: 'released', payout, txHash: body.txHash });
    }

    // ─── REJECT (may auto-escalate to dispute on 3rd) ───────────────────
    case 'reject': {
      if (!isClient) return NextResponse.json({ error: 'not client' }, { status: 403 });
      if (ms.status !== 'submitted') {
        return NextResponse.json({ error: `bad status: ${ms.status}` }, { status: 400 });
      }
      const verification = await verifyRejectMilestone(body.txHash, onChainJobId, midNum);
      if (!verification.ok) return NextResponse.json({ error: verification.error }, { status: 400 });

      // Branch on what the chain actually emitted
      if (verification.args.type === 'rejected') {
        const { error } = await supabase.from('vault_milestones').update({
          status: 'rejected',
          revisions: verification.args.revisions,
          feedback_uri: body.feedbackUri,
          tx_hash_reject: body.txHash,
        }).eq('id', ms.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({
          ok: true,
          status: 'rejected',
          revisions: verification.args.revisions,
          txHash: body.txHash,
        });
      }

      // Auto-escalated to dispute on-chain (3rd rejection)
      return await escalateToResolver({
        supabase,
        job,
        ms,
        wallet,
        reasonUri: body.feedbackUri,
        txHash: body.txHash,
        tier: verification.args.tier,
      });
    }

    // ─── DISPUTE ────────────────────────────────────────────────────────
    case 'dispute': {
      if (!isClient && !isJobber) return NextResponse.json({ error: 'not party' }, { status: 403 });
      if (ms.status !== 'submitted') {
        return NextResponse.json({ error: `bad status: ${ms.status}` }, { status: 400 });
      }
      const verification = await verifyOpenDispute(body.txHash, onChainJobId, midNum, wallet);
      if (!verification.ok) return NextResponse.json({ error: verification.error }, { status: 400 });

      return await escalateToResolver({
        supabase,
        job,
        ms,
        wallet,
        reasonUri: body.reasonUri,
        txHash: body.txHash,
        tier: verification.args.tier,
      });
    }

    // ─── AUTO-RELEASE (permissionless after approveDeadline) ────────────
    case 'autoRelease': {
      if (ms.status !== 'submitted') {
        return NextResponse.json({ error: `bad status: ${ms.status}` }, { status: 400 });
      }
      // Permissionless — anyone can trigger after deadline. Chain enforces the time check.
      const verification = await verifyAutoRelease(body.txHash, onChainJobId, midNum);
      if (!verification.ok) return NextResponse.json({ error: verification.error }, { status: 400 });

      const { error } = await supabase.from('vault_milestones').update({
        status: 'released',
        released_at: new Date().toISOString(),
        tx_hash_release: body.txHash,
        auto_released: true,
      }).eq('id', ms.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Approximate released amount = milestone amount; chain emits exact in MilestoneApproved
      await supabase.from('vault_jobs').update({
        released_to_jobber: Number(job.released_to_jobber || 0) + Number(ms.amount),
      }).eq('id', job.id);

      return NextResponse.json({ ok: true, status: 'released', autoReleased: true, txHash: body.txHash });
    }
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
});

async function escalateToResolver(opts: {
  supabase: ReturnType<typeof getSupabaseAdmin>;
  job: { id: string; spec_json: unknown };
  ms: { id: string; deliverable_uri: string | null; feedback_uri: string | null; revisions: number };
  wallet: string;
  reasonUri?: string;
  txHash: string;
  tier: number;
}) {
  const { supabase, job, ms, wallet, reasonUri, txHash, tier } = opts;

  // Chain-confirmed dispute → safe to mirror state
  await supabase.from('vault_milestones').update({
    status: 'disputed',
    tx_hash_dispute: txHash,
  }).eq('id', ms.id);
  await supabase.from('vault_jobs').update({ status: 'disputed' }).eq('id', job.id);

  // Run AI resolver Tier 0 (advisory only — does not settle on-chain)
  let aiOut, autoFinal = false;
  try {
    const result = await runAiResolver({
      jobId: job.id,
      milestoneId: ms.id,
      specJson: job.spec_json,
      deliverableUri: ms.deliverable_uri,
      feedbackUri: ms.feedback_uri,
      revisionCount: ms.revisions,
    });
    aiOut = result.output;
    autoFinal = result.autoFinal;
  } catch (err) {
    aiOut = {
      decision: 'escalate',
      confidence: 0,
      reason: `AI failed: ${(err as Error).message}`,
      matchedCriteria: [],
      missingEvidence: [],
    };
  }

  const dbTier = tier === 0 ? 'ai' : 'human';
  const { data: dispute } = await supabase.from('vault_disputes').insert({
    job_id: job.id,
    milestone_id: ms.id,
    initiator_address: wallet,
    tier: dbTier,
    outcome: autoFinal && aiOut.decision !== 'escalate' ? aiOut.decision : null,
    jobber_bps: aiOut.recommendedSplit?.jobberBps,
    client_bps: aiOut.recommendedSplit?.clientBps,
    reason_uri: reasonUri,
    ai_analysis: aiOut,
    ai_confidence: aiOut.confidence,
    tx_hash_open: txHash,
    // resolved_at stays null until on-chain DisputeResolved is verified
  }).select().single();

  await supabase.from('resolver_decisions').insert({
    dispute_id: dispute?.id,
    tier: dbTier,
    resolver_address: null,
    decision: aiOut.decision === 'escalate' ? 'refund' : aiOut.decision,
    jobber_bps: aiOut.recommendedSplit?.jobberBps,
    client_bps: aiOut.recommendedSplit?.clientBps,
    reasoning: aiOut.reason,
    evidence_reviewed: { matched: aiOut.matchedCriteria, missing: aiOut.missingEvidence },
    confidence: aiOut.confidence,
  });

  return NextResponse.json({
    ok: true,
    status: 'disputed',
    autoFinal: false, // AI is advisory only — actual settlement happens via resolveDispute on-chain
    aiAdvice: aiOut,
    dispute,
    txHash,
  });
}
