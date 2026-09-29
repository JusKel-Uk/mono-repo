'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { useLenderOnboardingStore } from '@/stores/lenderOnboardingStore';
import { LenderShell } from '@/components/lender/lender-shell';

const TERMS = [
  {
    title: 'Platform terms of use',
    body: 'JusKel provides sustainability-finance information to support your own processes. Access is granted per organisation and is not transferable.',
  },
  {
    title: 'Confidentiality obligations',
    body: 'SME summaries are confidential. You may not redistribute, republish or share them outside your organisation without the SME’s explicit permission.',
  },
  {
    title: 'Appropriate use of SME information',
    body: 'You may use SME summaries only to assess suitability for your own funding products. You may not attempt to reconstruct hidden information or contact SMEs outside agreed platform purposes.',
  },
  {
    title: 'AI-generated insight limitations',
    body: 'AI-assisted outputs may classify, summarise, and explain supporting information. Material JusKel intelligence presented to lenders is subject to the applicable JusKel validation and review controls. AI does not make lending, underwriting or credit-approval decisions.',
  },
  {
    title: 'Sustainability Finance Score limitations',
    body: 'The Sustainability Finance Score and associated JusKel intelligence are informational and decision-support outputs. They are not credit ratings, probability-of-default measures, underwriting decisions, lending advice or credit approvals and do not replace the lender’s own due diligence.',
  },
  {
    title: 'SME consent requirements',
    body: 'SME visibility is consent-based. Where consent is withdrawn or a match is deactivated, access to that SME summary is removed.',
  },
];

/** Lender onboarding step 1 — accept the Terms of Use. */
export function LenderTermsView() {
  const router = useRouter();
  const acceptTerms = useLenderOnboardingStore((s) => s.acceptTerms);
  const [acknowledged, setAcknowledged] = useState(false);

  const accept = () => {
    acceptTerms();
    router.push(ROUTES.lender.setUpOrganisation);
  };

  return (
    <LenderShell
      title='Terms & agreements'
      subtitle='Kindly acknowledge these terms to access SME summaries and sustainability-finance outputs.'
    >
      <div className='flex flex-col gap-4'>
        {/* Version badge */}
        <span className='inline-flex w-fit items-center gap-1 rounded-2xl border border-[#dec391] bg-[#faf6ef] py-1 pl-3 pr-2.5 text-body-sm font-medium text-refined-gold'>
          <ShieldCheck className='size-3' />
          v2.1 · August 8, 2026
        </span>

        {/* Term cards */}
        {TERMS.map((t, i) => (
          <div
            key={t.title}
            className='flex gap-6 rounded-2xl border border-gray-200 bg-white p-7'
          >
            <span className='text-body-sm font-bold text-gray-500'>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className='flex flex-col gap-0.5'>
              <p className='text-h5 font-semibold text-carbon-black'>
                {t.title}
              </p>
              <p className='text-body-md text-gray-500'>{t.body}</p>
            </div>
          </div>
        ))}

        {/* Acknowledgment */}
        <div className='flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-7'>
          <label className='flex items-start gap-3'>
            <input
              type='checkbox'
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className='mt-1 size-5 shrink-0 rounded border-gray-300 accent-teal-charcoal'
            />
            <span className='text-body-md text-carbon-black'>
              I acknowledge that JusKel outputs are directional and
              informational, do not constitute underwriting, lending advice or
              credit approval, that SME summaries are confidential and
              consent-based, and that data must not be redistributed without
              permission.
            </span>
          </label>
          <button
            type='button'
            disabled={!acknowledged}
            onClick={accept}
            className={cn(
              'ml-8 inline-flex w-fit items-center rounded-lg px-5 py-3 text-base font-semibold shadow-xs',
              acknowledged
                ? 'bg-primary text-mineral-white'
                : 'cursor-not-allowed bg-stone-grey text-gray-400',
            )}
          >
            Accept and continue
          </button>
        </div>
      </div>
    </LenderShell>
  );
}
