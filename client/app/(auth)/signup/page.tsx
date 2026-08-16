import type { Metadata } from 'next';
import { SignupForm } from './signup-form';

export const metadata: Metadata = { title: 'Sign up' };

export default function SignupPage() {
  return (
    <section className='flex w-full flex-col gap-10 xl:gap-14'>
      <div className='flex flex-col gap-1 xl:items-center xl:gap-2 xl:text-center'>
        <h1 className='text-[28px] font-semibold leading-9 text-carbon-black xl:text-[48px] xl:leading-16'>
          Create your account
        </h1>
        <p className='text-base leading-6 text-muted-foreground xl:text-2xl xl:leading-8'>
          Free readiness check. No credit search. UK SMEs only.
        </p>
      </div>

      <SignupForm />
    </section>
  );
}
