import type { Metadata } from 'next';
import { VerifyCodeForm } from './verify-code-form';

export const metadata: Metadata = { title: 'Verify code' };

/** Mask an email for display: flo@juskel.co.uk → f**@juskel.co.uk */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const masked = local.length <= 1 ? local : `${local[0]}**`;
  return `${masked}@${domain}`;
}

export default async function VerifyResetCodePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = '' } = await searchParams;
  const target = email ? maskEmail(email) : 'your email';

  return (
    <section className='flex w-full flex-col gap-10'>
      <div className='flex flex-col gap-1 xl:items-center xl:gap-2 xl:text-center'>
        <h1 className='text-[28px] font-semibold leading-9 text-carbon-black xl:text-[48px] xl:leading-16'>
          Check your Email
        </h1>
        <p className='text-base leading-6 text-muted-foreground xl:text-2xl xl:leading-8'>
          Enter the 6-digit verification code that was sent to {target}. It
          expires in 5 minutes.
        </p>
      </div>

      <VerifyCodeForm email={email} />
    </section>
  );
}
