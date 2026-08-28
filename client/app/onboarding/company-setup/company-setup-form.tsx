'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Grip,
  Loader2,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { onboardingKeys, useLookupOptions } from '@/lib/hooks/use-onboarding';
import {
  getCompanySetup,
  saveCompanySetup,
  verifyCompaniesHouse,
  type CompaniesHouseResult,
} from '@/lib/api/onboarding';
import { ApiError } from '@/lib/api/client';
import {
  toCompanySetupRequest,
  fromCompanySetup,
  parseUkAddress,
} from '@/lib/onboarding/mappers';
import {
  companySetupSchema,
  type CompanySetupInput,
} from '@/lib/validations/onboarding';
import { LOOKUP } from '@/lib/onboarding/enums';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OnboardingActions } from '@/components/onboarding/onboarding-actions';
import {
  CONTROL,
  EnumSelectField,
  FieldCard,
  TextField,
} from '@/components/onboarding/onboarding-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const step = getStep('company-setup')!;
const FORM_ID = 'company-setup-form';
const LABEL = 'text-base font-medium text-carbon-black';
const SLUG = 'company-setup';

export function CompanySetupForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const opt = useLookupOptions();

  const form = useForm<CompanySetupInput>({
    resolver: zodResolver(companySetupSchema),
    mode: 'onChange',
    defaultValues: {
      companiesHouseNumber: '',
      legalName: '',
      registeredAddress: '',
      city: '',
      postcode: '',
      relationship: '',
      region: '',
      employeeSizeBand: '',
      annualTurnoverBand: '',
      yearsInOperationBand: '',
    },
  });

  // Load any saved server draft for this step (404 → null → keep empty form).
  const { data: saved } = useQuery({
    queryKey: onboardingKeys.step(SLUG),
    queryFn: getCompanySetup,
  });
  useEffect(() => {
    if (saved) form.reset(fromCompanySetup(saved));
  }, [saved, form]);

  const save = useMutation({
    mutationFn: (values: CompanySetupInput) =>
      saveCompanySetup(toCompanySetupRequest(values)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: onboardingKeys.application });
      qc.invalidateQueries({ queryKey: onboardingKeys.step(SLUG) });
    },
  });

  const verify = useMutation({
    mutationFn: (companyNumber: string) => verifyCompaniesHouse(companyNumber),
    onSuccess: (result) => {
      // Only a verified match auto-fills; a non-match renders the inline notice.
      if (result.isVerified) {
        const set = (name: 'legalName' | 'registeredAddress' | 'city' | 'postcode', value: string) =>
          form.setValue(name, value, { shouldValidate: true, shouldDirty: true });
        set('legalName', result.companyName ?? '');
        if (result.registeredOfficeAddress) {
          // Split the one-line address into line 1 / city / postcode.
          const { line1, city, postcode } = parseUkAddress(
            result.registeredOfficeAddress,
          );
          set('registeredAddress', line1);
          if (city) set('city', city);
          if (postcode) set('postcode', postcode);
        }
        toast.success(`Verified: ${result.companyName}`);
      }
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError && err.status === 429
          ? 'Too many attempts. Please wait a minute and try again.'
          : 'We could not look up that company number. Please try again.',
      ),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
      const next = nextStepRoute(SLUG);
      if (next) router.push(next);
    } catch {
      toast.error('Could not save your details. Please try again.');
    }
  });

  const onSaveExit = async () => {
    // Save only when the form is valid; otherwise leave prior server state as-is.
    if (await form.trigger()) {
      try {
        await save.mutateAsync(form.getValues());
      } catch {
        toast.error('Could not save your details. Please try again.');
      }
    }
    router.push('/onboarding');
  };

  const handleVerify = () => {
    const raw = form.getValues('companiesHouseNumber').trim();
    if (!/^[A-Za-z0-9]{8}$/.test(raw)) {
      form.setError('companiesHouseNumber', {
        message: 'A company number is 8 characters (letters or digits)',
      });
      return;
    }
    verify.mutate(raw);
  };

  // Resets the verified state so the user can enter a different company number.
  const handleChangeCompany = () => verify.reset();

  const isVerified = verify.isSuccess && verify.data?.isVerified === true;
  const notVerified = verify.isSuccess && verify.data?.isVerified === false;

  return (
    <OnboardingShell
      currentStepTitle={step.title}
      title={step.title}
      subtitle={step.subtitle}
      whyWeAsk={step.whyWeAsk}
      actions={
        <OnboardingActions
          formId={FORM_ID}
          loading={save.isPending}
          disabled={!form.formState.isValid}
          onSaveExit={onSaveExit}
        />
      }
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={onSubmit}
          noValidate
          className='flex flex-col gap-6 lg:flex-row lg:items-stretch'
        >
          {/* Card 1 — Company Details */}
          <FieldCard
            icon={Building2}
            label='Company Details'
            className='lg:flex-1'
          >
            <FormField
              control={form.control}
              name='companiesHouseNumber'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2'>
                  <FormLabel className={LABEL}>
                    Companies House number
                  </FormLabel>
                  <div className='flex gap-3'>
                    <div className='relative flex-1'>
                      <FormControl>
                        <Input
                          placeholder='e.g. 12345678'
                          className={cn(CONTROL, 'w-full', notVerified && 'pr-11')}
                          readOnly={isVerified}
                          {...field}
                        />
                      </FormControl>
                      {notVerified && (
                        <TriangleAlert className='pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-destructive' />
                      )}
                    </div>
                    {isVerified ? (
                      <Button
                        type='button'
                        onClick={handleChangeCompany}
                        className='h-14 shrink-0 gap-3 rounded-xl border border-gray-300 px-5 text-base font-medium cursor-pointer'
                      >
                        <X className='size-5' />
                        Change Company
                      </Button>
                    ) : (
                      <Button
                        type='button'
                        onClick={handleVerify}
                        disabled={verify.isPending}
                        className='h-14 shrink-0 gap-3 rounded-xl border border-gray-300 px-5 text-base font-medium cursor-pointer'
                      >
                        {verify.isPending ? (
                          <Loader2 className='size-5 animate-spin' />
                        ) : (
                          <Search className='size-5' />
                        )}
                        Verify
                      </Button>
                    )}
                  </div>
                  {isVerified ? (
                    <VerifiedPanel result={verify.data!} />
                  ) : notVerified ? (
                    <p className='text-sm text-destructive'>
                      No match on Companies House, double-check the number, or
                      fill the form manually.
                    </p>
                  ) : (
                    <p className='text-sm text-muted-foreground'>
                      Verify your business and automatically pre-fill your
                      company details.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <TextField
              control={form.control}
              name='legalName'
              label='Registered company name'
              placeholder='e.g. JusKel Ltd'
            />
            <TextField
              control={form.control}
              name='registeredAddress'
              label='Registered address'
              placeholder='e.g. 1 High Street'
            />
            <div className='flex flex-col gap-5 sm:flex-row sm:gap-4'>
              <div className='flex-1'>
                <TextField
                  control={form.control}
                  name='city'
                  label='City'
                  placeholder='e.g. London'
                />
              </div>
              <div className='flex-1'>
                <TextField
                  control={form.control}
                  name='postcode'
                  label='Postcode'
                  placeholder='e.g. EC1A 1BB'
                />
              </div>
            </div>
            <EnumSelectField
              control={form.control}
              name='relationship'
              label='Your relationship to the company'
              placeholder='Select your role'
              options={opt(LOOKUP.companyRelationship)}
            />
          </FieldCard>

          {/* Card 2 — Basic Business Information */}
          <FieldCard
            icon={Grip}
            label='Basic Business Information'
            className='lg:flex-1'
          >
            <div className='flex flex-col gap-5 sm:flex-row sm:gap-4'>
              <div className='flex-1'>
                <EnumSelectField
                  control={form.control}
                  name='region'
                  label='Region'
                  options={opt(LOOKUP.ukRegion)}
                />
              </div>
              <div className='flex-1'>
                <EnumSelectField
                  control={form.control}
                  name='employeeSizeBand'
                  label='Employee size band'
                  options={opt(LOOKUP.employeeSizeBand)}
                />
              </div>
            </div>
            <EnumSelectField
              control={form.control}
              name='annualTurnoverBand'
              label='Annual turnover'
              options={opt(LOOKUP.annualTurnoverBand)}
              helper='Enter your total gross revenue in 12 months.'
            />
            <EnumSelectField
              control={form.control}
              name='yearsInOperationBand'
              label='Years in operation'
              options={opt(LOOKUP.yearsInOperationBand)}
            />
          </FieldCard>
        </form>
      </Form>
    </OnboardingShell>
  );
}

/** Green "Verified on Companies House" panel shown after a successful lookup. */
function VerifiedPanel({ result }: { result: CompaniesHouseResult }) {
  return (
    <div className='flex gap-3 rounded-2xl border border-success-200 bg-success-50 p-4'>
      <ShieldCheck className='mt-0.5 size-4.5 shrink-0 text-success-600' />
      <div className='flex flex-col gap-1 text-success-600'>
        <p className='text-base font-semibold'>Verified on Companies House</p>
        <p className='text-sm'>
          {result.registeredOfficeAddress
            ? `Registered office: ${result.registeredOfficeAddress}. `
            : ''}
          Company details successfully retrieved from Companies House.
        </p>
      </div>
    </div>
  );
}
