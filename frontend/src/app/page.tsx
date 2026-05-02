'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.section-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const features = [
    {
      title: 'Achievements',
      desc: 'Soulbound NFT badges for on-chain milestones. Non-transferable, permanent proof of contribution.',
      icon: '⬡',
      href: '/achievements',
      tag: 'Soulbound NFTs',
    },
    {
      title: 'Invoices',
      desc: 'Create, send, and settle USDC invoices with built-in escrow. 0.5% platform fee.',
      icon: '◈',
      href: '/invoice',
      tag: 'USDC Escrow',
    },
    {
      title: 'Subscriptions',
      desc: 'Recurring USDC payments with automatic billing. Set it and forget it.',
      icon: '◎',
      href: '/subscription',
      tag: 'Recurring Pay',
    },
  ];

  const recommended = [
    {
      title: 'Deploy Contracts',
      desc: 'Deploy your smart contracts on Arc Testnet with USDC gas.',
      icon: '🚀',
      tag: 'Developer',
    },
    {
      title: 'Bridge USDC',
      desc: 'Transfer USDC cross-chain via CCTP with sub-second finality.',
      icon: '🔗',
      tag: 'Cross-chain',
    },
    {
      title: 'Earn Badges',
      desc: 'Complete milestones and earn exclusive soulbound achievement badges.',
      icon: '🏆',
      tag: 'Gamified',
    },
    {
      title: 'Manage Subscriptions',
      desc: 'Create recurring payment plans for your services and products.',
      icon: '💳',
      tag: 'Billing',
    },
  ];

  return (
    <div className="relative">
      {/* Hero Section — Two Column */}
      <section className="relative min-h-screen flex items-center px-8">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.08) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(10,69,255,0.06) 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Left — Text */}
          <div className="section-reveal visible">
            <p className="text-xs font-light mb-6 tracking-widest uppercase"
               style={{ color: 'rgba(0,240,255,0.7)' }}>
              Arc Network · Testnet
            </p>
            <h1 style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 300,
              lineHeight: '1.05',
              letterSpacing: '-0.04em',
            }}>
              <span style={{ color: '#FFFFFF' }}>Build </span>
              <span style={{ color: '#00F0FF' }}>workflows</span>
              <br />
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>on programmable money.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base font-extralight leading-relaxed"
               style={{ color: 'rgba(255,255,255,0.45)', lineHeight: '26px' }}>
              The all-in-one platform for achievements, invoices, and subscriptions
              on Arc Network — powered by USDC with sub-second finality.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link href="/dashboard" className="btn-primary inline-block px-8 py-3">
                Get Started
              </Link>
              <Link href="/achievements"
                    className="text-sm font-light px-8 py-3 rounded-full transition-all duration-300"
                    style={{ color: '#00F0FF', border: '1px solid rgba(0,240,255,0.3)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,240,255,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                Learn More
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2"
                       style={{ background: `rgba(0,240,255,${0.15 + i*0.05})`, borderColor: '#000' }} />
                ))}
              </div>
              <p className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Trusted by 1,000+ developers on Arc Testnet
              </p>
            </div>
          </div>

          {/* Right — Visual */}
          <div className="section-reveal hidden lg:block" style={{ transitionDelay: '0.2s' }}>
            <div className="relative">
              {/* Glass card preview */}
              <div className="glass-card p-8 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: 'linear-gradient(135deg, rgba(0,240,255,0.05) 0%, transparent 50%)' }} />
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
                       style={{ background: 'rgba(0,240,255,0.15)', color: '#00F0FF' }}>
                    ⬡
                  </div>
                  <div>
                    <div className="text-sm font-light">ArcWork Dashboard</div>
                    <div className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.3)' }}>Arc Testnet · Chain 5042002</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-full"
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>Achievements</span>
                    <span className="text-xs font-light" style={{ color: '#00F0FF' }}>5 badges</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-full"
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>Invoices</span>
                    <span className="text-xs font-light" style={{ color: '#00F0FF' }}>12 active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-full"
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>Subscriptions</span>
                    <span className="text-xs font-light" style={{ color: '#00F0FF' }}>3 plans</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-full"
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>USDC Balance</span>
                    <span className="text-xs font-light" style={{ color: '#00F0FF' }}>1,250.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — 3 Column Grid */}
      <section className="relative py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal text-center mb-16">
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
              Powerful tools for a{' '}
              <span style={{ color: '#00F0FF' }}>smarter workflow</span>
            </h2>
            <p className="mt-4 text-sm font-extralight max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Everything you need to build, manage, and scale on Arc Network.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Link key={i} href={f.href} className="section-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="feature-card h-full">
                  <div className="text-2xl mb-4" style={{ color: '#00F0FF' }}>{f.icon}</div>
                  <h3 className="text-base font-light mb-2">{f.title}</h3>
                  <p className="text-sm font-extralight mb-4" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: '22px' }}>
                    {f.desc}
                  </p>
                  <span className="text-xs font-light px-3 py-1 rounded-full"
                        style={{ background: 'rgba(0,240,255,0.08)', color: 'rgba(0,240,255,0.7)' }}>
                    {f.tag}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended for You */}
      <section className="relative py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal mb-12">
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 300, letterSpacing: '-0.02em' }}>
              Recommended for You
            </h2>
            <p className="mt-3 text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Get started with these popular actions on Arc Testnet.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recommended.map((r, i) => (
              <div key={i} className="section-reveal feature-card" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="text-2xl mb-3">{r.icon}</div>
                <h4 className="text-sm font-light mb-1">{r.title}</h4>
                <p className="text-xs font-extralight mb-3" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '18px' }}>
                  {r.desc}
                </p>
                <span className="text-[10px] font-light px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,240,255,0.06)', color: 'rgba(0,240,255,0.6)' }}>
                  {r.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-20 px-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Chain', value: 'Arc Testnet' },
            { label: 'Gas Token', value: 'USDC' },
            { label: 'Finality', value: '<1 second' },
            { label: 'Fee', value: '0.5%' },
          ].map((s, i) => (
            <div key={i} className="section-reveal text-center" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="text-xl font-light mb-1" style={{ color: '#00F0FF' }}>{s.value}</div>
              <div className="text-[10px] font-light uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-8 text-center">
        <div className="max-w-2xl mx-auto section-reveal">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
            Ready to build on{' '}
            <span style={{ color: '#00F0FF' }}>Arc</span>?
          </h2>
          <p className="mt-4 text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Deploy your first contract, create an invoice, or start earning badges today.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/dashboard" className="btn-primary px-8 py-3">
              Open Dashboard
            </Link>
            <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
               className="text-sm font-light px-8 py-3 rounded-full transition-all duration-300"
               style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
               onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.3)'; e.currentTarget.style.color = '#00F0FF'; }}
               onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
              Get Testnet USDC
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
