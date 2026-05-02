'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';
import { CONTRACTS, shortenAddress } from '@/lib/contracts';

export default function InvoicePage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<'create' | 'view'>('create');

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-4xl mb-6" style={{ color: '#00F0FF' }}>◈</div>
          <h2 className="text-2xl font-light mb-4">Connect Wallet</h2>
          <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect your wallet to manage invoices.
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
            Invoices
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
            USDC Invoices
          </h1>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Create, pay, and manage invoices with USDC escrow. 0.5% fee.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8">
          {(['create', 'view'] as const).map((t) => (
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
              {t === 'create' ? 'Create Invoice' : 'View Invoices'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <div className="glass-card p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-light mb-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Client Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-full text-sm font-light outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                />
              </div>
              <div>
                <label className="block text-xs font-light mb-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-full text-sm font-light outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                />
              </div>
              <div>
                <label className="block text-xs font-light mb-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Invoice for..."
                  className="w-full px-4 py-3 rounded-full text-sm font-light outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                />
              </div>
              <button className="btn-primary w-full mt-4">
                Create Invoice
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No invoices yet. Create one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
