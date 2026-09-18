'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { ROUTES } from '@/lib/routes';
import {
  lenderResetCodeSchema,
  type LenderResetCodeInput,
} from '@/lib/validations/lender';
import {
  lenderForgotPassword,
  lenderVerifyResetCode,
  ApiError,
} from '@/lib/api/lender-auth';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

const slotClass =
  'size-12 rounded-xl border-2 text-xl font-semibold xl:size-16 xl:rounded-2xl xl:text-2xl';

export function LenderResetCodeForm({ email }: { email: string }) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const form = useForm<LenderResetCodeInput>({
    resolver: zodResolver(lenderResetCodeSchema),
    mode: 'onChange',
    defaultValues: { code: '' },
  });

  const verify = useMutation({
    mutationFn: (v: LenderResetCodeInput) =>
      lenderVerifyResetCode({ email, code: v.code }),
    // The verify step returns a short-lived token that authorises the confirm.
    onSuccess: (data) =>
      router.push(
        `${ROUTES.lender.resetPassword}?token=${encodeURIComponent(data.token)}`,
      ),
  });

  const resend = useMutation({
    mutationFn: () => lenderForgotPassword({ email }),
    onSuccess: () => setSeconds(60),
  });

  const onSubmit = form.handleSubmit((v) => verify.mutate(v));

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        className='flex w-full flex-col gap-10'
      >
        <FormField
          control={form.control}
          name='code'
          render={({ field }) => (
            <FormItem className='flex flex-col items-center gap-3'>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  onComplete={() => onSubmit()}
                >
                  <InputOTPGroup className='gap-2 xl:gap-4'>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} className={slotClass} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage className='text-center' />
            </FormItem>
          )}
        />

        <div className='flex flex-col items-center gap-6'>
          {verify.isError && (
            <p role='alert' className='text-center text-sm text-destructive'>
              {verify.error instanceof ApiError
                ? verify.error.message
                : 'Could not verify the code. Please try again.'}
            </p>
          )}
          <Button
            type='submit'
            loading={verify.isPending}
            disabled={verify.isPending || !form.formState.isValid}
            className='h-14 w-full rounded-lg text-base font-semibold'
          >
            {verify.isPending ? 'Verifying…' : 'Verify Code'}
          </Button>

          <p className='text-center text-base text-gray-600'>
            Didn&apos;t receive a code?{' '}
            {seconds > 0 ? (
              <span>Resend code in {seconds} secs.</span>
            ) : (
              <button
                type='button'
                onClick={() => resend.mutate()}
                disabled={resend.isPending}
                className='font-semibold text-teal-charcoal underline disabled:opacity-60'
              >
                {resend.isPending ? 'Resending…' : 'Resend code'}
              </button>
            )}
          </p>

          <Link
            href={ROUTES.lender.login}
            className='text-base text-teal-charcoal underline'
          >
            Back to Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
}
