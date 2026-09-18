'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, TriangleAlert } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import {
  lenderCreateAccountSchema,
  type LenderCreateAccountInput,
} from '@/lib/validations/lender';
import {
  lenderCreateAccount,
  lenderInvitePreview,
  ApiError,
} from '@/lib/api/lender-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const LABEL = 'text-sm font-semibold text-carbon-black xl:text-lg';

/** Shown when the invite token is missing, invalid, or expired. */
function InvalidInvite() {
  return (
    <section className='flex w-full flex-col items-center gap-10 text-center'>
      <div className='flex flex-col items-center gap-3'>
        <TriangleAlert className='size-16 text-warning-600' strokeWidth={1.5} />
        <div className='flex flex-col gap-2'>
          <h1 className='text-h3 font-semibold text-carbon-black xl:text-[40px]'>
            This invite link isn&apos;t valid
          </h1>
          <p className='text-base text-foreground-secondary xl:text-xl'>
            The link may have expired or already been used. Request access again
            to receive a new invite, or sign in if you already have an account.
          </p>
        </div>
      </div>
      <div className='flex w-full flex-col items-center gap-4'>
        <Link
          href={ROUTES.lender.requestAccess}
          className='inline-flex h-14 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-mineral-white shadow-xs transition-opacity hover:opacity-90'
        >
          Request access
        </Link>
        <Link
          href={ROUTES.lender.login}
          className='text-base text-teal-charcoal underline'
        >
          Back to Sign in
        </Link>
      </div>
    </section>
  );
}

export function LenderCreateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const preview = useQuery({
    queryKey: ['lender-invite', token],
    queryFn: () => lenderInvitePreview(token),
    enabled: token.length > 0,
    retry: false,
    staleTime: Infinity,
  });

  const form = useForm<LenderCreateAccountInput>({
    resolver: zodResolver(lenderCreateAccountSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Prefill from the approved invite once it loads (the email stays locked).
  const { reset } = form;
  useEffect(() => {
    if (!preview.data) return;
    reset({
      firstName: preview.data.firstName ?? '',
      lastName: preview.data.lastName ?? '',
      email: preview.data.email,
      password: '',
      confirmPassword: '',
    });
  }, [preview.data, reset]);

  const mutation = useMutation({
    mutationFn: (v: LenderCreateAccountInput) =>
      lenderCreateAccount({
        firstName: v.firstName,
        lastName: v.lastName,
        email: v.email,
        password: v.password,
        inviteToken: token,
      }),
    onSuccess: () => router.push(ROUTES.lender.dashboard),
  });

  const onSubmit = form.handleSubmit((v) => mutation.mutate(v));

  // No token, or the invite couldn't be resolved (404 / expired).
  if (!token || preview.isError) return <InvalidInvite />;

  // While the invite resolves, the three autofilled fields show as skeletons.
  const loading = preview.isLoading;
  const skeleton = <Skeleton className='h-18 w-full rounded-2xl' />;

  return (
    <section className='flex w-full flex-col gap-14'>
      <div className='flex flex-col items-center justify-center gap-2 text-center'>
        <h1 className='text-[28px] font-semibold text-carbon-black xl:text-5xl'>
          Create your Lender account
        </h1>
        <p className='text-base text-foreground-secondary xl:text-2xl'>
          Set up your login details to access{' '}
          {preview.data ? preview.data.organisationName : 'your organisation'}
          &apos;s JusKel workspace.
        </p>
      </div>

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
                      {loading ? (
                        skeleton
                      ) : (
                        <Input autoComplete='given-name' {...field} />
                      )}
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
                      {loading ? (
                        skeleton
                      ) : (
                        <Input autoComplete='family-name' {...field} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Business email — set by the approved invite, read-only */}
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2 xl:gap-4'>
                  <FormLabel className={LABEL}>Business Email</FormLabel>
                  <FormControl>
                    {loading ? (
                      skeleton
                    ) : (
                      <div className='relative'>
                        <Input
                          type='email'
                          disabled
                          className='pr-10'
                          {...field}
                        />
                        <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400'>
                          <Lock className='size-5' />
                        </span>
                      </div>
                    )}
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

          <div className='flex flex-col items-center justify-center gap-6'>
            {mutation.isError && (
              <p role='alert' className='w-full text-sm text-destructive'>
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : 'Unable to create your account. Please try again.'}
              </p>
            )}
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
    </section>
  );
}
