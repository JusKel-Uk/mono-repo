'use client';

import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Eye, Lock, ShieldCheck } from 'lucide-react';

import type { ConnectorConfig } from '@/lib/onboarding/connectors';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Trust pills (Open Banking only), in the order the config lists them.
const BADGE_ICONS: LucideIcon[] = [Eye, ShieldCheck, Lock];

/**
 * Consent dialog shown before starting a data-source connect. Open when a
 * connector is passed; closed when null.
 */
export function AuthoriseDialog({
  connector,
  onCancel,
  onContinue,
}: {
  connector: ConnectorConfig | null;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <Dialog
      open={Boolean(connector)}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent className='gap-5 rounded-2xl sm:max-w-105'>
        {connector && (
          <>
            <DialogHeader className='gap-2'>
              <DialogTitle className='text-lg font-semibold text-carbon-black'>
                {connector.consent.title}
              </DialogTitle>
              <DialogDescription className='text-sm text-foreground-secondary'>
                {connector.consent.intro}
              </DialogDescription>
            </DialogHeader>

            {connector.consent.note && (
              <p className='text-sm text-gold'>{connector.consent.note}</p>
            )}

            {connector.consent.badges && (
              <div className='flex flex-wrap gap-2'>
                {connector.consent.badges.map((badge, i) => {
                  const Icon = BADGE_ICONS[i] ?? ShieldCheck;
                  return (
                    <span
                      key={badge}
                      className='inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-normal text-foreground-secondary'
                    >
                      <Icon className='size-3.5' />
                      {badge}
                    </span>
                  );
                })}
              </div>
            )}

            <ul className='flex flex-col gap-3'>
              {connector.consent.permissions.map((permission) => (
                <li
                  key={permission}
                  className='flex items-center gap-2 text-sm font-medium text-gray-700'
                >
                  <CheckCircle2 className='size-4 shrink-0 text-success-600' />
                  {permission}
                </li>
              ))}
            </ul>

            <DialogFooter className='flex-row gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                className='h-10 flex-1 cursor-pointer rounded-lg border-gray-300 py-2.5 text-sm font-semibold text-gray-700'
              >
                Cancel
              </Button>
              <Button
                type='button'
                onClick={onContinue}
                className='h-10 cursor-pointer rounded-lg py-2.5 text-sm font-semibold'
              >
                {connector.continueCta}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
