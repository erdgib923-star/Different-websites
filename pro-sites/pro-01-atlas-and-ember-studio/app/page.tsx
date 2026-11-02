import Reveals from '@/components/Reveals';
import Magnetic from '@/components/Magnetic';
import TLink from '@/components/TLink';
import HorizontalGallery from '@/components/HorizontalGallery';
import Marquee from '@/components/Marquee';
import ScrollBadge from '@/components/ScrollBadge';
import Media from '@/components/Media';
import ProjectArt from '@/components/ProjectArt';

const services = [
  { n: '01', t: 'Identity', d: 'Names, marks, voice and the rules that hold them together.', items: ['Strategy', 'Logo & type', 'Guidelines'] },
  { n: '02', t: 'Motion', d: 'Brands that move with intent: one light source, one easing curve.', items: ['Motion systems', 'Launch films', 'UI motion'] },
  { n: '03', t: 'Spatial', d: 'Signage, exhibitions and rooms that explain themselves.', items: ['Wayfinding', 'Exhibitions', 'Retail'] },
  { n: '04', t: 'Digital', d: 'Websites and products built on the same tokens as the print.', items: ['Design systems', 'Web', 'Product UI'] },
];

// Fictional studio figures (sample data)
const stats = [
  { v: '62', l: 'launches since 2012' },
  { v: '9', l: 'people around one table' },
  { v: '14', l: 'cities with our signage' },
  { v: '0', l: 'account managers' },
];

export default function Home() {
  return (
    <Reveals>
      {/* ---------- hero ---------- */}
      <section className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden pt-32 pb-12 md:pb-16" aria-labelledby="hero-title">
        <div aria-hidden="true" className="ember-field absolute inset-0 -z-20" />
        {/* parallax layer pair: glow drifts slower than the orbit lines */}
        <div aria-hidden="true" data-speed="-0.35" className="absolute -top-[10%] right-[-20%] -z-10 aspect-square w-[85vw] max-w-[1100px] rounded-full opacity-90" style={{ background: 'var(--glow)' }} />
        <svg aria-hidden="true" data-speed="0.25" viewBox="0 0 600 600" className="absolute top-[8%] right-[-12%] -z-10 w-[min(90vw,820px)] opacity-60">
          {Array.from({ length: 7 }, (_, i) => (
            <circle key={i} cx="300" cy="300" r={60 + i * 38} fill="none" stroke="var(--brand-200)" strokeOpacity={0.32 - i * 0.035} strokeDasharray={i % 2 ? '1 7' : undefined} />
          ))}
          <circle cx="300" cy="300" r="34" fill="var(--accent)" />
        </svg>

        <div className="wrap w-full">
          <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-muted" data-fade>
            <span className="label">Independent studio</span>
            <span className="label">Port Calder</span>
            <span className="label">Est. 2012</span>
          </div>
          <h1 id="hero-title" className="display max-w-[11ch] text-[clamp(3.4rem,13vw,12.5rem)]" data-split="intro">
            We build brands that hold their heat.
          </h1>
          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,34rem)_1fr] md:items-end">
            <p className="text-lg text-muted md:text-xl" data-fade>
              Identity, motion and spatial design for organisations that would rather be remembered than noticed.
            </p>
            <div className="flex flex-wrap items-center gap-4 md:justify-end" data-fade>
              <Magnetic>
                <TLink href="/#work" className="btn" data-cursor="Go">
                  See selected work <span aria-hidden="true">↓</span>
                </TLink>
              </Magnetic>
              <Magnetic>
                <TLink href="/about/" className="btn btn--ghost">
                  Meet the studio
                </TLink>
              </Magnetic>
            </div>
          </div>
        </div>
        <div className="absolute right-[var(--gutter)] bottom-[38%] hidden md:block">
          <ScrollBadge text="Booking projects for 2027 · Booking projects for 2027 · " />
        </div>
      </section>

      {/* ---------- statement: words light up with scroll ---------- */}
      <section className="wrap py-28 md:py-44" aria-label="Studio statement">
        <p className="label mb-8 text-accent" data-fade>
          The studio
        </p>
        <p className="display max-w-[22ch] text-[clamp(2rem,5.2vw,4.75rem)] leading-[1.02]" data-scrub-words>
          We are nine designers, writers and engineers. We take quiet organisations, give them a voice that carries, then build the systems that keep it steady long after launch.
        </p>
      </section>

      <HorizontalGallery />

      <Marquee />

      {/* ---------- services: staggered pop-in cards ---------- */}
      <section className="wrap py-28 md:py-40" aria-labelledby="services-title">
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="label text-accent" data-fade>
              What we do
            </p>
            <h2 id="services-title" className="display mt-4 text-[clamp(2.5rem,5.5vw,5rem)]" data-split="scroll">
              Four crafts, one fire
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.n} data-pop className="group rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent md:p-8">
                <p className="label text-accent">{s.n}</p>
                <h3 className="display mt-6 text-4xl">{s.t}</h3>
                <p className="mt-3 text-muted">{s.d}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {s.items.map((i) => (
                    <li key={i} className="label rounded-full bg-surface-2 px-3 py-1.5 text-text">
                      {i}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- bone "paper" band: stat cards pop at their scroll positions ---------- */}
      <section className="paper relative overflow-hidden py-24 md:py-36" aria-labelledby="numbers-title">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="numbers-title" className="display max-w-[12ch] text-[clamp(2.5rem,6vw,5.5rem)]" data-split="scroll">
              Small studio, long fuse
            </h2>
            <p className="label text-ink-muted">Sample figures · fictional studio</p>
          </div>
          <ul className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s, i) => (
              <li key={s.l} data-pop className="rounded-2xl border border-ink/15 p-6 md:p-8" style={{ marginTop: `${(i % 2) * 2.5}rem` }}>
                <p className="display text-[clamp(3.5rem,8vw,7rem)] leading-none">{s.v}</p>
                <p className="mt-4 text-ink-muted">{s.l}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- studio teaser: clip-path media reveal ---------- */}
      <section className="wrap grid gap-10 py-28 md:grid-cols-2 md:items-center md:py-40" aria-labelledby="teaser-title">
        <Media slot="home-studio" ratio="5 / 4" alt="Abstract woven artwork standing in for a studio photograph" clip="left" tint="bone">
          <ProjectArt variant="weave" seed={41} id="home-studio" />
        </Media>
        <div>
          <p className="label text-accent" data-fade>
            Inside the studio
          </p>
          <h2 id="teaser-title" className="display mt-4 text-[clamp(2.5rem,5vw,4.5rem)]" data-split="scroll">
            One long table, no account managers
          </h2>
          <p className="mt-6 max-w-prose text-muted" data-fade>
            The people you meet in the first workshop are the people who make the work. That is the whole business model.
          </p>
          <div className="mt-8" data-fade>
            <TLink href="/about/" className="btn btn--ghost" data-cursor="Read">
              How we work <span aria-hidden="true">→</span>
            </TLink>
          </div>
        </div>
      </section>
    </Reveals>
  );
}
