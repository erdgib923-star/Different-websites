import type { Metadata } from 'next';
import Reveals from '@/components/Reveals';
import Media from '@/components/Media';
import ProjectArt from '@/components/ProjectArt';
import ProcessPin from '@/components/ProcessPin';

export const metadata: Metadata = { title: 'Studio', description: 'How the fictional Atlas & Ember studio works.' };

// Fictional people (sample content)
const team = [
  ['Ines Varga', 'Founder, creative director'],
  ['Tomas Achebe', 'Design director'],
  ['Mira Solberg', 'Motion lead'],
  ['Dev Oyelaran', 'Spatial designer'],
  ['Hana Kurosaki', 'Type & identity'],
  ['Rafael Quint', 'Engineering lead'],
  ['Lotte Brandt', 'Writer'],
  ['Sami Haddad', 'Designer'],
  ['Juno Pereira', 'Producer'],
] as const;

const principles = [
  { t: 'Fewer, hotter ideas', d: 'We present one direction we believe in, with the reasoning written down. Not three to choose from.' },
  { t: 'Test where it lives', d: 'Signs get tested on the street, packaging on the shelf, interfaces on a cracked phone in bright sun.' },
  { t: 'Leave a system, not a dependency', d: 'Every project ends with tools your own team can run. We would rather be invited back than needed.' },
];

const wont = ['Pitch work for free', 'Use stock photography as the idea', 'Ship a brand without accessibility checks', 'Hide behind account managers'];

export default function About() {
  return (
    <Reveals>
      <section className="wrap pt-36 pb-16 md:pt-44" aria-labelledby="about-title">
        <p className="label text-accent" data-fade>
          The studio
        </p>
        <h1 id="about-title" className="display mt-4 max-w-[13ch] text-[clamp(3rem,10vw,9.5rem)]" data-split="intro">
          Nine people, one long table.
        </h1>
        <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-end">
          <p className="max-w-prose text-lg text-muted md:text-xl" data-fade>
            Atlas &amp; Ember started in a former kiln shed in 2012. We still work in one room, so a typographer, an engineer and a motion designer can argue about the same pixel before lunch.
          </p>
          <div className="relative">
            <Media slot="about-hero" ratio="16 / 10" alt="Abstract monolith artwork standing in for a photograph of the studio" clip="up" className="rounded-2xl">
              <ProjectArt variant="monolith" seed={57} id="about-hero" />
            </Media>
            {/* parallax pair over the hero image */}
            <div aria-hidden="true" data-speed="-0.6" className="absolute -bottom-8 -left-6 hidden rounded-xl bg-accent px-5 py-4 text-accent-contrast shadow-[var(--shadow-lg)] md:block">
              <p className="label">Founded</p>
              <p className="display text-4xl">2012</p>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap py-24 md:py-36" aria-labelledby="principles-title">
        <h2 id="principles-title" className="display max-w-[16ch] text-[clamp(2.5rem,5.5vw,5rem)]" data-split="scroll">
          Three things we hold to
        </h2>
        <ol className="mt-14 grid gap-4 md:grid-cols-3">
          {principles.map((p, i) => (
            <li key={p.t} data-pop className="rounded-2xl border border-border bg-surface p-6 md:p-8">
              <p className="label text-accent">0{i + 1}</p>
              <h3 className="display mt-8 text-3xl">{p.t}</h3>
              <p className="mt-3 text-muted">{p.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <ProcessPin />

      <section className="wrap py-24 md:py-36" aria-labelledby="team-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="team-title" className="display text-[clamp(2.5rem,5.5vw,5rem)]" data-split="scroll">
            The table
          </h2>
          <p className="label text-muted">Fictional people · sample content</p>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {team.map(([name, role], i) => {
            const initials = name.split(' ').map((w) => w[0]).join('');
            return (
              <li key={name} data-pop className="flex items-center gap-5 rounded-2xl border border-border p-5">
                <span
                  aria-hidden="true"
                  className="grid size-16 shrink-0 place-items-center rounded-full font-mono text-sm text-text"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, var(--accent-${[700, 800, 900][i % 3]}), var(--neutral-800) 75%)`,
                  }}
                >
                  {initials}
                </span>
                <div>
                  <p className="text-lg">{name}</p>
                  <p className="text-sm text-muted">{role}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="wrap pb-28 md:pb-40" aria-labelledby="wont-title">
        <div className="grid gap-10 md:grid-cols-2">
          <h2 id="wont-title" className="display text-[clamp(2.5rem,5.5vw,5rem)]" data-split="scroll">
            Things we won’t do
          </h2>
          <ul className="divide-y divide-border border-y border-border">
            {wont.map((w) => (
              <li key={w} data-fade className="flex items-center justify-between gap-6 py-5 text-xl md:text-2xl">
                {w}
                <span aria-hidden="true" className="text-accent">
                  ✕
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Reveals>
  );
}
