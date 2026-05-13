'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { shortenAddress } from '@/lib/contracts';
import { useState, useEffect } from 'react';
import ArcMark from './ArcMark';

export default function Navbar() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'PROTOCOL' },
    { href: '/jobs', label: 'JOBS' },
    { href: '/agents', label: 'AGENTS' },
    { href: '/docs', label: 'SDK' },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Resolve address: prefer linked wallet, fall back to embedded wallet
  const address =
    user?.wallet?.address ||
    user?.linkedAccounts?.find((acc) => acc.type === 'wallet')?.address ||
    '';

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl transition-all duration-500"
      style={{
        background: 'rgba(5, 5, 5, 0.85)',
        height: scrolled ? '60px' : '72px',
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between px-5 transition-all duration-500 md:px-10">
        {/* Brand — logo + wordmark */}
        <Link href="/" className="group flex items-center gap-3" aria-label="ArcLayer home">
          <div className="relative transition-transform duration-300 group-hover:scale-105">
            <ArcMark size={scrolled ? 26 : 30} />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className="aureo-body text-[#EAE4D8]"
              style={{ fontSize: '15px', letterSpacing: '0.24em', fontWeight: 400 }}
            >
              ARCLAYER
            </span>
            <span className="mt-1 hidden font-mono text-[9px] tracking-[0.2em] text-[#C5A67C] md:block">
              PROTOCOL · AGENTIC ECONOMY
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 transition-all duration-300"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  letterSpacing: '0.24em',
                  fontWeight: 400,
                  color: isActive ? '#EAE4D8' : '#7A7A7A',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#C5A67C'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#7A7A7A'; }}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 h-[1px] w-6 -translate-x-1/2"
                    style={{ background: '#C5A67C', boxShadow: '0 0 8px rgba(197, 166, 124, 0.8)' }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Wallet + Mobile */}
        <div className="flex items-center gap-3">
          {!ready ? (
            <div
              className="px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-white/40"
              style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
            >
              LOADING…
            </div>
          ) : authenticated && address ? (
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-2 font-mono text-[11px]"
                style={{
                  background: 'rgba(197, 166, 124, 0.08)',
                  color: '#C5A67C',
                  border: '1px solid rgba(197, 166, 124, 0.25)',
                }}
              >
                <span className="pulse-dot" />
                {shortenAddress(address)}
              </div>
              <button
                onClick={() => logout()}
                className="px-3 py-2 font-mono text-[10px] tracking-[0.18em] text-white/40 transition-all duration-300"
                style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,100,100,0.5)'; e.currentTarget.style.color = '#ff6464'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
              >
                DISCONNECT
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: '11px' }}
            >
              CONNECT WALLET
            </button>
          )}

          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
          >
            <span className="h-[1.5px] w-5 transition-all duration-300" style={{ background: '#C5A67C', transform: menuOpen ? 'rotate(45deg) translateY(4px)' : 'none' }} />
            <span className="h-[1.5px] w-5 transition-all duration-300" style={{ background: '#C5A67C', opacity: menuOpen ? 0 : 1 }} />
            <span className="h-[1.5px] w-5 transition-all duration-300" style={{ background: '#C5A67C', transform: menuOpen ? 'rotate(-45deg) translateY(-4px)' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className="md:hidden overflow-hidden transition-all duration-400"
        style={{
          maxHeight: menuOpen ? '320px' : '0',
          opacity: menuOpen ? 1 : 0,
          borderTop: menuOpen ? '1px solid rgba(255,255,255,0.08)' : 'none',
          background: 'rgba(5, 5, 5, 0.96)',
        }}
      >
        <div className="px-6 py-5 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-3 px-4 transition-all duration-200"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  letterSpacing: '0.24em',
                  color: isActive ? '#C5A67C' : 'rgba(234, 228, 216, 0.7)',
                  background: isActive ? 'rgba(197, 166, 124, 0.08)' : 'transparent',
                  borderLeft: isActive ? '2px solid #C5A67C' : '2px solid transparent',
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
