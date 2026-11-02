'use client';
import { useEffect, useRef, useState } from 'react';
import { getPhotoManifest } from '@/lib/photos';

type Props = {
  slot: string;
  ratio?: string; // CSS aspect-ratio, e.g. "4 / 5"
  tint?: 'ember' | 'bone';
  alt: string;
  dominant?: string; // CSS colour shown while loading
  className?: string;
  children?: React.ReactNode; // procedural art fallback
  clip?: 'up' | 'left' | 'center';
};

/**
 * Reusable image slot: fixed aspect ratio, object-fit cover, dominant-colour background,
 * blur-up on load, lazy loading and a CSS duotone so real photos match the palette.
 * Without a photo in the manifest it renders its procedural art.
 */
export default function Media({ slot, ratio = '4 / 3', tint = 'ember', alt, dominant, className = '', children, clip }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let live = true;
    getPhotoManifest().then((m) => {
      if (live && m[slot]) setSrc(`/assets/images/${m[slot]}`);
    });
    return () => {
      live = false;
    };
  }, [slot]);

  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) setLoaded(true);
  }, [src]);

  return (
    <figure
      className={`media ${src ? 'has-photo' : ''} ${className}`}
      data-slot={slot}
      data-tint={tint}
      data-clip={clip}
      role={src ? undefined : 'img'}
      aria-label={src ? undefined : alt}
      style={{ ['--ar' as string]: ratio, ['--dominant' as string]: dominant }}
    >
      {children && <div className="media__art">{children}</div>}
      {src && (
        <img
          ref={img}
          className={`media__img ${loaded ? 'is-loaded' : ''}`}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      )}
    </figure>
  );
}
