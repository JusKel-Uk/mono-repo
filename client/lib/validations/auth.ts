import { z } from 'zod';

import { requiredText } from './sanitize';

/** Login form schema (Zod v4). */
export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  // Default supplied via RHF `defaultValues`; kept required so the schema's
  // input and output types match (avoids a Resolver type mismatch).
  rememberMe: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Personal email providers the API rejects at registration (must mirror the
 * backend BusinessEmailValidator blocklist). Caught client-side for faster UX;
 * the API is still the source of truth.
 */
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'hotmail.com',
  'hotmail.co.uk', 'outlook.com', 'live.com', 'msn.com', 'icloud.com', 'me.com',
  'mac.com', 'aol.com', 'protonmail.com', 'proton.me', 'mail.com', 'gmx.com',
  'yandex.com', 'mail.ru', 'zoho.com', 'fastmail.com', 'tutanota.com', 'hey.com',
]);

function isBusinessEmail(email: string): boolean {
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  return domain.length > 0 && !PERSONAL_EMAIL_DOMAINS.has(domain);
}

/** Signup form schema (Zod v4). */
export const signupSchema = z
  .object({
    firstName: requiredText('First name is required', 80),
    lastName: requiredText('Last name is required', 80),
    businessEmail: z
      .email('Enter a valid business email')
      .refine(isBusinessEmail, {
        message: 'Use a business email — personal providers are not accepted',
      }),
    password: z
      .string()
      .min(12, 'Use at least 12 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
        'Include an uppercase letter, a lowercase letter, a number, and a symbol',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeToTerms: z.boolean().refine((v) => v, {
      message: 'You must agree to the Terms of Use and Privacy Policy',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

/** Reusable password rule (min length + character mix). */
const passwordField = z
  .string()
  .min(12, 'Use at least 12 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
    'Include an uppercase letter, a lowercase letter, a number, and a symbol',
  );

/** Step 1 — request a reset code. */
export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** Step 2 — verify the 6-digit code. */
export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Enter the 6-digit code')
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});
export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

/** Step 3 — set a new password. */
export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
