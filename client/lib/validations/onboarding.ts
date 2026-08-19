import { z } from 'zod';

import {
  cleanText,
  optionalMultiline,
  optionalOneOf,
  optionalText,
  oneOf,
  requiredText,
} from './sanitize';

/* ---- Select options (placeholders — refine against the real data model) ---- */

export const RELATIONSHIP_OPTIONS = [
  'Owner / Director',
  'Employee',
  'Accountant / Adviser',
  'Other',
];

export const REGION_OPTIONS = [
  'England',
  'Scotland',
  'Wales',
  'Northern Ireland',
];

export const EMPLOYEE_BAND_OPTIONS = ['1-9', '10-49', '50-249', '250+'];

export const TURNOVER_OPTIONS = [
  'Under £250k',
  '£250k-£1m',
  '£1m-£5m',
  '£5m-£25m',
  'Over £25m',
];

export const YEARS_OPTIONS = [
  'Under 1 year',
  '1-3 years',
  '3-5 years',
  '5+ years',
];

export const SECTOR_OPTIONS = [
  'Agriculture',
  'Construction',
  'Manufacturing',
  'Professional Services',
  'Retail & Wholesale',
  'Technology',
  'Transport & Logistics',
  'Other',
];

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
  registeredCompanyName: requiredText('Enter your registered company name', 160),
  relationship: oneOf(
    RELATIONSHIP_OPTIONS,
    'Select your relationship to the company',
  ),
  region: oneOf(REGION_OPTIONS, 'Select a region'),
  employeeBand: oneOf(EMPLOYEE_BAND_OPTIONS, 'Select an employee size band'),
  annualTurnover: oneOf(TURNOVER_OPTIONS, 'Select your annual turnover'),
  yearsInOperation: oneOf(YEARS_OPTIONS, 'Select years in operation'),
});
export type CompanySetupInput = z.infer<typeof companySetupSchema>;

/* ---- Step 2: Business profile ---- */

export const businessProfileSchema = z.object({
  sector: oneOf(SECTOR_OPTIONS, 'Select your sector'),
  subSector: optionalText(100),
  city: requiredText('Enter your city or town', 80),
  postcode: z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .min(1, 'Enter your postcode')
        .max(10, 'Enter a valid postcode')
        .regex(/^[A-Za-z0-9 ]+$/, 'Enter a valid postcode'),
    ),
  description: optionalMultiline(2000),
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

export const FUNDING_PURPOSE_OPTIONS = [
  'Working capital',
  'Equipment purchase',
  'Expansion / growth',
  'Refinancing',
  'Property / premises',
  'Other',
];

export const URGENCY_OPTIONS = [
  'Immediate',
  'Within 1-3 months',
  'Within 3-6 months',
  '6+ months',
];

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
  purpose: oneOf(FUNDING_PURPOSE_OPTIONS, 'Select a funding purpose'),
  // Optional whole number of months.
  term: z
    .string()
    .transform(cleanText)
    .pipe(
      z
        .string()
        .refine(
          (v) => v === '' || /^\d{1,3}$/.test(v),
          'Enter the term in whole months',
        ),
    ),
  urgency: oneOf(URGENCY_OPTIONS, 'Select urgency'),
});
export type FundingProfileInput = z.infer<typeof fundingProfileSchema>;
