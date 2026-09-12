'use client';

import { CheckCircle2, Landmark, Loader2, Plus, Trash2 } from 'lucide-react';

import type { OpenBankingConnection } from '@/lib/api/onboarding';

/**
 * Connected-state panel for Open Banking (multi-bank). Lists the connected
 * banks with per-bank removal, lets the user connect another, and captures the
 * "all relevant accounts connected" completeness attestation.
 */
export function OpenBankingPanel({
  connections,
  complete,
  onConnectAnother,
  connecting,
  onRemoveBank,
  removingBankId,
  onDisconnectAll,
  disconnectingAll,
  onToggleComplete,
  completenessPending,
}: {
  connections: OpenBankingConnection[];
  complete: boolean;
  onConnectAnother: () => void;
  connecting?: boolean;
  onRemoveBank: (connectionId: string) => void;
  removingBankId?: string | null;
  onDisconnectAll: () => void;
  disconnectingAll?: boolean;
  onToggleComplete: (value: boolean) => void;
  completenessPending?: boolean;
}) {
  return (
    <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
            <Landmark className='size-5 text-primary' />
          </span>
          <div className='flex flex-col'>
            <p className='text-base font-semibold text-carbon-black'>
              Open Banking
            </p>
            <p className='text-xs text-muted-foreground'>
              TrueLayer · FCA-regulated
            </p>
          </div>
        </div>
        <span className='inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-label-md font-medium text-success-600'>
          <CheckCircle2 className='size-4' />
          Connected
        </span>
      </div>

      {/* Connected banks */}
      <div className='flex flex-col gap-2'>
        {connections.map((b) => (
          <div
            key={b.connectionId}
            className='flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3'
          >
            <div className='flex items-center gap-3'>
              <Landmark className='size-5 shrink-0 text-gray-500' />
              <div className='flex flex-col'>
                <p className='text-sm font-medium text-carbon-black'>
                  {b.institutionName}
                </p>
                <p className='text-xs text-gray-500'>
                  {b.accountCount} account{b.accountCount === 1 ? '' : 's'}{' '}
                  connected
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => onRemoveBank(b.connectionId)}
              disabled={removingBankId === b.connectionId}
              aria-label={`Remove ${b.institutionName}`}
              className='shrink-0 text-gray-500 hover:text-carbon-black disabled:opacity-60'
            >
              {removingBankId === b.connectionId ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <Trash2 className='size-4' />
              )}
            </button>
          </div>
        ))}
      </div>

      <button
        type='button'
        onClick={onConnectAnother}
        disabled={connecting}
        className='inline-flex h-10 w-fit items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-muted disabled:opacity-60'
      >
        {connecting ? (
          <Loader2 className='size-4 animate-spin' />
        ) : (
          <Plus className='size-4' />
        )}
        Connect another bank
      </button>

      <div className='h-px w-full bg-gray-200' />

      {/* Completeness attestation */}
      <label className='flex cursor-pointer items-start gap-3'>
        <input
          type='checkbox'
          checked={complete}
          disabled={completenessPending}
          onChange={(e) => onToggleComplete(e.target.checked)}
          className='mt-0.5 size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-primary disabled:opacity-60'
        />
        <span className='flex flex-col'>
          <span className='text-sm font-medium text-carbon-black'>
            I&apos;ve connected all my business bank accounts
          </span>
          <span className='text-xs text-muted-foreground'>
            Confirming completeness gives a full view of your cash flow and
            improves your score confidence.
          </span>
        </span>
      </label>

      <button
        type='button'
        onClick={onDisconnectAll}
        disabled={disconnectingAll}
        className='w-fit text-label-sm font-medium text-destructive hover:underline disabled:opacity-60'
      >
        {disconnectingAll ? 'Disconnecting…' : 'Disconnect all banks'}
      </button>
    </div>
  );
}
