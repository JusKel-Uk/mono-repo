/**
 * Client-side onboarding API — the multi-step SME assessment wizard.
 *
 * Mirrors `api/ONBOARDING_FRONTEND_API.md`. Every route here requires the
 * Bearer token (`auth: true`) and spans three backend modules:
 *   - /onboarding/*  application lifecycle, Company (1), Business (2), Submit
 *   - /funding/*     Financial (3), integrations, funding evidence, Funding (5)
 *   - /scoring/*     Sustainability (4) + certificate evidence
 *
 * Enum fields are INTEGERS — see `@/lib/onboarding/enums`. A step `GET` returns
 * 404 when the form is empty; `getOrNull` maps that to `null` so callers render
 * a blank form instead of erroring.
 */

import { request, ApiError } from './client';

/** Run a step `GET` and treat a 404 (empty step) as "no data yet". */
async function getOrNull<T>(path: string): Promise<T | null> {
  try {
    return await request<T>(path, { method: 'GET', auth: true });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/* ==================================================================== *
 * Lookups — the backend-authoritative enum option sets
 * ==================================================================== */

/** One selectable option: the integer the API stores, and its display label. */
export type LookupOption = { value: number; label: string };

/** `options` is keyed by enum name, e.g. `companyRelationship`, `revenueBand`. */
export type LookupsResponse = { options: Record<string, LookupOption[]> };

/**
 * All enum option sets in one public call (no auth). Reference data — cache it
 * hard. Drives every enum dropdown so the UI can only offer what the API accepts.
 */
export function getLookups() {
  return request<LookupsResponse>('/lookups', { method: 'GET' });
}

/* ==================================================================== *
 * Application lifecycle & dashboard
 * ==================================================================== */

/** OnboardingStep value: 1 Company · 2 Business · 3 Financial · 4 Sustainability · 5 Funding */
export type StepNumber = 1 | 2 | 3 | 4 | 5;
/** StepStatus value: 0 NotStarted · 1 InProgress · 2 Complete */
export type StepStatus = 0 | 1 | 2;

export type ApplicationProgress = {
  applicationId: string;
  /** SubmissionStatus: 0 Draft · 1 Submitted */
  status: number;
  submittedAt?: string | null;
  completedCount: number;
  totalSteps: number;
  canSubmit: boolean;
  steps: { step: StepNumber; status: StepStatus }[];
};

/**
 * Create the draft application (idempotent server-side — resolves the existing
 * draft if there is one). Call once on the first dashboard visit after login.
 */
export function createApplication() {
  return request<{ applicationId: string }>('/onboarding/applications', {
    method: 'POST',
    auth: true,
  });
}

/** Dashboard progress: step ticks, completion count, submit enablement. */
export function getCurrentApplication() {
  return request<ApplicationProgress>('/onboarding/applications/current', {
    method: 'GET',
    auth: true,
  });
}

/** Submit the completed application. 409 if steps are still missing. */
export function submitApplication() {
  return request<ApplicationProgress>(
    '/onboarding/applications/current/submit',
    { method: 'POST', auth: true },
  );
}

/* ==================================================================== *
 * Step 1 — Company setup  (/onboarding)
 * ==================================================================== */

export type CompanySetup = {
  legalName: string;
  tradingName?: string | null;
  companiesHouseNumber?: string | null;
  relationship: number;
  region: number;
  registeredAddressLine1?: string | null;
  registeredAddressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
  employeeSizeBand: number;
  annualTurnoverBand: number;
  yearsInOperationBand: number;
  isCompaniesHouseVerified?: boolean;
};

export type UpsertCompanySetupRequest = Omit<
  CompanySetup,
  'isCompaniesHouseVerified'
>;

export type CompaniesHouseResult = {
  companyNumber: string;
  companyName: string;
  status: string;
  registeredOfficeAddress: string;
  isActive: boolean;
  isVerified: boolean;
};

export function getCompanySetup() {
  return getOrNull<CompanySetup>(
    '/onboarding/applications/current/company-setup',
  );
}

export function saveCompanySetup(body: UpsertCompanySetupRequest) {
  return request<CompanySetup>(
    '/onboarding/applications/current/company-setup',
    { method: 'PUT', body, auth: true },
  );
}

/** Companies House lookup. Rate-limited 5/min (429). */
export function verifyCompaniesHouse(companyNumber: string) {
  return request<CompaniesHouseResult>(
    '/onboarding/applications/current/company-setup/verify-companies-house',
    { method: 'POST', body: { companyNumber }, auth: true },
  );
}

/* ==================================================================== *
 * Step 2 — Business profile  (/onboarding)
 * ==================================================================== */

export type BusinessProfile = {
  sector: number;
  region: number;
  employeeSizeBand: number;
  annualTurnoverBand: number;
  yearsInOperationBand: number;
  city: string;
  postcode: string;
  description?: string | null;
};

export type UpsertBusinessProfileRequest = BusinessProfile;

export function getBusinessProfile() {
  return getOrNull<BusinessProfile>(
    '/onboarding/applications/current/business-profile',
  );
}

export function saveBusinessProfile(body: UpsertBusinessProfileRequest) {
  return request<BusinessProfile>(
    '/onboarding/applications/current/business-profile',
    { method: 'PUT', body, auth: true },
  );
}

/* ==================================================================== *
 * Step 3 — Financial profile  (/funding)
 * ==================================================================== */

export type IntegrationProvider = 1 | 2 | 3; // OpenBanking · Xero · QuickBooks

export type FinancialIntegration = {
  provider: IntegrationProvider;
  connected: boolean;
};

export type FinancialProfile = {
  annualRevenueBand?: number | null;
  ebitdaBand?: number | null;
  existingDebtBand?: number | null;
  cashReserves?: number | null;
  avgMonthlyRevenue?: number | null;
  /** When true, connected-source fields are read-only; skip them on PUT. */
  bandsLockedByIntegration?: boolean;
  integrations?: FinancialIntegration[];
};

/** All bands are optional — the financial profile is self-declared. */
export type UpsertFinancialProfileRequest = {
  annualRevenueBand?: number | null;
  ebitdaBand?: number | null;
  existingDebtBand?: number | null;
  cashReserves?: number | null;
  avgMonthlyRevenue?: number | null;
};

export function getFinancialProfile() {
  return getOrNull<FinancialProfile>(
    '/funding/applications/current/financial-profile',
  );
}

export function saveFinancialProfile(body: UpsertFinancialProfileRequest) {
  return request<FinancialProfile>(
    '/funding/applications/current/financial-profile',
    { method: 'PUT', body, auth: true },
  );
}

/* ---- Integrations (OAuth redirect flow) ----
 * `authorize` returns the provider's consent URL to redirect the browser to.
 * The provider then returns to `/funding/integrations/<p>/callback` which the
 * backend handles; on return we refetch the financial profile. `disconnect`
 * removes the connection.
 */

export type IntegrationSlug = 'open-banking' | 'xero' | 'quickbooks';

export type AuthorizeResponse = { authorizationUrl: string; state: string };

export function authorizeIntegration(slug: IntegrationSlug) {
  return request<AuthorizeResponse>(
    `/funding/integrations/${slug}/authorize`,
    { method: 'POST', auth: true },
  );
}

export function disconnectIntegration(slug: IntegrationSlug) {
  return request<void>(`/funding/integrations/${slug}`, {
    method: 'DELETE',
    auth: true,
  });
}

/* ---- Financial evidence (multipart) ---- */

export type Evidence = { evidenceId: string; fileName: string };

export function uploadFundingEvidence(file: File) {
  const form = new FormData();
  form.append('file', file);
  return request<Evidence>('/funding/evidence', {
    method: 'POST',
    body: form,
    auth: true,
  });
}

export function removeFundingEvidence(evidenceId: string) {
  return request<void>(`/funding/evidence/${evidenceId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/* ==================================================================== *
 * Step 4 — Sustainability profile  (/scoring)
 * ==================================================================== */

/** Nine ESG questions; each is a SustainabilityAnswer (0–5). */
export type SustainabilityProfile = {
  ghgEmissions: number;
  sustainabilityPolicy: number;
  resourceTracking: number;
  wellbeing: number;
  training: number;
  dei: number;
  continuity: number;
  governancePolicies: number;
  riskReview: number;
};

export type UpsertSustainabilityProfileRequest = SustainabilityProfile;

/** questionKey 1–9, matching the nine fields above in order. */
export type SustainabilityQuestionKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export function getSustainabilityProfile() {
  return getOrNull<SustainabilityProfile>(
    '/scoring/applications/current/sustainability-profile',
  );
}

export function saveSustainabilityProfile(
  body: UpsertSustainabilityProfileRequest,
) {
  return request<SustainabilityProfile>(
    '/scoring/applications/current/sustainability-profile',
    { method: 'PUT', body, auth: true },
  );
}

export function uploadSustainabilityEvidence(
  file: File,
  questionKey: SustainabilityQuestionKey,
) {
  const form = new FormData();
  form.append('file', file);
  form.append('questionKey', String(questionKey));
  return request<Evidence>('/scoring/evidence', {
    method: 'POST',
    body: form,
    auth: true,
  });
}

export function removeSustainabilityEvidence(evidenceId: string) {
  return request<void>(`/scoring/evidence/${evidenceId}`, {
    method: 'DELETE',
    auth: true,
  });
}

/* ==================================================================== *
 * Step 5 — Funding profile  (/funding)
 * ==================================================================== */

export type FundingProfile = {
  /** decimal, two decimal places in the UI (e.g. 150000.00). */
  requestedAmount: number;
  purpose: number;
  termMonths: number;
  urgency: number;
};

export type UpsertFundingProfileRequest = FundingProfile;

export function getFundingProfile() {
  return getOrNull<FundingProfile>(
    '/funding/applications/current/funding-profile',
  );
}

export function saveFundingProfile(body: UpsertFundingProfileRequest) {
  return request<FundingProfile>(
    '/funding/applications/current/funding-profile',
    { method: 'PUT', body, auth: true },
  );
}
