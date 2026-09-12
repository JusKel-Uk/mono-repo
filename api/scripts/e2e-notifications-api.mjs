#!/usr/bin/env node
/**
 * juskel notifications module — inbox + gateway preference filter (HTTP only).
 *
 * Usage:
 *   E2E_SPAWN_API=1 E2E_PORT=5247 node scripts/e2e-notifications-api.mjs
 */
import { execSync, spawn } from 'node:child_process';
import { readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiClient, createLogger } from './lib/e2e-http-client.mjs';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || (process.env.E2E_SPAWN_API === '1'
  ? `http://localhost:${process.env.E2E_PORT || '5247'}`
  : 'http://localhost:5242');
const tag = Date.now();
const email = `e2e-notif-${tag}@juskel.co.uk`;
const password = 'E2eTestPass123!';
const { api, apiGet } = createApiClient(BASE);
const { log, summary } = createLogger();
const otpPattern = /\[E2E_OTP\]\s+([^:]+):\s+(\d{6})/;
const otpFile = process.env.E2E_OTP_FILE || join(tmpdir(), `juskel-e2e-notif-otp-${process.pid}.txt`);

const companySetupBody = {
  legalName: 'JusKel Notify Ltd',
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
  description: 'E2E notification test business — IT services across England.',
};

const allOn = {
  assessmentProgress: true,
  submissionsNeedAttention: true,
  expertReviewUpdates: true,
  integrationSyncEvents: true,
  scoreUpdates: true,
  newFundingMatches: true,
  inAppEnabled: true,
  emailEnabled: true,
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
    let startupFailed = false;
    const port = process.env.E2E_PORT || '5247';
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
    };
    child.stdout.on('data', (buf) => buf.toString().split('\n').forEach(onLine));
    child.stderr.on('data', (buf) => buf.toString().split('\n').forEach(onLine));
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0 && code !== null) startupFailed = true;
    });
    resolve({
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
      stop: () => child.kill('SIGTERM'),
    });
  });
}

function latestOtpFromFile(targetEmail) {
  const normalized = targetEmail.trim().toLowerCase();
  const fileLinePattern = /^([^:]+):(\d{6})$/;
  try {
    const lines = readFileSync(otpFile, 'utf8').split('\n');
    let found = null;
    for (const line of lines) {
      const trimmed = line.trim();
      const fileMatch = trimmed.match(fileLinePattern);
      if (fileMatch && fileMatch[1].trim().toLowerCase() === normalized) found = fileMatch[2];
      const logMatch = trimmed.match(otpPattern);
      if (logMatch && logMatch[1].trim().toLowerCase() === normalized) found = logMatch[2];
    }
    return found;
  } catch {
    return null;
  }
}

function latestOtpFromAzureLogs(targetEmail) {
  const normalized = targetEmail.trim().toLowerCase();
  const appName = process.env.AZURE_CONTAINER_APP || 'juskel-api';
  const resourceGroup = process.env.AZURE_RESOURCE_GROUP || 'DevTest';
  try {
    const logs = execSync(
      `az containerapp logs show -n "${appName}" -g "${resourceGroup}" --tail 120 2>/dev/null`,
      { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 },
    );
    let found = null;
    for (const line of logs.split('\n')) {
      const match = line.match(otpPattern);
      if (match && match[1].trim().toLowerCase() === normalized) found = match[2];
    }
    return found;
  } catch {
    return null;
  }
}

async function waitForOtp(targetEmail, previousCode = null, timeoutMs) {
  const useAzureLogs = BASE.includes('azurecontainerapps.io');
  const limit = timeoutMs ?? (useAzureLogs ? 60_000 : 20_000);
  const start = Date.now();
  while (Date.now() - start < limit) {
    const code = latestOtpFromFile(targetEmail)
      ?? (useAzureLogs ? latestOtpFromAzureLogs(targetEmail) : null);
    if (code && code !== previousCode) return code;
    await new Promise((r) => setTimeout(r, useAzureLogs ? 2500 : 250));
  }
  throw new Error(`OTP not found for ${targetEmail}`);
}

async function registerAndLogin() {
  const reg = await api('POST', '/identity/users', null, {
    firstName: 'E2E',
    lastName: 'Notify',
    email,
    password,
  });
  log('POST /identity/users', reg.status === 201, { status: reg.status, userId: reg.data?.userId });
  const otp = await waitForOtp(email);
  const verify = await api('POST', '/identity/verification', null, { email, otpCode: otp });
  log('POST /identity/verification', verify.status === 200, { status: verify.status });
  const login = await api('POST', '/identity/sessions', null, { email, password });
  log('POST /identity/sessions', login.status === 201 && !!login.data?.accessToken, {
    status: login.status,
  });
  return login.data.accessToken;
}

async function runNotificationCoverage(token) {
  const orgs = await apiGet('/identity/me/organisations', token);
  const orgId = orgs.data?.[0]?.id;
  log('GET /identity/me/organisations', orgs.status === 200 && !!orgId, { status: orgs.status, orgId });

  const create = await api('POST', '/onboarding/applications', token, null, orgId);
  log('POST /onboarding/applications', create.status === 201, { status: create.status });

  const prefsOff = await api('PUT', '/identity/me/notification-preferences', token, {
    ...allOn,
    assessmentProgress: false,
  });
  log('PUT prefs assessmentProgress=false', prefsOff.status === 200
    && prefsOff.data?.assessmentProgress === false, { status: prefsOff.status });

  const companyOff = await api(
    'PUT',
    '/onboarding/applications/current/company-setup',
    token,
    companySetupBody,
    orgId,
  );
  log('PUT company-setup (category off)', companyOff.status === 200, { status: companyOff.status });

  const emptyInbox = await apiGet('/notifications', token, orgId);
  log('GET /notifications empty when category off', emptyInbox.status === 200
    && Array.isArray(emptyInbox.data?.items)
    && emptyInbox.data.items.length === 0, {
    status: emptyInbox.status,
    count: emptyInbox.data?.items?.length,
  });

  const prefsOn = await api('PUT', '/identity/me/notification-preferences', token, allOn, orgId);
  log('PUT prefs all on', prefsOn.status === 200 && prefsOn.data?.assessmentProgress === true, {
    status: prefsOn.status,
  });

  const businessOn = await api(
    'PUT',
    '/onboarding/applications/current/business-profile',
    token,
    businessProfileBody,
    orgId,
  );
  log('PUT business-profile (category on)', businessOn.status === 200, { status: businessOn.status });

  const inboxOn = await apiGet('/notifications', token, orgId);
  const first = inboxOn.data?.items?.[0];
  log('GET /notifications has ONBOARDING item', inboxOn.status === 200
    && inboxOn.data.items.length === 1
    && first?.category === 'ONBOARDING'
    && first?.read === false, {
    status: inboxOn.status,
    count: inboxOn.data?.items?.length,
    category: first?.category,
  });

  const unread = await apiGet('/notifications/unread-count', token, orgId);
  log('GET /notifications/unread-count', unread.status === 200 && unread.data?.count === 1, {
    status: unread.status,
    count: unread.data?.count,
  });

  const inAppOff = await api('PUT', '/identity/me/notification-preferences', token, {
    ...allOn,
    inAppEnabled: false,
  }, orgId);
  log('PUT prefs inAppEnabled=false', inAppOff.status === 200 && inAppOff.data?.inAppEnabled === false, {
    status: inAppOff.status,
  });

  const companyInAppOff = await api(
    'PUT',
    '/onboarding/applications/current/company-setup',
    token,
    { ...companySetupBody, city: 'Leeds' },
    orgId,
  );
  log('PUT company-setup (in-app off)', companyInAppOff.status === 200, { status: companyInAppOff.status });

  const inboxInAppOff = await apiGet('/notifications', token, orgId);
  log('GET /notifications unchanged when in-app off', inboxInAppOff.status === 200
    && inboxInAppOff.data.items.length === 1, {
    status: inboxInAppOff.status,
    count: inboxInAppOff.data?.items?.length,
  });

  const emailOff = await api('PUT', '/identity/me/notification-preferences', token, {
    ...allOn,
    emailEnabled: false,
  }, orgId);
  log('PUT prefs emailEnabled=false', emailOff.status === 200
    && emailOff.data?.emailEnabled === false
    && emailOff.data?.inAppEnabled === true, { status: emailOff.status });

  const companyEmailOff = await api(
    'PUT',
    '/onboarding/applications/current/company-setup',
    token,
    { ...companySetupBody, city: 'Bristol' },
    orgId,
  );
  log('PUT company-setup (email off, in-app on)', companyEmailOff.status === 200, {
    status: companyEmailOff.status,
  });

  const inboxEmailOff = await apiGet('/notifications', token, orgId);
  log('GET /notifications grew with in-app only', inboxEmailOff.status === 200
    && inboxEmailOff.data.items.length === 2, {
    status: inboxEmailOff.status,
    count: inboxEmailOff.data?.items?.length,
  });

  const modulePrefs = await apiGet('/notifications/me/preferences', token);
  log('GET /notifications/me/preferences', modulePrefs.status === 200
    && modulePrefs.data?.emailEnabled === false, { status: modulePrefs.status });

  const markOne = await api('POST', `/notifications/${first.id}/read`, token, null, orgId);
  log('POST /notifications/{id}/read', markOne.status === 204, { status: markOne.status });

  const markAll = await api('POST', '/notifications/read-all', token, null, orgId);
  log('POST /notifications/read-all', markAll.status === 204, { status: markAll.status });

  const unreadAfter = await apiGet('/notifications/unread-count', token, orgId);
  log('GET unread-count after mark-all', unreadAfter.status === 200 && unreadAfter.data?.count === 0, {
    status: unreadAfter.status,
    count: unreadAfter.data?.count,
  });
}

async function main() {
  let apiProcess;
  try {
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

    const token = await registerAndLogin();
    await runNotificationCoverage(token);

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
