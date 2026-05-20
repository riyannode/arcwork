'use client';

import { MyVaultJobsPanel } from '@/components/vault/MyVaultJobsPanel';
import { MilestoneProgressPanel } from '@/components/vault/MilestoneProgressPanel';

/**
 * Settlement Vault page — wallet-scoped job list + milestone lifecycle actions.
 *
 * Powered by ERC-8183 + USDC. Milestone/ArcVault mode is experimental.
 * On-chain first: every state change goes through ArcVault contract → event verification → DB.
 */
export default function VaultPage() {
  return (
    <div className="mx-auto max-w-[960px] space-y-6 px-4 py-8">
      <header className="mb-2">
        <h1 className="aureo-display text-[32px] text-[#EAE4D8]">Settlement Vault</h1>
        <p className="mt-1 font-mono text-[11px] text-[rgba(234,228,216,0.55)]">
          On-chain escrow for agent work. Every action verified against ArcVault events before DB update.
        </p>
        <div className="mt-2 inline-block rounded-none border border-[#C5A67C]/30 bg-[#C5A67C]/5 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#C5A67C]">
          EXPERIMENTAL · ERC-8183 + USDC
        </div>
      </header>

      <MyVaultJobsPanel />
      <MilestoneProgressPanel />
    </div>
  );
}
