'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, ChevronDown } from 'lucide-react';

import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { onboardingKeys, useLookupOptions } from '@/lib/hooks/use-onboarding';
import {
  getFinancialProfile,
  saveFinancialProfile,
  authorizeIntegration,
  disconnectIntegration,
  type IntegrationProvider,
  type IntegrationSlug,
} from '@/lib/api/onboarding';
import { ApiError } from '@/lib/api/client';
import {
  toFinancialProfileRequest,
  fromFinancialProfile,
} from '@/lib/onboarding/mappers';
import { LOOKUP, labelOf, type LookupSpec } from '@/lib/onboarding/enums';
import {
  financialProfileSchema,
  type FinancialProfileInput,
} from '@/lib/validations/onboarding';
import {
  CONNECTORS,
  VERIFIED_BANDS,
  type ConnectionStatus,
  type ConnectorId,
} from '@/lib/onboarding/connectors';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OnboardingActions } from '@/components/onboarding/onboarding-actions';
import { ConnectCard } from '@/components/onboarding/connect-card';
import { AuthoriseDialog } from '@/components/onboarding/authorise-dialog';
import {
  EvidenceRow,
  EnumSelectField,
} from '@/components/onboarding/onboarding-fields';
import { Form } from '@/components/ui/form';

const step = getStep('financial-profile')!;
const FORM_ID = 'financial-profile-form';
const EVIDENCE_HINT = 'PDF, DOC, PNG or JPG · max 10 MB';
// Simulated OAuth round-trip for the providers not yet wired to the backend.
const CONNECT_DELAY_MS = 2200;

const SLUG = 'financial-profile';

// Provider ↔ backend identifiers.
const SLUG_BY_ID: Record<ConnectorId, IntegrationSlug> = {
  openBanking: 'open-banking',
  xero: 'xero',
  quickbooks: 'quickbooks',
};
const ID_BY_PROVIDER: Record<IntegrationProvider, ConnectorId> = {
  1: 'openBanking',
  2: 'xero',
  3: 'quickbooks',
};
const NAME_BY_SLUG: Record<string, string> = {
  'open-banking': 'Open Banking',
  xero: 'Xero',
  quickbooks: 'QuickBooks',
};
// Providers wired to the real OAuth backend. The rest use the simulated flow
// until their integration is verified end-to-end.
const LIVE_PROVIDERS: ReadonlySet<ConnectorId> = new Set(['quickbooks']);

const BANDS: {
  name: keyof FinancialProfileInput;
  label: string;
  lookup: LookupSpec;
}[] = [
  {
    name: 'annualRevenueBand',
    label: 'Annual revenue band',
    lookup: LOOKUP.annualRevenueBand,
  },
  {
    name: 'avgMonthlyRevenue',
    label: 'Average monthly revenue',
    lookup: LOOKUP.avgMonthlyRevenue,
  },
  {
    name: 'grossMarginBand',
    label: 'Gross profit margin',
    lookup: LOOKUP.grossMarginBand,
  },
  {
    name: 'ebitdaBand',
    label: 'EBITDA / Profitability band',
    lookup: LOOKUP.ebitdaBand,
  },
  {
    name: 'revenueGrowthBand',
    label: 'Revenue growth (YoY)',
    lookup: LOOKUP.revenueGrowthBand,
  },
  {
    name: 'existingDebtBand',
    label: 'Existing debt band',
    lookup: LOOKUP.existingDebtBand,
  },
  {
    name: 'receivablesBand',
    label: 'Outstanding receivables',
    lookup: LOOKUP.receivablesBand,
  },
  {
    name: 'cashReserves',
    label: 'Cash reserves',
    lookup: LOOKUP.cashReserves,
  },
];

const CONFIDENCE_ROWS = [
  ['Open Banking', 'Verified'],
  ['Xero', 'Verified'],
  ['QuickBooks', 'Verified'],
  ['Self-declared', 'Lower confidence'],
];

const BAND_KEYS = Object.keys(
  VERIFIED_BANDS,
) as (keyof FinancialProfileInput)[];

export function FinancialProfileForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const opt = useLookupOptions();

  const form = useForm<FinancialProfileInput>({
    resolver: zodResolver(financialProfileSchema),
    mode: 'onChange',
    defaultValues: {
      annualRevenueBand: '',
      ebitdaBand: '',
      existingDebtBand: '',
      cashReserves: '',
      avgMonthlyRevenue: '',
    },
  });

  const { data: saved, isLoading: profileLoading } = useQuery({
    queryKey: onboardingKeys.step(SLUG),
    queryFn: getFinancialProfile,
  });
  useEffect(() => {
    if (saved) form.reset(fromFinancialProfile(saved));
  }, [saved, form]);

  // --- Connector flow ---
  // Live providers (QuickBooks) run the real OAuth round-trip; the rest are
  // simulated client-side until their backend is verified.
  const [connection, setConnection] = useState<{
    id: ConnectorId;
    status: ConnectionStatus;
  } | null>(null);
  const [authoriseId, setAuthoriseId] = useState<ConnectorId | null>(null);
  // A live provider whose OAuth tab is open — shown as "connecting" until we
  // re-read the profile (on window focus / the callback redirect).
  const [pendingId, setPendingId] = useState<ConnectorId | null>(null);
  // A live provider whose disconnect request is in flight (shows a spinner).
  const [disconnectingId, setDisconnectingId] = useState<ConnectorId | null>(
    null,
  );
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The provider the backend reports as connected (source of truth for live).
  const backendConnected = saved?.integrations?.find((i) => i.isConnected);
  const backendConnectorId = backendConnected
    ? ID_BY_PROVIDER[backendConnected.provider]
    : null;

  const statusFor = (id: ConnectorId): ConnectionStatus => {
    if (pendingId === id) return 'connecting';
    // Until the profile has loaded we don't know what's connected — show a
    // "checking" spinner rather than flashing "Connect" then swapping.
    if (profileLoading) return 'checking';
    if (backendConnectorId === id) return 'connected';
    return connection?.id === id ? connection.status : 'idle';
  };
  const connectedId =
    backendConnectorId ??
    (connection?.status === 'connected' ? connection.id : null);
  // Real connections show server values; simulated ones use the stub band map.
  const verifiedValueFor = (
    name: keyof FinancialProfileInput,
    lookup: LookupSpec,
  ) => {
    if (backendConnectorId) {
      const raw = form.getValues(name);
      return raw ? labelOf(opt(lookup), Number(raw)) : '—';
    }
    return labelOf(opt(lookup), Number(VERIFIED_BANDS[name]));
  };

  const applyVerified = (apply: boolean) => {
    BAND_KEYS.forEach((k) =>
      form.setValue(k, apply ? VERIFIED_BANDS[k] : '', {
        shouldValidate: true,
        shouldDirty: true,
      }),
    );
  };

  const startConnect = (id: ConnectorId) => {
    setConnection({ id, status: 'connecting' });
    if (connectTimer.current) clearTimeout(connectTimer.current);
    connectTimer.current = setTimeout(() => {
      setConnection({ id, status: 'connected' });
      applyVerified(true);
      toast.success(`${CONNECTORS[id].name} connected`, {
        description:
          'Verified financial information has been imported from your connected source. You may review but cannot edit verified values.',
      });
    }, CONNECT_DELAY_MS);
  };

  const disconnect = async (id: ConnectorId) => {
    if (LIVE_PROVIDERS.has(id)) {
      setPendingId(null);
      setDisconnectingId(id);
      try {
        await disconnectIntegration(SLUG_BY_ID[id]);
        await qc.invalidateQueries({ queryKey: onboardingKeys.step(SLUG) });
        qc.invalidateQueries({ queryKey: onboardingKeys.application });
      } catch {
        toast.error(
          `Could not disconnect ${CONNECTORS[id].name}. Please try again.`,
        );
      } finally {
        setDisconnectingId(null);
      }
      return;
    }
    // Simulated providers.
    if (connectTimer.current) clearTimeout(connectTimer.current);
    setConnection(null);
    applyVerified(false);
  };

  const continueAuthorise = async () => {
    const id = authoriseId;
    setAuthoriseId(null);
    if (!id) return;
    if (!LIVE_PROVIDERS.has(id)) {
      startConnect(id);
      return;
    }
    // Real OAuth: navigate this tab to the provider's consent screen. The
    // backend callback redirects back here with ?integration&status, so the
    // page reloads into the connected state. `pendingId` shows a "connecting"
    // state while the authorize call resolves (the API can cold-start).
    setPendingId(id);
    try {
      const { authorizationUrl } = await authorizeIntegration(SLUG_BY_ID[id]);
      window.location.href = authorizationUrl;
    } catch (err) {
      setPendingId(null);
      toast.error(
        err instanceof ApiError
          ? err.message
          : `Could not start the ${CONNECTORS[id].name} connection. Please try again.`,
      );
    }
  };

  useEffect(
    () => () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
    },
    [],
  );

  // The backend callback redirects here with ?integration=<slug>&status=<...>.
  const params = useSearchParams();
  const handledCallback = useRef(false);
  useEffect(() => {
    const integration = params.get('integration');
    const status = params.get('status');
    if (!integration || !status || handledCallback.current) return;
    handledCallback.current = true;
    const name = NAME_BY_SLUG[integration] ?? integration;
    if (status === 'connected') {
      toast.success(`${name} connected`, {
        description:
          'Verified financial information has been imported from your connected source. You may review but cannot edit verified values.',
      });
      qc.invalidateQueries({ queryKey: onboardingKeys.step(SLUG) });
      qc.invalidateQueries({ queryKey: onboardingKeys.application });
    } else {
      toast.error(`Could not connect ${name}. Please try again.`);
    }
    // Strip the params so a refresh doesn't re-fire the toast.
    router.replace(`/onboarding/${SLUG}`);
  }, [params, qc, router]);

  const save = useMutation({
    mutationFn: (values: FinancialProfileInput) =>
      saveFinancialProfile(toFinancialProfileRequest(values)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: onboardingKeys.application });
      qc.invalidateQueries({ queryKey: onboardingKeys.step(SLUG) });
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
      const next = nextStepRoute(SLUG);
      router.push(next ?? '/onboarding');
    } catch {
      toast.error('Could not save your financial profile. Please try again.');
    }
  });

  const onSaveExit = async () => {
    try {
      await save.mutateAsync(form.getValues());
    } catch {
      toast.error('Could not save your financial profile. Please try again.');
    }
    router.push('/onboarding');
  };

  return (
    <>
      <OnboardingShell
        currentStepTitle={step.title}
        title={step.title}
        subtitle={step.subtitle}
        actions={
          <OnboardingActions
            formId={FORM_ID}
            loading={save.isPending}
            onSaveExit={onSaveExit}
          />
        }
      >
        <Form {...form}>
          <form id={FORM_ID} onSubmit={onSubmit} noValidate>
            <div className='mx-auto flex w-full max-w-170 flex-col gap-8 rounded-2xl border border-border bg-white p-6 lg:p-8'>
              {/* Connect a banking source */}
              <section className='flex flex-col gap-4'>
                <SectionHeading
                  title='Connect a banking source'
                  note='(Highly Recommended)'
                  description='Securely connect your business bank account to provide verified financial data, improve the accuracy of your Sustainability Finance Score, and unlock more relevant funding opportunities.'
                />
                <div className='gap-4 grid md:grid-cols-3'>
                  <ConnectCard
                    connector={CONNECTORS.openBanking}
                    status={statusFor('openBanking')}
                    onConnect={() => setAuthoriseId('openBanking')}
                    onDisconnect={() => disconnect('openBanking')}
                    disconnecting={disconnectingId === 'openBanking'}
                  />
                </div>
              </section>

              {/* Connect a financial source */}
              <section className='flex flex-col gap-4'>
                <SectionHeading
                  title='Connect a financial source'
                  note='(Highly Recommended)'
                  description='Securely connect your accounting software to import verified financial data, improve the accuracy of your Sustainability Finance Score, and unlock more relevant funding opportunities.'
                />
                <div className='gap-4 sm:flex-row grid md:grid-cols-3 items-stretch'>
                  <ConnectCard
                    connector={CONNECTORS.xero}
                    status={statusFor('xero')}
                    onConnect={() => setAuthoriseId('xero')}
                    onDisconnect={() => disconnect('xero')}
                    disconnecting={disconnectingId === 'xero'}
                  />
                  <ConnectCard
                    connector={CONNECTORS.quickbooks}
                    status={statusFor('quickbooks')}
                    onConnect={() => setAuthoriseId('quickbooks')}
                    onDisconnect={() => disconnect('quickbooks')}
                    disconnecting={disconnectingId === 'quickbooks'}
                  />
                </div>
              </section>

              {/* Confidence banner */}
              <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-abyssal p-6 text-mineral-white'>
                <div className='flex flex-col gap-1'>
                  <p className='text-base font-medium'>
                    Why connect your data sources?
                  </p>
                  <p className='text-xs text-gray-400'>
                    Connecting verified data sources improves the accuracy of
                    your Sustainability Finance Score and increases confidence
                    in your funding assessment.
                  </p>
                </div>
                <div className='grid grid-cols-2 gap-x-6 gap-y-1.5'>
                  <span className='text-sm font-medium'>Option</span>
                  <span className='text-sm font-medium'>Confidence Level</span>
                  {CONFIDENCE_ROWS.map(([option, level]) => (
                    <div key={option} className='contents'>
                      <span className='text-xs text-gray-400'>{option}</span>
                      <span className='text-xs text-gray-400'>{level}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bands — self-declared, or verified once a source is connected */}
              <section className='flex flex-col gap-6'>
                <div className='flex flex-col gap-1'>
                  <h3 className='text-base font-semibold text-carbon-black'>
                    Self-declared bands
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    Attach a document (accounts, statement, invoice) or a short
                    justification for each claim. Any information that is not
                    backed will stay self-declared until your ESG Specialist
                    reviews it to either confirm or reject your claim.
                  </p>
                </div>
                {BANDS.map((band) =>
                  connectedId ? (
                    <VerifiedBand
                      key={band.name}
                      label={band.label}
                      value={verifiedValueFor(band.name, band.lookup)}
                      provider={CONNECTORS[connectedId].name}
                    />
                  ) : (
                    <div key={band.name} className='flex flex-col gap-3'>
                      <EnumSelectField
                        control={form.control}
                        name={band.name}
                        label={band.label}
                        placeholder='Select band'
                        options={opt(band.lookup)}
                      />
                      <EvidenceRow
                        attachLabel='Attach evidence'
                        hint={EVIDENCE_HINT}
                      />
                    </div>
                  ),
                )}
              </section>
            </div>
          </form>
        </Form>
      </OnboardingShell>

      <AuthoriseDialog
        connector={authoriseId ? CONNECTORS[authoriseId] : null}
        onCancel={() => setAuthoriseId(null)}
        onContinue={continueAuthorise}
      />
    </>
  );
}

/** Read-only band value imported from a connected source. */
function VerifiedBand({
  label,
  value,
  provider,
}: {
  label: string;
  value: string;
  provider: string;
}) {
  return (
    <div className='flex flex-col gap-2'>
      <span className='text-base font-medium text-carbon-black'>{label}</span>
      <div className='flex h-14 items-center justify-between rounded-xl border border-gray-300 bg-muted/40 px-4 text-base text-carbon-black'>
        <span>{value}</span>
        <ChevronDown className='size-4 text-muted-foreground' />
      </div>
      <p className='flex items-center gap-1.5 text-sm text-success-600'>
        <CheckCircle2 className='size-4' />
        Verified via {provider}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  note,
  description,
}: {
  title: string;
  note: string;
  description: string;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <p className='text-base font-medium text-carbon-black'>
        {title} {note}
      </p>
      <p className='text-xs text-muted-foreground'>{description}</p>
    </div>
  );
}
