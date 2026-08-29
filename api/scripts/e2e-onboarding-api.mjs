#!/usr/bin/env node
/**
 * juskel SME onboarding — full real-API E2E (HTTP only).
 * Pattern: ~/Space/powerhouse/e2e-real-api-testing-playbook.md
 *
 * Usage:
 *   E2E_SPAWN_API=1 E2E_PORT=5245 node scripts/e2e-onboarding-api.mjs
 *
 * Optional env:
 *   BASE_URL, E2E_OTP, E2E_OTP_FILE, E2E_SPAWN_API, E2E_PORT
 *   COMPANIES_HOUSE_API_KEY — if set, CH verify expects 200 instead of 404
 */
import { execSync, spawn } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiClient, createLogger, tinyPngBuffer } from './lib/e2e-http-client.mjs';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const BASE = process.env.BASE_URL || (process.env.E2E_SPAWN_API === '1'
  ? `http://localhost:${process.env.E2E_PORT || '5243'}`
  : 'http://localhost:5242');
const tag = Date.now();
const email = `e2e-${tag}@juskel.co.uk`;
const password = 'E2eTestPass123!';
const { api, apiGet, apiDelete, apiMultipart, oauthCallback } = createApiClient(BASE);
const { log, summary } = createLogger();

const otpPattern = /\[E2E_OTP\]\s+([^:]+):\s+(\d{6})/;
const otpFile = process.env.E2E_OTP_FILE || join(tmpdir(), `juskel-e2e-otp-${process.pid}.txt`);

const companySetupBody = {
  legalName: 'JusKel E2E Ltd',
  companiesHouseNumber: '00000006',
  relationship: 2,
  region: 1,
  registeredAddress: '1 Test Street',
  city: 'Manchester',
  postcode: 'M1 1AA',
  employeeSizeBand: 2,
  annualTurnoverBand: 2,
  yearsInOperationBand: 3,
};

const businessProfileBody = {
  sector: 1,
  subSector: 'Software development',
  region: 1,
  employeeSizeBand: 2,
  annualTurnoverBand: 2,
  yearsInOperationBand: 3,
  city: 'Manchester',
  postcode: 'M1 1AA',
  description: 'E2E test business — IT services across England.',
};

const financialProfileBody = {
  annualRevenueBand: 2,
  ebitdaBand: 3,
  existingDebtBand: 1,
  cashReserves: 3,
  avgMonthlyRevenue: 3,
};

const sustainabilityBody = {
  ghgEmissions: 1,
  sustainabilityPolicy: 1,
  resourceTracking: 2,
  wellbeing: 1,
  training: 2,
  dei: 1,
  continuity: 3,
  governancePolicies: 1,
  riskReview: 2,
};

const fundingProfileBody = {
  requestedAmount: 150000.0,
  purpose: 1,
  termMonths: 60,
  urgency: 2,
};

async function waitForHealth(maxMs = 90_000, baseUrl = BASE) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function spawnApi() {
  return new Promise((resolve, reject) => {
    const otpWaiters = new Map();
    let startupFailed = false;
    const port = process.env.E2E_PORT || '5243';

    const child = spawn(
      'dotnet',
      ['run', '--project', 'src/Host/juskel.Api/juskel.Api.csproj', '--no-launch-profile'],
      {
        cwd: apiRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ASPNETCORE_ENVIRONMENT: 'Development',
          ASPNETCORE_URLS: `http://localhost:${port}`,
          E2E_OTP_FILE: otpFile,
        },
      },
    );

    const onLine = (line) => {
      process.stdout.write(`[api] ${line}\n`);
      if (line.includes('Unhandled exception') || line.includes('Error Number:')) {
        startupFailed = true;
      }
      const match = line.match(otpPattern);
      if (match) {
        const [, em, code] = match;
        const waiter = otpWaiters.get(em.trim());
        if (waiter) waiter(code);
      }
    };

    child.stdout.on('data', (buf) => buf.toString().split('\n').forEach(onLine));
    child.stderr.on('data', (buf) => buf.toString().split('\n').forEach(onLine));
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0 && code !== null) startupFailed = true;
    });

    resolve({
      child,
      waitUntilReady: async (maxMs = 180_000) => {
        const start = Date.now();
        while (Date.now() - start < maxMs) {
          if (startupFailed && !(await waitForHealth(2_000, BASE))) {
            throw new Error('API process failed during startup (check DB / Azure firewall).');
          }
          if (await waitForHealth(2_000, BASE)) return;
          await new Promise((r) => setTimeout(r, 2000));
        }
        throw new Error('API did not become ready in time.');
      },
      waitForOtp: (targetEmail, timeoutMs = 30_000) =>
        new Promise((res, rej) => {
          const timer = setTimeout(() => rej(new Error(`OTP timeout for ${targetEmail}`)), timeoutMs);
          otpWaiters.set(targetEmail, (code) => {
            clearTimeout(timer);
            otpWaiters.delete(targetEmail);
            res(code);
          });
        }),
      stop: () => child.kill('SIGTERM'),
    });
  });
}

async function readOtpFromFile(targetEmail, timeoutMs = 15_000) {
  const normalized = targetEmail.trim().toLowerCase();
  const fileLinePattern = /^([^:]+):(\d{6})$/;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const lines = readFileSync(otpFile, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        const fileMatch = trimmed.match(fileLinePattern);
        if (fileMatch && fileMatch[1].trim().toLowerCase() === normalized) return fileMatch[2];
        const logMatch = trimmed.match(otpPattern);
        if (logMatch && logMatch[1].trim().toLowerCase() === normalized) return logMatch[2];
      }
    } catch {
      // file not created yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

async function resolveOtpFromAzureLogs(targetEmail, timeoutMs = 60_000) {
  const normalized = targetEmail.trim().toLowerCase();
  const appName = process.env.AZURE_CONTAINER_APP || 'juskel-api';
  const resourceGroup = process.env.AZURE_RESOURCE_GROUP || 'DevTest';
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const logs = execSync(
        `az containerapp logs show -n "${appName}" -g "${resourceGroup}" --tail 80 2>/dev/null`,
        { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
      );
      for (const line of logs.split('\n')) {
        const match = line.match(otpPattern);
        if (match && match[1].trim().toLowerCase() === normalized) return match[2];
      }
    } catch {
      // az CLI or logs not ready yet
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return null;
}

async function resolveOtp(targetEmail, apiProcess) {
  if (process.env.E2E_OTP) return process.env.E2E_OTP;
  const fromFile = await readOtpFromFile(targetEmail);
  if (fromFile) return fromFile;
  if (apiProcess) return apiProcess.waitForOtp(targetEmail);
  if (BASE.includes('azurecontainerapps.io')) {
    const fromAzure = await resolveOtpFromAzureLogs(targetEmail);
    if (fromAzure) return fromAzure;
  }
  throw new Error(
    `OTP not found. Restart API with E2E_OTP_FILE=${otpFile} (Development), set E2E_OTP, use E2E_SPAWN_API=1, or ensure Azure logs emit [E2E_OTP].`,
  );
}

async function testSystemEndpoints() {
  const root = await apiGet('/');
  log('GET /', root.status === 200 && root.data?.status === 'online', {
    status: root.status,
    version: root.data?.version,
  });

  const health = await apiGet('/health');
  log('GET /health', health.status === 200, { status: health.status, body: health.data });

  const debug = await apiGet('/debug');
  log('GET /debug (dev throws → 500)', debug.status === 500, { status: debug.status });

  const lookups = await apiGet('/onboarding/lookups');
  const sector = lookups.data?.options?.businessSector?.[0];
  log('GET /onboarding/lookups', lookups.status === 200 && sector?.value === 1 && sector?.label === 'Technology', {
    status: lookups.status,
    firstSector: sector,
  });
}

async function registerAndLogin(apiProcess) {
  const reg = await api('POST', '/identity/users', null, {
    firstName: 'E2E',
    lastName: 'Tester',
    email,
    password,
  });
  log('POST /identity/users', reg.status === 201, { status: reg.status, userId: reg.data?.userId });
  const userId = reg.data?.userId;

  const otp = await resolveOtp(email, apiProcess);
  const verify = await api('POST', '/identity/verification', null, { email, otpCode: otp });
  log('POST /identity/verification', verify.status === 200, { status: verify.status });

  const resend = await api('POST', '/identity/verification/resend', null, { email });
  log('POST /identity/verification/resend', resend.status === 202, { status: resend.status });

  const login = await api('POST', '/identity/sessions', null, { email, password });
  log('POST /identity/sessions', login.status === 201 && !!login.data?.accessToken, {
    status: login.status,
    userId: login.data?.userId,
  });

  const token = login.data.accessToken;

  const me = await apiGet('/identity/me', token);
  log('GET /identity/me', me.status === 200 && me.data?.id === userId, {
    status: me.status,
    email: me.data?.email,
  });

  const userById = await apiGet(`/identity/users/${userId}`, token);
  log('GET /identity/users/{id}', userById.status === 200, {
    status: userById.status,
    id: userById.data?.id,
  });

  return { token, userId };
}

async function testOAuthProvider(token, label, authorizePath, callbackPath) {
  const auth = await api('POST', authorizePath, token);
  const okAuth = auth.status === 200 && !!auth.data?.authorizationUrl && !!auth.data?.state;
  log(`POST ${authorizePath}`, okAuth, { status: auth.status, hasUrl: !!auth.data?.authorizationUrl });

  const cb = await oauthCallback(callbackPath, 'e2e-stub-auth-code', auth.data.state);
  log(`GET ${callbackPath}`, cb.status === 200, { status: cb.status, provider: cb.data?.provider });

  const del = await apiDelete(callbackPath.replace('/callback', ''), token);
  log(`DELETE ${callbackPath.replace('/callback', '')}`, del.status === 204, { status: del.status });
}

async function uploadFundingEvidence(token) {
  const form = new FormData();
  const blob = new Blob([tinyPngBuffer()], { type: 'image/png' });
  form.append('file', blob, 'e2e-evidence.png');
  const upload = await apiMultipart('/funding/evidence', token, form);
  log('POST /funding/evidence', upload.status === 201 && !!upload.data?.evidenceId, {
    status: upload.status,
    evidenceId: upload.data?.evidenceId,
  });
  return upload.data?.evidenceId;
}

async function uploadScoringEvidence(token) {
  const form = new FormData();
  const blob = new Blob([tinyPngBuffer()], { type: 'image/png' });
  form.append('file', blob, 'e2e-cert.png');
  form.append('questionKey', '1');
  const upload = await apiMultipart('/scoring/evidence', token, form);
  log('POST /scoring/evidence', upload.status === 201 && !!upload.data?.evidenceId, {
    status: upload.status,
    evidenceId: upload.data?.evidenceId,
  });
  return upload.data?.evidenceId;
}

async function runFullCoverage(token) {
  const create = await api('POST', '/onboarding/applications', token);
  log('POST /onboarding/applications', create.status === 201, {
    status: create.status,
    applicationId: create.data?.applicationId,
  });
  const applicationId = create.data?.applicationId;

  const createAgain = await api('POST', '/onboarding/applications', token);
  log('POST /onboarding/applications (idempotent)', createAgain.status === 201
    && createAgain.data?.applicationId === applicationId, {
    status: createAgain.status,
    sameId: createAgain.data?.applicationId === applicationId,
  });

  const submitEarly = await api('POST', '/onboarding/applications/current/submit', token);
  log('POST /onboarding/applications/current/submit (incomplete → 409)', submitEarly.status === 409, {
    status: submitEarly.status,
  });

  const companyGetEmpty = await apiGet('/onboarding/applications/current/company-setup', token);
  log('GET /onboarding/.../company-setup (empty → 404)', companyGetEmpty.status === 404, {
    status: companyGetEmpty.status,
  });

  const companyPut = await api('PUT', '/onboarding/applications/current/company-setup', token, companySetupBody);
  log('PUT /onboarding/.../company-setup', companyPut.status === 200, { status: companyPut.status });

  const companyGet = await apiGet('/onboarding/applications/current/company-setup', token);
  log('GET /onboarding/.../company-setup', companyGet.status === 200
    && companyGet.data?.legalName === companySetupBody.legalName, {
    status: companyGet.status,
    legalName: companyGet.data?.legalName,
  });

  const chVerify = await api(
    'POST',
    '/onboarding/applications/current/company-setup/verify-companies-house',
    token,
    { companyNumber: '00000006' },
  );
  const chHasKey = !!process.env.COMPANIES_HOUSE_API_KEY;
  const chOk = chHasKey ? chVerify.status === 200 : chVerify.status === 404;
  log('POST /onboarding/.../verify-companies-house', chOk, {
    status: chVerify.status,
    note: chHasKey ? 'live CH key' : 'no API key → 404 expected',
  });

  const businessGetEmpty = await apiGet('/onboarding/applications/current/business-profile', token);
  log('GET /onboarding/.../business-profile (empty → 404)', businessGetEmpty.status === 404, {
    status: businessGetEmpty.status,
  });

  const businessPut = await api('PUT', '/onboarding/applications/current/business-profile', token, businessProfileBody);
  log('PUT /onboarding/.../business-profile', businessPut.status === 200, { status: businessPut.status });

  const businessGet = await apiGet('/onboarding/applications/current/business-profile', token);
  log('GET /onboarding/.../business-profile', businessGet.status === 200, {
    status: businessGet.status,
    sector: businessGet.data?.sector,
  });

  const financialPut = await api('PUT', '/funding/applications/current/financial-profile', token, financialProfileBody);
  log('PUT /funding/.../financial-profile', financialPut.status === 200, { status: financialPut.status });

  const financialGet = await apiGet('/funding/applications/current/financial-profile', token);
  log('GET /funding/.../financial-profile', financialGet.status === 200, {
    status: financialGet.status,
    annualRevenueBand: financialGet.data?.annualRevenueBand,
  });

  const fundingEvidenceId = await uploadFundingEvidence(token);
  if (fundingEvidenceId) {
    const delEvidence = await apiDelete(`/funding/evidence/${fundingEvidenceId}`, token);
    log('DELETE /funding/evidence/{id}', delEvidence.status === 204, { status: delEvidence.status });
  }

  await testOAuthProvider(
    token,
    'open-banking',
    '/funding/integrations/open-banking/authorize',
    '/funding/integrations/open-banking/callback',
  );

  const financialAfterOb = await apiGet('/funding/applications/current/financial-profile', token);
  log('GET /funding/.../financial-profile (after OB disconnect)', financialAfterOb.status === 200, {
    status: financialAfterOb.status,
    bandsLocked: financialAfterOb.data?.bandsLockedByIntegration,
  });

  await testOAuthProvider(
    token,
    'xero',
    '/funding/integrations/xero/authorize',
    '/funding/integrations/xero/callback',
  );

  await testOAuthProvider(
    token,
    'quickbooks',
    '/funding/integrations/quickbooks/authorize',
    '/funding/integrations/quickbooks/callback',
  );

  const financialRefresh = await api('PUT', '/funding/applications/current/financial-profile', token, financialProfileBody);
  log('PUT /funding/.../financial-profile (refresh after integrations)', financialRefresh.status === 200, {
    status: financialRefresh.status,
  });

  const sustainabilityGetEmpty = await apiGet('/scoring/applications/current/sustainability-profile', token);
  log('GET /scoring/.../sustainability-profile (empty → 404)', sustainabilityGetEmpty.status === 404, {
    status: sustainabilityGetEmpty.status,
  });

  const sustainabilityPut = await api('PUT', '/scoring/applications/current/sustainability-profile', token, sustainabilityBody);
  log('PUT /scoring/.../sustainability-profile', sustainabilityPut.status === 200, { status: sustainabilityPut.status });

  const sustainabilityGet = await apiGet('/scoring/applications/current/sustainability-profile', token);
  log('GET /scoring/.../sustainability-profile', sustainabilityGet.status === 200, {
    status: sustainabilityGet.status,
    ghgEmissions: sustainabilityGet.data?.ghgEmissions,
  });

  const scoringEvidenceId = await uploadScoringEvidence(token);
  if (scoringEvidenceId) {
    const delScoring = await apiDelete(`/scoring/evidence/${scoringEvidenceId}`, token);
    log('DELETE /scoring/evidence/{id}', delScoring.status === 204, { status: delScoring.status });
  }

  const fundingGetEmpty = await apiGet('/funding/applications/current/funding-profile', token);
  log('GET /funding/.../funding-profile (empty → 404)', fundingGetEmpty.status === 404, {
    status: fundingGetEmpty.status,
  });

  const fundingPut = await api('PUT', '/funding/applications/current/funding-profile', token, fundingProfileBody);
  log('PUT /funding/.../funding-profile', fundingPut.status === 200, { status: fundingPut.status });

  const fundingGet = await apiGet('/funding/applications/current/funding-profile', token);
  log('GET /funding/.../funding-profile', fundingGet.status === 200
    && fundingGet.data?.requestedAmount === fundingProfileBody.requestedAmount, {
    status: fundingGet.status,
    amount: fundingGet.data?.requestedAmount,
  });

  const current = await apiGet('/onboarding/applications/current', token);
  const progressOk =
    current.status === 200 &&
    current.data?.completedCount === 5 &&
    current.data?.canSubmit === true &&
    current.data?.status === 0;
  log('GET /onboarding/applications/current (5/5 canSubmit)', progressOk, {
    status: current.status,
    completedCount: current.data?.completedCount,
    canSubmit: current.data?.canSubmit,
  });

  const submit = await api('POST', '/onboarding/applications/current/submit', token);
  const submitted =
    submit.status === 200 &&
    submit.data?.applicationId === applicationId &&
    submit.data?.status === 1;
  log('POST /onboarding/applications/current/submit', submitted, {
    status: submit.status,
    applicationStatus: submit.data?.status,
    submittedAt: submit.data?.submittedAt,
  });

  const afterSubmit = await apiGet('/onboarding/applications/current', token);
  log('GET /onboarding/applications/current (after submit)', afterSubmit.data?.status === 1, {
    status: afterSubmit.data?.status,
    submittedAt: afterSubmit.data?.submittedAt,
  });
}

async function main() {
  let apiProcess;
  try {
    writeFileSync(otpFile, '');
    console.log(`E2E OTP file: ${otpFile}`);
    console.log(`Target: ${BASE}\n`);

    if (process.env.E2E_SPAWN_API === '1') {
      console.log(`Spawning API on ${BASE} (E2E_SPAWN_API=1)…`);
      apiProcess = await spawnApi();
      await apiProcess.waitUntilReady();
      log('API spawned', true, BASE);
    } else {
      const healthTimeout = BASE.includes('azurecontainerapps.io') ? 120_000 : 5_000;
      const healthy = await waitForHealth(healthTimeout);
      if (!healthy) {
        log('GET /health', false, `API not reachable at ${BASE} within ${healthTimeout / 1000}s`);
        process.exit(1);
      }
    }

    await testSystemEndpoints();
    const { token } = await registerAndLogin(apiProcess);
    await runFullCoverage(token);

    const { failed } = summary();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    apiProcess?.stop();
    try {
      unlinkSync(otpFile);
    } catch {
      // ignore
    }
  }
}

main();
