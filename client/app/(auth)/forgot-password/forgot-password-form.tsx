'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { ROUTES } from '@/lib/routes';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validations/auth';
import { requestPasswordReset, ApiError } from '@/lib/api/auth';
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

export function ForgotPasswordForm() {
  const router = useRouter();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    // onChange so the submit button's isValid gate updates as the user types.
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: (_data, variables) => {
      router.push(
        `${ROUTES.auth.verifyResetCode}?email=${encodeURIComponent(variables.email)}`,
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
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem className='flex flex-col gap-2 xl:gap-4'>
              <FormLabel className='text-sm font-semibold xl:text-lg text-carbon-black'>
                Email
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

        <div className='flex flex-col items-center gap-6'>
          <div className='flex items-center justify-start w-full'>
            {mutation.isError && (
              <p role='alert' className='text-sm text-destructive'>
                {mutation.error instanceof ApiError
                  ? mutation.error.message
                  : 'Unable to send the reset code. Please try again.'}
              </p>
            )}
          </div>

          <Button
            type='submit'
            loading={mutation.isPending}
            disabled={mutation.isPending || !form.formState.isValid}
            className='h-14 w-full rounded-lg text-base font-semibold cursor-pointer'
          >
            {mutation.isPending ? 'Sending…' : 'Send reset link'}
          </Button>
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
