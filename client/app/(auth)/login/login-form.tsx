'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import { login, ApiError } from '@/lib/api/auth';
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

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      // TODO(auth): route by role once the session/redirect flow lands (M1).
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

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
                  <FormLabel className='text-sm xl:text-lg text-carbon-black'>
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      autoComplete='email'
                      placeholder='Flo@juskel.co.uk'
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
                  <FormLabel className='text-sm xl:text-lg text-carbon-black'>
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
                  <FormLabel className='text-sm xl:text-base text-foreground-secondary'>
                    Remember me
                  </FormLabel>
                </FormItem>
              )}
            />
            <Link
              href={ROUTES.auth.forgotPassword}
              className='underline text-teal-charcoal text-sm xl:text-base'
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <div className='flex flex-col items-center justify-center gap-6'>
          {mutation.isError && (
            <p role='alert' className='text-sm text-destructive'>
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : 'Unable to sign in. Please try again.'}
            </p>
          )}
          <Button type='submit' className='w-full' disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
          <div className='flex items-center gap-4 xl:gap-8'>
            <p className='text-foreground-secondary text-xs xl:text-base'>
              New to JusKel?{' '}
              <Link
                href={ROUTES.auth.signup}
                className='text-teal-charcoal font-bold text-xs xl:text-base'
              >
                Create an Account
              </Link>
            </p>
            {/* Placeholder target until a lender/admin auth flow exists (M1). */}
            <Link
              href={ROUTES.lender.dashboard}
              className='text-teal-charcoal text-xs xl:text-base hover:underline'
            >
              I&apos;m a Lender or Admin
            </Link>
          </div>
        </div>
      </form>
    </Form>
  );
}
