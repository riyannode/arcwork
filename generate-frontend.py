#!/usr/bin/env python3
"""
ArcWork Frontend Redesign — Qwen3-Coder Batch Generator
Vertex Design System: https://github.com/riyannode/arcwork
"""
import json
import urllib.request
import os
import time
import re

QWEN_URL = "http://134.199.199.229:8000/v1/chat/completions"
MODEL = "Qwen/Qwen3-Coder-30B-A3B-Instruct"
BASE = "/root/arcwork/frontend"

# Contract addresses (deployed on Arc Testnet)
CONTRACTS = {
    "USDC": "0x3600000000000000000000000000000000000000",
    "ACHIEVEMENT": "0x52138F4C77e53805CaaeD0D2e39292EC312C8440",
    "INVOICE": "0x1Eb2Ed241Cb978f4BF02DA68E128D50AD7A53Fbf",
    "SUBSCRIPTION": "0x01028Ca35bE5c3dcE85F661C6528138bc3Ad9Fc1",
}

DESIGN_SPEC = """
=== VERTEX DESIGN SYSTEM (MANDATORY) ===
Colors:
  - background: #000000
  - surface: #010A04
  - primary/accent: #00F0FF (cyan)
  - tertiary: #0A45FF
  - text-primary: #FFFFFF
  - text-secondary: #888888
  - border: rgba(255,255,255,0.12)

Typography (Inter font family):
  - display-lg: 96px, weight 300, line-height 96px, letter-spacing -0.05em
  - body-md: 16px, weight 200, line-height 24px
  - label-md: 14px, weight 300, line-height 20px

Layout:
  - Grid system, base spacing 8px
  - Scale: 1px, 8px, 12px, 14px, 16px, 24px, 28px, 32px
  - Section padding: 32px, 84px
  - Content width: max-w-7xl bounded

Glass Surface (cards, panels):
  - Background: rgba(1,10,4,0.6)
  - Border: 1.25px gradient shell (white to gray)
  - Blur: 12px backdrop-blur
  - Corner radius: 9999px (full pill) for cards
  - Box shadow: inset highlights + outer depth
  - Use this CSS class for all glass cards:
    .glass-card {
      background: rgba(1,10,4,0.6);
      backdrop-filter: blur(12px);
      border: 1.25px solid rgba(255,255,255,0.12);
      border-radius: 9999px;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.5);
    }

Buttons:
  - Primary: bg #00F0FF, text #000000, radius 9999px, padding 8px 24px
  - Label font: 14px, weight 300

Motion:
  - Duration: 300ms
  - Easing: cubic-bezier(0.4, 0, 0.2, 1)
  - Hover: text color + transform scale
  - Scroll: section reveals on scroll (use IntersectionObserver for simplicity)

WebGL Background:
  - Fixed full-bleed canvas behind all content
  - Dot-matrix particle field, black/greenish tint
  - Slow breathing pulse animation
  - Pointer-reactive subtle drift
  - Use Three.js with ShaderMaterial
"""

FILES = {}

# ============================================================
# 1. GLOBAL CSS
# ============================================================
FILES["src/app/globals.css"] = f"""@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700&display=swap');

:root {{
  --bg: #000000;
  --surface: #010A04;
  --primary: #00F0FF;
  --tertiary: #0A45FF;
  --text-primary: #FFFFFF;
  --text-secondary: #888888;
  --border: rgba(255,255,255,0.12);
}}

* {{
  box-sizing: border-box;
}}

body {{
  font-family: 'Inter', sans-serif;
  background: var(--bg);
  color: var(--text-primary);
  min-height: 100vh;
  overflow-x: hidden;
}}

/* Glass Card System */
.glass-card {{
  background: rgba(1,10,4,0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.25px solid var(--border);
  border-radius: 9999px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.5);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}}

.glass-card:hover {{
  border-color: rgba(0,240,255,0.3);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(0,240,255,0.1);
  transform: translateY(-2px);
}}

/* Glass Panel (less rounded, for nav) */
.glass-panel {{
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1.25px solid var(--border);
  border-radius: 16px;
}}

/* Primary Button */
.btn-primary {{
  background: var(--primary);
  color: #000000;
  border: none;
  border-radius: 9999px;
  padding: 8px 24px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 300;
  cursor: pointer;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}}

.btn-primary:hover {{
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(0,240,255,0.4);
}}

/* Section Reveal Animation */
.section-reveal {{
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1), transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
}}

.section-reveal.visible {{
  opacity: 1;
  transform: translateY(0);
}}

/* Glow Text */
.glow-text {{
  text-shadow: 0 0 20px rgba(0,240,255,0.5), 0 0 40px rgba(0,240,255,0.2);
}}

/* Scrollbar */
::-webkit-scrollbar {{
  width: 6px;
}}
::-webkit-scrollbar-track {{
  background: #000;
}}
::-webkit-scrollbar-thumb {{
  background: rgba(0,240,255,0.3);
  border-radius: 9999px;
}}

/* Gradient border shell for cards */
.gradient-border-shell {{
  padding: 1.25px;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
}}
"""

# ============================================================
# 2. LAYOUT (root layout)
# ============================================================
FILES["src/app/layout.tsx"] = f"""'use client';

import type {{ Metadata }} from 'next';
import {{ Inter }} from 'next/font/google';
import './globals.css';
import {{ WagmiProvider }} from 'wagmi';
import {{ QueryClient, QueryClientProvider }} from '@tanstack/react-query';
import {{ config }} from '@/lib/wagmi';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WebGLBackground from '@/components/WebGLBackground';

const inter = Inter({{ subsets: ['latin'], weight: ['200','300','400','500','600','700'] }});
const queryClient = new QueryClient();

export default function RootLayout({{
  children,
}}: {{
  children: React.ReactNode;
}}) {{
  return (
    <html lang="en">
      <body className={{inter.className}} style={{{{ background: '#000000', color: '#FFFFFF' }}}}>
        <WebGLBackground />
        <WagmiProvider config={{config}}>
          <QueryClientProvider client={{queryClient}}>
            <div className="relative z-10 min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{{children}}</main>
              <Footer />
            </div>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}}
"""

# ============================================================
# 3. WEBGL BACKGROUND COMPONENT
# ============================================================
FILES["src/components/WebGLBackground.tsx"] = """'use client';

import { useEffect, useRef } from 'react';

export default function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let mouseX = 0, mouseY = 0;
    let time = 0;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
    if (!gl) return;

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader — dot-matrix particle field with breathing pulse
    const fsSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 mouse = u_mouse / u_resolution;

        // Grid spacing for dot matrix
        float gridSize = 40.0;
        vec2 grid = floor(uv * gridSize);
        vec2 gridUv = fract(uv * gridSize) - 0.5;

        // Distance from center of each grid cell
        float dist = length(gridUv);

        // Breathing pulse
        float pulse = 0.5 + 0.5 * sin(u_time * 0.3 + noise(grid * 0.1) * 6.28);

        // Mouse influence — subtle drift
        float mouseInfluence = 1.0 - smoothstep(0.0, 0.4, length(grid / gridSize - mouse));
        pulse += mouseInfluence * 0.3;

        // Dot visibility
        float dotRadius = 0.08 + pulse * 0.04;
        float dot = 1.0 - smoothstep(dotRadius - 0.02, dotRadius + 0.02, dist);

        // Color: greenish-cyan tint
        vec3 color = vec3(0.0, 0.08, 0.04) * dot * (0.3 + pulse * 0.7);
        // Add subtle cyan accent near mouse
        color += vec3(0.0, 0.6, 0.64) * dot * mouseInfluence * 0.15;

        // Depth fade from edges
        float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5));
        color *= vignette;

        // Alpha for compositing
        float alpha = length(color) * 1.5;

        gl_FragColor = vec4(color, alpha);
      }
    `;

    function createShader(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Full-screen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + 'px';
      canvas!.style.height = window.innerHeight + 'px';
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize);

    function onMouseMove(e: MouseEvent) {
      const dpr = Math.min(window.devicePixelRatio, 2);
      mouseX = e.clientX * dpr;
      mouseY = (window.innerHeight - e.clientY) * dpr; // Flip Y for GL
    }
    window.addEventListener('mousemove', onMouseMove);

    function render() {
      time += 0.016;
      gl!.enable(gl!.BLEND);
      gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, time);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, mouseX, mouseY);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: '#010A04' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}
"""

# ============================================================
# 4. NAVBAR
# ============================================================
FILES["src/components/Navbar.tsx"] = """'use client';

import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { shortenAddress } from '@/lib/contracts';
import { useState } from 'react';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/achievements', label: 'Achievements' },
    { href: '/invoice', label: 'Invoices' },
    { href: '/subscription', label: 'Subscriptions' },
  ];

  return (
    <nav className="sticky top-0 z-50 glass-panel" style={{ borderRadius: 0, borderBottom: '1.25px solid rgba(255,255,255,0.12)' }}>
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
               style={{ background: '#00F0FF', color: '#000' }}>
            A
          </div>
          <span className="text-lg font-light tracking-tight"
                style={{ color: '#00F0FF' }}>
            ArcWork
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-light transition-colors duration-300"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00F0FF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-4">
          {isConnected ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-light px-4 py-2 rounded-full"
                    style={{ background: 'rgba(0,240,255,0.1)', color: '#00F0FF', border: '1px solid rgba(0,240,255,0.2)' }}>
                {shortenAddress(address || '')}
              </span>
              <button
                onClick={() => disconnect()}
                className="text-xs font-light px-4 py-2 rounded-full transition-all duration-300"
                style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,100,100,0.5)'; e.currentTarget.style.color = '#ff6464'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="btn-primary"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
"""

# ============================================================
# 5. FOOTER
# ============================================================
FILES["src/components/Footer.tsx"] = """'use client';

export default function Footer() {
  return (
    <footer className="relative z-10 py-12 px-8" style={{ borderTop: '1.25px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
               style={{ background: '#00F0FF', color: '#000' }}>
            A
          </div>
          <span className="text-sm font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            ArcWork — Built on Arc Network
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
             className="text-xs font-light transition-colors duration-300"
             style={{ color: 'rgba(255,255,255,0.4)' }}
             onMouseEnter={(e) => (e.currentTarget.style.color = '#00F0FF')}
             onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            Explorer
          </a>
          <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
             className="text-xs font-light transition-colors duration-300"
             style={{ color: 'rgba(255,255,255,0.4)' }}
             onMouseEnter={(e) => (e.currentTarget.style.color = '#00F0FF')}
             onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            Faucet
          </a>
        </div>
      </div>
    </footer>
  );
}
"""

# ============================================================
# 6. HOME PAGE (Hero)
# ============================================================
FILES["src/app/page.tsx"] = """'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

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
    },
    {
      title: 'Invoices',
      desc: 'Create, send, and settle USDC invoices with built-in escrow. 0.5% platform fee.',
      icon: '◈',
      href: '/invoice',
    },
    {
      title: 'Subscriptions',
      desc: 'Recurring USDC payments with automatic billing. Set it and forget it.',
      icon: '◎',
      href: '/subscription',
    },
  ];

  return (
    <div className="relative">
      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="section-reveal visible">
            <p className="text-sm font-light mb-6 tracking-widest uppercase"
               style={{ color: 'rgba(0,240,255,0.6)' }}>
              Arc Network · Testnet
            </p>
            <h1 style={{
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 300,
              lineHeight: '1',
              letterSpacing: '-0.05em',
            }}>
              <span style={{ color: '#FFFFFF' }}>Build </span>
              <span className="glow-text" style={{ color: '#00F0FF' }}>workflows</span>
              <br />
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>on programmable money.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base font-extralight leading-relaxed"
               style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '24px' }}>
              ArcWork is the all-in-one platform for achievements, invoices, and subscriptions
              on Arc Network — powered by USDC with sub-second finality.
            </p>
            <div className="mt-12 flex items-center gap-4">
              <Link href="/dashboard" className="btn-primary inline-block">
                Open Dashboard
              </Link>
              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer"
                 className="text-sm font-light px-6 py-2 rounded-full transition-all duration-300"
                 style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.12)' }}
                 onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,240,255,0.3)'; e.currentTarget.style.color = '#00F0FF'; }}
                 onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                Get Testnet USDC
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="section-reveal mb-16">
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
              Three primitives. One network.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Link key={i} href={f.href} className="section-reveal">
                <div className="glass-card p-8 h-full">
                  <div className="text-3xl mb-4" style={{ color: '#00F0FF' }}>{f.icon}</div>
                  <h3 className="text-lg font-light mb-3" style={{ color: '#FFFFFF' }}>{f.title}</h3>
                  <p className="text-sm font-extralight leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {f.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-24 px-8" style={{ borderTop: '1.25px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { label: 'Chain', value: 'Arc Testnet' },
            { label: 'Gas Token', value: 'USDC' },
            { label: 'Finality', value: '<1 second' },
            { label: 'Fee', value: '0.5%' },
          ].map((s, i) => (
            <div key={i} className="section-reveal text-center">
              <div className="text-2xl font-light mb-2" style={{ color: '#00F0FF' }}>{s.value}</div>
              <div className="text-xs font-light uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
"""

# ============================================================
# 7. DASHBOARD PAGE
# ============================================================
FILES["src/app/dashboard/page.tsx"] = """'use client';

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { CONTRACTS, USDC_ABI, ACHIEVEMENT_ABI, INVOICE_ABI, SUBSCRIPTION_ABI, shortenAddress } from '@/lib/contracts';
import { useReadContract } from 'wagmi';
import Link from 'next/link';

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-4xl mb-6" style={{ color: '#00F0FF' }}>⬡</div>
          <h2 className="text-2xl font-light mb-4">Connect Wallet</h2>
          <p className="text-sm font-extralight mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect your wallet to access the ArcWork dashboard on Arc Testnet.
          </p>
        </div>
      </div>
    );
  }

  const sections = [
    { title: 'Achievements', desc: 'View your soulbound badges', href: '/achievements', icon: '⬡', color: '#00F0FF' },
    { title: 'Invoices', desc: 'Create & manage USDC invoices', href: '/invoice', icon: '◈', color: '#00F0FF' },
    { title: 'Subscriptions', desc: 'Recurring payment plans', href: '/subscription', icon: '◎', color: '#00F0FF' },
  ];

  return (
    <div className="relative py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-light tracking-widest uppercase mb-3" style={{ color: 'rgba(0,240,255,0.6)' }}>
            Dashboard
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
            Welcome back
          </h1>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {shortenAddress(address || '')} · Arc Testnet
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((s, i) => (
            <Link key={i} href={s.href} className="group">
              <div className="glass-card p-8 h-full transition-all duration-300">
                <div className="text-3xl mb-4" style={{ color: s.color }}>{s.icon}</div>
                <h3 className="text-lg font-light mb-2">{s.title}</h3>
                <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.desc}</p>
                <div className="mt-6 text-xs font-light transition-colors duration-300"
                     style={{ color: 'rgba(255,255,255,0.3)' }}>
                  <span className="group-hover:text-[#00F0FF] transition-colors duration-300">Open →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Network Info */}
        <div className="mt-12 glass-card p-8">
          <h3 className="text-sm font-light mb-4 uppercase tracking-widest" style={{ color: 'rgba(0,240,255,0.6)' }}>
            Network
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <div className="font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>Chain</div>
              <div className="font-light mt-1">Arc Testnet</div>
            </div>
            <div>
              <div className="font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>Chain ID</div>
              <div className="font-light mt-1">5042002</div>
            </div>
            <div>
              <div className="font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>USDC</div>
              <div className="font-light mt-1 text-xs">{CONTRACTS.USDC}</div>
            </div>
            <div>
              <div className="font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>Explorer</div>
              <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer"
                 className="font-light mt-1 block transition-colors duration-300"
                 style={{ color: '#00F0FF' }}>ArcScan →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"""

# ============================================================
# 8. ACHIEVEMENTS PAGE
# ============================================================
FILES["src/app/achievements/page.tsx"] = """'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';
import { CONTRACTS, shortenAddress } from '@/lib/contracts';

const BADGE_TYPES = [
  { id: 0, name: 'First Transaction', desc: 'Complete your first tx on Arc', icon: '⬡' },
  { id: 1, name: 'Bridge USDC', desc: 'Bridge USDC to Arc Network', icon: '◈' },
  { id: 2, name: 'Deploy Contract', desc: 'Deploy your first smart contract', icon: '◎' },
  { id: 3, name: 'Refer Friends', desc: 'Refer a friend to ArcWork', icon: '⬢' },
  { id: 4, name: 'Complete Invoice', desc: 'Complete your first invoice cycle', icon: '◇' },
];

export default function Achievements() {
  const { address, isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-4xl mb-6" style={{ color: '#00F0FF' }}>⬡</div>
          <h2 className="text-2xl font-light mb-4">Connect Wallet</h2>
          <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect your wallet to view achievements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-light tracking-widest uppercase mb-3" style={{ color: 'rgba(0,240,255,0.6)' }}>
            Achievements
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
            Soulbound Badges
          </h1>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Non-transferable NFT badges for on-chain milestones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BADGE_TYPES.map((badge) => (
            <div key={badge.id} className="glass-card p-8 text-center">
              <div className="text-4xl mb-4" style={{ color: '#00F0FF' }}>{badge.icon}</div>
              <h3 className="text-base font-light mb-2">{badge.name}</h3>
              <p className="text-xs font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>{badge.desc}</p>
              <div className="mt-4 text-xs font-light px-4 py-1 rounded-full inline-block"
                   style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
                Not earned
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
"""

# ============================================================
# 9. INVOICE PAGE
# ============================================================
FILES["src/app/invoice/page.tsx"] = """'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';
import { CONTRACTS, shortenAddress } from '@/lib/contracts';

export default function InvoicePage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<'create' | 'view'>('create');

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-4xl mb-6" style={{ color: '#00F0FF' }}>◈</div>
          <h2 className="text-2xl font-light mb-4">Connect Wallet</h2>
          <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect your wallet to manage invoices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-24 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-light tracking-widest uppercase mb-3" style={{ color: 'rgba(0,240,255,0.6)' }}>
            Invoices
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
            USDC Invoices
          </h1>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Create, pay, and manage invoices with USDC escrow. 0.5% fee.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8">
          {(['create', 'view'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-2 rounded-full text-sm font-light transition-all duration-300"
              style={{
                background: tab === t ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.03)',
                color: tab === t ? '#00F0FF' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${tab === t ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {t === 'create' ? 'Create Invoice' : 'View Invoices'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <div className="glass-card p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-light mb-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Client Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full px-4 py-3 rounded-full text-sm font-light outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                />
              </div>
              <div>
                <label className="block text-xs font-light mb-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-full text-sm font-light outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                />
              </div>
              <div>
                <label className="block text-xs font-light mb-2 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Invoice for..."
                  className="w-full px-4 py-3 rounded-full text-sm font-light outline-none"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                />
              </div>
              <button className="btn-primary w-full mt-4">
                Create Invoice
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No invoices yet. Create one to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
"""

# ============================================================
# 10. SUBSCRIPTION PAGE
# ============================================================
FILES["src/app/subscription/page.tsx"] = """'use client';

import { useAccount } from 'wagmi';
import { useState } from 'react';
import { CONTRACTS, shortenAddress } from '@/lib/contracts';

export default function SubscriptionPage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<'plans' | 'my'>('plans');

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8">
        <div className="glass-card p-12 text-center max-w-md">
          <div className="text-4xl mb-6" style={{ color: '#00F0FF' }}>◎</div>
          <h2 className="text-2xl font-light mb-4">Connect Wallet</h2>
          <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Connect your wallet to manage subscriptions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative py-24 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="text-xs font-light tracking-widest uppercase mb-3" style={{ color: 'rgba(0,240,255,0.6)' }}>
            Subscriptions
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, letterSpacing: '-0.03em' }}>
            Recurring Payments
          </h1>
          <p className="mt-3 text-sm font-light" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Create subscription plans and manage recurring USDC payments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8">
          {(['plans', 'my'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-6 py-2 rounded-full text-sm font-light transition-all duration-300"
              style={{
                background: tab === t ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.03)',
                color: tab === t ? '#00F0FF' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${tab === t ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {t === 'plans' ? 'Browse Plans' : 'My Subscriptions'}
            </button>
          ))}
        </div>

        {tab === 'plans' ? (
          <div className="glass-card p-12 text-center">
            <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No subscription plans available yet.
            </p>
            <p className="text-xs font-extralight mt-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Create the first plan on Arc Network.
            </p>
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <p className="text-sm font-extralight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              You have no active subscriptions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
"""

# ============================================================
# GENERATE ALL FILES
# ============================================================
def generate_file(path, content):
    full_path = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f"  ✅ {path} ({len(content)} bytes)")

def main():
    print("🎨 ArcWork Frontend Redesign — Vertex Design System")
    print(f"📂 Output: {BASE}")
    print(f"📝 Files: {len(FILES)}")
    print()

    for path, content in FILES.items():
        generate_file(path, content)

    print()
    print("✅ All files generated!")
    print()
    print("Next steps:")
    print("  cd /root/arcwork/frontend && npm run build")
    print("  pm2 restart arcwork-fe (or npm run dev -- -p 3080)")

if __name__ == "__main__":
    main()
