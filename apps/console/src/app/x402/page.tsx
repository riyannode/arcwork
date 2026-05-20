'use client';

import X402DemoPanel from '@/components/x402/X402DemoPanel';

export default function X402Page() {
  return (
    <main className="relative z-20 flex min-h-screen flex-col items-center px-4 pt-12 pb-20 md:px-8">
      <div className="w-full max-w-[720px]">
        <div className="mb-6">
          <h1 className="aureo-display text-[32px] text-[#EAE4D8]">
            x402 <span className="italic text-[#C5A67C]">Payment Gate</span>
          </h1>
          <p className="mt-2 font-mono text-[11px] leading-5 text-[rgba(234,228,216,0.7)]">
            Pay micro-fees to access protected agent resources. Powered by ERC-8183 + USDC on Arc Network.
          </p>
        </div>
        <div id="x402-ticket">
          <X402DemoPanel />
        </div>
      </div>
    </main>
  );
}
