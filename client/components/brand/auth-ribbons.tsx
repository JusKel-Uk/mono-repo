'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { RIBBONS } from './ribbon-paths';

/**
 * Decorative brand ribbons for the auth shell (desktop only). Rendered as an
 * inline SVG so every ribbon is its own <path> — each gets an independent GSAP
 * tween (randomised drift/rotation/duration/phase), so they float out of sync
 * for an organic feel rather than a single synchronised pulse.
 *
 * The former teal (bottom) paths are rendered in the same dark green so the top
 * ribbons read as continuing down to the bottom. Runs regardless of
 * prefers-reduced-motion (per request).
 */
export function AuthRibbons() {
  const ref = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const paths = ref.current?.querySelectorAll('path') ?? [];
      paths.forEach((path, i) => {
        gsap.to(path, {
          x: gsap.utils.random(-50, 50),
          y: gsap.utils.random(-35, 35),
          rotation: gsap.utils.random(-1.2, 1.2),
          transformOrigin: '50% 50%',
          duration: gsap.utils.random(6, 11),
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          delay: i * 0.4,
        });
      });
    },
    { scope: ref },
  );

  return (
    <svg
      ref={ref}
      viewBox='0 0 1728 1156'
      preserveAspectRatio='xMidYMid slice'
      aria-hidden
      className='pointer-events-none absolute inset-0 hidden size-full xl:block'
    >
      {RIBBONS.map((ribbon, i) => (
        <path key={i} d={ribbon.d} fill='var(--color-teal-charcoal)' />
      ))}
    </svg>
  );
}
