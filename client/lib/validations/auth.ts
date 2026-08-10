import { z } from 'zod';

/** Login form schema (Zod v4). */
export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  // Default supplied via RHF `defaultValues`; kept required so the schema's
  // input and output types match (avoids a Resolver type mismatch).
  rememberMe: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Signup form schema (Zod v4). */
export const signupSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    businessEmail: z.email('Enter a valid business email'),
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
  code: z.string().length(6, 'Enter the 6-digit code'),
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
