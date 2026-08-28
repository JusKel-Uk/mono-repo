import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(
        // Default = auth-form input (72px, 2px Gray/200 border, rounded-16).
        // Onboarding fields override these via the CONTROL class.
        'h-18 w-full min-w-0 rounded-2xl border-2 border-input bg-transparent px-4 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30',
        'focus-visible:border-carbon-black focus-visible:ring-0',
        // Per Figma, invalid fields keep the neutral border and signal the error
        // via the message below (aria-invalid is still set for assistive tech).
        className,
      )}
      {...props}
    />
  );
}

export { Input };
