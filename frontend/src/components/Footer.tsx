'use client';

export default function Footer() {
  return (
    <footer className="relative z-10 py-12 px-8" style={{ borderTop: '1.25px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="ArcWork" className="w-6 h-6 rounded-full object-cover" style={{ border: '1px solid rgba(0,240,255,0.2)' }} />
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
