'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { ROUTES } from '@/lib/routes';
import { verifyCodeSchema, type VerifyCodeInput } from '@/lib/validations/auth';
import {
  verifyResetCode,
  requestPasswordReset,
  ApiError,
} from '@/lib/api/auth';
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
  'size-11 rounded-md border text-lg font-semibold xl:size-14 xl:text-2xl';

export function VerifyCodeForm({ email }: { email: string }) {
  const router = useRouter();

  const form = useForm<VerifyCodeInput>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: VerifyCodeInput) =>
      verifyResetCode({ email, code: values.code }),
    onSuccess: (data) => {
      router.push(
        `${ROUTES.auth.resetPassword}?token=${encodeURIComponent(data.token)}`,
      );
    },
  });

  const resend = useMutation({
    mutationFn: () => requestPasswordReset({ email }),
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        className='flex w-full flex-col gap-8 xl:gap-10'
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
                  <InputOTPGroup className='gap-1.5 xl:gap-3'>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} className={slotClass} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              {mutation.isError ? (
                <p role='alert' className='text-center text-sm text-destructive'>
                  {mutation.error instanceof ApiError
                    ? mutation.error.message
                    : 'Something went wrong. Please try again.'}
                </p>
              ) : (
                <FormMessage className='text-center' />
              )}
            </FormItem>
          )}
        />

        <div className='flex flex-col items-center gap-6'>
          <Button type='submit' disabled={mutation.isPending} className='w-full'>
            {mutation.isPending ? 'Verifying…' : 'Verify Code'}
          </Button>
          <p className='text-sm text-muted-foreground xl:text-base'>
            Didn&apos;t get any code?{' '}
            <button
              type='button'
              onClick={() => resend.mutate()}
              disabled={resend.isPending}
              className='text-teal-charcoal underline disabled:opacity-60'
            >
              {resend.isPending
                ? 'Sending…'
                : resend.isSuccess
                  ? 'Code sent'
                  : 'Click to resend'}
            </button>
          </p>
          <Link
            href={ROUTES.auth.login}
            className='text-sm text-teal-charcoal underline xl:text-base'
          >
            Back to Login
          </Link>
        </div>
      </form>
    </Form>
  );
}
