'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { cn } from '@/lib/utils';
import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { useOnboardingStore } from '@/stores/onboardingStore';
import {
  sustainabilityProfileSchema,
  type SustainabilityProfileInput,
} from '@/lib/validations/onboarding';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OnboardingActions } from '@/components/onboarding/onboarding-actions';
import { EvidenceRow } from '@/components/onboarding/onboarding-fields';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const step = getStep('sustainability-profile')!;
const FORM_ID = 'sustainability-profile-form';

type QuestionName = keyof SustainabilityProfileInput;
type Question = { name: QuestionName; label: string; options: string[] };
type Section = { pillar: string; desc: string; questions: Question[] };

const SECTIONS: Section[] = [
  {
    pillar: 'Environmental',
    desc: 'We understand how your business manages its environmental impact.',
    questions: [
      {
        name: 'ghgEmissions',
        label:
          'Do you measure greenhouse gas emissions (Scope 1, Scope 2 or Scope 3)?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'sustainabilityPolicy',
        label: 'Do you have a sustainability policy?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'resourceTracking',
        label: 'Do you track energy, water, or waste consumption?',
        options: ['Yes', 'No', 'Partially'],
      },
    ],
  },
  {
    pillar: 'Social',
    desc: 'Tell us how your business supports employees, customers, and the wider community.',
    questions: [
      {
        name: 'wellbeing',
        label:
          'Do you provide regular health, safety, or wellbeing initiatives for employees?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'training',
        label:
          'Do you provide training or professional development opportunities for employees?',
        options: ['Yes', 'No', 'Occasionally'],
      },
      {
        name: 'dei',
        label:
          'Do you have policies that promote equality, diversity, and inclusion?',
        options: ['Yes', 'No', 'In progress'],
      },
    ],
  },
  {
    pillar: 'Governance',
    desc: 'Help us understand how your business is managed and how risks are controlled.',
    questions: [
      {
        name: 'continuity',
        label:
          'Does your business have a Business Continuity or Disaster Recovery Plan?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'governancePolicies',
        label:
          'Does your business have documented governance or risk management policies?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'riskReview',
        label:
          'Do you regularly review compliance, operational risks, or supplier risks?',
        options: ['Yes', 'No', 'Occasionally'],
      },
    ],
  },
];

export function SustainabilityProfileForm() {
  const router = useRouter();
  const saveStep = useOnboardingStore((s) => s.saveStep);
  const markComplete = useOnboardingStore((s) => s.markComplete);

  const form = useForm<SustainabilityProfileInput>({
    resolver: zodResolver(sustainabilityProfileSchema),
    defaultValues: {
      ghgEmissions: '',
      sustainabilityPolicy: '',
      resourceTracking: '',
      wellbeing: '',
      training: '',
      dei: '',
      continuity: '',
      governancePolicies: '',
      riskReview: '',
    },
  });

  useEffect(() => {
    const saved = useOnboardingStore.getState().data.sustainabilityProfile;
    if (saved) form.reset(saved);
  }, [form]);

  const onSubmit = form.handleSubmit((values) => {
    saveStep('sustainabilityProfile', values);
    markComplete('sustainability-profile');
    const next = nextStepRoute('sustainability-profile');
    router.push(next ?? '/onboarding');
  });

  const onSaveExit = () => {
    saveStep('sustainabilityProfile', form.getValues());
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
          onSaveExit={onSaveExit}
        />
      }
    >
      <Form {...form}>
        <form id={FORM_ID} onSubmit={onSubmit} noValidate>
          <div className='mx-auto w-full max-w-170 overflow-hidden rounded-2xl border border-border bg-white'>
            {SECTIONS.map((section, i) => (
              <div
                key={section.pillar}
                className={cn(
                  'flex flex-col gap-6 p-6 lg:p-8',
                  i > 0 && 'border-t border-border',
                )}
              >
                <div className='flex flex-col gap-1'>
                  <h3 className='text-base font-semibold text-carbon-black'>
                    {section.pillar}
                  </h3>
                  <p className='text-sm text-muted-foreground'>
                    {section.desc}
                  </p>
                </div>
                {section.questions.map((q) => (
                  <RadioQuestion
                    key={q.name}
                    control={form.control}
                    name={q.name}
                    label={q.label}
                    options={q.options}
                  />
                ))}
              </div>
            ))}
          </div>
        </form>
      </Form>
    </OnboardingShell>
  );
}

function RadioQuestion({
  control,
  name,
  label,
  options,
}: {
  control: Control<SustainabilityProfileInput>;
  name: QuestionName;
  label: string;
  options: string[];
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-col gap-3'>
          <FormLabel className='text-[15px] font-semibold text-carbon-black'>
            {label}
          </FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className='flex flex-wrap gap-x-6 gap-y-2'
            >
              {options.map((opt) => (
                <label
                  key={opt}
                  className='flex cursor-pointer items-center gap-2 text-sm text-carbon-black'
                >
                  <RadioGroupItem value={opt} />
                  {opt}
                </label>
              ))}
            </RadioGroup>
          </FormControl>
          <EvidenceRow
            attachLabel='Attach certification proof'
            hint='Certificate PDF or link screenshot · max 10 MB'
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
