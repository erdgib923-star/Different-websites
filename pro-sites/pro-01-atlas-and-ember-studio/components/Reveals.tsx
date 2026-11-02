'use client';
import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, SplitText, pop, prefersReduced, DUR, EASE, STAGGER } from '@/lib/motion';
import { stage } from '@/lib/stage';

const CLIP_FROM: Record<string, string> = {
  up: 'inset(100% 0% 0% 0%)',
  left: 'inset(0% 100% 0% 0%)',
  center: 'inset(50% 50% 50% 50%)',
};

/**
 * Wires the declarative motion attributes inside a page:
 *  data-split="intro|scroll"  split-text headline (masked lines, words rise)
 *  data-clip="up|left|center" clip-path media reveal (+ inner art settles from 1.2x)
 *  data-pop                   staggered "pop" preset via ScrollTrigger.batch
 *  data-fade                  simple rise + fade
 *  data-speed="-0.2"          parallax layer (yPercent per section scroll)
 *  data-scrub-words           paragraph whose words light up with scroll
 * Everything waits for the stage (preloader / transition curtain) and is reverted on unmount.
 */
export default function Reveals({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReduced()) return;
    let ctx: gsap.Context | undefined;
    const off = stage.whenReady(() => {
      ctx = gsap.context(() => {
        const q = <T extends Element = HTMLElement>(s: string) => Array.from(scope.current!.querySelectorAll<T & HTMLElement>(s));

        q('[data-split]').forEach((el) => {
          const intro = el.dataset.split === 'intro';
          SplitText.create(el, {
            type: 'lines,words',
            mask: 'lines',
            autoSplit: true,
            onSplit(self) {
              gsap.set(el, { visibility: 'visible' });
              return gsap.from(self.words, {
                yPercent: 115,
                rotate: 3,
                duration: DUR.lg,
                ease: EASE.out,
                stagger: 0.05,
                delay: intro ? 0.15 : 0,
                scrollTrigger: intro ? undefined : { trigger: el, start: 'top 88%', once: true },
              });
            },
          });
        });

        q('[data-clip]').forEach((el) => {
          const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
          tl.fromTo(el, { clipPath: CLIP_FROM[el.dataset.clip!] ?? CLIP_FROM.up }, { clipPath: 'inset(0% 0% 0% 0%)', duration: DUR.lg, ease: 'expo.inOut' });
          const art = el.querySelector('.media__art, .media__img');
          if (art) tl.fromTo(art, { scale: 1.22 }, { scale: 1, duration: DUR.lg * 1.4, ease: EASE.out }, 0);
        });

        ScrollTrigger.batch(q('[data-pop]'), {
          start: 'top 90%',
          once: true,
          onEnter: (batch) => pop(batch, { stagger: STAGGER }),
        });

        q('[data-fade]').forEach((el) =>
          gsap.fromTo(el, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: DUR.md, ease: EASE.soft, scrollTrigger: { trigger: el, start: 'top 90%', once: true } }),
        );

        q('[data-speed]').forEach((el) => {
          const speed = parseFloat(el.dataset.speed!);
          gsap.fromTo(el, { yPercent: -speed * 50 }, {
            yPercent: speed * 50,
            ease: 'none',
            scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
          });
        });

        // words light up as the paragraph scrolls through; progress only moves forward,
        // so text never returns to its dimmed (low-contrast) state once read
        q('[data-scrub-words]').forEach((el) => {
          const split = SplitText.create(el, { type: 'words', tag: 'span', aria: 'none' });
          const tl = gsap.fromTo(split.words, { opacity: 0.22 }, { opacity: 1, stagger: 0.1, ease: 'none', paused: true });
          let max = 0;
          ScrollTrigger.create({
            trigger: el,
            start: 'top 80%',
            end: 'bottom 45%',
            onUpdate(self) {
              if (self.progress > max) {
                max = self.progress;
                gsap.to(tl, { progress: max, duration: 0.4, ease: 'power2.out', overwrite: true });
              }
            },
          });
        });
      }, scope);
      ScrollTrigger.refresh();
    });
    return () => {
      off();
      ctx?.revert();
    };
  }, []);

  return <div ref={scope}>{children}</div>;
}
