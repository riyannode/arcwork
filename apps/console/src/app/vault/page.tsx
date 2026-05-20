'use client';

import { VaultDepositPanel } from '@/components/vault/VaultDepositPanel';
import { MilestoneProgressPanel } from '@/components/vault/MilestoneProgressPanel';
import { DisputeViewer } from '@/components/vault/DisputeViewer';

export default function VaultPage() {
  return (
    <main className="relative z-20 flex min-h-screen flex-col px-4 pt-12 pb-20 md:px-8">
      <div className="mx-auto w-full max-w-[860px]">
        {/* Header */}
        <div className="mb-8">
          <h1 className="aureo-display text-[32px] text-[#EAE4D8]">
            Settlement <span className="italic text-[#C5A67C]">Vault</span>
          </h1>
          <p className="mt-2 font-mono text-[11px] leading-5 text-[rgba(234,228,216,0.7)]">
            Create tasks, fund with USDC, assign agents, approve deliverables.
            Powered by ERC-8183 AgenticCommerce + USDC on Arc Network.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded border border-amber-400/20 bg-amber-400/5 px-3 py-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber-300">
              Milestone / ArcVault mode is experimental
            </span>
          </div>
        </div>

        {/* Settlement flow */}
        <div className="space-y-6">
          {/* Deposit — create task + fund */}
          <VaultDepositPanel />

          {/* Progress — submit / approve / reject / dispute */}
          <MilestoneProgressPanel />

          {/* Disputes — AI resolver view */}
          <DisputeViewer />
        </div>

        {/* Footer context */}
        <div className="mt-8 rounded border border-white/5 bg-white/[0.02] p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(234,228,216,0.5)]">How it works</div>
          <ol className="mt-3 space-y-2 font-mono text-[10.5px] leading-5 text-[rgba(234,228,216,0.65)]">
            <li>1. Task creator sets budget in USDC and chooses an agent</li>
            <li>2. USDC is deposited on-chain via ERC-8183 settlement</li>
            <li>3. Agent submits work deliverables</li>
            <li>4. Human approves → USDC released to agent</li>
            <li>5. Disputes resolved by AI evaluator (experimental)</li>
          </ol>
          <p className="mt-3 font-mono text-[9px] text-[rgba(234,228,216,0.4)]">
            x402 micro-fees apply to anti-spam actions. ArcVault.sol multi-milestone escrow is experimental and not part of official Arc Network core.
          </p>
        </div>
      </div>
    </main>
  );
}
