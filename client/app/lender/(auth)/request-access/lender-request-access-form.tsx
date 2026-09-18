'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type Control, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { ROUTES } from '@/lib/routes';
import {
  lenderRequestAccessSchema,
  type LenderRequestAccessInput,
} from '@/lib/validations/lender';
import { lenderRequestAccess } from '@/lib/api/lender-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const LABEL = 'text-sm font-semibold text-carbon-black xl:text-lg';

function TextField({
  control,
  name,
  label,
  placeholder,
  autoComplete,
  help,
}: {
  control: Control<LenderRequestAccessInput>;
  name: FieldPath<LenderRequestAccessInput>;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  help?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-col gap-2 xl:gap-4'>
          <FormLabel className={LABEL}>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              autoComplete={autoComplete}
              {...field}
            />
          </FormControl>
          {help && <p className='text-sm text-gray-600'>{help}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function LenderRequestAccessForm() {
  const router = useRouter();

  const form = useForm<LenderRequestAccessInput>({
    resolver: zodResolver(lenderRequestAccessSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      workEmail: '',
      organisation: '',
      website: '',
      role: '',
      message: '',
    },
  });

  const mutation = useMutation({
    mutationFn: lenderRequestAccess,
    onSuccess: () => router.push(ROUTES.lender.login),
  });

  const onSubmit = form.handleSubmit((v) => mutation.mutate(v));

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} noValidate className='flex flex-col gap-10'>
        <div className='flex flex-col gap-8 xl:gap-10'>
          <div className='grid gap-8 sm:grid-cols-2'>
            <TextField
              control={form.control}
              name='firstName'
              label='First Name'
              autoComplete='given-name'
            />
            <TextField
              control={form.control}
              name='lastName'
              label='Last Name'
              autoComplete='family-name'
            />
          </div>
          <TextField
            control={form.control}
            name='workEmail'
            label='Business Email'
            placeholder='you@company.co.uk'
            autoComplete='email'
          />
          <TextField
            control={form.control}
            name='organisation'
            label='Organisation Name'
            placeholder='Enter your organisation name'
            autoComplete='organization'
          />
          <TextField
            control={form.control}
            name='website'
            label='Organisation Website'
            placeholder='https://...'
            autoComplete='url'
            help='Optional, but it helps us verify your organisation faster.'
          />
          <TextField
            control={form.control}
            name='role'
            label='Job title / Role'
            placeholder='Enter your job title or role'
            autoComplete='organization-title'
          />
          <FormField
            control={form.control}
            name='message'
            render={({ field }) => (
              <FormItem className='flex flex-col gap-2 xl:gap-4'>
                <FormLabel className={LABEL}>
                  Why are you requesting access?
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder='Tell us briefly how your organisation intends to use the JusKel Lender Portal.'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className='flex flex-col items-center justify-center gap-6'>
          <Button
            type='submit'
            loading={mutation.isPending}
            disabled={mutation.isPending || !form.formState.isValid}
            className='h-14 w-full rounded-lg text-base font-semibold'
          >
            {mutation.isPending ? 'Requesting…' : 'Request access'}
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
