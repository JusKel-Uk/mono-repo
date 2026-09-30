import { cn } from '@/lib/utils';

/**
 * Small pill used across the lender portal (match/product status, role tag).
 * Tones map to the Figma badge palette; blue-gray isn't a global token so it
 * carries literal hex here.
 */
export type LenderBadgeTone =
  | 'neutral' // LENDER, DRAFT
  | 'success' // INTERESTED (dashboard match rows)
  | 'warning' // REVIEWING
  | 'info' // NEW MATCH (blue-gray)
  | 'type' // product-type chip (e.g. Green Loan)
  | 'active' // ACTIVE status on the funding-products list
  | 'error'; // CONSENT WITHDRAWN

const TONES: Record<LenderBadgeTone, string> = {
  neutral: 'bg-gray-200 border-gray-300 text-gray-600',
  success: 'bg-[#d1fadf] border-success-200 text-success-600',
  warning: 'bg-warning-100 border-warning-200 text-warning-600',
  info: 'bg-[#eaecf5] border-[#d5d9eb] text-[#3e4784]',
  type: 'bg-success-50 border-[#d1fadf] text-teal-charcoal',
  active: 'bg-success-50 border-[#d1fadf] text-success-600',
  error: 'bg-error-50 border-error-100 text-error-700',
};

export function LenderBadge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: LenderBadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-2xl border px-2.5 py-0.5 text-label-lg font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
