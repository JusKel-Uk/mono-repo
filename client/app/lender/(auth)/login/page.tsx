import type { Metadata } from 'next';

import { LenderSignInForm } from './lender-sign-in-form';

export const metadata: Metadata = { title: 'Lender sign in' };

export default function LenderLoginPage() {
  return (
    <section className='flex w-full flex-col gap-14'>
      <div className='flex flex-col items-center justify-center gap-2 text-center'>
        <h1 className='text-[28px] font-semibold text-carbon-black xl:text-5xl'>
          Welcome back
        </h1>
        <p className='text-base text-foreground-secondary xl:text-2xl'>
          Sign in to access your organisation&apos;s lender Portal.
        </p>
      </div>

      <LenderSignInForm />
    </section>
  );
}
