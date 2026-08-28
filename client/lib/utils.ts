import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Register our custom Figma type-scale utilities as font-sizes so tailwind-merge
// treats e.g. `text-label-sm` as conflicting with `text-sm`. Without this, a
// component that bakes in `text-sm` (like the shadcn Button) keeps both classes
// and the built-in one wins.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-h2',
        'text-h3',
        'text-h4',
        'text-h5',
        'text-h6',
        'text-body-lg',
        'text-body-md',
        'text-body-sm',
        'text-label-lg',
        'text-label-md',
        'text-label-sm',
      ],
    },
  },
});

/** Merge class names, resolving Tailwind conflicts (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
