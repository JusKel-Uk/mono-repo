'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { ROUTES } from '@/lib/routes';
import {
  lenderForgotPasswordSchema,
  type LenderForgotPasswordInput,
} from '@/lib/validations/lender';
import { lenderForgotPassword } from '@/lib/api/lender-auth';
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

export function LenderForgotPasswordForm() {
  const router = useRouter();

  const form = useForm<LenderForgotPasswordInput>({
    resolver: zodResolver(lenderForgotPasswordSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const mutation = useMutation({
    mutationFn: lenderForgotPassword,
    onSuccess: (_data, vars) =>
      router.push(
        `${ROUTES.lender.verifyResetCode}?email=${encodeURIComponent(vars.email)}`,
      ),
  });

  const onSubmit = form.handleSubmit((v) => mutation.mutate(v));

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className='flex flex-col gap-10'>
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem className='flex flex-col gap-2 xl:gap-4'>
              <FormLabel className='text-sm font-semibold text-carbon-black xl:text-lg'>
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

        <div className='flex flex-col items-center justify-center gap-6'>
          <Button
            type='submit'
            loading={mutation.isPending}
            disabled={mutation.isPending || !form.formState.isValid}
            className='h-14 w-full rounded-lg text-base font-semibold'
          >
            {mutation.isPending ? 'Sending…' : 'Send verification code'}
          </Button>
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
