import type { Metadata } from 'next';

import { LenderRequestAccessForm } from './lender-request-access-form';

export const metadata: Metadata = { title: 'Request lender access' };

export default function LenderRequestAccessPage() {
  return (
    <section className='flex w-full flex-col gap-14'>
      <div className='flex flex-col items-center justify-center gap-2 text-center'>
        <h1 className='text-[28px] font-semibold text-carbon-black xl:text-5xl'>
          Request access to the Lender Portal
        </h1>
        <p className='text-base text-foreground-secondary xl:text-2xl'>
          Tell us about yourself and your organisation. We&apos;ll review your
          request and contact you with the next steps.
        </p>
      </div>

      <LenderRequestAccessForm />
    </section>
  );
}
