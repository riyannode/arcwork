'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WebGLBackground from '@/components/WebGLBackground';

const inter = Inter({ subsets: ['latin'], weight: ['200','300','400','500','600','700'] });
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: '#000000', color: '#FFFFFF' }}>
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
