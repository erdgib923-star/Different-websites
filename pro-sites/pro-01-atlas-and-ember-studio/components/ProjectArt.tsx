import type { ArtVariant } from '@/lib/projects';

/**
 * Procedural cover art. Shared lighting rules for every piece on the site:
 *  - one key light from the top-left (highlights at ~25% / 20%)
 *  - shadows fall to the bottom-right, tinted with neutral-950 (never pure black)
 *  - grain overlay at 22% (see .art::after)
 *  - only bone + ember on warm near-black
 */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BG: Record<ArtVariant, [string, string]> = {
  orbit: ['linear-gradient(165deg in oklch, var(--neutral-800), var(--neutral-950) 70%)', 'linear-gradient(165deg, #342c25, #0c0603 70%)'],
  contour: ['linear-gradient(200deg in oklch, var(--accent-800), var(--neutral-950) 75%)', 'linear-gradient(200deg, #5a1d00, #0c0603 75%)'],
  monolith: ['linear-gradient(150deg in oklch, var(--brand-200), var(--brand-500) 90%)', 'linear-gradient(150deg, #cdbfac, #85785f 90%)'],
  weave: ['linear-gradient(170deg in oklch, var(--neutral-900), var(--accent-900) 120%)', 'linear-gradient(170deg, #1f1812, #3d1704 120%)'],
  flare: ['radial-gradient(80% 60% at 30% 25% in oklch, var(--accent-700), var(--neutral-950) 70%)', 'radial-gradient(80% 60% at 30% 25%, #7a2a00, #0c0603 70%)'],
};

export default function ProjectArt({ variant, seed, id }: { variant: ArtVariant; seed: number; id: string }) {
  const r = rng(seed);
  const W = 400,
    H = 500;
  const fid = `distort-${id}`;
  let body: React.ReactNode = null;

  if (variant === 'orbit') {
    const cx = 250, cy = 210;
    body = (
      <>
        {Array.from({ length: 9 }, (_, i) => (
          <circle key={i} cx={cx} cy={cy} r={40 + i * 26} fill="none" stroke="var(--brand-100)" strokeOpacity={0.5 - i * 0.045} strokeWidth={i % 3 === 0 ? 1.4 : 0.7} strokeDasharray={i % 2 ? '2 6' : undefined} />
        ))}
        <ellipse cx={cx + 40} cy={cy + 70} rx={90} ry={30} fill="var(--neutral-950)" opacity={0.55} />
        <circle cx={cx} cy={cy} r={58} fill={`url(#sun-${id})`} />
        {Array.from({ length: 40 }, (_, i) => (
          <circle key={`s${i}`} cx={r() * W} cy={r() * H} r={r() * 1.4 + 0.3} fill="var(--brand-50)" opacity={0.3 + r() * 0.6} />
        ))}
        <circle cx={cx + Math.cos(2.2) * 144} cy={cy + Math.sin(2.2) * 144} r={9} fill="var(--accent-300)" />
      </>
    );
  } else if (variant === 'contour') {
    body = Array.from({ length: 22 }, (_, i) => {
      const y0 = 40 + i * 21;
      const a = 10 + r() * 22, f = 0.012 + r() * 0.01, ph = r() * 6;
      let d = `M -10 ${y0}`;
      for (let x = -10; x <= W + 10; x += 12) d += ` L ${x} ${(y0 + Math.sin(x * f + ph) * a + Math.sin(x * f * 2.3 + i) * a * 0.3).toFixed(1)}`;
      return <path key={i} d={d} fill="none" stroke={i % 5 === 2 ? 'var(--accent-300)' : 'var(--brand-100)'} strokeOpacity={i % 5 === 2 ? 0.95 : 0.35} strokeWidth={i % 5 === 2 ? 1.6 : 0.8} />;
    });
  } else if (variant === 'monolith') {
    const slabs = [70, 160, 250, 320];
    body = (
      <>
        {slabs.map((x, i) => {
          const w = 46 + r() * 30, top = 120 + r() * 140, base = 420;
          return (
            <g key={i}>
              {/* cast shadow to bottom-right */}
              <polygon points={`${x + w},${base} ${x + w + 70},${base + 40} ${x + w + 70},${top + 80} ${x + w},${top}`} fill="var(--neutral-950)" opacity={0.28} />
              <rect x={x} y={top} width={w * 0.62} height={base - top} fill="var(--brand-50)" />
              <rect x={x + w * 0.62} y={top} width={w * 0.38} height={base - top} fill="var(--brand-600)" />
            </g>
          );
        })}
        <rect x={0} y={420} width={W} height={80} fill="var(--brand-700)" opacity={0.5} />
        <circle cx={92} cy={86} r={26} fill="var(--accent-400)" />
      </>
    );
  } else if (variant === 'weave') {
    const cells: React.ReactNode[] = [];
    for (let y = 0; y < 10; y++)
      for (let x = 0; x < 8; x++) {
        const on = (x + y) % 2 === 0;
        cells.push(
          <rect key={`${x}-${y}`} x={x * 50 + 6} y={y * 50 + 6} width={38} height={38} rx={2} fill={on ? 'var(--brand-100)' : 'var(--accent-400)'} opacity={on ? 0.12 + r() * 0.5 : 0.25 + r() * 0.7} transform={`rotate(${on ? 0 : 45} ${x * 50 + 25} ${y * 50 + 25}) scale(1)`} />,
        );
      }
    body = cells;
  } else {
    body = (
      <>
        <rect x={0} y={232} width={W} height={4} fill="var(--accent-200)" opacity={0.7} />
        <rect x={0} y={226} width={W} height={16} fill="var(--accent-400)" opacity={0.18} />
        <circle cx={150} cy={234} r={120} fill={`url(#sun-${id})`} />
        {[30, 55, 90].map((rr, i) => (
          <circle key={i} cx={150 + i * 70} cy={234} r={rr / 3 + 6} fill="none" stroke="var(--brand-100)" strokeOpacity={0.35} />
        ))}
        <circle cx={150} cy={234} r={14} fill="var(--brand-50)" />
      </>
    );
  }

  const [bg, fallback] = BG[variant];
  return (
    <div className="art" style={{ ['--art-bg' as string]: bg, ['--art-fallback' as string]: fallback }} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`sun-${id}`}>
            <stop offset="0%" style={{ stopColor: 'var(--accent-100)' }} />
            <stop offset="35%" style={{ stopColor: 'var(--accent-400)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent-700)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id={`key-${id}`} cx="25%" cy="20%" r="70%">
            <stop offset="0%" style={{ stopColor: 'var(--brand-50)', stopOpacity: 0.16 }} />
            <stop offset="100%" style={{ stopColor: 'var(--brand-50)', stopOpacity: 0 }} />
          </radialGradient>
          <filter id={fid} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011 0.024" numOctaves={2} seed={seed} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={0} xChannelSelector="R" yChannelSelector="G" data-distort="" />
          </filter>
        </defs>
        <g filter={`url(#${fid})`}>{body}</g>
        <rect width={W} height={H} fill={`url(#key-${id})`} />
      </svg>
    </div>
  );
}
