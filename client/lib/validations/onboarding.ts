import { z } from 'zod';

import {
  cleanText,
  requiredMultiline,
  optionalOneOf,
  optionalText,
  requiredText,
  enumSelect,
} from './sanitize';

/** UK postcode — mirrors the backend's server-side rule. */
export const UK_POSTCODE_RE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/;

/** Required, cleaned UK postcode field. */
const ukPostcode = () =>
  z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, 'Enter your postcode')
        .regex(UK_POSTCODE_RE, 'Enter a valid UK postcode'),
    );
import {
  COMPANY_RELATIONSHIP,
  UK_REGION,
  EMPLOYEE_SIZE_BAND,
  ANNUAL_TURNOVER_BAND,
  YEARS_IN_OPERATION_BAND,
  FUNDING_PURPOSE,
  FUNDING_URGENCY,
  BUSINESS_SECTOR,
} from '@/lib/onboarding/enums';

/* ---- Step 1: Company setup ---- */

export const companySetupSchema = z.object({
  // Optional, but if present a UK company number is exactly 8 alphanumerics.
  companiesHouseNumber: z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .refine(
          (v) => v === '' || /^[A-Za-z0-9]{8}$/.test(v),
          'A company number is 8 characters (letters or digits)',
        ),
    ),
  legalName: requiredText('Enter your registered company name', 160),
  // Address (line 1) + city + postcode are all required by the backend.
  // Auto-filled from Companies House verify, but editable / manual-enterable.
  registeredAddress: requiredText('Enter your registered address', 250),
  city: requiredText('Enter your city or town', 80),
  postcode: ukPostcode(),
  relationship: enumSelect(
    COMPANY_RELATIONSHIP,
    'Select your relationship to the company',
  ),
  region: enumSelect(UK_REGION, 'Select a region'),
  employeeSizeBand: enumSelect(EMPLOYEE_SIZE_BAND, 'Select an employee size band'),
  annualTurnoverBand: enumSelect(
    ANNUAL_TURNOVER_BAND,
    'Select your annual turnover',
  ),
  yearsInOperationBand: enumSelect(
    YEARS_IN_OPERATION_BAND,
    'Select years in operation',
  ),
});
export type CompanySetupInput = z.infer<typeof companySetupSchema>;

/* ---- Step 2: Business profile ---- */

export const businessProfileSchema = z.object({
  sector: enumSelect(BUSINESS_SECTOR, 'Select your sector'),
  subSector: optionalText(100),
  city: requiredText('Enter your city or town', 80),
  postcode: ukPostcode(),
  description: requiredMultiline('Describe your business', 2000),
});
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;

/* ---- Step 3: Financial profile ---- */

// Per-field bands (placeholders — refine against the real data model). Each set
// includes the value a connected data source reports (see VERIFIED_BANDS).
export const ANNUAL_REVENUE_BANDS = [
  'Under £250k',
  '£250k-£1m',
  '£1m-£5m',
  '£5m-£25m',
  'Over £25m',
];
export const EBITDA_BANDS = [
  'Loss-making',
  '0-5% margin',
  '5-15% margin',
  '15-30% margin',
  'Over 30% margin',
];
export const EXISTING_DEBT_BANDS = [
  'No debt',
  'Under £50k',
  '£50k-£250k',
  '£250k-£1m',
  'Over £1m',
];
export const CASH_RESERVES_BANDS = [
  'Under 1 month',
  '1-3 months',
  '3-6 months',
  '6-12 months',
  'Over 12 months',
];
export const AVG_MONTHLY_REVENUE_BANDS = [
  'Under £20k',
  '£20k-£80k',
  '£80k-£400k',
  '£400k-£1m',
  'Over £1m',
];

export const financialProfileSchema = z.object({
  annualRevenueBand: optionalOneOf(ANNUAL_REVENUE_BANDS),
  ebitdaBand: optionalOneOf(EBITDA_BANDS),
  existingDebtBand: optionalOneOf(EXISTING_DEBT_BANDS),
  cashReserves: optionalOneOf(CASH_RESERVES_BANDS),
  avgMonthlyRevenue: optionalOneOf(AVG_MONTHLY_REVENUE_BANDS),
});
export type FinancialProfileInput = z.infer<typeof financialProfileSchema>;

/* ---- Step 4: Sustainability profile ---- */

// Every sustainability question answers with one of these (the third option
// varies per question, but the full set is fixed).
export const SUSTAINABILITY_ANSWER_OPTIONS = [
  'Yes',
  'No',
  'In progress',
  'Partially',
  'Occasionally',
];

const answer = () => optionalOneOf(SUSTAINABILITY_ANSWER_OPTIONS);

export const sustainabilityProfileSchema = z.object({
  ghgEmissions: answer(),
  sustainabilityPolicy: answer(),
  resourceTracking: answer(),
  wellbeing: answer(),
  training: answer(),
  dei: answer(),
  continuity: answer(),
  governancePolicies: answer(),
  riskReview: answer(),
});
export type SustainabilityProfileInput = z.infer<
  typeof sustainabilityProfileSchema
>;

/* ---- Step 5: Funding profile ---- */

export const fundingProfileSchema = z.object({
  // Accept currency-formatted input, e.g. "£150,000" or "150000".
  amount: z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, 'Enter a funding amount')
        .max(20, 'Enter a valid amount')
        .regex(/^[£$€]?\s?\d[\d,.\s]*$/, 'Enter a valid amount, e.g. £150,000'),
    ),
  purpose: enumSelect(FUNDING_PURPOSE, 'Select a funding purpose'),
  // The backend requires the term — whole number of months.
  term: z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, 'Enter the term in months')
        .regex(/^\d{1,3}$/, 'Enter the term in whole months'),
    ),
  urgency: enumSelect(FUNDING_URGENCY, 'Select urgency'),
});
export type FundingProfileInput = z.infer<typeof fundingProfileSchema>;
