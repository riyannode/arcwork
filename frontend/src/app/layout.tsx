'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WebGLBackground from '@/components/WebGLBackground';

const inter = Inter({ 
  subsets: ['latin'], 
  weight: ['200','300','400','500','600','700'],
  variable: '--font-inter',
});
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="ArcWork — Achievement, Invoice & Subscription dApp on Arc Network. Build workflows on programmable money." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ArcWork — Build on Programmable Money</title>
      </head>
      <body className={inter.className} style={{ background: '#000', color: '#FFF' }}>
        <WebGLBackground />
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <div className="relative z-10 min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
