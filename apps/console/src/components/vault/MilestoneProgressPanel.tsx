'use client';

import { useEffect, useState } from 'react';
import { useArcWallet } from '@/hooks/useArcWallet';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { useVaultLifecycle } from '@/hooks/useVaultLifecycle';
import { WorkActionModal, type WorkActionKind, type WorkActionMetadata } from './WorkActionModal';
import { LifecycleStatus } from './LifecycleStatus';

type VaultJob = {
  id: string;
  on_chain_job_id?: string | null;
  client_address: string;
  jobber_address?: string | null;
  total_amount: number | string;
  status: string;
  duration_tier?: string | null;
  tx_hash_create?: string | null;
  created_at?: string;
};

type Milestone = {
  id: string;
  job_id: string;
  milestone_index: number;
  title?: string | null;
  amount: number | string;
  percentage_bps?: number | null;
  status: 'created' | 'submitted' | 'rejected' | 'released' | 'disputed' | string;
  revisions?: number | null;
  deliverable_uri?: string | null;
  feedback_uri?: string | null;
  approve_deadline?: string | null;
  tx_hash_submit?: string | null;
  tx_hash_release?: string | null;
  auto_released?: boolean;
};

type LoadedJob = VaultJob & { milestones?: Milestone[] };

type ModalState = {
  open: boolean;
  kind: WorkActionKind;
  jobId: string;
  onChainJobId: string;
  milestoneIndex: number;
};

const CLOSED_MODAL: ModalState = { open: false, kind: 'submit', jobId: '', onChainJobId: '', milestoneIndex: 0 };

function isDeadlinePassed(deadline?: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

export function MilestoneProgressPanel() {
  const { address, isConnected } = useArcWallet();
  const { authFetch } = useAuthFetch();
  const lifecycle = useVaultLifecycle();
  const [jobs, setJobs] = useState<LoadedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [modal, setModal] = useState<ModalState>(CLOSED_MODAL);

  async function loadJobs() {
    if (!address) return;
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/vault/jobs?role=all&wallet=${address}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setJobs(json.jobs || []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isConnected) void loadJobs();
  }, [isConnected, address]);

  // Reload after lifecycle completes
  useEffect(() => {
    if (lifecycle.state.step === 'done') {
      void loadJobs();
    }
  }, [lifecycle.state.step]);

  // ─── On-chain-first actions via useVaultLifecycle ─────────────────────

  async function handleApprove(job: LoadedJob, mid: number) {
    if (!job.on_chain_job_id) { setMsg('Job has no on-chain ID'); return; }
    lifecycle.reset();
    await lifecycle.approveMilestone({
      dbJobId: job.id,
      onChainJobId: job.on_chain_job_id,
      milestoneIndex: mid,
    });
  }

  async function handleAutoRelease(job: LoadedJob, mid: number) {
    if (!job.on_chain_job_id) { setMsg('Job has no on-chain ID'); return; }
    lifecycle.reset();
    await lifecycle.autoReleaseMilestone({
      dbJobId: job.id,
      onChainJobId: job.on_chain_job_id,
      milestoneIndex: mid,
    });
  }

  function openModal(kind: WorkActionKind, job: LoadedJob, mid: number) {
    setModal({ open: true, kind, jobId: job.id, onChainJobId: job.on_chain_job_id || '', milestoneIndex: mid });
  }

  async function submitFromModal(uri: string, _meta: WorkActionMetadata) {
    const { kind, jobId, onChainJobId, milestoneIndex } = modal;
    if (!onChainJobId) throw new Error('Job has no on-chain ID');
    lifecycle.reset();

    if (kind === 'submit') {
      await lifecycle.submitMilestone({
        dbJobId: jobId,
        onChainJobId,
        milestoneIndex,
        deliverableUri: uri,
      });
    } else if (kind === 'reject') {
      await lifecycle.rejectMilestone({
        dbJobId: jobId,
        onChainJobId,
        milestoneIndex,
        feedbackUri: uri,
      });
    } else if (kind === 'dispute') {
      await lifecycle.openDispute({
        dbJobId: jobId,
        onChainJobId,
        milestoneIndex,
        tier: 0, // AI tier by default
        reasonUri: uri,
      });
    }
    setModal(CLOSED_MODAL);
  }

  if (!isConnected) {
    return (
      <div className="aureo-panel p-5">
        <div className="aureo-mono-label">VAULT · MILESTONES</div>
        <p className="mt-2 font-mono text-[11px] text-[rgba(234,228,216,0.65)]">Connect wallet to view milestone jobs.</p>
      </div>
    );
  }

  const busy = lifecycle.isPending || lifecycle.state.step === 'sending' || lifecycle.state.step === 'waiting' || lifecycle.state.step === 'indexing';

  return (
    <div className="aureo-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="aureo-mono-label">VAULT · MILESTONE PROGRESS</div>
          <h3 className="aureo-display mt-1 text-[24px] text-[#EAE4D8]">Submit · approve · dispute</h3>
          <p className="mt-1 font-mono text-[10px] text-[rgba(234,228,216,0.5)]">On-chain first — every action verified against ArcVault events</p>
        </div>
        <button onClick={loadJobs} disabled={loading || busy} className="btn-secondary px-4 py-2 text-[10px]">
          {loading ? 'LOADING…' : 'REFRESH'}
        </button>
      </div>

      <LifecycleStatus state={lifecycle.state} />

      {msg && <div className="mt-4 rounded-none border border-white/10 bg-black/25 px-3 py-2 font-mono text-[11px] text-[#C5A67C]">{msg}</div>}

      <div className="mt-4 space-y-4">
        {jobs.length === 0 && !loading && (
          <div className="rounded-none border border-white/10 bg-black/20 p-4 font-mono text-[11px] text-[rgba(234,228,216,0.55)]">No vault jobs found for this wallet.</div>
        )}

        {jobs.map((job) => {
          const isClient = address?.toLowerCase() === job.client_address?.toLowerCase();
          const isJobber = address?.toLowerCase() === job.jobber_address?.toLowerCase();
          return (
            <div key={job.id} className="rounded-none border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(234,228,216,0.5)]">Job {job.id.slice(0, 8)} · {job.status}</div>
                  <div className="mt-1 font-mono text-[13px] text-[#EAE4D8]">${Number(job.total_amount).toFixed(2)} USDC {job.on_chain_job_id ? `· On-chain #${job.on_chain_job_id}` : ''}</div>
                </div>
                <div className="font-mono text-[10px] text-[rgba(234,228,216,0.55)]">Role: {isClient ? 'Approver' : isJobber ? 'Agent' : 'Observer'}</div>
              </div>

              <div className="mt-3 space-y-2">
                {(job.milestones || []).map((m) => {
                  const canSubmit = isJobber && ['created', 'rejected'].includes(m.status);
                  const canApprove = isClient && m.status === 'submitted';
                  const canReject = isClient && m.status === 'submitted';
                  const canDispute = (isClient || isJobber) && m.status === 'submitted';
                  const canAutoRelease = m.status === 'submitted' && isDeadlinePassed(m.approve_deadline);
                  return (
                    <div key={m.id} className="rounded-none border border-white/10 bg-black/25 p-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C5A67C]">#{m.milestone_index + 1} · {m.status}{m.auto_released ? ' (auto)' : ''}</div>
                          <div className="mt-1 font-mono text-[12px] text-[#EAE4D8]">{m.title || 'Milestone'} · ${Number(m.amount).toFixed(2)}</div>
                          {m.deliverable_uri && <div className="mt-1 break-all font-mono text-[9.5px] text-[rgba(234,228,216,0.5)]">Deliverable: {m.deliverable_uri.slice(0, 80)}{m.deliverable_uri.length > 80 ? '…' : ''}</div>}
                          {m.feedback_uri && <div className="mt-1 break-all font-mono text-[9.5px] text-[rgba(234,228,216,0.5)]">Feedback: {m.feedback_uri.slice(0, 80)}{m.feedback_uri.length > 80 ? '…' : ''}</div>}
                          {m.approve_deadline && (
                            <div className={`mt-1 font-mono text-[9.5px] ${isDeadlinePassed(m.approve_deadline) ? 'text-[#f0c5c5]' : 'text-[rgba(234,228,216,0.45)]'}`}>
                              Approve deadline: {new Date(m.approve_deadline).toLocaleString()}{isDeadlinePassed(m.approve_deadline) ? ' (EXPIRED)' : ''}
                            </div>
                          )}
                          {m.tx_hash_submit && <div className="mt-1 font-mono text-[9px] text-[rgba(234,228,216,0.35)]">Submit tx: {m.tx_hash_submit.slice(0, 16)}…</div>}
                          {m.tx_hash_release && <div className="mt-1 font-mono text-[9px] text-[rgba(234,228,216,0.35)]">Release tx: {m.tx_hash_release.slice(0, 16)}…</div>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {canSubmit && <button disabled={busy} onClick={() => openModal('submit', job, m.milestone_index)} className="btn-secondary px-3 py-1 text-[9px]">SUBMIT WORK</button>}
                          {canApprove && <button disabled={busy} onClick={() => handleApprove(job, m.milestone_index)} className="btn-secondary px-3 py-1 text-[9px]">APPROVE</button>}
                          {canReject && <button disabled={busy} onClick={() => openModal('reject', job, m.milestone_index)} className="btn-secondary px-3 py-1 text-[9px]">REJECT</button>}
                          {canDispute && <button disabled={busy} onClick={() => openModal('dispute', job, m.milestone_index)} className="btn-secondary px-3 py-1 text-[9px]">DISPUTE</button>}
                          {canAutoRelease && <button disabled={busy} onClick={() => handleAutoRelease(job, m.milestone_index)} className="btn-primary px-3 py-1 text-[9px]">AUTO-RELEASE</button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <WorkActionModal
        open={modal.open}
        kind={modal.kind}
        jobId={modal.jobId}
        milestoneIndex={modal.milestoneIndex}
        walletAddress={address ?? undefined}
        busy={busy}
        onClose={() => setModal(CLOSED_MODAL)}
        onSubmit={submitFromModal}
      />
    </div>
  );
}
