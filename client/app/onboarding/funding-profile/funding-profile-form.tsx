'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  fundingProfileSchema,
  type FundingProfileInput,
  FUNDING_PURPOSE_OPTIONS,
  URGENCY_OPTIONS,
} from '@/lib/validations/onboarding';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OnboardingActions } from '@/components/onboarding/onboarding-actions';
import {
  FieldCard,
  SelectField,
  TextField,
} from '@/components/onboarding/onboarding-fields';
import { Form } from '@/components/ui/form';

const step = getStep('funding-profile')!;
const FORM_ID = 'funding-profile-form';

export function FundingProfileForm() {
  const router = useRouter();
  const saveStep = useOnboardingStore((s) => s.saveStep);
  const markComplete = useOnboardingStore((s) => s.markComplete);

  const form = useForm<FundingProfileInput>({
    resolver: zodResolver(fundingProfileSchema),
    mode: 'onChange',
    defaultValues: { amount: '', purpose: '', term: '', urgency: '' },
  });

  useEffect(() => {
    const saved = useOnboardingStore.getState().data.fundingProfile;
    if (saved) form.reset(saved);
  }, [form]);

  const onSubmit = form.handleSubmit((values) => {
    saveStep('fundingProfile', values);
    markComplete('funding-profile');
    const next = nextStepRoute('funding-profile');
    router.push(next ?? '/onboarding');
  });

  const onSaveExit = () => {
    saveStep('fundingProfile', form.getValues());
    router.push('/onboarding');
  };

  return (
    <OnboardingShell
      currentStepTitle={step.title}
      title={step.title}
      subtitle={step.subtitle}
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
        <form id={FORM_ID} onSubmit={onSubmit} noValidate>
          <FieldCard className='mx-auto w-full max-w-120'>
            <TextField
              control={form.control}
              name='amount'
              label='Funding amount needed (£)'
              placeholder='e.g. £150,000'
            />
            <SelectField
              control={form.control}
              name='purpose'
              label='Funding purpose'
              placeholder='Select purpose'
              options={FUNDING_PURPOSE_OPTIONS}
            />
            <TextField
              control={form.control}
              name='term'
              label='Desired term (months)'
              placeholder='e.g. 60'
              type='number'
            />
            <SelectField
              control={form.control}
              name='urgency'
              label='Urgency'
              options={URGENCY_OPTIONS}
            />
          </FieldCard>
        </form>
      </Form>
    </OnboardingShell>
  );
}
