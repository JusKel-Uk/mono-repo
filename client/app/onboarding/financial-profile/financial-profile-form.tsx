'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { CheckCircle2, ChevronDown } from 'lucide-react';

import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  financialProfileSchema,
  type FinancialProfileInput,
  ANNUAL_REVENUE_BANDS,
  EBITDA_BANDS,
  EXISTING_DEBT_BANDS,
  CASH_RESERVES_BANDS,
  AVG_MONTHLY_REVENUE_BANDS,
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
  SelectField,
} from '@/components/onboarding/onboarding-fields';
import { Form } from '@/components/ui/form';

const step = getStep('financial-profile')!;
const FORM_ID = 'financial-profile-form';
const EVIDENCE_HINT = 'PDF, DOC, PNG or JPG · max 10 MB';
// Simulated OAuth round-trip while the real integrations are stubbed.
const CONNECT_DELAY_MS = 2200;

const BANDS: {
  name: keyof FinancialProfileInput;
  label: string;
  options: string[];
}[] = [
  {
    name: 'annualRevenueBand',
    label: 'Annual revenue band',
    options: ANNUAL_REVENUE_BANDS,
  },
  {
    name: 'ebitdaBand',
    label: 'EBITDA / Profitability band',
    options: EBITDA_BANDS,
  },
  {
    name: 'existingDebtBand',
    label: 'Existing debt band',
    options: EXISTING_DEBT_BANDS,
  },
  {
    name: 'cashReserves',
    label: 'Cash reserves',
    options: CASH_RESERVES_BANDS,
  },
  {
    name: 'avgMonthlyRevenue',
    label: 'Average monthly revenue',
    options: AVG_MONTHLY_REVENUE_BANDS,
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
  const saveStep = useOnboardingStore((s) => s.saveStep);
  const markComplete = useOnboardingStore((s) => s.markComplete);

  const form = useForm<FinancialProfileInput>({
    resolver: zodResolver(financialProfileSchema),
    defaultValues: {
      annualRevenueBand: '',
      ebitdaBand: '',
      existingDebtBand: '',
      cashReserves: '',
      avgMonthlyRevenue: '',
    },
  });

  // --- Connector flow (stubbed / simulated) ---
  const [connection, setConnection] = useState<{
    id: ConnectorId;
    status: ConnectionStatus;
  } | null>(null);
  const [authoriseId, setAuthoriseId] = useState<ConnectorId | null>(null);
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusFor = (id: ConnectorId): ConnectionStatus =>
    connection?.id === id ? connection.status : 'idle';
  const connectedId = connection?.status === 'connected' ? connection.id : null;

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

  const disconnect = () => {
    if (connectTimer.current) clearTimeout(connectTimer.current);
    setConnection(null);
    applyVerified(false);
  };

  const continueAuthorise = () => {
    if (authoriseId) startConnect(authoriseId);
    setAuthoriseId(null);
  };

  useEffect(
    () => () => {
      if (connectTimer.current) clearTimeout(connectTimer.current);
    },
    [],
  );

  useEffect(() => {
    const saved = useOnboardingStore.getState().data.financialProfile;
    if (saved) form.reset(saved);
  }, [form]);

  const onSubmit = form.handleSubmit((values) => {
    saveStep('financialProfile', values);
    markComplete('financial-profile');
    const next = nextStepRoute('financial-profile');
    router.push(next ?? '/onboarding');
  });

  const onSaveExit = () => {
    saveStep('financialProfile', form.getValues());
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
            loading={form.formState.isSubmitting}
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
                    onDisconnect={disconnect}
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
                    onDisconnect={disconnect}
                  />
                  <ConnectCard
                    connector={CONNECTORS.quickbooks}
                    status={statusFor('quickbooks')}
                    onConnect={() => setAuthoriseId('quickbooks')}
                    onDisconnect={disconnect}
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
                      value={VERIFIED_BANDS[band.name]}
                      provider={CONNECTORS[connectedId].name}
                    />
                  ) : (
                    <div key={band.name} className='flex flex-col gap-3'>
                      <SelectField
                        control={form.control}
                        name={band.name}
                        label={band.label}
                        placeholder='Select band'
                        options={band.options}
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
    <div className='flex flex-col gap-2 c-border'>
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
