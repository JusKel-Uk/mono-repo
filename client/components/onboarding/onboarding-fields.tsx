import type { ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { Paperclip } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { EnumOption } from '@/lib/onboarding/enums';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

/**
 * Shared control styling for onboarding inputs/selects (56px, rounded-xl).
 * Default: light grey border + light placeholder. Active (focus): dark
 * brand border, no ring. Filled value text is dark (the browser default).
 */
export const CONTROL =
  'h-14 rounded-xl border border-gray-300 px-4 text-base placeholder:text-gray-400 focus-visible:border-primary focus-visible:ring-0';
const LABEL = 'text-base font-medium text-carbon-black';

/** White bordered card, with an optional icon + label header. */
export function FieldCard({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-2xl border border-border bg-white p-7',
        className,
      )}
    >
      {label && (
        <div className='flex items-center gap-2'>
          {Icon && <Icon className='size-4.5 text-foreground-secondary' />}
          <span className='text-sm font-medium text-foreground-secondary'>
            {label}
          </span>
        </div>
      )}
      <div className='flex flex-1 flex-col gap-5'>{children}</div>
    </div>
  );
}

/**
 * Evidence controls shown under a self-declared field: an "attach" button, a
 * justification link, and a right-aligned accepted-formats hint. Upload wiring
 * is stubbed for now.
 */
export function EvidenceRow({
  attachLabel,
  hint,
}: {
  attachLabel: string;
  hint: string;
}) {
  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
      <button
        type='button'
        // TODO(onboarding): open file picker → upload supporting evidence.
        className='inline-flex h-7 items-center gap-2 rounded-lg bg-primary px-5 text-label-sm font-medium text-gray-200 shadow-xs transition-opacity hover:opacity-90'
      >
        <Paperclip className='size-3' />
        {attachLabel}
      </button>
      <button
        type='button'
        className='text-label-sm font-normal text-gray-700 underline hover:no-underline'
      >
        Or add a justification
      </button>
      <span className='ml-auto text-label-sm font-normal text-gray-700'>
        {hint}
      </span>
    </div>
  );
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  helper,
  type = 'text',
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  helper?: string;
  type?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-col gap-2'>
          <FormLabel className={LABEL}>{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              className={CONTROL}
              {...field}
            />
          </FormControl>
          {helper && <p className='text-sm text-muted-foreground'>{helper}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-1 flex-col gap-2'>
          <FormLabel className={LABEL}>{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className='min-h-40 flex-1 rounded-xl border-gray-300 text-base placeholder:text-gray-400 focus-visible:border-primary focus-visible:ring-0'
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Select',
  options,
  helper,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  options: string[];
  helper?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className='flex flex-col gap-2'>
          <FormLabel className={LABEL}>{label}</FormLabel>
          {/* key on value so a programmatic form.reset() (draft rehydrate)
              remounts the trigger and it re-derives its label. */}
          <Select
            key={field.value || 'empty'}
            onValueChange={field.onChange}
            value={field.value}
          >
            <FormControl>
              <SelectTrigger
                className={cn(
                  CONTROL,
                  'w-full data-placeholder:text-gray-400 py-6',
                )}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {helper && <p className='text-sm text-muted-foreground'>{helper}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * Like SelectField, but backed by the integer enum registry: the option label
 * is shown, the option's integer (as a string) is the stored value. Map to a
 * number at the API boundary.
 */
export function EnumSelectField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Select',
  options,
  helper,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  options: EnumOption[];
  helper?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value = field.value === '' || field.value == null
          ? undefined
          : String(field.value);
        return (
          <FormItem className='flex flex-col gap-2'>
            <FormLabel className={LABEL}>{label}</FormLabel>
            {/* key on value so a programmatic form.reset() (draft rehydrate)
                remounts the trigger and it re-derives its label. */}
            <Select
              key={value ?? 'empty'}
              onValueChange={field.onChange}
              value={value}
            >
              <FormControl>
                <SelectTrigger
                  className={cn(
                    CONTROL,
                    'w-full data-placeholder:text-gray-400 py-6',
                  )}
                >
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {helper && <p className='text-sm text-muted-foreground'>{helper}</p>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
