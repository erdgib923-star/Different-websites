'use client';
import Link from 'next/link';
import { useNav } from './Providers';

/** Link that routes through the page-transition curtain. Modified clicks keep native behaviour. */
export default function TLink({ href, children, ...rest }: React.ComponentProps<typeof Link> & { href: string }) {
  const { navigate } = useNav();
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        rest.onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </Link>
  );
}
