'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import TLink from './TLink';

export default function Header() {
  const path = usePathname();
  const ref = useRef<HTMLElement>(null);
  // hide while scrolling down, reveal on any upward scroll
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 160 || y < last - 2) ref.current?.classList.remove('is-hidden');
      else if (y > last + 2) ref.current?.classList.add('is-hidden');
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => ref.current?.classList.remove('is-hidden'), [path]);
  const links = [
    { href: '/#work', label: 'Work' },
    { href: '/about/', label: 'Studio' },
    { href: '#contact', label: 'Contact' },
  ];
  return (
    <header ref={ref} className="site-header fixed inset-x-0 top-0 z-50">
      <div className="wrap flex items-center justify-between gap-4 py-4 md:py-6">
        <TLink href="/" className="display text-xl md:text-2xl">
          Atlas <span className="text-accent">&amp;</span> Ember
        </TLink>
        <nav aria-label="Primary">
          <ul className="flex gap-4 md:gap-8">
            {links.map((l) => (
              <li key={l.href}>
                <TLink
                  href={l.href}
                  className="label inline-flex min-h-11 items-center text-muted transition-colors hover:text-text aria-[current=page]:text-accent"
                  aria-current={l.href === path ? 'page' : undefined}
                >
                  {l.label}
                </TLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {/* soft scrim so the header stays legible over imagery */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-bg/90 to-transparent" />
    </header>
  );
}
