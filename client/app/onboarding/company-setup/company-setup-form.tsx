'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Grip, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  companySetupSchema,
  type CompanySetupInput,
  RELATIONSHIP_OPTIONS,
  REGION_OPTIONS,
  EMPLOYEE_BAND_OPTIONS,
  TURNOVER_OPTIONS,
  YEARS_OPTIONS,
} from '@/lib/validations/onboarding';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OnboardingActions } from '@/components/onboarding/onboarding-actions';
import {
  CONTROL,
  FieldCard,
  SelectField,
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

export function CompanySetupForm() {
  const router = useRouter();
  const saveStep = useOnboardingStore((s) => s.saveStep);
  const markComplete = useOnboardingStore((s) => s.markComplete);

  const form = useForm<CompanySetupInput>({
    resolver: zodResolver(companySetupSchema),
    mode: 'onChange',
    defaultValues: {
      companiesHouseNumber: '',
      registeredCompanyName: '',
      relationship: '',
      region: '',
      employeeBand: '',
      annualTurnover: '',
      yearsInOperation: '',
    },
  });

  // Rehydrate any saved draft for this step (client-only → no SSR mismatch).
  useEffect(() => {
    const saved = useOnboardingStore.getState().data.companySetup;
    if (saved) form.reset(saved);
  }, [form]);

  const onSubmit = form.handleSubmit((values) => {
    saveStep('companySetup', values);
    markComplete('company-setup');
    const next = nextStepRoute('company-setup');
    if (next) router.push(next);
  });

  const onSaveExit = () => {
    saveStep('companySetup', form.getValues());
    router.push('/onboarding');
  };

  const handleVerify = () => {
    // TODO(onboarding): Companies House lookup → pre-fill company details.
  };

  return (
    <OnboardingShell
      currentStepTitle={step.title}
      title={step.title}
      subtitle={step.subtitle}
      whyWeAsk={step.whyWeAsk}
      actions={
        <OnboardingActions
          formId={FORM_ID}
          loading={form.formState.isSubmitting}
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
                    <FormControl>
                      <Input
                        placeholder='e.g. 12345678'
                        className={cn(CONTROL, 'flex-1')}
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type='button'
                      onClick={handleVerify}
                      className='h-14 shrink-0 gap-3 rounded-xl border border-gray-300 px-5 text-base font-medium cursor-pointer'
                    >
                      <Search className='size-5' />
                      Verify
                    </Button>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    Verify your business and automatically pre-fill your company
                    details.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TextField
              control={form.control}
              name='registeredCompanyName'
              label='Registered company name'
              placeholder='e.g. JusKel Ltd'
            />
            <SelectField
              control={form.control}
              name='relationship'
              label='Your relationship to the company'
              placeholder='Select your role'
              options={RELATIONSHIP_OPTIONS}
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
                <SelectField
                  control={form.control}
                  name='region'
                  label='Region'
                  options={REGION_OPTIONS}
                />
              </div>
              <div className='flex-1'>
                <SelectField
                  control={form.control}
                  name='employeeBand'
                  label='Employee size band'
                  options={EMPLOYEE_BAND_OPTIONS}
                />
              </div>
            </div>
            <SelectField
              control={form.control}
              name='annualTurnover'
              label='Annual turnover'
              options={TURNOVER_OPTIONS}
              helper='Enter your total gross revenue in 12 months.'
            />
            <SelectField
              control={form.control}
              name='yearsInOperation'
              label='Years in operation'
              options={YEARS_OPTIONS}
            />
          </FieldCard>
        </form>
      </Form>
    </OnboardingShell>
  );
}
