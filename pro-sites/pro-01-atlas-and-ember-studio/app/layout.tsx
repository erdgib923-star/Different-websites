import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/bricolage-grotesque/standard.css';
import '@fontsource-variable/jetbrains-mono/index.css';
import './globals.css';
import Providers from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Reveals from '@/components/Reveals';

export const metadata: Metadata = {
  title: { default: 'Atlas & Ember — Independent creative studio (fictional demo)', template: '%s — Atlas & Ember' },
  description: 'Atlas & Ember is a fictional brand, motion and spatial design studio. A portfolio demo with sample content.',
};

export const viewport: Viewport = { themeColor: '#0c0603', width: 'device-width', initialScale: 1 };

// Runs before paint: enables hidden start states only when JS runs, and falls back to
// fully visible content if the app has not booted within 4s.
const boot = `(function(d){var h=d.documentElement;h.classList.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('reduced');setTimeout(function(){if(!h.classList.contains('motion-ready'))h.classList.remove('js')},4000)})(document)`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Providers>
          <Header />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <Reveals>
            <Footer />
          </Reveals>
        </Providers>
      </body>
    </html>
  );
}
