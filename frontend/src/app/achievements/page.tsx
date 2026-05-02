'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';
import { CONTRACTS, shortenAddress } from '@/lib/contracts';

const BADGE_TYPES = [
  { id: 0, name: 'First Transaction', desc: 'Complete your first tx on Arc', icon: '⬡' },
  { id: 1, name: 'Bridge USDC', desc: 'Bridge USDC to Arc Network', icon: '◈' },
  { id: 2, name: 'Deploy Contract', desc: 'Deploy your first smart contract', icon: '◎' },
  { id: 3, name: 'Refer Friends', desc: 'Refer a friend to ArcWork', icon: '⬢' },
  { id: 4, name: 'Complete Invoice', desc: 'Complete your first invoice cycle', icon: '◇' },
];

export default function Achievements() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-4xl mb-6" style={{ color: '#00F0FF' }}>⬡</div>
          <h2 className="text-2xl font-light mb-4">Connect Wallet</h2>
          <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect your wallet to view achievements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-light tracking-widest uppercase mb-3" style={{ color: 'rgba(0,240,255,0.6)' }}>
            Achievements
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
            Soulbound Badges
          </h1>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Non-transferable NFT badges for on-chain milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BADGE_TYPES.map((badge) => (
            <div key={badge.id} className="glass-card p-8 text-center">
              <div className="text-4xl mb-4" style={{ color: '#00F0FF' }}>{badge.icon}</div>
              <h3 className="text-base font-light mb-2">{badge.name}</h3>
              <p className="text-xs font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>{badge.desc}</p>
              <div className="mt-4 text-xs font-light px-4 py-1 rounded-full inline-block"
                   style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                Not earned
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
