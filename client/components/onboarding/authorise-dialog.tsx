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
              <DialogDescription className='text-sm text-muted-foreground'>
                {connector.consent.intro}
              </DialogDescription>
            </DialogHeader>

            {connector.consent.note && (
              <p className='text-xs leading-5 text-[#a97e1e]'>
                {connector.consent.note}
              </p>
            )}

            {connector.consent.badges && (
              <div className='flex flex-wrap gap-2'>
                {connector.consent.badges.map((badge, i) => {
                  const Icon = BADGE_ICONS[i] ?? ShieldCheck;
                  return (
                    <span
                      key={badge}
                      className='inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground'
                    >
                      <Icon className='size-3.5' />
                      {badge}
                    </span>
                  );
                })}
              </div>
            )}

            <ul className='flex flex-col gap-2.5'>
              {connector.consent.permissions.map((permission) => (
                <li
                  key={permission}
                  className='flex items-center gap-2 text-sm text-carbon-black'
                >
                  <CheckCircle2 className='size-4 shrink-0 text-data-teal' />
                  {permission}
                </li>
              ))}
            </ul>

            <DialogFooter className='flex-row gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                className='flex-1 rounded-xl cursor-pointer'
              >
                Cancel
              </Button>
              <Button
                type='button'
                onClick={onContinue}
                className='flex-1 rounded-xl cursor-pointer'
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
