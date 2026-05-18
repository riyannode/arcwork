'use client';

import { useState } from 'react';
import { useArcWallet } from '@/hooks/useArcWallet';

type Milestone = {
  description: string;
  amount: string; // USDC string
};

type DurationTier = 'instant' | 'single_payout' | 'milestone';

const MIN_MILESTONE_BPS = 1000; // 10%

export function VaultDepositPanel() {
  const { address, isConnected } = useArcWallet();
  const [jobberAddr, setJobberAddr] = useState('');
  const [specJson, setSpecJson] = useState('');
  const [durationTier, setDurationTier] = useState<DurationTier>('single_payout');
  const [milestones, setMilestones] = useState<Milestone[]>([{ description: '', amount: '' }]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ tone: 'idle' | 'pending' | 'success' | 'error'; msg: string }>({
    tone: 'idle',
    msg: 'Configure milestones and deposit USDC into Vault.',
  });

  const totalAmount = milestones.reduce((sum, m) => {
    const n = Number(m.amount);
    return Number.isFinite(n) ? sum + n : sum;
  }, 0);

  // Bond preview (matches BondConfig.sol tiers — should fetch from chain in prod)
  const bondPreview = computeBond(totalAmount);

  function addMilestone() {
    setMilestones((prev) => [...prev, { description: '', amount: '' }]);
  }

  function removeMilestone(i: number) {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateMilestone(i: number, field: keyof Milestone, value: string) {
    setMilestones((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  }

  async function handleCreate() {
    if (!isConnected || !address) {
      setStatus({ tone: 'error', msg: 'Connect wallet first.' });
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(jobberAddr)) {
      setStatus({ tone: 'error', msg: 'Jobber address invalid.' });
      return;
    }
    if (!specJson.trim()) {
      setStatus({ tone: 'error', msg: 'Spec / task description required.' });
      return;
    }
    if (totalAmount <= 0) {
      setStatus({ tone: 'error', msg: 'Total amount must be > 0.' });
      return;
    }

    // Validate min 10% per milestone for milestone-tier jobs
    if (durationTier === 'milestone') {
      const minPerMs = totalAmount * (MIN_MILESTONE_BPS / 10000);
      for (const m of milestones) {
        if (Number(m.amount) < minPerMs) {
          setStatus({ tone: 'error', msg: `Each milestone must be ≥ 10% of total ($${minPerMs.toFixed(2)}).` });
          return;
        }
      }
    }

    try {
      setBusy(true);
      setStatus({ tone: 'pending', msg: 'Creating vault job...' });

      const res = await fetch('/api/vault/jobs', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-arc-wallet': address,
        },
        body: JSON.stringify({
          clientAddress: address,
          jobberAddress: jobberAddr,
          totalAmount: totalAmount.toString(),
          durationTier,
          specJson: { description: specJson },
          milestones: milestones.map((m, i) => ({
            index: i,
            description: m.description,
            amount: m.amount,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      setStatus({
        tone: 'success',
        msg: `Vault job ${json.jobId?.slice(0, 8) ?? 'created'}. Bond required: $${bondPreview.bondAmount.toFixed(2)}. Approve USDC + deposit on-chain to fund Vault 1.`,
      });
    } catch (e) {
      setStatus({ tone: 'error', msg: e instanceof Error ? e.message : 'Failed.' });
    } finally {
      setBusy(false);
    }
  }

  const toneClass = {
    idle: 'border-white/10 bg-black/20 text-[rgba(234,228,216,0.82)]',
    pending: 'border-amber-400/30 bg-amber-400/5 text-amber-200',
    success: 'border-[#B8CD7E]/35 bg-[#B8CD7E]/8 text-[#B8CD7E]',
    error: 'border-red-400/35 bg-red-400/6 text-red-200',
  }[status.tone];

  return (
    <div className="aureo-panel p-4 md:p-6">
      <div className="aureo-mono-label mb-2">VAULT · ADVANCED ESCROW</div>
      <h2 className="aureo-display text-[28px] text-[#EAE4D8]">
        Multi-milestone <span className="italic text-[#C5A67C]">vault deposit</span>
      </h2>
      <p className="mt-1 font-mono text-[11px] leading-5 text-[rgba(234,228,216,0.78)]">
        Dual-vault system: V1 (Open Pool, instant withdraw) → V2 (Escrow Lock, locked on jobber accept). Auto-resolved disputes via AI · 7-tier performance bond · 48hr approval window.
      </p>

      {/* Tier selector */}
      <div className="mt-5">
        <label className="mb-2 block font-mono text-[10.5px] tracking-[0.14em] text-[rgba(234,228,216,0.82)]">JOB DURATION TIER</label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'instant' as const, label: '< 5 min', sub: 'Direct x402' },
              { id: 'single_payout' as const, label: '5min–24hr', sub: 'Single payout' },
              { id: 'milestone' as const, label: '> 24hr', sub: 'Milestone-based' },
            ]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setDurationTier(t.id);
                if (t.id !== 'milestone') setMilestones((prev) => [prev[0] || { description: '', amount: '' }]);
              }}
              className={`rounded-none border px-3 py-2.5 text-left transition-colors ${
                durationTier === t.id
                  ? 'border-[#C5A67C] bg-[#C5A67C]/10 text-[#EAE4D8]'
                  : 'border-white/10 bg-black/20 text-[rgba(234,228,216,0.78)] hover:border-white/25'
              }`}
            >
              <div className="font-mono text-[10px] uppercase tracking-[0.14em]">{t.label}</div>
              <div className="mt-1 font-mono text-[9.5px] text-[rgba(234,228,216,0.6)]">{t.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Jobber + Spec */}
      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.14em] text-[rgba(234,228,216,0.82)]">JOBBER WALLET</label>
          <input
            value={jobberAddr}
            onChange={(e) => setJobberAddr(e.target.value)}
            placeholder="0x... worker / executor wallet"
            className="input-mono"
            spellCheck={false}
          />
        </div>

        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] tracking-[0.14em] text-[rgba(234,228,216,0.82)]">SPEC / TASK DESCRIPTION</label>
          <textarea
            value={specJson}
            onChange={(e) => setSpecJson(e.target.value)}
            placeholder="Describe deliverables, acceptance criteria, file format. AI resolver uses this if disputed."
            className="input-mono min-h-[100px]"
          />
        </div>
      </div>

      {/* Milestones */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="block font-mono text-[10.5px] tracking-[0.14em] text-[rgba(234,228,216,0.82)]">
            {durationTier === 'milestone' ? 'MILESTONES (2–5)' : 'PAYOUT'}
          </label>
          {durationTier === 'milestone' && milestones.length < 5 && (
            <button
              type="button"
              onClick={addMilestone}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C5A67C] transition-colors hover:text-[#EAE4D8]"
            >
              + Add Milestone
            </button>
          )}
        </div>

        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-2 rounded-none border border-white/10 bg-black/20 px-3 py-2.5">
              <span className="mt-2 font-mono text-[10px] text-[rgba(234,228,216,0.5)]">#{i + 1}</span>
              <div className="flex-1 space-y-2">
                <input
                  value={m.description}
                  onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                  placeholder="Milestone description (e.g. 'Initial wireframes')"
                  className="input-mono"
                />
                <div className="flex items-center gap-2">
                  <input
                    value={m.amount}
                    onChange={(e) => updateMilestone(i, 'amount', e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-mono flex-1"
                  />
                  <span className="font-mono text-[11px] text-[rgba(234,228,216,0.6)]">USDC</span>
                </div>
              </div>
              {durationTier === 'milestone' && milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(i)}
                  className="font-mono text-[14px] text-[rgba(234,228,216,0.4)] transition-colors hover:text-red-400"
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        {durationTier === 'milestone' && (
          <p className="mt-2 font-mono text-[9.5px] text-[rgba(234,228,216,0.5)]">
            Each milestone must be ≥ 10% of total. 2× free revisions per milestone before auto-escalation to AI resolver.
          </p>
        )}
      </div>

      {/* Bond + Total preview */}
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-none border border-white/10 bg-black/20 px-3 py-2.5">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[rgba(234,228,216,0.6)]">Total Deposit</div>
          <div className="mt-1 font-mono text-[14px] text-[#EAE4D8]">${totalAmount.toFixed(2)}</div>
          <div className="font-mono text-[9.5px] text-[rgba(234,228,216,0.5)]">Vault 1 (Open Pool)</div>
        </div>
        <div className="rounded-none border border-white/10 bg-black/20 px-3 py-2.5">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[rgba(234,228,216,0.6)]">Jobber Bond</div>
          <div className="mt-1 font-mono text-[14px] text-[#EAE4D8]">${bondPreview.bondAmount.toFixed(2)}</div>
          <div className="font-mono text-[9.5px] text-[rgba(234,228,216,0.5)]">{bondPreview.tier}</div>
        </div>
        <div className="rounded-none border border-white/10 bg-black/20 px-3 py-2.5">
          <div className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-[rgba(234,228,216,0.6)]">Dispute SLA</div>
          <div className="mt-1 font-mono text-[14px] text-[#EAE4D8]">~5 min</div>
          <div className="font-mono text-[9.5px] text-[rgba(234,228,216,0.5)]">AI Tier 0 (auto)</div>
        </div>
      </div>

      {/* Status */}
      <div className={`mt-4 rounded-none border px-4 py-3 font-mono text-[11px] ${toneClass}`}>
        {status.msg}
      </div>

      <button
        onClick={handleCreate}
        disabled={!isConnected || busy}
        className="btn-primary mt-5"
      >
        {busy ? 'CREATING…' : 'CREATE VAULT JOB'}
      </button>
    </div>
  );
}

// Mirror BondConfig.sol tier logic
function computeBond(totalUsd: number): { bondAmount: number; tier: string } {
  if (totalUsd === 0) return { bondAmount: 0, tier: '—' };
  if (totalUsd < 50) return { bondAmount: 0, tier: 'Free tier' };
  if (totalUsd < 300) return { bondAmount: 5, tier: '$5 flat' };
  if (totalUsd < 500) return { bondAmount: totalUsd * 0.01, tier: '1% rate' };
  if (totalUsd < 1000) return { bondAmount: totalUsd * 0.02, tier: '2% rate' };
  if (totalUsd < 2000) return { bondAmount: totalUsd * 0.03, tier: '3% rate' };
  if (totalUsd < 3000) return { bondAmount: totalUsd * 0.045, tier: '4.5% rate' };
  return { bondAmount: totalUsd * 0.06, tier: '6% rate (max)' };
}
