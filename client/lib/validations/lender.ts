import { z } from 'zod';

/** Shared strong-password rule (Figma copy: 12+ chars, mixed case, number, symbol). */
const strongPassword = z
  .string()
  .min(12, 'Use at least 12 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number')
  .regex(/[^A-Za-z0-9]/, 'Include a special symbol');

export const lenderRequestAccessSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  workEmail: z
    .string()
    .min(1, 'Business email is required')
    .email('Enter a valid email'),
  organisation: z.string().min(1, 'Organisation name is required'),
  website: z
    .string()
    .url('Enter a valid URL')
    .optional()
    .or(z.literal('')),
  role: z.string().optional().or(z.literal('')),
  message: z.string().optional().or(z.literal('')),
});
export type LenderRequestAccessInput = z.infer<typeof lenderRequestAccessSchema>;

export const lenderCreateAccountSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z
      .string()
      .min(1, 'Business email is required')
      .email('Enter a valid email'),
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type LenderCreateAccountInput = z.infer<typeof lenderCreateAccountSchema>;

export const lenderForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Business email is required')
    .email('Enter a valid email'),
});
export type LenderForgotPasswordInput = z.infer<
  typeof lenderForgotPasswordSchema
>;

export const lenderResetCodeSchema = z.object({
  code: z.string().min(6, 'Enter the 6-digit code').max(6),
});
export type LenderResetCodeInput = z.infer<typeof lenderResetCodeSchema>;

export const lenderResetPasswordSchema = z
  .object({
    password: strongPassword,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type LenderResetPasswordInput = z.infer<
  typeof lenderResetPasswordSchema
>;
