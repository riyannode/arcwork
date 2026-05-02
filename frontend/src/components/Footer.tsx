'use client';

import Link from 'next/link';

export default function Footer() {
  const links = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Achievements', href: '/achievements' },
    { label: 'Invoices', href: '/invoice' },
    { label: 'Subscriptions', href: '/subscription' },
  ];

  const externalLinks = [
    { label: 'Explorer', href: 'https://testnet.arcscan.app' },
    { label: 'Faucet', href: 'https://faucet.circle.com' },
    { label: 'GitHub', href: 'https://github.com/riyannode/arcwork' },
  ];

  return (
    <footer className="relative z-10 py-16 px-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img 
                src="/logo.jpg" 
                alt="ArcWork" 
                className="w-7 h-7 rounded-lg object-cover" 
                style={{ border: '1px solid rgba(0,240,255,0.2)' }} 
              />
              <span className="text-base font-medium" style={{ color: '#00F0FF' }}>ArcWork</span>
            </div>
            <p className="text-xs font-extralight leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              The all-in-one platform for achievements, invoices, and subscriptions on Arc Network — powered by USDC.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Product
            </h4>
            <div className="space-y-2.5">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm font-light transition-colors duration-300 hover:text-[#00F0FF]"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Resources
            </h4>
            <div className="space-y-2.5">
              {externalLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-light transition-colors duration-300 hover:text-[#00F0FF]"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <p className="text-xs font-extralight" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © 2026 ArcWork. Built on Arc Network.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />
              <span className="text-[11px] font-light" style={{ color: 'rgba(0,255,136,0.6)' }}>
                Arc Testnet Live
              </span>
            </div>
            <span className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Chain ID: 5042002
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
