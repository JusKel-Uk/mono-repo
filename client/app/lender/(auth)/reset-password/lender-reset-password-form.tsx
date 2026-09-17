'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CircleCheck, Eye, EyeOff } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import {
  lenderResetPasswordSchema,
  type LenderResetPasswordInput,
} from '@/lib/validations/lender';
import { lenderResetPassword } from '@/lib/api/lender-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const LABEL = 'text-sm font-semibold text-carbon-black xl:text-lg';

export function LenderResetPasswordForm() {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<LenderResetPasswordInput>({
    resolver: zodResolver(lenderResetPasswordSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: LenderResetPasswordInput) =>
      lenderResetPassword({ password: v.password }),
    onSuccess: () => setDone(true),
  });

  const onSubmit = form.handleSubmit((v) => mutation.mutate(v));

  // Success state (Password Successfully Reset).
  if (done) {
    return (
      <section className='flex w-full flex-col items-center gap-10 text-center'>
        <div className='flex flex-col items-center gap-3'>
          <CircleCheck className='size-16 text-success-600' strokeWidth={1.5} />
          <div className='flex flex-col gap-2'>
            <h1 className='text-h3 font-semibold text-carbon-black xl:text-[40px]'>
              Password updated
            </h1>
            <p className='text-base text-foreground-secondary xl:text-xl'>
              Your password has been updated successfully. You can now sign in
              using your new password.
            </p>
          </div>
        </div>
        <Link
          href={ROUTES.lender.login}
          className='inline-flex h-14 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90'
        >
          Return to sign in
        </Link>
      </section>
    );
  }

  return (
    <section className='flex w-full flex-col gap-14'>
      <div className='flex flex-col items-center justify-center gap-2 text-center'>
        <h1 className='text-[28px] font-semibold text-carbon-black xl:text-5xl'>
          Set a new password
        </h1>
        <p className='text-base text-foreground-secondary xl:text-2xl'>
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={onSubmit} noValidate className='flex flex-col gap-10'>
          <div className='flex flex-col gap-8 xl:gap-10'>
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2 xl:gap-4'>
                  <FormLabel className={LABEL}>New Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showPw ? 'text' : 'password'}
                        autoComplete='new-password'
                        className='pr-10'
                        {...field}
                      />
                      <button
                        type='button'
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        className='absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-secondary hover:text-carbon-black'
                      >
                        {showPw ? (
                          <EyeOff className='size-5' />
                        ) : (
                          <Eye className='size-5' />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <p className='text-sm text-gray-600'>
                    Use at least 12 characters with a mix of uppercase,
                    lowercase, numbers, and special symbols (e.g., @, #, $).
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2 xl:gap-4'>
                  <FormLabel className={LABEL}>Confirm Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete='new-password'
                        className='pr-10'
                        {...field}
                      />
                      <button
                        type='button'
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={
                          showConfirm ? 'Hide password' : 'Show password'
                        }
                        className='absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-secondary hover:text-carbon-black'
                      >
                        {showConfirm ? (
                          <EyeOff className='size-5' />
                        ) : (
                          <Eye className='size-5' />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='flex items-center justify-center'>
            <Button
              type='submit'
              loading={mutation.isPending}
              disabled={mutation.isPending || !form.formState.isValid}
              className='h-14 w-full rounded-lg text-base font-semibold'
            >
              {mutation.isPending ? 'Updating…' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Form>
    </section>
  );
}
