'use client';

import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { shortenAddress } from '@/lib/contracts';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">
                A
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                ArcWork
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                Dashboard
              </Link>
              <Link href="/achievements" className="text-gray-400 hover:text-white transition-colors text-sm">
                Achievements
              </Link>
              <Link href="/invoice" className="text-gray-400 hover:text-white transition-colors text-sm">
                Invoices
              </Link>
              <Link href="/subscription" className="text-gray-400 hover:text-white transition-colors text-sm">
                Subscriptions
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 font-mono">
                  {shortenAddress(address!)}
                </span>
                <button onClick={() => disconnect()} className="btn-secondary text-sm">
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const injected = connectors.find((c) => c.id === 'injected');
                  if (injected) connect({ connector: injected });
                }}
                className="btn-primary text-sm"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
