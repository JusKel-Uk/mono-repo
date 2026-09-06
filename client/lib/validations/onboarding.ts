import { z } from 'zod';

import {
  cleanText,
  requiredMultiline,
  optionalText,
  requiredText,
  enumSelect,
  optionalEnumSelect,
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
  ANNUAL_REVENUE_BAND,
  EBITDA_BAND,
  EXISTING_DEBT_BAND,
  CASH_RESERVES_BAND,
  AVG_MONTHLY_REVENUE_BAND,
  GROSS_MARGIN_BAND,
  REVENUE_GROWTH_BAND,
  RECEIVABLES_BAND,
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

// All bands are self-declared and optional; options come from /lookups.
export const financialProfileSchema = z.object({
  annualRevenueBand: optionalEnumSelect(ANNUAL_REVENUE_BAND),
  avgMonthlyRevenue: optionalEnumSelect(AVG_MONTHLY_REVENUE_BAND),
  grossMarginBand: optionalEnumSelect(GROSS_MARGIN_BAND),
  ebitdaBand: optionalEnumSelect(EBITDA_BAND),
  revenueGrowthBand: optionalEnumSelect(REVENUE_GROWTH_BAND),
  existingDebtBand: optionalEnumSelect(EXISTING_DEBT_BAND),
  receivablesBand: optionalEnumSelect(RECEIVABLES_BAND),
  cashReserves: optionalEnumSelect(CASH_RESERVES_BAND),
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

// The backend requires every question answered (a valid answer, not "unset").
const answer = () =>
  z
    .string()
    .refine((v) => SUSTAINABILITY_ANSWER_OPTIONS.includes(v), 'Select an answer');

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
