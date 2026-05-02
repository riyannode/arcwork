'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';
import { CONTRACTS, shortenAddress } from '@/lib/contracts';

export default function SubscriptionPage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<'plans' | 'my'>('plans');

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-4xl mb-6" style={{ color: '#00F0FF' }}>◎</div>
          <h2 className="text-2xl font-light mb-4">Connect Wallet</h2>
          <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect your wallet to manage subscriptions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-24 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-light tracking-widest uppercase mb-3" style={{ color: 'rgba(0,240,255,0.6)' }}>
            Subscriptions
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
            Recurring Payments
          </h1>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Create subscription plans and manage recurring USDC payments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8">
          {(['plans', 'my'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-2 rounded-full text-sm font-light transition-all duration-300"
              style={{
                background: tab === t ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.03)',
                color: tab === t ? '#00F0FF' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${tab === t ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {t === 'plans' ? 'Browse Plans' : 'My Subscriptions'}
            </button>
          ))}
        </div>

        {tab === 'plans' ? (
          <div className="glass-card p-12 text-center">
            <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No subscription plans available yet.
            </p>
            <p className="text-xs font-extralight mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Create the first plan on Arc Network.
            </p>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              You have no active subscriptions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
