import { format, formatDistanceToNowStrict, isValid, parseISO } from 'date-fns';

/**
 * App-wide date/time formatting. One place, one library (date-fns) so every
 * screen renders dates the same way. Import these helpers instead of hand-
 * rolling `new Date().toLocaleString(...)` or relative-time math.
 *
 * All helpers accept an ISO string, epoch millis, or a Date, and return '' for
 * anything unparseable (safe to drop straight into JSX).
 */

type DateInput = string | number | Date;

function toDate(value: DateInput): Date | null {
  const d =
    value instanceof Date
      ? value
      : typeof value === 'string'
        ? parseISO(value)
        : new Date(value);
  return isValid(d) ? d : null;
}

/** Relative time with a suffix, e.g. "2 hours ago", "3 days ago", "in 5 minutes". */
export function fromNow(value: DateInput): string {
  const d = toDate(value);
  return d ? formatDistanceToNowStrict(d, { addSuffix: true }) : '';
}

/** Short date, e.g. "12 Sep 2026". */
export function formatDate(value: DateInput): string {
  const d = toDate(value);
  return d ? format(d, 'd MMM yyyy') : '';
}

/** Date + 24h time, e.g. "12 Sep 2026, 14:30". */
export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  return d ? format(d, 'd MMM yyyy, HH:mm') : '';
}

/** Numeric date, e.g. "12/09/2026". */
export function formatShortDate(value: DateInput): string {
  const d = toDate(value);
  return d ? format(d, 'dd/MM/yyyy') : '';
}

/** Longer date, e.g. "12 September 2026" (for headings / captions). */
export function formatLongDate(value: DateInput): string {
  const d = toDate(value);
  return d ? format(d, 'd MMMM yyyy') : '';
}
