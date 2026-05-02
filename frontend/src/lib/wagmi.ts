import { http, createConfig } from 'wagmi';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
} as const;

export const config = createConfig({
  chains: [arcTestnet],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'ArcWork',
        url: 'https://arcwork-zeta.vercel.app',
      },
    }),
    injected(),
    walletConnect({
      projectId: 'arcwork-testnet-demo', // Replace with real WalletConnect projectId
    }),
  ],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
