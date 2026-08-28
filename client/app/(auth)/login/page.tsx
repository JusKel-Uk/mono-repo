import type { Metadata } from 'next';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <section className='flex flex-col gap-14 w-full'>
      <div className='flex flex-col items-center justify-center gap-2'>
        <h1 className='text-[28px] xl:text-5xl font-semibold text-carbon-black'>
          Welcome back
        </h1>
        <p className='text-base xl:text-2xl text-foreground-secondary'>
          Sign in to your JusKel account.
        </p>
      </div>

      <LoginForm next={next} />
    </section>
  );
}
