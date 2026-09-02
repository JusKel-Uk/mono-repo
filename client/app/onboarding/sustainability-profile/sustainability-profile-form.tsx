'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { getStep, nextStepRoute } from '@/lib/onboarding/steps';
import { onboardingKeys } from '@/lib/hooks/use-onboarding';
import {
  getSustainabilityProfile,
  saveSustainabilityProfile,
  uploadSustainabilityEvidence,
  removeSustainabilityEvidence,
  downloadSustainabilityEvidence,
  type SustainabilityQuestionKey,
} from '@/lib/api/onboarding';
import {
  toSustainabilityProfileRequest,
  fromSustainabilityProfile,
} from '@/lib/onboarding/mappers';
import {
  sustainabilityProfileSchema,
  type SustainabilityProfileInput,
} from '@/lib/validations/onboarding';
import { OnboardingShell } from '@/components/onboarding/onboarding-shell';
import { OnboardingActions } from '@/components/onboarding/onboarding-actions';
import { EvidenceAttach } from '@/components/onboarding/evidence-attach';
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
type Question = {
  name: QuestionName;
  key: SustainabilityQuestionKey;
  label: string;
  options: string[];
};
type Section = { pillar: string; desc: string; questions: Question[] };

const SECTIONS: Section[] = [
  {
    pillar: 'Environmental',
    desc: 'We understand how your business manages its environmental impact.',
    questions: [
      {
        name: 'ghgEmissions',
        key: 1,
        label:
          'Do you measure greenhouse gas emissions (Scope 1, Scope 2 or Scope 3)?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'sustainabilityPolicy',
        key: 2,
        label: 'Do you have a sustainability policy?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'resourceTracking',
        key: 3,
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
        key: 4,
        label:
          'Do you provide regular health, safety, or wellbeing initiatives for employees?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'training',
        key: 5,
        label:
          'Do you provide training or professional development opportunities for employees?',
        options: ['Yes', 'No', 'Occasionally'],
      },
      {
        name: 'dei',
        key: 6,
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
        key: 7,
        label:
          'Does your business have a Business Continuity or Disaster Recovery Plan?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'governancePolicies',
        key: 8,
        label:
          'Does your business have documented governance or risk management policies?',
        options: ['Yes', 'No', 'In progress'],
      },
      {
        name: 'riskReview',
        key: 9,
        label:
          'Do you regularly review compliance, operational risks, or supplier risks?',
        options: ['Yes', 'No', 'Occasionally'],
      },
    ],
  },
];

const SLUG = 'sustainability-profile';

export function SustainabilityProfileForm() {
  const router = useRouter();
  const qc = useQueryClient();

  const form = useForm<SustainabilityProfileInput>({
    resolver: zodResolver(sustainabilityProfileSchema),
    mode: 'onChange',
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

  const { data: saved } = useQuery({
    queryKey: onboardingKeys.step(SLUG),
    queryFn: getSustainabilityProfile,
  });
  useEffect(() => {
    if (saved) form.reset(fromSustainabilityProfile(saved));
  }, [saved, form]);

  // First uploaded file per question, to rehydrate the attach control on load.
  const evidenceByKey = useMemo(() => {
    const map = new Map<number, { evidenceId: string; fileName: string }>();
    saved?.evidence?.forEach((e) => {
      if (!map.has(e.questionKey)) {
        map.set(e.questionKey, {
          evidenceId: e.evidenceId,
          fileName: e.fileName,
        });
      }
    });
    return map;
  }, [saved]);

  const save = useMutation({
    mutationFn: (values: SustainabilityProfileInput) =>
      saveSustainabilityProfile(toSustainabilityProfileRequest(values)),
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
      toast.error('Could not save your answers. Please try again.');
    }
  });

  const onSaveExit = async () => {
    if (await form.trigger()) {
      try {
        await save.mutateAsync(form.getValues());
      } catch {
        toast.error('Could not save your answers. Please try again.');
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
                  <h3 className='text-base font-medium text-carbon-black'>
                    {section.pillar}
                  </h3>
                  <p className='text-xs text-muted-foreground'>
                    {section.desc}
                  </p>
                </div>
                {section.questions.map((q) => (
                  <RadioQuestion
                    key={q.name}
                    control={form.control}
                    name={q.name}
                    questionKey={q.key}
                    label={q.label}
                    options={q.options}
                    initialEvidence={evidenceByKey.get(q.key)}
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
  questionKey,
  label,
  options,
  initialEvidence,
}: {
  control: Control<SustainabilityProfileInput>;
  name: QuestionName;
  questionKey: SustainabilityQuestionKey;
  label: string;
  options: string[];
  initialEvidence?: { evidenceId: string; fileName: string };
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-col gap-2'>
          <FormLabel className='text-base font-medium text-carbon-black'>
            {label}
          </FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className='flex flex-wrap gap-x-5 gap-y-2'
            >
              {options.map((opt) => (
                <label
                  key={opt}
                  className='flex cursor-pointer items-center gap-2 text-base text-carbon-black'
                >
                  <RadioGroupItem
                    value={opt}
                    className='border-carbon-black cursor-pointer'
                  />
                  {opt}
                </label>
              ))}
            </RadioGroup>
          </FormControl>
          <EvidenceAttach
            attachLabel='Attach certification proof'
            hint='PDF, DOC, PNG or JPG · max 10 MB'
            onUpload={(file) => uploadSustainabilityEvidence(file, questionKey)}
            onRemove={removeSustainabilityEvidence}
            onView={downloadSustainabilityEvidence}
            initial={initialEvidence}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
