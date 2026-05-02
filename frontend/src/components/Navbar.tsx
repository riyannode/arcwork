'use client';

import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { shortenAddress } from '@/lib/contracts';
import { useState } from 'react';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/achievements', label: 'Achievements' },
    { href: '/invoice', label: 'Invoices' },
    { href: '/subscription', label: 'Subscriptions' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-panel" style={{ borderRadius: 0, borderBottom: '1.25px solid rgba(255,255,255,0.12)' }}>
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo.jpg" alt="ArcWork" className="w-8 h-8 rounded-full object-cover" style={{ border: '1.5px solid rgba(0,240,255,0.3)' }} />
          <span className="text-lg font-light tracking-tight"
                style={{ color: '#00F0FF' }}>
            ArcWork
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-light transition-colors duration-300"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00F0FF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-light px-4 py-2 rounded-full"
                    style={{ background: 'rgba(0,240,255,0.1)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.2)' }}>
                {shortenAddress(address || '')}
              </span>
              <button
                onClick={() => disconnect()}
                className="text-xs font-light px-4 py-2 rounded-full transition-all duration-300"
                style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,100,100,0.5)'; e.currentTarget.style.color = '#ff6464'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="btn-primary"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
