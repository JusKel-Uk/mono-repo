'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  businessProfileSchema,
  type BusinessProfileInput,
  SECTOR_OPTIONS,
} from '@/lib/validations/onboarding';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OnboardingActions } from '@/components/onboarding/onboarding-actions';
import {
  FieldCard,
  SelectField,
  TextField,
  TextareaField,
} from '@/components/onboarding/onboarding-fields';
import { Form } from '@/components/ui/form';

const step = getStep('business-profile')!;
const FORM_ID = 'business-profile-form';

export function BusinessProfileForm() {
  const router = useRouter();
  const saveStep = useOnboardingStore((s) => s.saveStep);
  const markComplete = useOnboardingStore((s) => s.markComplete);

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

  useEffect(() => {
    const saved = useOnboardingStore.getState().data.businessProfile;
    if (saved) form.reset(saved);
  }, [form]);

  const onSubmit = form.handleSubmit((values) => {
    saveStep('businessProfile', values);
    markComplete('business-profile');
    const next = nextStepRoute('business-profile');
    if (next) router.push(next);
  });

  const onSaveExit = () => {
    saveStep('businessProfile', form.getValues());
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
          {/* Left — company details */}
          <FieldCard className='lg:flex-1'>
            <SelectField
              control={form.control}
              name='sector'
              label='Sector'
              placeholder='Select your sector'
              options={SECTOR_OPTIONS}
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
