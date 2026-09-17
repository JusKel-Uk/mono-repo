'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import {
  lenderCreateAccountSchema,
  type LenderCreateAccountInput,
} from '@/lib/validations/lender';
import { lenderCreateAccount } from '@/lib/api/lender-auth';
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
// The pre-approved email is fixed once a lender access request is granted.
const APPROVED_EMAIL = 'lender@company.co.uk';

export function LenderCreateAccountForm() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<LenderCreateAccountInput>({
    resolver: zodResolver(lenderCreateAccountSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: APPROVED_EMAIL,
      password: '',
      confirmPassword: '',
    },
  });

  const mutation = useMutation({
    mutationFn: lenderCreateAccount,
    onSuccess: () => router.push(ROUTES.lender.dashboard),
  });

  const onSubmit = form.handleSubmit((v) => mutation.mutate(v));

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className='flex flex-col gap-10'>
        <div className='flex flex-col gap-8 xl:gap-10'>
          <div className='grid gap-8 sm:grid-cols-2'>
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2 xl:gap-4'>
                  <FormLabel className={LABEL}>First Name</FormLabel>
                  <FormControl>
                    <Input autoComplete='given-name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='lastName'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2 xl:gap-4'>
                  <FormLabel className={LABEL}>Last Name</FormLabel>
                  <FormControl>
                    <Input autoComplete='family-name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Business email — pre-approved, read-only */}
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='flex flex-col gap-2 xl:gap-4'>
                <FormLabel className={LABEL}>Business Email</FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input type='email' disabled className='pr-10' {...field} />
                    <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400'>
                      <Lock className='size-5' />
                    </span>
                  </div>
                </FormControl>
                <p className='text-sm text-gray-600'>
                  This is the business email address approved for your JusKel
                  lender access request. It can&apos;t be changed here.
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem className='flex flex-col gap-2 xl:gap-4'>
                <FormLabel className={LABEL}>Password</FormLabel>
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
                  Use at least 12 characters with a mix of uppercase, lowercase,
                  numbers, and special symbols (e.g., @, #, $).
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
            {mutation.isPending ? 'Creating account…' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
