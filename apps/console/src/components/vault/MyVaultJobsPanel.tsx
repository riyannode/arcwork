'use client';

import { useEffect, useState } from 'react';
import { useArcWallet } from '@/hooks/useArcWallet';
import { useVaultLifecycle } from '@/hooks/useVaultLifecycle';
import { LifecycleStatus } from './LifecycleStatus';

type VaultJob = {
  id: string;
  on_chain_job_id?: string | null;
  client_address: string;
  jobber_address?: string | null;
  total_amount: number | string;
  status: string;
  duration_tier?: string | null;
  milestone_count?: number;
  released_to_jobber?: number | null;
  tx_hash_create?: string | null;
  tx_hash_accept?: string | null;
  created_at?: string;
  milestones?: Array<{
    milestone_index: number;
    title?: string | null;
    amount: number | string;
    status: string;
  }>;
};

const STATUS_COLORS: Record<string, string> = {
  open_pool: 'text-[#81d4fa]',
  active: 'text-[#a5d6a7]',
  completed: 'text-[#c5e1a5]',
  cancelled: 'text-[rgba(234,228,216,0.4)]',
  disputed: 'text-[#f0c5c5]',
  resolved: 'text-[#C5A67C]',
};

export function MyVaultJobsPanel() {
  const { address, isConnected } = useArcWallet();
  const lifecycle = useVaultLifecycle();
  const [jobs, setJobs] = useState<VaultJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'client' | 'jobber'>('all');

  async function loadJobs() {
    if (!address) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/vault/jobs?role=${filter}&wallet=${address}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setJobs(json.jobs || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isConnected) void loadJobs();
  }, [isConnected, address, filter]);

  // Reload after lifecycle action completes
  useEffect(() => {
    if (lifecycle.state.step === 'done') void loadJobs();
  }, [lifecycle.state.step]);

  async function handleAcceptJob(job: VaultJob) {
    if (!job.on_chain_job_id) { setError('Job has no on-chain ID'); return; }
    lifecycle.reset();
    try {
      await lifecycle.acceptJob({
        onChainJobId: job.on_chain_job_id,
        dbJobId: job.id,
      });
    } catch { /* state already set by hook */ }
  }

  if (!isConnected) {
    return (
      <div className="aureo-panel p-5">
        <div className="aureo-mono-label">VAULT · MY JOBS</div>
        <p className="mt-2 font-mono text-[11px] text-[rgba(234,228,216,0.65)]">Connect wallet to view your vault jobs.</p>
      </div>
    );
  }

  const busy = lifecycle.isPending || ['sending', 'waiting', 'indexing'].includes(lifecycle.state.step);

  return (
    <div className="aureo-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="aureo-mono-label">VAULT · MY JOBS</div>
          <h3 className="aureo-display mt-1 text-[24px] text-[#EAE4D8]">Settlement Vault</h3>
          <p className="mt-1 font-mono text-[10px] text-[rgba(234,228,216,0.5)]">Powered by ERC-8183 + USDC · Milestone/ArcVault mode is experimental</p>
        </div>
        <button onClick={loadJobs} disabled={loading || busy} className="btn-secondary px-4 py-2 text-[10px]">
          {loading ? 'LOADING…' : 'REFRESH'}
        </button>
      </div>

      {/* Role filter */}
      <div className="mt-3 flex gap-2">
        {(['all', 'client', 'jobber'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-none border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors ${
              filter === f
                ? 'border-[#C5A67C] bg-[#C5A67C]/10 text-[#C5A67C]'
                : 'border-white/10 text-[rgba(234,228,216,0.55)] hover:border-white/20'
            }`}
          >
            {f === 'all' ? 'ALL' : f === 'client' ? 'AS CLIENT' : 'AS AGENT'}
          </button>
        ))}
      </div>

      <LifecycleStatus state={lifecycle.state} />

      {error && <div className="mt-3 rounded-none border border-white/10 bg-black/25 px-3 py-2 font-mono text-[11px] text-[#f0c5c5]">{error}</div>}

      <div className="mt-4 space-y-3">
        {jobs.length === 0 && !loading && (
          <div className="rounded-none border border-white/10 bg-black/20 p-4 font-mono text-[11px] text-[rgba(234,228,216,0.55)]">
            No vault jobs found for this wallet ({filter === 'all' ? 'any role' : filter}).
          </div>
        )}

        {jobs.map((job) => {
          const isClient = address?.toLowerCase() === job.client_address?.toLowerCase();
          const isJobber = address?.toLowerCase() === job.jobber_address?.toLowerCase();
          const canAccept = !isClient && !isJobber && job.status === 'open_pool';
          const milestones = job.milestones || [];
          const completedMs = milestones.filter((m) => m.status === 'released').length;
          const totalMs = milestones.length;
          const progressPct = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;

          return (
            <div key={job.id} className="rounded-none border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${STATUS_COLORS[job.status] || 'text-[rgba(234,228,216,0.5)]'}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    {job.on_chain_job_id && (
                      <span className="font-mono text-[9px] text-[rgba(234,228,216,0.35)]">chain #{job.on_chain_job_id}</span>
                    )}
                  </div>
                  <div className="mt-1 font-mono text-[13px] text-[#EAE4D8]">
                    ${Number(job.total_amount).toFixed(2)} USDC
                    <span className="ml-2 text-[10px] text-[rgba(234,228,216,0.5)]">
                      {totalMs} milestone{totalMs !== 1 ? 's' : ''} · {job.duration_tier || 'single'}
                    </span>
                  </div>
                  {job.released_to_jobber != null && Number(job.released_to_jobber) > 0 && (
                    <div className="mt-1 font-mono text-[10px] text-[#a5d6a7]">Released: ${Number(job.released_to_jobber).toFixed(2)}</div>
                  )}
                  <div className="mt-1 font-mono text-[9px] text-[rgba(234,228,216,0.35)]">
                    {isClient ? 'You are the client' : isJobber ? 'You are the agent' : 'Open pool'}
                    {job.created_at && ` · ${new Date(job.created_at).toLocaleDateString()}`}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Progress bar */}
                  {totalMs > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] text-[rgba(234,228,216,0.5)]">{completedMs}/{totalMs}</span>
                      <div className="h-[4px] w-[60px] overflow-hidden rounded-none bg-white/10">
                        <div className="h-full bg-[#C5A67C] transition-all" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  )}
                  {canAccept && (
                    <button disabled={busy} onClick={() => handleAcceptJob(job)} className="btn-primary px-3 py-1 text-[9px]">
                      ACCEPT JOB
                    </button>
                  )}
                  {job.tx_hash_create && (
                    <a
                      href={`https://testnet.arcscan.app/tx/${job.tx_hash_create}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[9px] text-[#C5A67C] underline"
                    >
                      create tx↗
                    </a>
                  )}
                </div>
              </div>

              {/* Milestone summary row */}
              {milestones.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {milestones.map((m) => {
                    const msColor = m.status === 'released' ? 'bg-[#a5d6a7]/20 border-[#a5d6a7]/30' :
                      m.status === 'submitted' ? 'bg-[#C5A67C]/15 border-[#C5A67C]/30' :
                      m.status === 'disputed' ? 'bg-[#f0c5c5]/15 border-[#f0c5c5]/30' :
                      'bg-white/5 border-white/10';
                    return (
                      <div key={m.milestone_index} className={`rounded-none border px-2 py-0.5 font-mono text-[8px] ${msColor}`}>
                        #{m.milestone_index + 1} {m.status}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
