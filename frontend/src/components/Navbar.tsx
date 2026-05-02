'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { shortenAddress } from '@/lib/contracts';
import { useState, useEffect, useCallback } from 'react';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

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

  // Close modal on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setWalletModalOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close modal when connected
  useEffect(() => {
    if (isConnected) setWalletModalOpen(false);
  }, [isConnected]);

  const handleConnect = useCallback((connector: typeof connectors[number]) => {
    connect({ connector });
  }, [connect]);

  // Detect MetaMask
  const hasMetaMask = typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask;

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect with MetaMask browser extension',
      connector: connectors.find(c => c.id === 'metaMask' || c.name === 'MetaMask'),
      installed: hasMetaMask,
      recommended: true,
    },
    {
      id: 'injected',
      name: 'Browser Wallet',
      icon: '🌐',
      description: 'Connect with any injected wallet',
      connector: connectors.find(c => c.id === 'injected' && c.name !== 'MetaMask'),
      installed: true,
      recommended: false,
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '📱',
      description: 'Scan QR code with your mobile wallet',
      connector: connectors.find(c => c.id === 'walletConnect'),
      installed: true,
      recommended: false,
    },
  ].filter(w => w.connector); // Only show available connectors

  return (
    <>
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
                src="/logo.png" 
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
              <button 
                onClick={() => setWalletModalOpen(true)} 
                className="btn-primary text-sm"
              >
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

      {/* ─── Wallet Selection Modal ─── */}
      {walletModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setWalletModalOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          
          {/* Modal */}
          <div 
            className="relative w-full max-w-md glass-card p-6 animate-fade-in-up"
            style={{ borderRadius: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setWalletModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>✕</span>
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-1">Connect Wallet</h3>
              <p className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Choose a wallet to connect to Arc Testnet
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div 
                className="mb-4 p-3 rounded-xl text-xs font-light"
                style={{ 
                  background: 'rgba(255,80,80,0.1)', 
                  border: '1px solid rgba(255,80,80,0.2)',
                  color: '#ff6464',
                }}
              >
                {error.message.includes('User rejected') 
                  ? 'Connection was rejected. Please try again.' 
                  : error.message.includes('already pending')
                  ? 'Connection request already pending. Check your wallet.'
                  : error.message}
              </div>
            )}

            {/* Wallet Options */}
            <div className="space-y-3">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => handleConnect(wallet.connector!)}
                  disabled={isPending}
                  className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 text-left group"
                  style={{ 
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    opacity: isPending ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { 
                    if (!isPending) {
                      e.currentTarget.style.background = 'rgba(0,240,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(0,240,255,0.2)';
                    }
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    {wallet.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal">{wallet.name}</span>
                      {wallet.recommended && (
                        <span 
                          className="text-[10px] font-light px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(0,255,136,0.1)', color: 'rgba(0,255,136,0.8)' }}
                        >
                          Recommended
                        </span>
                      )}
                      {!wallet.installed && wallet.id === 'metamask' && (
                        <a 
                          href="https://metamask.io/download/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] font-light px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,200,0,0.1)', color: 'rgba(255,200,0,0.8)' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Install
                        </a>
                      )}
                    </div>
                    <span className="text-xs font-extralight" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {wallet.description}
                    </span>
                  </div>
                  <div 
                    className="text-xs font-light transition-colors duration-200"
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  >
                    →
                  </div>
                </button>
              ))}
            </div>

            {/* Network info */}
            <div 
              className="mt-5 pt-4 flex items-center justify-center gap-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="pulse-dot" style={{ width: '5px', height: '5px' }} />
              <span className="text-[11px] font-light" style={{ color: 'rgba(0,255,136,0.5)' }}>
                Arc Testnet · Chain ID 5042002
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
