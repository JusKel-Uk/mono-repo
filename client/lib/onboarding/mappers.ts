/**
 * Form ⇆ API mapping for the onboarding wizard.
 *
 * The forms keep enum fields as strings (selects are string-valued, e.g. "2");
 * the API carries integers. These functions convert at the boundary so neither
 * side leaks the other's representation.
 */

import type {
  CompanySetupInput,
  BusinessProfileInput,
  SustainabilityProfileInput,
  FinancialProfileInput,
  FundingProfileInput,
} from '@/lib/validations/onboarding';
import type {
  CompanySetup,
  UpsertCompanySetupRequest,
  BusinessProfile,
  UpsertBusinessProfileRequest,
  SustainabilityProfile,
  UpsertSustainabilityProfileRequest,
  FinancialProfile,
  UpsertFinancialProfileRequest,
  FundingProfile,
  UpsertFundingProfileRequest,
} from '@/lib/api/onboarding';
import { SUSTAINABILITY_ANSWER } from '@/lib/onboarding/enums';

/** "2" → 2, ""/undefined → undefined. */
function toInt(v: string | number | null | undefined): number | undefined {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** int → "2", nullish → "". */
function toStr(v: number | null | undefined): string {
  return v == null ? '' : String(v);
}

/* ---- Step 1: Company setup ---- */

const UK_POSTCODE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/;

/**
 * Best-effort split of a Companies House one-line address into the parts the
 * backend wants. e.g. "1 High Street, London, EC1A 1BB" →
 * { line1: "1 High Street", city: "London", postcode: "EC1A 1BB" }.
 * "London, N1 7GU" → { line1: "London", city: "London", postcode: "N1 7GU" }.
 */
export function parseUkAddress(full: string): {
  line1: string;
  city: string;
  postcode: string;
} {
  const parts = full
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  let postcode = '';
  if (parts.length && UK_POSTCODE.test(parts[parts.length - 1])) {
    postcode = parts.pop()!;
  }
  const city = parts.length ? parts[parts.length - 1] : '';
  const line1 =
    parts.length > 1 ? parts.slice(0, -1).join(', ') : city || full;
  return { line1: line1 || full, city, postcode };
}

export function toCompanySetupRequest(
  v: CompanySetupInput,
): UpsertCompanySetupRequest {
  return {
    legalName: v.legalName,
    companiesHouseNumber: v.companiesHouseNumber || null,
    registeredAddressLine1: v.registeredAddress,
    city: v.city,
    postcode: v.postcode,
    relationship: toInt(v.relationship)!,
    region: toInt(v.region)!,
    employeeSizeBand: toInt(v.employeeSizeBand)!,
    annualTurnoverBand: toInt(v.annualTurnoverBand)!,
    yearsInOperationBand: toInt(v.yearsInOperationBand)!,
  };
}

export function fromCompanySetup(d: CompanySetup): CompanySetupInput {
  return {
    companiesHouseNumber: d.companiesHouseNumber ?? '',
    legalName: d.legalName ?? '',
    registeredAddress: d.registeredAddressLine1 ?? '',
    city: d.city ?? '',
    postcode: d.postcode ?? '',
    relationship: toStr(d.relationship),
    region: toStr(d.region),
    employeeSizeBand: toStr(d.employeeSizeBand),
    annualTurnoverBand: toStr(d.annualTurnoverBand),
    yearsInOperationBand: toStr(d.yearsInOperationBand),
  };
}

/* ---- Step 2: Business profile ---- */

/**
 * Business profile "overlaps some company fields by design" — the backend
 * stores region + the three size bands here too, but the screen doesn't
 * re-collect them, so they're inherited from the saved company setup.
 */
export function toBusinessProfileRequest(
  v: BusinessProfileInput,
  company: CompanySetup | null | undefined,
): UpsertBusinessProfileRequest {
  return {
    sector: toInt(v.sector)!,
    region: company?.region ?? 0,
    employeeSizeBand: company?.employeeSizeBand ?? 0,
    annualTurnoverBand: company?.annualTurnoverBand ?? 0,
    yearsInOperationBand: company?.yearsInOperationBand ?? 0,
    city: v.city,
    postcode: v.postcode,
    description: v.description,
  };
}

export function fromBusinessProfile(d: BusinessProfile): BusinessProfileInput {
  return {
    sector: toStr(d.sector),
    subSector: '',
    city: d.city ?? '',
    postcode: d.postcode ?? '',
    description: d.description ?? '',
  };
}

/* ---- Step 4: Sustainability profile ---- */

const ANSWER_TO_INT = new Map(
  SUSTAINABILITY_ANSWER.map((o) => [o.label, o.value]),
);
const INT_TO_ANSWER = new Map(
  SUSTAINABILITY_ANSWER.map((o) => [o.value, o.label]),
);

const SUSTAINABILITY_FIELDS = [
  'ghgEmissions',
  'sustainabilityPolicy',
  'resourceTracking',
  'wellbeing',
  'training',
  'dei',
  'continuity',
  'governancePolicies',
  'riskReview',
] as const;

export function toSustainabilityProfileRequest(
  v: SustainabilityProfileInput,
): UpsertSustainabilityProfileRequest {
  const out = {} as Record<string, number>;
  for (const k of SUSTAINABILITY_FIELDS) out[k] = ANSWER_TO_INT.get(v[k]) ?? 0;
  return out as UpsertSustainabilityProfileRequest;
}

export function fromSustainabilityProfile(
  d: SustainabilityProfile,
): SustainabilityProfileInput {
  const out = {} as Record<string, string>;
  for (const k of SUSTAINABILITY_FIELDS) out[k] = INT_TO_ANSWER.get(d[k]) ?? '';
  return out as SustainabilityProfileInput;
}

/* ---- Step 3: Financial profile ---- */

export function toFinancialProfileRequest(
  v: FinancialProfileInput,
): UpsertFinancialProfileRequest {
  return {
    annualRevenueBand: toInt(v.annualRevenueBand) ?? null,
    ebitdaBand: toInt(v.ebitdaBand) ?? null,
    existingDebtBand: toInt(v.existingDebtBand) ?? null,
    cashReserves: toInt(v.cashReserves) ?? null,
    avgMonthlyRevenue: toInt(v.avgMonthlyRevenue) ?? null,
    grossMarginBand: toInt(v.grossMarginBand) ?? null,
    revenueGrowthBand: toInt(v.revenueGrowthBand) ?? null,
    receivablesBand: toInt(v.receivablesBand) ?? null,
  };
}

export function fromFinancialProfile(
  d: FinancialProfile,
): FinancialProfileInput {
  // The three new bands aren't derived server-side yet, so fall back to a
  // client-side derivation from the verified integration metrics. Once the
  // backend returns them, the server value (`d.*Band`) takes precedence.
  const derived = deriveMetricBands(d.integrationMetrics);
  return {
    annualRevenueBand: toStr(d.annualRevenueBand),
    avgMonthlyRevenue: toStr(d.avgMonthlyRevenue),
    ebitdaBand: toStr(d.ebitdaBand),
    existingDebtBand: toStr(d.existingDebtBand),
    cashReserves: toStr(d.cashReserves),
    grossMarginBand: toStr(d.grossMarginBand) || derived.grossMarginBand,
    revenueGrowthBand: toStr(d.revenueGrowthBand) || derived.revenueGrowthBand,
    receivablesBand: toStr(d.receivablesBand) || derived.receivablesBand,
  };
}

/** First band whose upper bound the value falls under (bounds ascending). */
function bandFor(
  value: number | null | undefined,
  bounds: number[],
): string {
  if (value == null) return '';
  const idx = bounds.findIndex((b) => value < b);
  return String(idx === -1 ? bounds.length + 1 : idx + 1);
}

/**
 * Derive the three new bands from the verified metric set, mirroring the
 * backend's own band thresholds (percentages as fractions, £ amounts raw).
 */
function deriveMetricBands(
  m: FinancialProfile['integrationMetrics'],
): {
  grossMarginBand: string;
  revenueGrowthBand: string;
  receivablesBand: string;
} {
  if (!m) return { grossMarginBand: '', revenueGrowthBand: '', receivablesBand: '' };

  const grossMargin =
    m.annualRevenue && m.annualRevenue > 0 && m.grossProfit != null
      ? m.grossProfit / m.annualRevenue
      : null;

  return {
    // <10 / 10-25 / 25-50 / 50-75 / >75 %
    grossMarginBand: bandFor(grossMargin, [0.1, 0.25, 0.5, 0.75]),
    // Declining / 0-10 / 10-25 / 25-50 / >50 %
    revenueGrowthBand: bandFor(m.revenueGrowthYoY, [0, 0.1, 0.25, 0.5]),
    // None / <£50k / £50k-£250k / £250k-£1m / >£1m
    receivablesBand: bandFor(m.accountsReceivable, [0.01, 50_000, 250_000, 1_000_000]),
  };
}

/* ---- Step 5: Funding profile ---- */

/** "£150,000" / "150,000.50" → 150000 / 150000.5 (NaN-safe → 0). */
function parseAmount(v: string): number {
  const n = Number(v.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function toFundingProfileRequest(
  v: FundingProfileInput,
): UpsertFundingProfileRequest {
  return {
    requestedAmount: parseAmount(v.amount),
    purpose: toInt(v.purpose)!,
    termMonths: toInt(v.term)!,
    urgency: toInt(v.urgency)!,
  };
}

export function fromFundingProfile(d: FundingProfile): FundingProfileInput {
  return {
    amount: d.requestedAmount == null ? '' : String(d.requestedAmount),
    purpose: toStr(d.purpose),
    term: d.termMonths == null ? '' : String(d.termMonths),
    urgency: toStr(d.urgency),
  };
}
