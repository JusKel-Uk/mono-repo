import type { Metadata } from 'next';
import { ResetPasswordForm } from './reset-password-form';

export const metadata: Metadata = { title: 'Reset password' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = '' } = await searchParams;

  return (
    <section className='flex w-full flex-col gap-10 xl:gap-14'>
      <div className='flex flex-col gap-1 xl:items-center xl:gap-2 xl:text-center'>
        <h1 className='text-[28px] font-semibold leading-9 text-carbon-black xl:text-[48px] xl:leading-16'>
          Set a new password
        </h1>
        <p className='text-base leading-6 text-muted-foreground xl:text-2xl xl:leading-8'>
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <ResetPasswordForm token={token} />
    </section>
  );
}
