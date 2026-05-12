'use client';

import ArcMark from '@/components/ArcMark';

/**
 * HexGrid3D — honeycomb tech grid with perspective rotation and the ArcMark
 * logo at the center core. Entirely SVG + CSS 3D transforms, no WebGL needed.
 *
 * Layout: 5 rings of hex cells around the central logo. Each ring is rotated
 * on a different axis, producing the feel of a spinning orbital mesh. Some
 * cells pulse gold (active contracts), others stay muted (idle slots).
 */

type HexCell = {
  q: number; // axial coordinate
  r: number;
  depth: number; // z-translate
  active: boolean;
  delay: number;
};

const HEX_SIZE = 28; // flat-to-flat radius in px
const SQRT3 = Math.sqrt(3);

/** Generate honeycomb of axial coordinates within radius N. */
function buildRings(radius: number): HexCell[] {
  const cells: HexCell[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r;
      if (Math.abs(s) > radius) continue;
      if (q === 0 && r === 0) continue; // skip center (logo goes there)
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      cells.push({
        q,
        r,
        depth: (ring - 2) * 20 + (Math.sin(q * 2.3 + r * 1.7) * 14),
        active: ring === 2 ? (q + r) % 2 === 0 : Math.abs(q * r) === 2,
        delay: (Math.abs(q) + Math.abs(r)) * 0.15 + (q + r) * 0.05,
      });
    }
  }
  return cells;
}

const cells = buildRings(3);

/** Axial to pixel (pointy-top). */
function axialToXY(q: number, r: number) {
  const x = HEX_SIZE * SQRT3 * (q + r / 2);
  const y = HEX_SIZE * 1.5 * r;
  return { x, y };
}

/** Pointy-top hex SVG path for size s. */
function hexPath(s: number) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push(`${(s * Math.cos(a)).toFixed(2)},${(s * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}

const HEX_D = hexPath(HEX_SIZE * 0.92);

export default function HexGrid3D() {
  return (
    <div
      className="relative h-full w-full flex items-center justify-center select-none"
      style={{ perspective: '1400px' }}
      aria-hidden="true"
    >
      {/* Rotating 3D stage */}
      <div className="hex-stage relative" style={{ width: 640, height: 640 }}>
        {/* Back dark vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(closest-side, rgba(197,166,124,0.08) 0%, rgba(5,5,5,0) 72%)',
            transform: 'translateZ(-120px)',
          }}
        />

        {/* SVG honeycomb (centered) */}
        <svg
          viewBox="-300 -300 600 600"
          className="absolute inset-0 h-full w-full"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <defs>
            <linearGradient id="hexStroke" x1="0" y1="-30" x2="0" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#EAE4D8" stopOpacity="0.45" />
              <stop offset="1" stopColor="#C5A67C" stopOpacity="0.18" />
            </linearGradient>
            <linearGradient id="hexActive" x1="0" y1="-30" x2="0" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#EAE4D8" stopOpacity="0.9" />
              <stop offset="1" stopColor="#C5A67C" stopOpacity="0.7" />
            </linearGradient>
            <filter id="hexGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {cells.map((c) => {
            const { x, y } = axialToXY(c.q, c.r);
            return (
              <g
                key={`${c.q}-${c.r}`}
                transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
                className={c.active ? 'hex-active' : 'hex-idle'}
                style={{ animationDelay: `${c.delay}s` }}
              >
                <path
                  d={HEX_D}
                  fill={c.active ? 'rgba(197, 166, 124, 0.1)' : 'rgba(10, 10, 10, 0.6)'}
                  stroke={c.active ? 'url(#hexActive)' : 'url(#hexStroke)'}
                  strokeWidth={c.active ? 1.1 : 0.55}
                  filter={c.active ? 'url(#hexGlow)' : undefined}
                />
                {c.active && (
                  <circle
                    cx="0"
                    cy="0"
                    r="2"
                    fill="#EAE4D8"
                    filter="url(#hexGlow)"
                    className="hex-core-dot"
                  />
                )}
              </g>
            );
          })}

          {/* Subtle outer boundary ring */}
          <circle
            cx="0"
            cy="0"
            r="240"
            fill="none"
            stroke="rgba(197, 166, 124, 0.16)"
            strokeWidth="0.6"
            strokeDasharray="1 4"
          />
          <circle
            cx="0"
            cy="0"
            r="190"
            fill="none"
            stroke="rgba(234, 228, 216, 0.08)"
            strokeWidth="0.4"
          />
        </svg>

        {/* Central core — ArcMark logo, slowly counter-rotating */}
        <div
          className="hex-core absolute left-1/2 top-1/2 flex items-center justify-center"
          style={{
            width: 300,
            height: 300,
            transform: 'translate(-50%, -50%) translateZ(110px)',
          }}
        >
          {/* Inner hex cell behind logo */}
          <svg viewBox="-80 -80 160 160" className="absolute inset-0 h-full w-full">
            <defs>
              <radialGradient id="coreFill" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="#0a0a0a" stopOpacity="1" />
                <stop offset="0.7" stopColor="#050505" stopOpacity="0.98" />
                <stop offset="1" stopColor="#050505" stopOpacity="0.92" />
              </radialGradient>
              <filter id="coreGlowStrong" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d={hexPath(72)}
              fill="url(#coreFill)"
              stroke="rgba(197, 166, 124, 0.95)"
              strokeWidth="1.8"
              filter="url(#coreGlowStrong)"
            />
            <path
              d={hexPath(64)}
              fill="none"
              stroke="rgba(234, 228, 216, 0.5)"
              strokeWidth="0.7"
              strokeDasharray="2 3"
              className="hex-core-ring"
            />
            <path
              d={hexPath(54)}
              fill="none"
              stroke="rgba(197, 166, 124, 0.3)"
              strokeWidth="0.5"
            />
          </svg>
          <div className="relative z-10 hex-core-logo">
            <ArcMark size={140} />
          </div>
        </div>

        {/* Scan ring — soft animated equator */}
        <div className="hex-scan absolute left-1/2 top-1/2" style={{ transform: 'translate(-50%, -50%)' }}>
          <svg width="540" height="540" viewBox="-270 -270 540 540">
            <ellipse
              cx="0"
              cy="0"
              rx="240"
              ry="46"
              fill="none"
              stroke="rgba(184, 205, 126, 0.35)"
              strokeWidth="0.8"
              strokeDasharray="3 5"
            />
          </svg>
        </div>
      </div>

      {/* Local styles — keep HexGrid self-contained */}
      <style jsx>{`
        .hex-stage {
          transform-style: preserve-3d;
          animation: hex-orbit 28s linear infinite;
          will-change: transform;
        }
        @keyframes hex-orbit {
          0%   { transform: rotateX(-28deg) rotateY(0deg); }
          100% { transform: rotateX(-28deg) rotateY(360deg); }
        }
        .hex-core {
          transform-style: preserve-3d;
          animation: hex-core-spin 28s linear infinite;
        }
        @keyframes hex-core-spin {
          0%   { transform: translate(-50%, -50%) translateZ(110px) rotateY(0deg); }
          100% { transform: translate(-50%, -50%) translateZ(110px) rotateY(-360deg); }
        }
        .hex-core-logo {
          animation: hex-core-breathe 3.6s ease-in-out infinite;
        }
        @keyframes hex-core-breathe {
          0%, 100% { transform: scale(1);   filter: drop-shadow(0 0 14px rgba(197,166,124,0.7)) drop-shadow(0 0 28px rgba(234,228,216,0.25)); }
          50%      { transform: scale(1.08); filter: drop-shadow(0 0 28px rgba(197,166,124,1)) drop-shadow(0 0 48px rgba(234,228,216,0.45)); }
        }
        .hex-core-ring {
          transform-origin: center;
          animation: hex-ring-rotate 18s linear infinite;
        }
        @keyframes hex-ring-rotate { to { transform: rotate(360deg); } }
        .hex-active {
          animation: hex-pulse 3.6s ease-in-out infinite;
        }
        @keyframes hex-pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1;    }
        }
        .hex-core-dot {
          animation: hex-dot-pulse 2.2s ease-in-out infinite;
        }
        @keyframes hex-dot-pulse {
          0%, 100% { opacity: 0.5; }
          50%      { opacity: 1;   }
        }
        .hex-scan {
          animation: hex-scan-rotate 24s linear infinite;
        }
        @keyframes hex-scan-rotate {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .hex-idle { opacity: 0.38; }
        @media (prefers-reduced-motion: reduce) {
          .hex-stage, .hex-core, .hex-core-logo, .hex-core-ring,
          .hex-active, .hex-core-dot, .hex-scan {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
