import type { Metadata } from 'next';

import { LenderCreateAccountForm } from './lender-create-account-form';

export const metadata: Metadata = { title: 'Create lender account' };

export default function LenderCreateAccountPage() {
  return (
    <section className='flex w-full flex-col gap-14'>
      <div className='flex flex-col items-center justify-center gap-2 text-center'>
        <h1 className='text-[28px] font-semibold text-carbon-black xl:text-5xl'>
          Create your Lender account
        </h1>
        <p className='text-base text-foreground-secondary xl:text-2xl'>
          Set up your login details to access your organisation&apos;s JusKel
          workspace.
        </p>
      </div>

      <LenderCreateAccountForm />
    </section>
  );
}
