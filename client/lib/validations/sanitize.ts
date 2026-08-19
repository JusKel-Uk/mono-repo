import { z } from 'zod';

/**
 * Input-hardening helpers shared across form schemas.
 *
 * React escapes values on render, so these are *defense-in-depth*, not the
 * primary XSS control: they trim/strip and bound every free-text value before
 * it is sent to the API or persisted to localStorage, and they pin select /
 * radio fields to a known option set so a crafted request can't smuggle
 * arbitrary strings past the client.
 */

// C0 controls (0x00-0x1F), DEL (0x7F), and C1 controls (0x80-0x9F). Built from
// an ASCII-safe string so no control bytes are embedded in this source file.
const CONTROL_CHARS = new RegExp('[\\u0000-\\u001F\\u007F-\\u009F]', 'g');
// Same, but preserving tab (0x09), LF (0x0A) and CR (0x0D) for textareas.
const CONTROL_CHARS_KEEP_WS = new RegExp(
  '[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F-\\u009F]',
  'g',
);

/** Strip all control characters and trim (single-line fields). */
export function cleanText(value: string): string {
  return value.replace(CONTROL_CHARS, '').trim();
}

/** Strip control characters but keep line breaks/tabs (textareas). */
export function cleanMultiline(value: string): string {
  return value.replace(CONTROL_CHARS_KEEP_WS, '').trim();
}

/** Required, cleaned, length-capped free text. */
export function requiredText(message: string, max = 200) {
  return z
    .string()
    .transform(cleanText)
    .pipe(
      z.string().min(1, message).max(max, `Keep this under ${max} characters`),
    );
}

/** Optional (may be empty), cleaned, length-capped free text. */
export function optionalText(max = 200) {
  return z
    .string()
    .transform(cleanText)
    .pipe(z.string().max(max, `Keep this under ${max} characters`));
}

/** Optional multi-line text (keeps line breaks), length-capped. */
export function optionalMultiline(max = 2000) {
  return z
    .string()
    .transform(cleanMultiline)
    .pipe(z.string().max(max, `Keep this under ${max} characters`));
}

/** Value must be one of a known option set (required select / radio). */
export function oneOf(options: readonly string[], message: string) {
  return z.string().refine((v) => options.includes(v), message);
}

/** Optional select / radio: empty or one of a known option set. */
export function optionalOneOf(options: readonly string[]) {
  return z
    .string()
    .refine((v) => v === '' || options.includes(v), 'Choose a valid option');
}
