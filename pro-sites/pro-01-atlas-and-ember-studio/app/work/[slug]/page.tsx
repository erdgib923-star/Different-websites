import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Reveals from '@/components/Reveals';
import Media from '@/components/Media';
import ProjectArt from '@/components/ProjectArt';
import TLink from '@/components/TLink';
import { getProject, nextProject, projects } from '@/lib/projects';

export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = getProject((await params).slug);
  return { title: p ? `${p.title} case study` : 'Case study', description: p?.summary };
}

export default async function CaseStudy({ params }: Params) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const next = nextProject(slug);
  const altVariants = (['contour', 'monolith', 'orbit', 'flare', 'weave'] as const).filter((v) => v !== p.art);

  return (
    <Reveals>
      <article>
        <header className="wrap pt-36 pb-12 md:pt-44">
          <TLink href="/#work" className="label inline-flex min-h-11 items-center text-muted hover:text-text">
            ← All work
          </TLink>
          <p className="label mt-8 text-accent" data-fade>
            {p.discipline} · {p.year}
          </p>
          <h1 className="display mt-4 max-w-[14ch] text-[clamp(3rem,10vw,9.5rem)]" data-split="intro">
            {p.title}
          </h1>
          <p className="mt-8 max-w-[38rem] text-lg text-muted md:text-xl" data-fade>
            {p.summary}
          </p>
          <dl className="mt-12 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
            <div data-pop>
              <dt className="label text-muted">Client</dt>
              <dd className="mt-2">{p.client}</dd>
            </div>
            <div data-pop>
              <dt className="label text-muted">Year</dt>
              <dd className="mt-2">{p.year}</dd>
            </div>
            <div data-pop>
              <dt className="label text-muted">Services</dt>
              <dd className="mt-2">{p.services.join(', ')}</dd>
            </div>
          </dl>
        </header>

        <div className="wrap">
          <Media slot={`case-${p.slug}-hero`} ratio="16 / 9" alt={`${p.title}: hero artwork`} clip="center" className="rounded-2xl">
            <ProjectArt variant={p.art} seed={p.seed} id={`hero-${p.slug}`} />
          </Media>
        </div>

        <section className="wrap grid gap-8 py-24 md:grid-cols-[1fr_2fr] md:py-36" aria-labelledby="brief">
          <h2 id="brief" className="display text-[clamp(2.25rem,5vw,4rem)]" data-split="scroll">
            The brief
          </h2>
          <p className="display text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] font-normal" data-scrub-words>
            {p.brief}
          </p>
        </section>

        <section className="wrap pb-24 md:pb-36" aria-labelledby="approach">
          <h2 id="approach" className="display mb-14 text-[clamp(2.25rem,5vw,4rem)]" data-split="scroll">
            Approach
          </h2>
          <ol className="grid gap-20 md:gap-28">
            {p.approach.map((a, i) => (
              <li key={i} className={`grid gap-8 md:grid-cols-2 md:items-center ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <Media slot={`case-${p.slug}-${i + 1}`} ratio={i === 1 ? '4 / 5' : '4 / 3'} alt={`${p.title}: process artwork ${i + 1}`} clip={i % 2 ? 'left' : 'up'} tint={i === 1 ? 'bone' : 'ember'} className="rounded-xl">
                  <ProjectArt variant={altVariants[i % altVariants.length]} seed={p.seed + i * 13} id={`case-${p.slug}-${i}`} />
                </Media>
                <div>
                  <p className="label text-accent" data-fade>
                    Step {String(i + 1).padStart(2, '0')}
                  </p>
                  <p className="mt-4 text-xl md:text-2xl" data-fade>
                    {a}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="paper py-24 md:py-32" aria-labelledby="outcomes">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 id="outcomes" className="display text-[clamp(2.25rem,5vw,4rem)]" data-split="scroll">
                Outcomes
              </h2>
              <p className="label text-ink-muted">Sample data · fictional project</p>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-3">
              {p.outcomes.map((o) => (
                <li key={o.label} data-pop className="rounded-2xl border border-ink/15 p-6 md:p-8">
                  <p className="display text-[clamp(3rem,7vw,6rem)] leading-none">{o.value}</p>
                  <p className="mt-4 text-ink-muted">{o.label}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <nav className="wrap py-24 md:py-36" aria-label="Next project">
          <p className="label text-muted">Next project</p>
          <TLink href={`/work/${next.slug}/`} className="group mt-4 block" data-cursor="Next">
            <span className="display block text-[clamp(3rem,10vw,9rem)] transition-colors group-hover:text-accent">{next.title} →</span>
            <span className="mt-3 block text-muted">{next.discipline}</span>
          </TLink>
        </nav>
      </article>
    </Reveals>
  );
}
