/**
 * Funding matches — frontend placeholder data (TODO backend). Opportunities
 * ranked by fit with the SME's business / financial / sustainability profile.
 */

export type MatchTone = 'strong' | 'good' | 'fair';

export type FundingMatch = {
  id: string;
  /** Provider monogram shown in the logo tile (e.g. "BBB"). */
  monogram: string;
  provider: string;
  match: MatchTone;
  /** Product-type label (Loan / Green Loan / Grant). */
  type: string;
  product: string;
  /** Why this is a match — one line. */
  reason: string;
  /** Fit score 0–100. */
  fit: number;
  amount: string;
  apr: string;
  /** Detail-page extras. */
  term: string;
  minBand: string;
  /** Word shown beside the fit % on the detail hero (e.g. "Excellent"). */
  rating: string;
};

export const MATCH_LABEL: Record<MatchTone, string> = {
  strong: 'Strong match',
  good: 'Good match',
  fair: 'Fair match',
};

export const FUNDING_MATCHES: FundingMatch[] = [
  {
    id: 'growth-guarantee-scheme',
    monogram: 'BBB',
    provider: 'British Business Bank',
    match: 'strong',
    type: 'Loan',
    product: 'Growth Guarantee Scheme',
    reason: 'Your turnover band and 3+ years of trading meet all the core criteria.',
    fit: 92,
    amount: '£25k – £250k',
    apr: '7.9–11.4%',
    term: '3 – 7 years',
    minBand: '61 and above',
    rating: 'Excellent',
  },
  {
    id: 'clean-growth-financing',
    monogram: 'LB',
    provider: 'Lloyds Bank',
    match: 'strong',
    type: 'Green Loan',
    product: 'Clean Growth Financing',
    reason:
      'Your sustainability profile aligns with sustainability criteria considered by some funding providers. Energy tracking evidence may strengthen your match.',
    fit: 88,
    amount: '£50k – £500k',
    apr: '6.4–9.2%',
    term: '3 – 10 years',
    minBand: '55 and above',
    rating: 'Strong',
  },
  {
    id: 'smart-grants-sustainability',
    monogram: 'IUK',
    provider: 'Innovate UK',
    match: 'good',
    type: 'Grant',
    product: 'Smart Grants for Sustainability',
    reason:
      'Project-based grant. Your readiness level qualifies but requires an eligible innovation project outline.',
    fit: 74,
    amount: '£25k – £100k',
    apr: '0% — grant funding',
    term: 'Project-based',
    minBand: '50 and above',
    rating: 'Good',
  },
  {
    id: 'ethical-business-loan',
    monogram: 'TRB',
    provider: 'Triodos Bank',
    match: 'fair',
    type: 'Loan',
    product: 'Ethical Business Loan',
    reason:
      'Aligned with your sustainability direction but requires stronger ESG evidence.',
    fit: 61,
    amount: '£50k – £1M',
    apr: '7.2–10.5%',
    term: '3 – 10 years',
    minBand: '61 and above',
    rating: 'Fair',
  },
];

/** Product-type filter options (first = show all). */
export const PRODUCT_TYPES = ['All product types', 'Loan', 'Green Loan', 'Grant'];

export const findMatch = (id: string) =>
  FUNDING_MATCHES.find((m) => m.id === id);

/* ---- Detail page: generic (SME-level, not product-specific) content ---- */
export type ChecklistItem = { label: string; done: boolean; note?: string };

export const APPLICATION_CHECKLIST: ChecklistItem[] = [
  { label: 'Verified company details', done: true },
  { label: 'ESG score of 70+', done: true },
  { label: 'Last 12 months of management accounts', done: true },
  {
    label: 'Provide 12-month cashflow forecast ',
    done: false,
    note: '(Upload during application)',
  },
];

export const ELIGIBILITY: string[] = [
  'UK-based SME',
  'Preferred sectors (all)',
  'Preferred SME stage (3–5 years trading)',
  'Minimum readiness band (Ready)',
  'Minimum SFS score band (61 and above)',
];
