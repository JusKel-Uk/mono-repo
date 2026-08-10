'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';

import { ROUTES } from '@/lib/routes';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/lib/validations/auth';
import { resetPassword, ApiError } from '@/lib/api/auth';
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

const labelClass = 'text-sm xl:text-lg text-carbon-black';

type ResetField = ControllerRenderProps<
  ResetPasswordInput,
  'password' | 'confirmPassword'
>;

function PasswordField({
  field,
  autoComplete,
}: {
  field: ResetField;
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

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordInput) =>
      resetPassword({ token, password: values.password }),
    onSuccess: () => {
      router.push(ROUTES.auth.login);
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
        <div className='flex flex-col gap-8 xl:gap-10'>
          <FormField
            control={form.control}
            name='password'
            render={({ field, fieldState }) => (
              <FormItem className='flex flex-col gap-2 xl:gap-4'>
                <FormLabel className={labelClass}>New Password</FormLabel>
                <FormControl>
                  <PasswordField field={field} autoComplete='new-password' />
                </FormControl>
                {fieldState.error ? (
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
        </div>

        <div className='flex flex-col items-center gap-6'>
          {mutation.isError && (
            <p role='alert' className='text-sm text-destructive'>
              {mutation.error instanceof ApiError
                ? mutation.error.message
                : 'Unable to update your password. Please try again.'}
            </p>
          )}
          <Button type='submit' disabled={mutation.isPending} className='w-full'>
            {mutation.isPending ? 'Updating…' : 'Update Password'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
