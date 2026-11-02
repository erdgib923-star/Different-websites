import { gsap, MOTION } from './lib/motion';

/**
 * "From scrap to stack": a pinned, scrubbed sequence. Four steps share one stage; scraps fly into
 * an outline, links draw in, then the published card rises. Badges pop at fixed timeline points.
 * Only set up when motion is allowed: without JS or under reduced motion the section is a plain
 * list with the finished state shown.
 */
export function initFlow() {
  const sec = document.querySelector<HTMLElement>('.flow');
  const pin = sec?.querySelector<HTMLElement>('[data-flow]');
  if (!sec || !pin) return;

  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    sec.classList.add('is-pinned');
    const q = gsap.utils.selector(sec);
    const steps = q('.step') as HTMLElement[];
    const dots = q('.flow__dots i') as HTMLElement[];
    const links = [...sec.querySelectorAll<SVGPathElement>('.links path')];
    const outlineLines = q('.outline__l');

    gsap.set(steps.slice(1), { autoAlpha: 0, y: 28 });
    gsap.set(q('.outline'), { autoAlpha: 0 });
    gsap.set(outlineLines, { autoAlpha: 0, x: -16 });
    gsap.set(q('.published'), { autoAlpha: 0, y: 40 });
    gsap.set(q('.linkchip'), { autoAlpha: 0, x: 16 });
    gsap.set(q('.badge--flow1, .badge--flow2'), { autoAlpha: 0, scale: 0.4 });
    links.forEach((p) => {
      const len = p.getTotalLength();
      gsap.set(p, { strokeDasharray: `${len} ${len}`, strokeDashoffset: len });
    });

    const out = { autoAlpha: 0, y: -28, duration: 0.5 };
    const into = { autoAlpha: 1, y: 0, duration: 0.5 };
    const pop = { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(2.2)' };
    const setDot = (n: number) => dots.forEach((d, i) => d.classList.toggle('on', i <= n));
    setDot(0);

    const tl = gsap.timeline({
      defaults: { ease: MOTION.ease.power3 },
      scrollTrigger: {
        trigger: pin,
        start: 'top top+=76',
        end: '+=300%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        onUpdate: (self) => setDot(Math.min(3, Math.floor(self.progress * 4.2))),
      },
    });

    // 1 -> 2 Shape: scraps gather into the outline
    tl.to(steps[0], out, 0.6)
      .to(steps[1], into, 0.8)
      .to(q('.scrap'), { x: (i) => [40, -120, 30][i], y: (i) => [-20, 30, -90][i], rotate: 0, scale: 0.7, autoAlpha: 0, stagger: 0.08, duration: 0.6 }, 0.6)
      .to(q('.outline'), { autoAlpha: 1, duration: 0.3 }, 0.9)
      .to(outlineLines, { autoAlpha: 1, x: 0, stagger: 0.12, duration: 0.4 }, 1.0)
      // 2 -> 3 Link: connections draw in, first badge pops
      .to(steps[1], out, 1.8)
      .to(steps[2], into, 2.0)
      .to(links, { strokeDashoffset: 0, stagger: 0.18, duration: 0.7, ease: 'none' }, 2.0)
      .to(q('.linkchip'), { autoAlpha: 1, x: 0, stagger: 0.18, duration: 0.4 }, 2.3)
      .to(q('.badge--flow1'), pop, 2.5)
      // 3 -> 4 Publish: the page rises, second badge pops
      .to(steps[2], out, 3.1)
      .to(steps[3], into, 3.3)
      .to(q('.outline'), { autoAlpha: 0.3, duration: 0.4 }, 3.2)
      .to(q('.links, .linkchip'), { autoAlpha: 0.3, duration: 0.4 }, 3.2)
      .to(q('.published'), { autoAlpha: 1, y: 0, duration: 0.6 }, 3.3)
      .to(q('.badge--flow2'), pop, 3.8)
      .to({}, { duration: 0.5 });

    return () => sec.classList.remove('is-pinned');
  });
}
