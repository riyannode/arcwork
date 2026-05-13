'use client';

/**
 * ArcLayer — Landing page.
 *
 * This file is intentionally a thin composition. Every visual piece lives in
 * `@/components/home/*` so the landing stays isolated from the in-app
 * protocol chrome (Navbar, Footer, WebGLBackground). Touching the hero,
 * sidebar, proof strip, stats, or protocol section? Edit the file in
 * `components/home/` — do not fatten this page back up.
 *
 * Shell-only responsibilities here:
 *   - Page background color + overflow frame
 *   - DotMatrixField ambient canvas (landing-only)
 *   - Top-level grid layout that pairs the hero with ArchVisual
 *   - Scroll anchor targets (#top, #protocol)
 */

import DotMatrixField from '@/components/DotMatrixField';
import {
  HexGrid3D,
  HomeFeaturedCard,
  HomeFooterStrip,
  HomeHeader,
  HomeHero,
  HomeProtocolSection,
  HomeSidebar,
  LiveLogStream,
} from '@/components/home';

export default function Home() {
  return (
    <div
      id="top"
      className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-[#EAE4D8]"
    >
      <DotMatrixField />

      <HomeHeader />
      <HomeSidebar />

      {/*
        Grid tuned for 80–90% browser zoom primary target (desktop 1440/1536/1920).
        12-col split: hero takes 7, right visual/terminal column takes 5.
        Vertical padding reduced so first viewport fits: nav → hero → CTAs → proof → stats → right column
        without the lower cards being pushed below the fold at 80–90% zoom.
      */}
      <main className="relative z-20 min-h-[calc(100svh-80px)] overflow-x-clip px-3 pt-6 pb-6 md:px-5 md:pl-[84px] md:pr-5 md:pt-8 md:pb-7 lg:pl-[98px] xl:pl-[110px] 2xl:pl-[122px]">
        <div className="pointer-events-none absolute inset-x-0 top-3 bottom-3 hidden md:block">
          <span className="absolute inset-x-0 top-0 h-px bg-white/10" />
          <span className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
          <span className="absolute bottom-0 left-0 top-0 w-px bg-white/10" />
        </div>
        <div className="relative grid min-h-[calc(100svh-80px)] grid-cols-1 gap-y-5 md:grid-cols-12 md:items-center md:gap-x-12 xl:gap-x-14 2xl:gap-x-16">
          <div className="md:col-span-5 md:ml-4 md:max-w-[530px] md:justify-self-start xl:ml-6">
            <HomeHero />
          </div>

          <div className="relative flex flex-col gap-3.5 md:col-span-7 md:min-h-[480px] md:justify-self-end md:w-full md:max-w-[840px]">
            {/* Hex grid — logo floats solo */}
            <div className="relative flex flex-1 items-center justify-center">
              <HexGrid3D />
            </div>
            {/* Row: terminal (wide) + active escrow card (compact) side-by-side */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.35fr_0.65fr]">
              <LiveLogStream />
              <HomeFeaturedCard />
            </div>
          </div>
        </div>

        <HomeProtocolSection />
        <HomeFooterStrip />
      </main>
    </div>
  );
}
