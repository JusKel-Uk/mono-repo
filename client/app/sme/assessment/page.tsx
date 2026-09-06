import type { Metadata } from 'next';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CircleCheck,
  Coins,
  Landmark,
  Leaf,
  Lock,
} from 'lucide-react';

import { stepRoute } from '@/lib/onboarding/steps';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export const metadata: Metadata = { title: 'Assessment' };

type TimelineStep = {
  icon: LucideIcon;
  title: string;
  desc: string;
  time: string;
  href: string;
};

const STEPS: TimelineStep[] = [
  {
    icon: Building2,
    title: 'Company setup',
    desc: 'Legal name, registration, your role, and business basics.',
    time: '3 mins',
    href: stepRoute('company-setup'),
  },
  {
    icon: Briefcase,
    title: 'Business profile',
    desc: 'Sector, location, employees, and years in operation.',
    time: '3 mins',
    href: stepRoute('business-profile'),
  },
  {
    icon: Landmark,
    title: 'Financial profile',
    desc: 'Revenue, profitability, existing debt, cash position, and key financial information.',
    time: '4 mins',
    href: stepRoute('financial-profile'),
  },
  {
    icon: Leaf,
    title: 'Sustainability profile',
    desc: 'Environmental, Social, and Governance.',
    time: '5 mins',
    href: stepRoute('sustainability-profile'),
  },
  {
    icon: Coins,
    title: 'Funding profile',
    desc: 'Amount needed, purpose, term, urgency.',
    time: '2 mins',
    href: stepRoute('funding-profile'),
  },
];

export default function AssessmentPage() {
  return (
    <DashboardShell
      title='Your onboarding submission'
      subtitle='Your answers are locked while an Assessment Specialist reviews, however, you can still upload your documents as evidence.'
    >
      {/* Progress + locked */}
      <section className='rounded-2xl border border-gray-200 bg-white p-7'>
        <div className='flex flex-col gap-7'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex flex-col gap-2'>
              <p className='text-body-lg text-gray-500'>Onboarding progress</p>
              <p className='text-h3 font-semibold text-carbon-black'>
                5 of 5 complete
              </p>
            </div>
            <div className='flex flex-col gap-2 sm:items-end sm:text-right'>
              <p className='text-body-lg text-gray-500'>ASSESSMENT STATUS</p>
              <p className='text-body-lg font-medium text-success-600'>
                Submitted (awaiting review)
              </p>
            </div>
          </div>

          <div className='h-2 w-full overflow-hidden rounded-lg border border-primary/50 bg-gray-300'>
            <div className='h-full w-full rounded-lg bg-primary' />
          </div>

          <div className='flex gap-3 rounded-2xl border border-primary/50 bg-primary p-6 text-mineral-white'>
            <Lock className='size-6 shrink-0' />
            <div className='flex flex-col gap-1'>
              <p className='text-h6 font-semibold'>Submission locked</p>
              <p className='text-body-md'>
                Your answers are being reviewed. If the reviewer needs further
                clarification, you&apos;ll see an information request on your
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Assessment timeline */}
      <section className='flex flex-col gap-5'>
        <div className='flex flex-col gap-0.5'>
          <h2 className='text-h4 font-semibold text-carbon-black'>
            Your assessment timeline
          </h2>
          <p className='text-body-lg text-gray-500'>
            Track your assessment progress, review completed steps, and continue
            where you left off.
          </p>
        </div>

        <ol className='flex flex-col'>
          {STEPS.map((step, i) => {
            const isLast = i === STEPS.length - 1;
            const Icon = step.icon;
            return (
              <li key={step.title} className='flex gap-4 lg:gap-6'>
                {/* Rail */}
                <div className='flex flex-col items-center'>
                  <CircleCheck className='size-6 shrink-0 text-success-600' />
                  {!isLast && <span className='w-px flex-1 bg-gray-300' />}
                </div>

                {/* Card */}
                <div className='mb-4 flex-1'>
                  <div className='rounded-2xl border border-gray-200 bg-white p-5'>
                    <div className='flex items-center justify-between gap-4'>
                      <div className='flex items-center gap-4'>
                        <Icon className='size-4.5 shrink-0 text-carbon-black' />
                        <div className='flex flex-wrap items-center gap-2'>
                          <p className='text-h5 font-medium text-carbon-black'>
                            {step.title}
                          </p>
                          <span className='inline-flex h-6 items-center rounded-full bg-success-50 px-3 text-label-sm text-success-600'>
                            Complete
                          </span>
                        </div>
                      </div>
                      <p className='shrink-0 text-body-md font-medium text-gray-500'>
                        {step.time}
                      </p>
                    </div>
                    <div className='mt-4 flex flex-col gap-4 pl-[34px]'>
                      <p className='text-body-lg text-gray-500'>{step.desc}</p>
                      <Link
                        href={step.href}
                        className='flex w-fit items-center gap-2 text-carbon-black transition-colors hover:text-primary'
                      >
                        <span className='text-body-lg font-semibold'>
                          Review answers
                        </span>
                        <ArrowRight className='size-4.5' />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </DashboardShell>
  );
}
