'use client';
import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReduced, EASE } from '@/lib/motion';
import { stage } from '@/lib/stage';
import Preloader from './Preloader';
import Cursor from './Cursor';

type Nav = { navigate: (href: string) => void };
const NavCtx = createContext<Nav>({ navigate: () => {} });
export const useNav = () => useContext(NavCtx);

const norm = (p: string) => (p.endsWith('/') ? p : p + '/');

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const lenis = useRef<Lenis | null>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const pendingHash = useRef<string | null>(null);
  const firstPath = useRef(true);

  const scrollToHash = useCallback((hash: string) => {
    const el = document.getElementById(hash);
    if (!el) return;
    if (lenis.current) lenis.current.scrollTo(el, { offset: -24, duration: 1.4 });
    else el.scrollIntoView({ behavior: prefersReduced() ? 'auto' : 'smooth' });
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }, []);

  // smooth scroll: Lenis driven by the GSAP ticker (single loop), ScrollTrigger updated on every Lenis scroll
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('motion-ready');
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    if (prefersReduced()) {
      return () => window.removeEventListener('load', refresh);
    }
    const l = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.current = l;
    l.on('scroll', ScrollTrigger.update);
    const tick = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
      lenis.current = null;
      window.removeEventListener('load', refresh);
    };
  }, []);

  const navigate = useCallback(
    (href: string) => {
      const [path, hash] = href.split('#');
      const target = path || pathname;
      if (norm(target) === norm(pathname)) {
        if (hash) scrollToHash(hash);
        else lenis.current ? lenis.current.scrollTo(0) : window.scrollTo(0, 0);
        return;
      }
      if (busy.current) return;
      pendingHash.current = hash ?? null;
      if (prefersReduced() || !curtain.current) {
        router.push(href);
        return;
      }
      busy.current = true;
      stage.hold();
      const [ember, ink] = curtain.current.children;
      gsap
        .timeline()
        .set(curtain.current, { visibility: 'visible' })
        .fromTo(ember, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: EASE.inOut })
        .fromTo(ink, { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: EASE.inOut }, '-=0.42')
        .add(() => router.push(target));
    },
    [pathname, router, scrollToHash],
  );

  // after the route changed: reset scroll, release the stage, lift the curtain
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    lenis.current?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    const hash = pendingHash.current;
    pendingHash.current = null;
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      stage.release();
      if (!busy.current || !curtain.current) {
        if (hash) setTimeout(() => scrollToHash(hash), 50);
        return;
      }
      const [ember, ink] = curtain.current.children;
      gsap
        .timeline({
          onComplete: () => {
            busy.current = false;
            gsap.set(curtain.current, { visibility: 'hidden' });
            if (hash) scrollToHash(hash);
          },
        })
        .to(ink, { yPercent: -100, duration: 0.7, ease: EASE.inOut })
        .to(ember, { yPercent: -100, duration: 0.7, ease: EASE.inOut }, '-=0.55');
      document.getElementById('main')?.focus({ preventScroll: true });
    });
  }, [pathname, scrollToHash]);

  return (
    <NavCtx.Provider value={{ navigate }}>
      <Preloader />
      <div className="curtain" ref={curtain} aria-hidden="true">
        <div className="curtain__ember" />
        <div className="curtain__ink">
          <span className="label text-muted">Atlas &amp; Ember</span>
        </div>
      </div>
      <Cursor />
      {children}
    </NavCtx.Provider>
  );
}
