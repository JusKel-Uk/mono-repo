import { toast } from 'sonner';

/**
 * PLACEHOLDER lender-auth API. There is no lender/role concept in the backend
 * yet, so these calls don't hit the network — each one logs its payload to the
 * console and fires a clearly-labelled DUMMY toast, then resolves after a short
 * delay so the calling mutation shows its loading → success transition.
 *
 * TODO(backend): replace `dummy(...)` with real `request(...)` calls once lender
 * registration / sign-in / access-request endpoints exist.
 */
function dummy<T = void>(action: string, payload?: unknown, result?: T): Promise<T> {
  console.log(`[lender-auth · DUMMY] ${action}`, payload ?? '');
  toast.message('🧪 Dummy action — no backend', {
    description: `"${action}" was logged to the console. Lender auth isn't wired to a backend yet.`,
  });
  return new Promise((resolve) => {
    setTimeout(() => resolve(result as T), 500);
  });
}

export type LenderSignInInput = {
  email: string;
  password: string;
  rememberMe: boolean;
};
export function lenderSignIn(input: LenderSignInInput) {
  return dummy('Lender sign in', input);
}

export type LenderRequestAccessInput = {
  firstName: string;
  lastName: string;
  workEmail: string;
  organisation: string;
  website?: string;
  role?: string;
  message?: string;
};
export function lenderRequestAccess(input: LenderRequestAccessInput) {
  return dummy('Request lender access', input);
}

export type LenderCreateAccountInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
export function lenderCreateAccount(input: LenderCreateAccountInput) {
  return dummy('Create lender account', input);
}

export function lenderForgotPassword(input: { email: string }) {
  return dummy('Forgot password — send reset code', input);
}

export function lenderVerifyResetCode(input: { email: string; code: string }) {
  return dummy('Verify reset code', input);
}

export function lenderResetPassword(input: { password: string }) {
  return dummy('Set a new password', input);
}
