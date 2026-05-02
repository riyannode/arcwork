'use client';

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { CONTRACTS, USDC_ABI, ACHIEVEMENT_ABI, INVOICE_ABI, SUBSCRIPTION_ABI, shortenAddress } from '@/lib/contracts';
import { useReadContract } from 'wagmi';
import Link from 'next/link';

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-4xl mb-6" style={{ color: '#00F0FF' }}>⬡</div>
          <h2 className="text-2xl font-light mb-4">Connect Wallet</h2>
          <p className="text-sm font-extralight mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect your wallet to access the ArcWork dashboard on Arc Testnet.
          </p>
        </div>
      </div>
    );
  }

  const sections = [
    { title: 'Achievements', desc: 'View your soulbound badges', href: '/achievements', icon: '⬡', color: '#00F0FF' },
    { title: 'Invoices', desc: 'Create & manage USDC invoices', href: '/invoice', icon: '◈', color: '#00F0FF' },
    { title: 'Subscriptions', desc: 'Recurring payment plans', href: '/subscription', icon: '◎', color: '#00F0FF' },
  ];

  return (
    <div className="relative py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-light tracking-widest uppercase mb-3" style={{ color: 'rgba(0,240,255,0.6)' }}>
            Dashboard
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
            Welcome back
          </h1>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {shortenAddress(address || '')} · Arc Testnet
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((s, i) => (
            <Link key={i} href={s.href} className="group">
              <div className="glass-card p-8 h-full transition-all duration-300">
                <div className="text-3xl mb-4" style={{ color: s.color }}>{s.icon}</div>
                <h3 className="text-lg font-light mb-2">{s.title}</h3>
                <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.desc}</p>
                <div className="mt-6 text-xs font-light transition-colors duration-300"
                     style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span className="group-hover:text-[#00F0FF] transition-colors duration-300">Open →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Network Info */}
        <div className="mt-12 glass-card p-8">
          <h3 className="text-sm font-light mb-4 uppercase tracking-widest" style={{ color: 'rgba(0,240,255,0.6)' }}>
            Network
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <div className="font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>Chain</div>
              <div className="font-light mt-1">Arc Testnet</div>
            </div>
            <div>
              <div className="font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>Chain ID</div>
              <div className="font-light mt-1">5042002</div>
            </div>
            <div>
              <div className="font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>USDC</div>
              <div className="font-light mt-1 text-xs">{CONTRACTS.USDC}</div>
            </div>
            <div>
              <div className="font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>Explorer</div>
              <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
                 className="font-light mt-1 block transition-colors duration-300"
                 style={{ color: '#00F0FF' }}>ArcScan →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
