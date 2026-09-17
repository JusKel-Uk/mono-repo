import { Suspense } from 'react';
import type { Metadata } from 'next';

import { LenderResetCodeForm } from './lender-reset-code-form';

export const metadata: Metadata = { title: 'Verify reset code' };

/** flo@juskel.co.uk → f**@juskel.co.uk */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const masked = local.length <= 1 ? local : `${local[0]}**`;
  return `${masked}@${domain}`;
}

export default async function LenderResetCodePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = '' } = await searchParams;
  const target = email ? maskEmail(email) : 'your email';

  return (
    <section className='flex w-full flex-col gap-14'>
      <div className='flex flex-col items-center justify-center gap-2 text-center'>
        <h1 className='text-[28px] font-semibold text-carbon-black xl:text-5xl'>
          Check your email
        </h1>
        <p className='text-base text-foreground-secondary xl:text-2xl'>
          Enter the 6-digit verification code that was sent to {target}. It
          expires in 5 minutes.
        </p>
      </div>

      <Suspense>
        <LenderResetCodeForm email={email} />
      </Suspense>
    </section>
  );
}
