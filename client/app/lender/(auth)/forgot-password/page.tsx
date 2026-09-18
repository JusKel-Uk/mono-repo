import type { Metadata } from 'next';

import { LenderForgotPasswordForm } from './lender-forgot-password-form';

export const metadata: Metadata = { title: 'Forgot password' };

export default function LenderForgotPasswordPage() {
  return (
    <section className='flex w-full flex-col gap-14'>
      <div className='flex flex-col items-center justify-center gap-2 text-center'>
        <h1 className='text-[28px] font-semibold text-carbon-black xl:text-5xl'>
          Forgot your password?
        </h1>
        <p className='text-base text-foreground-secondary xl:text-2xl'>
          Enter your email and we&apos;ll send you a code to reset your password.
        </p>
      </div>

      <LenderForgotPasswordForm />
    </section>
  );
}
