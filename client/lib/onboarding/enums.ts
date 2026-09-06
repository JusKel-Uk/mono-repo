/**
 * Onboarding enum registry — the single source of truth for the integer values
 * the API expects, mirroring the backend contracts under
 * `api/src/Modules/<Module>.Contracts/` (see the `*Enums.cs` files).
 *
 * The API sends and receives INTEGERS for every enum field. The UI shows the
 * `label`; the wire carries the `value`. Keep these in sync with Swagger.
 *
 * NOTE ON LABELS: values are authoritative (from the backend). The display
 * labels below are the human wording — verify each against the Figma dropdowns
 * before shipping; adjust the `label` only (never the `value`).
 */

export type EnumOption = { value: number; label: string };

/* ---- Company & business (CompanyEnums.cs) ---- */

export const COMPANY_RELATIONSHIP: EnumOption[] = [
  { value: 1, label: 'Sole trader' },
  { value: 2, label: 'Director' },
  { value: 3, label: 'Shareholder' },
  { value: 4, label: 'Partner' },
  { value: 5, label: 'Other' },
];

export const UK_REGION: EnumOption[] = [
  { value: 1, label: 'England' },
  { value: 2, label: 'Wales' },
  { value: 3, label: 'Scotland' },
  { value: 4, label: 'Northern Ireland' },
];

export const EMPLOYEE_SIZE_BAND: EnumOption[] = [
  { value: 1, label: '1–9' },
  { value: 2, label: '10–49' },
  { value: 3, label: '50–249' },
  { value: 4, label: '250+' },
];

export const ANNUAL_TURNOVER_BAND: EnumOption[] = [
  { value: 1, label: 'Under £250k' },
  { value: 2, label: '£250k–£1m' },
  { value: 3, label: '£1m–£5m' },
  { value: 4, label: '£5m–£25m' },
  { value: 5, label: 'Over £25m' },
];

export const YEARS_IN_OPERATION_BAND: EnumOption[] = [
  { value: 1, label: 'Under 1 year' },
  { value: 2, label: '1–3 years' },
  { value: 3, label: '3–5 years' },
  { value: 4, label: '5–10 years' },
  { value: 5, label: 'Over 10 years' },
];

export const BUSINESS_SECTOR: EnumOption[] = [
  { value: 1, label: 'Technology' },
  { value: 2, label: 'Manufacturing' },
  { value: 3, label: 'Retail' },
  { value: 4, label: 'Professional services' },
  { value: 5, label: 'Hospitality' },
  { value: 6, label: 'Construction' },
  { value: 7, label: 'Agriculture' },
  { value: 8, label: 'Healthcare' },
  { value: 99, label: 'Other' },
];

/* ---- Financial & funding (FundingEnums.cs) ---- */

export const ANNUAL_REVENUE_BAND: EnumOption[] = [
  { value: 1, label: 'Under £250k' },
  { value: 2, label: '£250k-£1m' },
  { value: 3, label: '£1m-£5m' },
  { value: 4, label: '£5m-£25m' },
  { value: 5, label: 'Over £25m' },
];

export const EBITDA_BAND: EnumOption[] = [
  { value: 1, label: 'Loss-making' },
  { value: 2, label: '0-5% margin' },
  { value: 3, label: '5-15% margin' },
  { value: 4, label: '15-30% margin' },
  { value: 5, label: 'Over 30% margin' },
];

export const EXISTING_DEBT_BAND: EnumOption[] = [
  { value: 1, label: 'No debt' },
  { value: 2, label: 'Under £50k' },
  { value: 3, label: '£50k-£250k' },
  { value: 4, label: '£250k-£1m' },
  { value: 5, label: 'Over £1m' },
];

export const CASH_RESERVES_BAND: EnumOption[] = [
  { value: 1, label: 'Under 1 month' },
  { value: 2, label: '1-3 months' },
  { value: 3, label: '3-6 months' },
  { value: 4, label: '6-12 months' },
  { value: 5, label: 'Over 12 months' },
];

export const AVG_MONTHLY_REVENUE_BAND: EnumOption[] = [
  { value: 1, label: 'Under £20k' },
  { value: 2, label: '£20k-£80k' },
  { value: 3, label: '£80k-£400k' },
  { value: 4, label: '£400k-£1m' },
  { value: 5, label: 'Over £1m' },
];

// New bands added from the QuickBooks/Xero metric set (self-declared or
// integration-derived). Backend support pending — see the PUT payload spec.
export const GROSS_MARGIN_BAND: EnumOption[] = [
  { value: 1, label: 'Under 10%' },
  { value: 2, label: '10-25%' },
  { value: 3, label: '25-50%' },
  { value: 4, label: '50-75%' },
  { value: 5, label: 'Over 75%' },
];

export const REVENUE_GROWTH_BAND: EnumOption[] = [
  { value: 1, label: 'Declining' },
  { value: 2, label: '0-10%' },
  { value: 3, label: '10-25%' },
  { value: 4, label: '25-50%' },
  { value: 5, label: 'Over 50%' },
];

export const RECEIVABLES_BAND: EnumOption[] = [
  { value: 1, label: 'None' },
  { value: 2, label: 'Under £50k' },
  { value: 3, label: '£50k-£250k' },
  { value: 4, label: '£250k-£1m' },
  { value: 5, label: 'Over £1m' },
];

export const FUNDING_PURPOSE: EnumOption[] = [
  { value: 1, label: 'Working capital' },
  { value: 2, label: 'Equipment' },
  { value: 3, label: 'Expansion' },
  { value: 4, label: 'Refinance' },
  { value: 99, label: 'Other' },
];

export const FUNDING_URGENCY: EnumOption[] = [
  { value: 1, label: 'Immediate' },
  { value: 2, label: 'Within 30 days' },
  { value: 3, label: 'Within 90 days' },
  { value: 4, label: 'Flexible' },
];

export const INTEGRATION_PROVIDER = {
  openBanking: 1,
  xero: 2,
  quickbooks: 3,
} as const;

/* ---- Sustainability (ScoringEnums.cs) ---- */

/** SustainabilityAnswer — every ESG question answers with one of these. */
export const SUSTAINABILITY_ANSWER: EnumOption[] = [
  { value: 1, label: 'Yes' },
  { value: 2, label: 'No' },
  { value: 3, label: 'In progress' },
  { value: 4, label: 'Partially' },
  { value: 5, label: 'Occasionally' },
];
/** 0 = NotAnswered — the "unset" sentinel; never offered as a selectable option. */
export const SUSTAINABILITY_NOT_ANSWERED = 0;

/* ---- Progress (OnboardingEnums.cs) ---- */

export const ONBOARDING_STEP = {
  company: 1,
  business: 2,
  financial: 3,
  sustainability: 4,
  funding: 5,
} as const;

export const STEP_STATUS = {
  notStarted: 0,
  inProgress: 1,
  complete: 2,
} as const;

export const SUBMISSION_STATUS = {
  draft: 0,
  submitted: 1,
} as const;

/* ---- Lookup specs ---- *
 * Pairs each backend lookup key (see GET /lookups) with the hardcoded fallback
 * used for instant first paint / offline, before the live lookups load. The
 * fallbacks mirror the backend today — keep them in sync if the backend adds
 * enum values (the render source is the live lookup; validation uses these).
 */

export type LookupSpec = { key: string; fallback: EnumOption[] };

export const LOOKUP = {
  companyRelationship: { key: 'companyRelationship', fallback: COMPANY_RELATIONSHIP },
  ukRegion: { key: 'ukRegion', fallback: UK_REGION },
  employeeSizeBand: { key: 'employeeSizeBand', fallback: EMPLOYEE_SIZE_BAND },
  annualTurnoverBand: { key: 'annualTurnoverBand', fallback: ANNUAL_TURNOVER_BAND },
  yearsInOperationBand: { key: 'yearsInOperationBand', fallback: YEARS_IN_OPERATION_BAND },
  businessSector: { key: 'businessSector', fallback: BUSINESS_SECTOR },
  annualRevenueBand: { key: 'annualRevenueBand', fallback: ANNUAL_REVENUE_BAND },
  ebitdaBand: { key: 'ebitdaBand', fallback: EBITDA_BAND },
  existingDebtBand: { key: 'existingDebtBand', fallback: EXISTING_DEBT_BAND },
  cashReserves: { key: 'cashReserves', fallback: CASH_RESERVES_BAND },
  avgMonthlyRevenue: { key: 'avgMonthlyRevenue', fallback: AVG_MONTHLY_REVENUE_BAND },
  grossMarginBand: { key: 'grossMarginBand', fallback: GROSS_MARGIN_BAND },
  revenueGrowthBand: { key: 'revenueGrowthBand', fallback: REVENUE_GROWTH_BAND },
  receivablesBand: { key: 'receivablesBand', fallback: RECEIVABLES_BAND },
  fundingPurpose: { key: 'fundingPurpose', fallback: FUNDING_PURPOSE },
  fundingUrgency: { key: 'fundingUrgency', fallback: FUNDING_URGENCY },
  sustainabilityAnswer: { key: 'sustainabilityAnswer', fallback: SUSTAINABILITY_ANSWER },
} as const satisfies Record<string, LookupSpec>;

/* ---- Helpers ---- */

/** Label for a stored enum value (falls back to the raw value as a string). */
export function labelOf(options: EnumOption[], value: number | undefined | null): string {
  return options.find((o) => o.value === value)?.label ?? String(value ?? '');
}
