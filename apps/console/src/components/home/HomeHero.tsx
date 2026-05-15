'use client';

import Link from 'next/link';
import HomeProofStrip from './HomeProofStrip';
import HomeStats from './HomeStats';

/**
 * Home hero — editorial serif headline, developer quickstart block,
 * CTAs, real deployed contracts strip, and live indexer stats.
 * Left column of the landing grid.
 *
 * Spacing tuned for 80–90% browser zoom (primary viewing target) while
 * staying usable at 100%. Headline uses clamp() so it scales continuously
 * with viewport width instead of jumping at breakpoints.
 */
export default function HomeHero() {
  return (
    <div className="relative flex max-w-[540px] flex-col justify-center">
      {/* Kicker */}
      <div className="mb-2 flex flex-col gap-1">
        <span className="aureo-mono-label">x402 · USDC ESCROW · PROOF OF WORK</span>
      </div>

      {/* Headline — slogan (fluid, clamp-driven) */}
      <h1
        className="aureo-display text-[#EAE4D8]"
        style={{
          fontSize: 'clamp(32px, 3.2vw, 58px)',
          lineHeight: 0.9,
        }}
      >
        <span className="block section-reveal" style={{ animationDelay: '0.05s' }}>
          PROTOCOL LAYER
        </span>
        <span className="block section-reveal" style={{ animationDelay: '0.15s' }}>
          FOR THE
        </span>
        <span
          className="block italic text-[#C5A67C] section-reveal"
          style={{ animationDelay: '0.25s' }}
        >
          agentic economy
        </span>
      </h1>

      {/* Divider */}
      <div className="my-3 flex max-w-[460px] items-center gap-3">
        <span className="h-px flex-1 bg-white/15" />
        <span
          className="h-[10px] w-[10px] rotate-45 border border-[#C5A67C]/60"
          style={{ background: 'rgba(197, 166, 124, 0.14)' }}
        />
        <span className="h-px flex-1 bg-white/15" />
      </div>

      {/* Body */}
      <p className="aureo-body max-w-[510px] text-[14px] text-[#9a9a9a] md:text-[14.5px]">
        ArcLayer lets agent builders add{' '}
        <span className="text-[#C5A67C]">x402 payments, USDC escrow, Proof of Work, and reputation</span>{' '}
        to any AI agent or API — without rebuilding payment and settlement logic from scratch.
        Deployed on Arc (chain{' '}
        <span className="font-mono text-[#C5A67C]">5042002</span>).
      </p>



      {/* CTAs */}
      <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-2.5">
        <Link href="/protocol" className="btn-primary">
          OPEN PROTOCOL CONSOLE
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 11L11 3M11 3H4M11 3V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </Link>
        <Link href="/docs" className="btn-ghost">
          READ SDK DOCS
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 11L11 3M11 3H4M11 3V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </Link>
        <a
          href="https://github.com/riyannode/ArcLayer"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
        >
          GITHUB
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 11L11 3M11 3H4M11 3V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </a>
      </div>

      <HomeProofStrip />
      <HomeStats />

      {/* Developer quickstart — moved to bottom */}
      <div className="mt-8 max-w-[500px]">
        <div className="aureo-mono-label mb-1.5">QUICKSTART</div>
        <pre className="code-block py-2.5">
<span className="tok-k">import</span> {'{ registerModuleAdjust }'} <span className="tok-k">from</span>{' '}
<span className="tok-s">&apos;@arclayer/sdks&apos;</span>;{'\n'}
sdks(em);
        </pre>
      </div>
    </div>
  );
}
