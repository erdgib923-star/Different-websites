'use client';
import { useEffect, useRef } from 'react';
import { gsap, prefersReduced, EASE } from '@/lib/motion';
import { stage } from '@/lib/stage';

const steps = [
  { t: 'Listen', d: 'Two weeks inside your organisation before we draw anything. We interview the people who answer the phones as well as the board.' },
  { t: 'Frame', d: 'One page that says what the work must do. If we cannot agree on that page, we do not start designing.' },
  { t: 'Forge', d: 'Small, fast prototypes tested in the real places the brand lives: signs, screens, packaging, inboxes.' },
  { t: 'Hand over', d: 'A system your own team can run without us: templates, tokens, a written rulebook and a training day.' },
];

/** Pinned, scrubbed sequence: the step list lights up one by one while a giant numeral counts. */
export default function ProcessPin() {
  const section = useRef<HTMLElement>(null);
  useEffect(() => {
    if (prefersReduced()) return;
    let ctx: gsap.Context | undefined;
    const off = stage.whenReady(() => {
      ctx = gsap.context(() => {
        // inactive steps use ink-muted (7.1:1 on paper) rather than opacity, so every state passes contrast
        const items = gsap.utils.toArray<HTMLElement>('[data-step]');
        const nums = gsap.utils.toArray<HTMLElement>('[data-num]');
        gsap.set(nums.slice(1), { opacity: 1, yPercent: 100 });
        let current = -1;
        const setActive = (i: number) => {
          if (i === current) return;
          current = i;
          items.forEach((el, j) => el.classList.toggle('is-active', j === i));
        };
        setActive(0);
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: `+=${steps.length * 70}%`,
            pin: true,
            scrub: 0.6,
            onUpdate: (self) => setActive(Math.min(steps.length - 1, Math.floor(self.progress * (steps.length - 1) + 0.35))),
          },
        });
        tl.fromTo('[data-fill]', { scaleY: 0 }, { scaleY: 1, ease: 'none', duration: steps.length - 1 }, 0);
        for (let i = 1; i < steps.length; i++) {
          tl.to(nums[i - 1], { yPercent: -100, duration: 0.5, ease: EASE.inOut }, i - 0.65).to(nums[i], { yPercent: 0, duration: 0.5, ease: EASE.inOut }, i - 0.65);
        }
      }, section);
    });
    return () => { off(); ctx?.revert(); };
  }, []);

  return (
    <section ref={section} className="paper relative flex min-h-svh items-center py-24" aria-labelledby="process-title">
      <div className="wrap grid w-full gap-12 md:grid-cols-[1fr_1.2fr] md:items-center">
        <div>
          <p className="label text-ink-muted">How a project runs</p>
          <h2 id="process-title" className="display mt-4 text-[clamp(2.5rem,6vw,5rem)]">
            Four stages, no surprises
          </h2>
          <div className="relative mt-10 h-[1em] overflow-hidden font-mono text-[clamp(6rem,16vw,13rem)] leading-none" aria-hidden="true">
            {steps.map((s, i) => (
              <span key={s.t} data-num className="absolute inset-0 block text-ink">
                0{i + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="relative pl-8">
          <span aria-hidden="true" className="absolute top-0 left-0 h-full w-px bg-ink-muted/30">
            <span data-fill className="block h-full w-px origin-top bg-ink" />
          </span>
          <ol className="grid gap-8">
          {steps.map((s, i) => (
            <li key={s.t} data-step>
              <span data-mark aria-hidden="true" className="mb-3 block h-1 w-10 origin-left rounded-full bg-accent" />
              <h3 className="display text-3xl md:text-4xl">
                <span className="label mr-3 align-middle text-ink-muted">0{i + 1}</span>
                {s.t}
              </h3>
              <p className="mt-3 max-w-prose text-ink-muted">{s.d}</p>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
