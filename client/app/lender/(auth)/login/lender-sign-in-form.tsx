'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { lenderSignIn, ApiError } from '@/lib/api/lender-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export function LenderSignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const mutation = useMutation({
    mutationFn: (v: LoginInput) =>
      lenderSignIn({ email: v.email, password: v.password }),
    onSuccess: () => {
      // Drop any stale cache from a prior session (same token cookie as SME).
      qc.clear();
      router.push(ROUTES.lender.dashboard);
    },
  });

  // Valid credentials but no lender access → a clearer message than the raw 403.
  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.code === 'NOT_LENDER_ACCOUNT'
        ? "This account doesn't have access to the Lender Portal."
        : mutation.error.message
      : 'Unable to sign in. Please try again.';

  const onSubmit = form.handleSubmit((v) => mutation.mutate(v));

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className='flex flex-col gap-10'>
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-8 xl:gap-10'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2 xl:gap-4'>
                  <FormLabel className='text-sm font-semibold text-carbon-black xl:text-lg'>
                    Business Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      autoComplete='email'
                      placeholder='you@company.co.uk'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2 xl:gap-4'>
                  <FormLabel className='text-sm font-semibold text-carbon-black xl:text-lg'>
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete='current-password'
                        placeholder='********'
                        className='pr-10'
                        {...field}
                      />
                      <button
                        type='button'
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        aria-pressed={showPassword}
                        className='absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-secondary hover:text-carbon-black'
                      >
                        {showPassword ? (
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

          <div className='flex items-center justify-between gap-2'>
            <FormField
              control={form.control}
              name='rememberMe'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center gap-3 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className='text-sm text-foreground-secondary xl:text-base'>
                    Keep me signed in
                  </FormLabel>
                </FormItem>
              )}
            />
            <Link
              href={ROUTES.lender.forgotPassword}
              className='text-sm text-teal-charcoal underline xl:text-base'
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <div className='flex flex-col items-center justify-center gap-6'>
          {mutation.isError && (
            <p role='alert' className='w-full text-sm text-destructive'>
              {errorMessage}
            </p>
          )}
          <Button
            type='submit'
            loading={mutation.isPending}
            disabled={mutation.isPending || !form.formState.isValid}
            className='h-14 w-full rounded-lg text-base font-semibold'
          >
            {mutation.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className='text-xs text-foreground-secondary xl:text-base'>
            Don&apos;t have Lender access yet?{' '}
            <Link
              href={ROUTES.lender.requestAccess}
              className='font-bold text-teal-charcoal underline'
            >
              Request access
            </Link>
          </p>
        </div>
      </form>
    </Form>
  );
}
