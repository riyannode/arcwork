'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arcTestnet } from '@arclayer/sdk';
import AutoSwitchArcChain from './AutoSwitchArcChain';
import { config } from '@/lib/wagmi';

const queryClient = new QueryClient();

// Privy App ID — injected at build time via NEXT_PUBLIC_PRIVY_APP_ID.
// Falls back to hardcoded testing ID if env missing (not production-safe).
const PRIVY_APP_ID =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmopoaivr00kw0cl7pl9m3noz';

/**
 * Client-side providers tree. Order matters:
 *   PrivyProvider → WagmiProvider (Privy's) → QueryClientProvider
 *
 * This gives us:
 * - Email / Google / Twitter login (embedded wallets auto-provisioned)
 * - External wallet connect (MetaMask, Rabby, Phantom, etc.) via WalletConnect
 * - Full wagmi hooks compatibility in downstream components
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#C5A67C',
          logo: '/arc-brand.svg',
          showWalletLoginFirst: false,
          // EIP-6963-first wallet list. `detected_ethereum_wallets` renders
          // each installed extension as its own button, routed by RDNS — no
          // window.ethereum fallback, so OKX's "Default Wallet" toggle cannot
          // hijack a MetaMask click. Generic brand buttons (metamask, okx_wallet
          // etc) were removed because they fall back to window.ethereum when
          // EIP-6963 resolution misses, which was causing wrong-wallet popups.
          //
          // `wallet_connect` stays for mobile + desktop wallets that can't be
          // detected locally. `safe` stays for multisig flows.
          walletList: [
            'detected_ethereum_wallets',
            'wallet_connect',
            'safe',
          ],
          walletChainType: 'ethereum-only',
        },
        externalWallets: {
          walletConnect: {
            enabled: true,
          },
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <AutoSwitchArcChain />
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
