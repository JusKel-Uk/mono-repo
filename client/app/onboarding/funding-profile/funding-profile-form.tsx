'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { onboardingKeys, useLookupOptions } from '@/lib/hooks/use-onboarding';
import { getFundingProfile, saveFundingProfile } from '@/lib/api/onboarding';
import {
  toFundingProfileRequest,
  fromFundingProfile,
} from '@/lib/onboarding/mappers';
import { LOOKUP } from '@/lib/onboarding/enums';
import {
  fundingProfileSchema,
  type FundingProfileInput,
} from '@/lib/validations/onboarding';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OnboardingActions } from '@/components/onboarding/onboarding-actions';
import {
  EnumSelectField,
  FieldCard,
  TextField,
} from '@/components/onboarding/onboarding-fields';
import { Form } from '@/components/ui/form';

const step = getStep('funding-profile')!;
const FORM_ID = 'funding-profile-form';
const SLUG = 'funding-profile';

export function FundingProfileForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const opt = useLookupOptions();

  const form = useForm<FundingProfileInput>({
    resolver: zodResolver(fundingProfileSchema),
    mode: 'onChange',
    defaultValues: { amount: '', purpose: '', term: '', urgency: '' },
  });

  const { data: saved } = useQuery({
    queryKey: onboardingKeys.step(SLUG),
    queryFn: getFundingProfile,
  });
  useEffect(() => {
    if (saved) form.reset(fromFundingProfile(saved));
  }, [saved, form]);

  const save = useMutation({
    mutationFn: (values: FundingProfileInput) =>
      saveFundingProfile(toFundingProfileRequest(values)),
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
      toast.error('Could not save your funding details. Please try again.');
    }
  });

  const onSaveExit = async () => {
    if (await form.trigger()) {
      try {
        await save.mutateAsync(form.getValues());
      } catch {
        toast.error('Could not save your funding details. Please try again.');
      }
    }
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
          loading={save.isPending}
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
            <EnumSelectField
              control={form.control}
              name='purpose'
              label='Funding purpose'
              placeholder='Select purpose'
              options={opt(LOOKUP.fundingPurpose)}
            />
            <TextField
              control={form.control}
              name='term'
              label='Desired term (months)'
              placeholder='e.g. 60'
              type='number'
            />
            <EnumSelectField
              control={form.control}
              name='urgency'
              label='Urgency'
              options={opt(LOOKUP.fundingUrgency)}
            />
          </FieldCard>
        </form>
      </Form>
    </OnboardingShell>
  );
}
