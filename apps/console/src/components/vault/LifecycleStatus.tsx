'use client';

import type { LifecycleState } from '@/hooks/useVaultLifecycle';

/**
 * Inline lifecycle status banner — shows current step + tx link.
 * Used by every Settlement Vault panel that runs on-chain actions.
 */
export function LifecycleStatus({ state }: { state: LifecycleState }) {
  if (state.step === 'idle') return null;

  const color =
    state.step === 'error' ? 'text-[#f0c5c5]' :
    state.step === 'done' ? 'text-[#a5d6a7]' :
    'text-[#C5A67C]';

  return (
    <div className={`mt-3 rounded-none border border-white/10 bg-black/25 px-3 py-2 font-mono text-[11px] ${color}`}>
      [{state.step.toUpperCase()}] {state.message}
      {state.txHash && (
        <a
          href={`https://testnet.arcscan.app/tx/${state.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 underline text-[#C5A67C]"
        >
          tx↗
        </a>
      )}
    </div>
  );
}
