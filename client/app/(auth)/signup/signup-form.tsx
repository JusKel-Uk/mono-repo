'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Check, Eye, EyeOff, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { signupSchema, type SignupInput } from '@/lib/validations/auth';
import { register, ApiError } from '@/lib/api/auth';
import { useAuthStore } from '@/stores/authStore';
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

const labelClass = 'text-sm xl:text-lg text-carbon-black';

type SignupField = ControllerRenderProps<
  SignupInput,
  'password' | 'confirmPassword'
>;

function PasswordField({
  field,
  autoComplete,
}: {
  field: SignupField;
  autoComplete: 'new-password';
}) {
  const [show, setShow] = useState(false);
  return (
    <div className='relative'>
      <Input
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder='********'
        className='pr-10'
        {...field}
      />
      <button
        type='button'
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className='absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-secondary hover:text-carbon-black'
      >
        {show ? <EyeOff className='size-5' /> : <Eye className='size-5' />}
      </button>
    </div>
  );
}

const PASSWORD_RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: 'At least 12 characters', test: (v) => v.length >= 12 },
  { label: 'Include an uppercase', test: (v) => /[A-Z]/.test(v) },
  { label: 'Include a lowercase', test: (v) => /[a-z]/.test(v) },
  { label: 'Include a number', test: (v) => /[0-9]/.test(v) },
  {
    label: 'Include special symbols (e.g., @, #, $)',
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

function PasswordRequirements({ value }: { value: string }) {
  return (
    <ul className='flex flex-col gap-2' aria-live='polite'>
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              'flex items-center gap-2 text-sm',
              met ? 'text-success' : 'text-destructive',
            )}
          >
            {met ? (
              <Check className='size-4 shrink-0' />
            ) : (
              <X className='size-4 shrink-0' />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

export function SignupForm() {
  const router = useRouter();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      businessEmail: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: SignupInput) =>
      register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.businessEmail,
        password: values.password,
      }),
    onSuccess: (data, variables) => {
      // Remember the profile through verification → login (login only returns
      // id + email, so this is where we capture the name).
      useAuthStore.getState().setUser({
        id: data.userId,
        firstName: variables.firstName,
        lastName: variables.lastName,
        email: data.email,
      });
      // Account created but unverified — go verify the email OTP.
      router.push(
        `${ROUTES.auth.verifyEmail}?email=${encodeURIComponent(data.email)}`,
      );
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        className='flex flex-col gap-8 xl:gap-10'
      >
        {/* Fields */}
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-5 xl:flex-row xl:gap-6'>
            <FormField
              control={form.control}
              name='firstName'
              render={({ field }) => (
                <FormItem className='flex flex-1 flex-col gap-2 xl:gap-4'>
                  <FormLabel className={labelClass}>First Name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete='given-name'
                      placeholder='Flo'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='lastName'
              render={({ field }) => (
                <FormItem className='flex flex-1 flex-col gap-2 xl:gap-4'>
                  <FormLabel className={labelClass}>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete='family-name'
                      placeholder='Okoro'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='businessEmail'
            render={({ field }) => (
              <FormItem className='flex flex-col gap-2 xl:gap-4'>
                <FormLabel className={labelClass}>Business Email</FormLabel>
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
            render={({ field, fieldState }) => (
              <FormItem className='flex flex-col gap-2 xl:gap-4'>
                <FormLabel className={labelClass}>Password</FormLabel>
                <FormControl>
                  <PasswordField field={field} autoComplete='new-password' />
                </FormControl>
                {field.value.length > 0 ? (
                  <PasswordRequirements value={field.value} />
                ) : fieldState.error ? (
                  <FormMessage />
                ) : (
                  <p className='text-sm text-muted-foreground xl:text-foreground-secondary'>
                    Use at least 12 characters with a mix of uppercase,
                    lowercase, numbers, and special symbols (e.g., @, #, $).
                  </p>
                )}
              </FormItem>
            )}
          />

          <div className='flex flex-col gap-4'>
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem className='flex flex-col gap-2 xl:gap-4'>
                  <FormLabel className={labelClass}>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordField field={field} autoComplete='new-password' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='agreeToTerms'
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-center gap-3'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label='I agree to the Terms of Use and Privacy Policy'
                      />
                    </FormControl>
                    <p className='text-sm text-muted-foreground xl:text-foreground-secondary'>
                      I agree to the{' '}
                      {/* TODO: point at real Terms/Privacy routes when they exist */}
                      <Link href='#' className='text-teal-charcoal underline'>
                        Terms of Use
                      </Link>{' '}
                      and{' '}
                      <Link href='#' className='text-teal-charcoal underline'>
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit + footer */}
        <div className='flex flex-col items-center justify-center gap-6'>
          <div className='flex items-center justify-start w-full'>
            {mutation.isError && (
              <p role='alert' className='text-sm text-destructive'>
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : 'Unable to create your account. Please try again.'}
              </p>
            )}
          </div>
          <Button type='submit' loading={mutation.isPending} className='w-full'>
            {mutation.isPending ? 'Creating account…' : 'Create Account'}
          </Button>
          <div className='flex items-center gap-4 text-center xl:gap-8'>
            <p className='text-sm text-muted-foreground xl:text-foreground-secondary'>
              Already have an account?{' '}
              <Link
                href={ROUTES.auth.login}
                className='font-semibold text-teal-charcoal underline xl:font-bold'
              >
                Sign in
              </Link>
            </p>
            {/* Placeholder target until a lender/admin auth flow exists (M1). */}
            <Link
              href={ROUTES.lender.dashboard}
              className='text-sm text-teal-charcoal underline'
            >
              I&apos;m a Lender or Admin
            </Link>
          </div>
        </div>
      </form>
    </Form>
  );
}
