'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { shortenAddress } from '@/lib/contracts';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/achievements', label: 'Achievements' },
    { href: '/invoice', label: 'Invoices' },
    { href: '/subscription', label: 'Subscriptions' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav 
      className="sticky top-0 z-50 glass-panel transition-all duration-500"
      style={{ 
        borderRadius: 0, 
        borderBottom: `1px solid rgba(255,255,255,${scrolled ? '0.1' : '0.06'})`,
        height: scrolled ? '56px' : '64px',
        boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between transition-all duration-500">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <img 
              src="/logo.jpg" 
              alt="ArcWork" 
              className="w-8 h-8 rounded-lg object-cover transition-all duration-300 group-hover:scale-105" 
              style={{ border: '1.5px solid rgba(0,240,255,0.3)' }} 
            />
            <div 
              className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: '0 0 16px rgba(0,240,255,0.3)' }}
            />
          </div>
          <span className="text-lg font-medium tracking-tight" style={{ color: '#00F0FF' }}>
            ArcWork
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-light px-4 py-2 rounded-lg transition-all duration-300"
                style={{ 
                  color: isActive ? '#00F0FF' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(0,240,255,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => { 
                  if (!isActive) {
                    e.currentTarget.style.color = '#00F0FF';
                    e.currentTarget.style.background = 'rgba(0,240,255,0.04)';
                  }
                }}
                onMouseLeave={(e) => { 
                  if (!isActive) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {link.label}
                {isActive && (
                  <span 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                    style={{ background: '#00F0FF' }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Wallet + Mobile Menu */}
        <div className="flex items-center gap-3">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center gap-2 text-xs font-light px-4 py-2 rounded-full"
                style={{ 
                  background: 'rgba(0,240,255,0.08)', 
                  color: '#00F0FF', 
                  border: '1px solid rgba(0,240,255,0.15)' 
                }}
              >
                <span className="pulse-dot" />
                {shortenAddress(address || '')}
              </div>
              <button
                onClick={() => disconnect()}
                className="text-xs font-light px-3 py-2 rounded-full transition-all duration-300"
                style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,100,100,0.5)'; e.currentTarget.style.color = '#ff6464'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={() => connect({ connector: connectors[0] })} className="btn-primary text-sm">
              Connect Wallet
            </button>
          )}

          {/* Mobile hamburger */}
          <button 
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span 
              className="w-5 h-[1.5px] rounded-full transition-all duration-300"
              style={{ 
                background: 'rgba(255,255,255,0.6)',
                transform: menuOpen ? 'rotate(45deg) translateY(4px)' : 'none'
              }}
            />
            <span 
              className="w-5 h-[1.5px] rounded-full transition-all duration-300"
              style={{ 
                background: 'rgba(255,255,255,0.6)',
                opacity: menuOpen ? 0 : 1
              }}
            />
            <span 
              className="w-5 h-[1.5px] rounded-full transition-all duration-300"
              style={{ 
                background: 'rgba(255,255,255,0.6)',
                transform: menuOpen ? 'rotate(-45deg) translateY(-4px)' : 'none'
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className="md:hidden overflow-hidden transition-all duration-400"
        style={{ 
          maxHeight: menuOpen ? '300px' : '0',
          opacity: menuOpen ? 1 : 0,
          borderTop: menuOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
        }}
      >
        <div className="px-6 py-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 px-4 rounded-lg text-sm font-light transition-all duration-200"
                style={{ 
                  color: isActive ? '#00F0FF' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(0,240,255,0.08)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
