'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ─── Typewriter Hook ─── */
function useTypewriter(words: string[], speed = 80, pause = 2000) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && text === current) {
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    } else {
      timeout = setTimeout(() => {
        setText(isDeleting ? current.substring(0, text.length - 1) : current.substring(0, text.length + 1));
      }, isDeleting ? speed / 2 : speed);
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words, speed, pause]);

  return text;
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2000 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <div ref={ref}>{prefix}{count.toLocaleString()}{suffix}</div>;
}

/* ─── Section Reveal Observer ─── */
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.section-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function Home() {
  useReveal();
  const typewriterText = useTypewriter(['programmable money', 'on-chain payments', 'USDC workflows', 'recurring billing']);

  const features = [
    {
      title: 'Achievements',
      desc: 'Soulbound NFT badges for on-chain milestones. Non-transferable, permanent proof of contribution.',
      icon: '⬡',
      href: '/achievements',
      tag: 'Soulbound NFTs',
      gradient: 'from-cyan-500/10 to-blue-500/10',
    },
    {
      title: 'Invoices',
      desc: 'Create, send, and settle USDC invoices with built-in escrow. 0.5% platform fee.',
      icon: '◈',
      href: '/invoice',
      tag: 'USDC Escrow',
      gradient: 'from-blue-500/10 to-purple-500/10',
    },
    {
      title: 'Subscriptions',
      desc: 'Recurring USDC payments with automatic billing. Set it and forget it.',
      icon: '◎',
      href: '/subscription',
      tag: 'Recurring Pay',
      gradient: 'from-green-500/10 to-cyan-500/10',
    },
  ];

  const stats = [
    { label: 'Finality', value: '<1', suffix: 's', prefix: '' },
    { label: 'Platform Fee', value: 0.5, suffix: '%', prefix: '' },
    { label: 'Gas Token', value: 0, suffix: '', prefix: '', display: 'USDC' },
    { label: 'Chain', value: 0, suffix: '', prefix: '', display: 'Arc Testnet' },
  ];

  return (
    <div className="relative">
      {/* ═══════════ Hero Section ═══════════ */}
      <section className="relative min-h-[92vh] flex items-center px-6 overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-[15%] left-[20%] w-[500px] h-[500px] rounded-full float-slow"
            style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)' }} 
          />
          <div 
            className="absolute bottom-[10%] right-[15%] w-[400px] h-[400px] rounded-full float-medium"
            style={{ background: 'radial-gradient(circle, rgba(10,69,255,0.05) 0%, transparent 70%)' }} 
          />
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
          {/* Left — Text */}
          <div className="section-reveal visible">
            <div className="flex items-center gap-3 mb-8">
              <div className="pulse-dot" />
              <span className="text-xs font-light tracking-widest uppercase" style={{ color: 'rgba(0,255,136,0.7)' }}>
                Arc Network · Testnet
              </span>
            </div>

            <h1 className="mb-6" style={{
              fontSize: 'clamp(38px, 5.5vw, 68px)',
              fontWeight: 300,
              lineHeight: '1.08',
              letterSpacing: '-0.04em',
            }}>
              <span style={{ color: '#FFFFFF' }}>Build workflows on</span>
              <br />
              <span className="glow-text" style={{ color: '#00F0FF' }}>{typewriterText}</span>
              <span className="cursor-blink ml-0.5" style={{ color: '#00F0FF' }}>|</span>
            </h1>

            <p className="max-w-lg text-base font-extralight leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: '28px' }}>
              The all-in-one platform for achievements, invoices, and subscriptions
              on Arc Network — powered by USDC with sub-second finality.
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Link href="/dashboard" className="btn-primary inline-block">
                Get Started
              </Link>
              <Link href="/achievements" className="btn-ghost inline-block">
                Learn More
              </Link>
            </div>

            {/* Trust bar */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2.5">
                {[0,1,2,3,4].map(i => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full border-2 transition-transform duration-300 hover:scale-110 hover:z-10"
                    style={{ 
                      background: `linear-gradient(135deg, rgba(0,240,255,${0.15 + i*0.06}), rgba(10,69,255,${0.1 + i*0.04}))`, 
                      borderColor: '#000',
                    }} 
                  />
                ))}
              </div>
              <div>
                <p className="text-xs font-light" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Trusted by <span style={{ color: '#00F0FF' }}>1,000+</span> developers
                </p>
                <p className="text-[10px] font-extralight" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  on Arc Testnet
                </p>
              </div>
            </div>
          </div>

          {/* Right — Dashboard Preview Card */}
          <div className="section-reveal hidden lg:block" style={{ transitionDelay: '0.15s' }}>
            <div className="relative">
              {/* Glow behind card */}
              <div 
                className="absolute -inset-8 rounded-3xl opacity-50"
                style={{ 
                  background: 'radial-gradient(ellipse at center, rgba(0,240,255,0.06) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                }}
              />
              
              <div className="glass-card p-8 relative overflow-hidden">
                {/* Top gradient line */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.4), transparent)' }}
                />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm"
                      style={{ background: 'rgba(0,240,255,0.12)', color: '#00F0FF' }}
                    >
                      ⬡
                    </div>
                    <div>
                      <div className="text-sm font-medium">ArcWork Dashboard</div>
                      <div className="text-[11px] font-light flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <span className="pulse-dot" style={{ width: '5px', height: '5px' }} />
                        Arc Testnet · Chain 5042002
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: 'Achievements', value: '5 badges', color: '#00F0FF' },
                    { label: 'Invoices', value: '12 active', color: '#00FF88' },
                    { label: 'Subscriptions', value: '3 plans', color: '#0A45FF' },
                    { label: 'USDC Balance', value: '1,250.00', color: '#00F0FF' },
                  ].map((item, i) => (
                    <div 
                      key={i}
                      className="p-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                      style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="text-[10px] font-light uppercase tracking-wider mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {item.label}
                      </div>
                      <div className="text-sm font-medium" style={{ color: item.color }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Activity bar */}
                <div className="p-3 rounded-xl shimmer" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00FF88' }} />
                      <span className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Recent: Invoice #1042 settled
                      </span>
                    </div>
                    <span className="text-[10px] font-light" style={{ color: 'rgba(0,240,255,0.5)' }}>
                      2m ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Features Section ═══════════ */}
      <section className="relative py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal text-center mb-16">
            <span 
              className="inline-block text-xs font-light tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(0,240,255,0.06)', color: 'rgba(0,240,255,0.6)', border: '1px solid rgba(0,240,255,0.1)' }}
            >
              Core Features
            </span>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: '1.2' }}>
              Powerful tools for a{' '}
              <span className="glow-text" style={{ color: '#00F0FF' }}>smarter workflow</span>
            </h2>
            <p className="mt-5 text-sm font-extralight max-w-xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Everything you need to build, manage, and scale on Arc Network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Link key={i} href={f.href} className="section-reveal block" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="feature-card h-full group">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5 transition-all duration-300 group-hover:scale-110"
                    style={{ 
                      background: 'rgba(0,240,255,0.08)', 
                      color: '#00F0FF',
                      boxShadow: '0 0 20px rgba(0,240,255,0.05)',
                    }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-light mb-3">{f.title}</h3>
                  <p className="text-sm font-extralight mb-5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {f.desc}
                  </p>
                  <span 
                    className="text-xs font-light px-3 py-1.5 rounded-full self-start"
                    style={{ background: 'rgba(0,240,255,0.08)', color: 'rgba(0,240,255,0.7)' }}
                  >
                    {f.tag}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Recommended Section ═══════════ */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal mb-12">
            <span 
              className="inline-block text-xs font-light tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(0,240,255,0.06)', color: 'rgba(0,240,255,0.6)', border: '1px solid rgba(0,240,255,0.1)' }}
            >
              Try ArcWork on Testnet
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 300, letterSpacing: '-0.02em' }}>
              Get started in <span style={{ color: '#00F0FF' }}>3 steps</span>
            </h2>
            <p className="mt-3 text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Connect your wallet and try each feature on Arc Testnet — powered by USDC.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                step: '1',
                title: 'Mint Achievement',
                desc: 'Claim your first soulbound NFT badge. Non-transferable proof of contribution on-chain.',
                href: '/achievements',
                tag: 'Soulbound NFT',
                icon: '⬡',
              },
              {
                step: '2',
                title: 'Send an Invoice',
                desc: 'Create a USDC invoice with built-in escrow. Set amount, recipient, and settle on-chain.',
                href: '/invoice',
                tag: 'USDC Escrow',
                icon: '◈',
              },
              {
                step: '3',
                title: 'Start a Subscription',
                desc: 'Set up recurring USDC payments. Automatic billing with customizable plans.',
                href: '/subscription',
                tag: 'Recurring Pay',
                icon: '◎',
              },
              {
                step: '4',
                title: 'View Dashboard',
                desc: 'Track all your achievements, invoices, and subscriptions in one unified dashboard.',
                href: '/dashboard',
                tag: 'Overview',
                icon: '⬡',
              },
            ].map((r, i) => (
              <Link key={i} href={r.href} className="section-reveal block" style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="feature-card h-full group">
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-300 group-hover:scale-110"
                      style={{ 
                        background: 'rgba(0,240,255,0.08)', 
                        color: '#00F0FF',
                      }}
                    >
                      {r.icon}
                    </div>
                    <span 
                      className="text-xs font-medium w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,240,255,0.1)', color: '#00F0FF' }}
                    >
                      {r.step}
                    </span>
                  </div>
                  <h4 className="text-sm font-normal mb-2">{r.title}</h4>
                  <p className="text-xs font-extralight mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {r.desc}
                  </p>
                  <span 
                    className="text-[10px] font-light px-2.5 py-1 rounded-full self-start"
                    style={{ background: 'rgba(0,240,255,0.06)', color: 'rgba(0,240,255,0.6)' }}
                  >
                    {r.tag}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Stats Bar ═══════════ */}
      <section 
        className="relative py-24 px-6" 
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          {[
            { label: 'Finality', value: '<1', suffix: 's' },
            { label: 'Platform Fee', value: '0.5', suffix: '%' },
            { label: 'Gas Token', display: 'USDC' },
            { label: 'Network', display: 'Arc Testnet' },
          ].map((s, i) => (
            <div key={i} className="section-reveal text-center" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="text-2xl font-light mb-2 glow-text" style={{ color: '#00F0FF' }}>
                {s.display || (
                  <>
                    {s.value}<span className="text-lg">{s.suffix}</span>
                  </>
                )}
              </div>
              <div className="text-[10px] font-light uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ How It Works ═══════════ */}
      <section className="relative py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="section-reveal text-center mb-16">
            <span 
              className="inline-block text-xs font-light tracking-widest uppercase px-4 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(0,255,136,0.06)', color: 'rgba(0,255,136,0.6)', border: '1px solid rgba(0,255,136,0.1)' }}
            >
              How It Works
            </span>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 40px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
              Three steps to <span style={{ color: '#00F0FF' }}>on-chain workflows</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Connect Wallet', desc: 'Link your wallet to Arc Testnet. Get USDC from the Circle faucet for gas.' },
              { step: '02', title: 'Choose a Tool', desc: 'Create achievements, send invoices, or set up recurring subscriptions.' },
              { step: '03', title: 'Go Live', desc: 'Execute on-chain with sub-second finality. Track everything from your dashboard.' },
            ].map((item, i) => (
              <div key={i} className="section-reveal text-center" style={{ transitionDelay: `${i * 0.15}s` }}>
                <div 
                  className="text-5xl font-extralight mb-4 glow-text"
                  style={{ color: 'rgba(0,240,255,0.2)' }}
                >
                  {item.step}
                </div>
                <h3 className="text-base font-normal mb-3">{item.title}</h3>
                <p className="text-sm font-extralight leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA Section ═══════════ */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: 'radial-gradient(ellipse at center bottom, rgba(0,240,255,0.04) 0%, transparent 60%)',
          }}
        />

        <div className="max-w-2xl mx-auto section-reveal relative z-10">
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, letterSpacing: '-0.03em', lineHeight: '1.2' }}>
            Try <span className="glow-text" style={{ color: '#00F0FF' }}>ArcWork</span> now
          </h2>
          <p className="mt-5 text-sm font-extralight leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Connect your wallet, mint your first achievement badge, send an invoice, or set up a subscription — all on Arc Testnet.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/achievements" className="btn-primary">
              Mint Your First Badge
            </Link>
            <Link href="/invoice" className="btn-ghost">
              Try Invoices
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
