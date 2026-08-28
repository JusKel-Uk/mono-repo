'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { onboardingKeys, useLookupOptions } from '@/lib/hooks/use-onboarding';
import {
  getBusinessProfile,
  saveBusinessProfile,
  getCompanySetup,
} from '@/lib/api/onboarding';
import {
  toBusinessProfileRequest,
  fromBusinessProfile,
} from '@/lib/onboarding/mappers';
import { LOOKUP } from '@/lib/onboarding/enums';
import {
  businessProfileSchema,
  type BusinessProfileInput,
} from '@/lib/validations/onboarding';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OnboardingActions } from '@/components/onboarding/onboarding-actions';
import {
  EnumSelectField,
  FieldCard,
  TextField,
  TextareaField,
} from '@/components/onboarding/onboarding-fields';
import { Form } from '@/components/ui/form';

const step = getStep('business-profile')!;
const FORM_ID = 'business-profile-form';
const SLUG = 'business-profile';

export function BusinessProfileForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const opt = useLookupOptions();

  const form = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
    mode: 'onChange',
    defaultValues: {
      sector: '',
      subSector: '',
      city: '',
      postcode: '',
      description: '',
    },
  });

  const { data: saved } = useQuery({
    queryKey: onboardingKeys.step(SLUG),
    queryFn: getBusinessProfile,
  });
  useEffect(() => {
    if (saved) form.reset(fromBusinessProfile(saved));
  }, [saved, form]);

  // region + size bands are inherited from company setup (not re-collected here).
  const { data: company } = useQuery({
    queryKey: onboardingKeys.step('company-setup'),
    queryFn: getCompanySetup,
  });

  const save = useMutation({
    mutationFn: (values: BusinessProfileInput) =>
      saveBusinessProfile(toBusinessProfileRequest(values, company)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: onboardingKeys.application });
      qc.invalidateQueries({ queryKey: onboardingKeys.step(SLUG) });
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(values);
      const next = nextStepRoute(SLUG);
      if (next) router.push(next);
    } catch {
      toast.error('Could not save your business profile. Please try again.');
    }
  });

  const onSaveExit = async () => {
    if (await form.trigger()) {
      try {
        await save.mutateAsync(form.getValues());
      } catch {
        toast.error('Could not save your business profile. Please try again.');
      }
    }
    router.push('/onboarding');
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
          {/* Left — company details */}
          <FieldCard className='lg:flex-1'>
            <EnumSelectField
              control={form.control}
              name='sector'
              label='Sector'
              placeholder='Select your sector'
              options={opt(LOOKUP.businessSector)}
            />
            <TextField
              control={form.control}
              name='subSector'
              label='Sub-sector (Optional)'
              placeholder='e.g. IT services'
            />
            <div className='flex flex-col gap-5 sm:flex-row sm:gap-4'>
              <div className='flex-1'>
                <TextField
                  control={form.control}
                  name='city'
                  label='City / Town'
                  placeholder='e.g. Manchester'
                />
              </div>
              <div className='flex-1'>
                <TextField
                  control={form.control}
                  name='postcode'
                  label='Postcode'
                  placeholder='M1 1AA'
                />
              </div>
            </div>
          </FieldCard>

          {/* Right — description */}
          <FieldCard className='lg:flex-1'>
            <TextareaField
              control={form.control}
              name='description'
              label='Short business description'
              placeholder='Describe your core products, services and primary customers'
            />
          </FieldCard>
        </form>
      </Form>
    </OnboardingShell>
  );
}
