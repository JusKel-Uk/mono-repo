import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, KeyRound, type LucideIcon } from 'lucide-react';

import { ROUTES } from '@/lib/routes';

export const metadata: Metadata = { title: 'Lender Portal' };

type Option = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

const OPTIONS: Option[] = [
  {
    href: ROUTES.lender.login,
    icon: KeyRound,
    title: 'Sign in',
    description:
      "Already have Lender access? Sign in to your organisation's Lender workspace.",
  },
  {
    href: ROUTES.lender.requestAccess,
    icon: Building2,
    title: 'Request access',
    description: 'Need Lender access? Request access from the JusKel team.',
  },
];

export default function LenderAccessPage() {
  return (
    <section className='flex w-full flex-col items-center gap-6'>
      <div className='flex w-full flex-col items-center gap-14'>
        <div className='flex flex-col items-center gap-2 text-center'>
          <h1 className='text-[28px] font-semibold text-carbon-black xl:text-5xl'>
            Lender Portal
          </h1>
          <p className='text-base text-foreground-secondary xl:text-2xl'>
            Review authorised SME intelligence and access your organisation&apos;s
            JusKel lender workspace.
          </p>
        </div>

        <div className='flex w-full flex-col gap-4'>
          {OPTIONS.map(({ href, icon: Icon, title, description }) => (
            <Link
              key={href}
              href={href}
              className='flex min-h-20 w-full items-center justify-between gap-4 rounded-xl border border-gray-200 bg-primary p-[15px] transition-opacity hover:opacity-90'
            >
              <div className='flex items-center gap-4'>
                <div className='flex size-10 shrink-0 items-center justify-center rounded-md bg-mineral-white'>
                  <Icon className='size-5 text-teal-charcoal' />
                </div>
                <div className='flex flex-col text-left'>
                  <span className='text-base font-semibold text-mineral-white'>
                    {title}
                  </span>
                  <span className='text-sm text-gray-200'>{description}</span>
                </div>
              </div>
              <ArrowRight className='size-6 shrink-0 text-mineral-white' />
            </Link>
          ))}
        </div>
      </div>

      <p className='text-center text-sm text-gray-600'>
        Are you an SME looking for funding?{' '}
        <Link
          href={ROUTES.auth.login}
          className='font-bold text-teal-charcoal underline'
        >
          Use the SME sign in
        </Link>
      </p>
    </section>
  );
}
