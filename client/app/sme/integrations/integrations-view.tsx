'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  ChevronDown,
  ExternalLink,
  Landmark,
  Loader2,
  Receipt,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { ApiError } from '@/lib/api/client';
import {
  authorizeIntegration,
  disconnectIntegration,
  getFinancialProfile,
  type IntegrationProvider,
  type IntegrationSlug,
} from '@/lib/api/onboarding';
import { onboardingKeys } from '@/lib/hooks/use-onboarding';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

type Connector = {
  key: string;
  provider: IntegrationProvider;
  slug: IntegrationSlug;
  live: boolean; // OB + QBO are wired to the real OAuth backend; Xero simulated.
  icon: LucideIcon;
  name: string;
  providerLabel: string;
  desc: string;
};

const CONNECTORS: Connector[] = [
  {
    key: 'open-banking',
    provider: 1,
    slug: 'open-banking',
    live: true,
    icon: Landmark,
    name: 'Open Banking',
    providerLabel: 'TrueLayer · FCA regulated',
    desc: 'Securely read business current-account transactions to verify inflows, outflows, and cash runway.',
  },
  {
    key: 'xero',
    provider: 2,
    slug: 'xero',
    live: false,
    icon: Banknote,
    name: 'Xero',
    providerLabel: 'Xero Accounting',
    desc: 'Pull P&L, balance sheet, and outstanding invoices directly from your Xero account.',
  },
  {
    key: 'quickbooks',
    provider: 3,
    slug: 'quickbooks',
    live: true,
    icon: Receipt,
    name: 'QuickBooks',
    providerLabel: 'Intuit QuickBooks Online',
    desc: 'Import financial statements and receivables from your QuickBooks company file.',
  },
];

const NAME_BY_SLUG: Record<string, string> = {
  'open-banking': 'Open Banking',
  xero: 'Xero',
  quickbooks: 'QuickBooks',
};

/** ISO datetime → "DD-MM-YYYY" (or "—" when absent/invalid). */
function fmt(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

// TODO(backend): no sync-history endpoint yet — placeholder display only.
const HISTORY = [
  { date: '29-07-2026, 09:12', result: 'Success', ok: true },
  { date: '28-07-2026, 09:07', result: 'Success', ok: true },
  { date: '27-07-2026, 20:28', result: 'Failed — token expired', ok: false },
  { date: '26-07-2026, 09:03', result: 'Success', ok: true },
  { date: '25-07-2026, 09:10', result: 'Success', ok: true },
];

export function IntegrationsView() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data: saved, isLoading } = useQuery({
    queryKey: onboardingKeys.step('financial-profile'),
    queryFn: getFinancialProfile,
  });

  // A live provider whose OAuth tab is opening (shows a spinner briefly).
  const [pending, setPending] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  // Xero is not wired to the backend — a local simulated toggle for now.
  const [xeroConnected, setXeroConnected] = useState(false);

  // The OAuth callback lands back here with ?integration=<slug>&status=<...>.
  const handled = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const integration = params.get('integration');
    const status = params.get('status');
    if (!integration || !status || handled.current) return;
    handled.current = true;
    const name = NAME_BY_SLUG[integration] ?? integration;
    if (status === 'connected') {
      toast.success(`${name} connected`);
      qc.invalidateQueries({
        queryKey: onboardingKeys.step('financial-profile'),
      });
    } else {
      toast.error(`Could not connect ${name}. Please try again.`);
    }
    router.replace(ROUTES.sme.integrations);
  }, [qc, router]);

  const isConnected = (c: Connector): boolean => {
    if (!c.live) return xeroConnected;
    if (c.key === 'open-banking') {
      return (
        (saved?.connectedBanks?.length ?? 0) > 0 ||
        !!saved?.integrations?.find((i) => i.provider === 1)?.isConnected
      );
    }
    return !!saved?.integrations?.find((i) => i.provider === c.provider)
      ?.isConnected;
  };

  const syncOf = (c: Connector) => {
    const integ = saved?.integrations?.find((i) => i.provider === c.provider);
    const metrics =
      c.key === 'open-banking'
        ? saved?.bankingIntegrationMetrics
        : saved?.integrationMetrics?.provider === c.provider
          ? saved?.integrationMetrics
          : null;
    return {
      connected: fmt(integ?.connectedAt),
      lastSuccess: fmt(metrics?.syncedAt ?? integ?.connectedAt),
      lastSyncAttempt: fmt(metrics?.syncedAt ?? integ?.connectedAt),
      lastError: 'None',
    };
  };

  const connect = async (c: Connector) => {
    if (!c.live) {
      setXeroConnected(true);
      toast.success(`${c.name} connected`);
      return;
    }
    setPending(c.key);
    try {
      // Return here (not the assessment page) after the OAuth round-trip.
      sessionStorage.setItem('oauthReturn', ROUTES.sme.integrations);
      const { authorizationUrl } = await authorizeIntegration(c.slug);
      window.location.assign(authorizationUrl);
    } catch (err) {
      setPending(null);
      // 404 = the backend authorize is gated to a draft application, which
      // doesn't exist post-submission (see backend GetDraftApplicationIdAsync).
      if (err instanceof ApiError && err.status === 404) {
        toast.error(
          `${c.name} can't be connected right now. Please try again later.`,
        );
      } else {
        toast.error(
          err instanceof ApiError
            ? err.message
            : `Could not start the ${c.name} connection. Please try again.`,
        );
      }
    }
  };

  const disconnect = async (c: Connector) => {
    if (!c.live) {
      setXeroConnected(false);
      setOpen((o) => ({ ...o, [c.key]: false }));
      toast.success(`${c.name} disconnected`);
      return;
    }
    setDisconnecting(c.key);
    try {
      await disconnectIntegration(c.slug);
      await qc.invalidateQueries({
        queryKey: onboardingKeys.step('financial-profile'),
      });
      setOpen((o) => ({ ...o, [c.key]: false }));
      toast.success(`${c.name} disconnected`);
    } catch {
      toast.error(`Could not disconnect ${c.name}. Please try again.`);
    } finally {
      setDisconnecting(null);
    }
  };

  const resync = (c: Connector) => {
    qc.invalidateQueries({ queryKey: onboardingKeys.step('financial-profile') });
    toast.success(`Re-syncing ${c.name}…`);
  };

  const anyConnected = CONNECTORS.some((c) => isConnected(c));

  return (
    <DashboardShell
      title='Connected accounts'
      subtitle='Link your bank and accounting tools to securely populate relevant financial and banking information and strengthen your Sustainability Finance Score.'
    >
      <div
        className={cn(
          // Equal-height cards while none are connected; once one connects it
          // grows taller, so top-align the compact not-connected ones instead.
          'grid gap-4 md:grid-cols-3',
          anyConnected && 'items-start',
        )}
      >
        {CONNECTORS.map((c) => {
          const connected = isConnected(c);
          const sync = syncOf(c);
          const connecting = pending === c.key;
          return (
            <div
              key={c.key}
              className='flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white'
            >
              <div className='flex flex-1 flex-col gap-4 p-5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex items-center gap-2.5'>
                    <span className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100'>
                      <c.icon className='size-5 text-carbon-black' />
                    </span>
                    <div className='flex flex-col gap-0.5'>
                      <p className='text-body-md font-semibold text-carbon-black'>
                        {c.name}
                      </p>
                      <p className='text-label-md text-gray-500'>
                        {c.providerLabel}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'inline-flex h-6 shrink-0 items-center rounded-full px-3 text-label-sm font-medium',
                      isLoading && c.live
                        ? 'bg-gray-100 text-gray-500'
                        : connected
                          ? 'bg-success-50 text-success-600'
                          : 'bg-gray-100 text-gray-600',
                    )}
                  >
                    {isLoading && c.live
                      ? 'Checking…'
                      : connected
                        ? 'Connected'
                        : 'Not connected'}
                  </span>
                </div>

                <p className='text-body-sm text-carbon-black'>{c.desc}</p>

                {connected ? (
                  <>
                    <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
                      <Field label='Connected' value={sync.connected} />
                      <Field label='Last success' value={sync.lastSuccess} />
                      <Field
                        label='Last sync attempt'
                        value={sync.lastSyncAttempt}
                      />
                      <Field label='Last error' value={sync.lastError} />
                    </div>
                    <div className='flex items-center gap-4'>
                      <button
                        type='button'
                        onClick={() => resync(c)}
                        className='inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-label-lg font-medium text-mineral-white transition-opacity hover:opacity-90'
                      >
                        <RefreshCw className='size-4' />
                        Re-sync
                      </button>
                      <button
                        type='button'
                        onClick={() => disconnect(c)}
                        disabled={disconnecting === c.key}
                        className='inline-flex items-center gap-1.5 text-label-lg font-medium text-carbon-black underline underline-offset-2 hover:text-primary disabled:opacity-60'
                      >
                        {disconnecting === c.key && (
                          <Loader2 className='size-4 animate-spin' />
                        )}
                        Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type='button'
                    onClick={() => connect(c)}
                    disabled={connecting}
                    className='mt-auto inline-flex h-9 w-fit items-center gap-2 rounded-lg bg-primary px-4 text-label-lg font-medium text-mineral-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-60'
                  >
                    {connecting ? (
                      <>
                        <Loader2 className='size-4 animate-spin' />
                        Connecting…
                      </>
                    ) : (
                      <>
                        Connect
                        <ExternalLink className='size-3.5' />
                      </>
                    )}
                  </button>
                )}
              </div>

              {connected && (
                <div className='border-t border-gray-200'>
                  <button
                    type='button'
                    onClick={() =>
                      setOpen((o) => ({ ...o, [c.key]: !o[c.key] }))
                    }
                    className='flex w-full items-center justify-between gap-2 px-5 py-3 text-label-lg text-gray-600'
                  >
                    <span className='flex items-center gap-2'>
                      <RefreshCw className='size-4' />
                      Sync history ({HISTORY.length})
                    </span>
                    <ChevronDown
                      className={cn(
                        'size-4 transition-transform',
                        open[c.key] && 'rotate-180',
                      )}
                    />
                  </button>
                  {open[c.key] && (
                    <ul className='flex flex-col gap-2 px-5 pb-4'>
                      {HISTORY.map((h) => (
                        <li
                          key={h.date}
                          className='flex items-center justify-between gap-3 text-label-md'
                        >
                          <span className='text-gray-500'>{h.date}</span>
                          <span
                            className={
                              h.ok ? 'text-success-600' : 'text-error-600'
                            }
                          >
                            {h.result}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className='flex gap-3 rounded-2xl bg-abyssal p-6 text-mineral-white'>
        <Shield className='size-6 shrink-0' />
        <div className='flex flex-col gap-1'>
          <p className='text-body-md font-semibold lg:text-h6'>
            Read-only, revoke any time
          </p>
          <p className='text-body-sm lg:text-body-md'>
            We use FCA-regulated Open Banking (TrueLayer) and OAuth for
            accounting apps. JusKel never sees your login credentials and cannot
            move your money.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <p className='text-label-md text-gray-500'>{label}</p>
      <p className='text-body-sm text-carbon-black'>{value}</p>
    </div>
  );
}
