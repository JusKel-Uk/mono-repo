#!/usr/bin/env node
/**
 * Real TrueLayer sandbox Open Banking E2E (Mock Bank via Playwright).
 *
 * Prerequisites:
 *   1. api/sandbox/truelayer/secrets.env with TRUELAYER_CLIENT_ID + TRUELAYER_CLIENT_SECRET
 *   2. TrueLayer Console → sandbox app → Redirect URIs includes:
 *        http://localhost:5242/funding/integrations/open-banking/callback
 *   3. cd api/scripts && npm install playwright && npx playwright install chromium
 *
 * Usage:
 *   E2E_SPAWN_API=1 node scripts/e2e-open-banking-sandbox-api.mjs
 *
 * Optional:
 *   E2E_PORT=5242  TRUELAYER_SECRETS_PATH=...  E2E_HEADED=1 (show browser)
 */
import { spawn } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiClient, createLogger, integrationCallbackOk } from './lib/e2e-http-client.mjs';
import {
  e2eSpawnTrueLayerSandboxEnv,
  loadTrueLayerSecrets,
  requiredTrueLayerSecrets,
} from './lib/truelayer-secrets.mjs';
import { completeTrueLayerMockBankOAuth } from './lib/truelayer-oauth-playwright.mjs';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scriptsRoot = resolve(dirname(fileURLToPath(import.meta.url)));

const PORT = process.env.E2E_PORT || '5242';
const BASE = process.env.BASE_URL || (process.env.E2E_SPAWN_API === '1'
  ? `http://localhost:${PORT}`
  : 'http://localhost:5242');
const REDIRECT_URI = `${BASE}/funding/integrations/open-banking/callback`;

const tag = Date.now();
const email = `e2e-tl-${tag}@juskel.co.uk`;
const password = 'E2eTestPass123!';
const { api, apiGet, apiDelete, oauthCallback } = createApiClient(BASE);
const { log, summary } = createLogger();

const otpPattern = /\[E2E_OTP\]\s+([^:]+):\s+(\d{6})/;
const otpFile = process.env.E2E_OTP_FILE || joinTmp(`juskel-e2e-otp-tl-${process.pid}.txt`);

function joinTmp(name) {
  return resolve(tmpdir(), name);
}

const companySetupBody = {
  legalName: 'JusKel TrueLayer E2E Ltd',
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

async function waitForHealth(maxMs = 180_000, baseUrl = BASE) {
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

async function assertPortFree(baseUrl, maxMs = 3_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (res.ok) return false;
    } catch {
      return true;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return true;
}

function spawnApi(secrets) {
  return new Promise((resolve, reject) => {
    const otpWaiters = new Map();
    let startupFailed = false;

    const child = spawn(
      'dotnet',
      ['run', '--project', 'src/Host/juskel.Api/juskel.Api.csproj', '--no-launch-profile'],
      {
        cwd: apiRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ASPNETCORE_ENVIRONMENT: 'Development',
          ASPNETCORE_URLS: BASE,
          E2E_OTP_FILE: otpFile,
          ...e2eSpawnTrueLayerSandboxEnv(PORT, secrets),
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
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      for (const line of readFileSync(otpFile, 'utf8').split('\n')) {
        const trimmed = line.trim();
        const fileMatch = trimmed.match(/^([^:]+):(\d{6})$/);
        if (fileMatch && fileMatch[1].trim().toLowerCase() === normalized) return fileMatch[2];
        const logMatch = trimmed.match(otpPattern);
        if (logMatch && logMatch[1].trim().toLowerCase() === normalized) return logMatch[2];
      }
    } catch {
      // not ready
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

async function resolveOtp(targetEmail, apiProcess) {
  if (process.env.E2E_OTP) return process.env.E2E_OTP;
  const fromFile = await readOtpFromFile(targetEmail);
  if (fromFile) return fromFile;
  if (apiProcess) return apiProcess.waitForOtp(targetEmail);
  throw new Error('OTP not found — use E2E_SPAWN_API=1 or set E2E_OTP.');
}

async function registerAndLogin(apiProcess) {
  const reg = await api('POST', '/identity/users', null, {
    firstName: 'E2E',
    lastName: 'TL',
    email,
    password,
  });
  log('POST /identity/users', reg.status === 201, { status: reg.status });

  const otp = await resolveOtp(email, apiProcess);
  const verify = await api('POST', '/identity/verification', null, { email, otpCode: otp });
  log('POST /identity/verification', verify.status === 200, { status: verify.status });

  const login = await api('POST', '/identity/sessions', null, { email, password });
  log('POST /identity/sessions', login.status === 201 && !!login.data?.accessToken, { status: login.status });
  return login.data.accessToken;
}

async function connectViaTrueLayer(token, secrets, label) {
  const auth = await api('POST', '/funding/integrations/open-banking/authorize', token);
  const okAuth = auth.status === 200 && !!auth.data?.authorizationUrl && !!auth.data?.state;
  log(`POST authorize (${label})`, okAuth, { status: auth.status });

  if (!okAuth) return false;

  const oauth = await completeTrueLayerMockBankOAuth(auth.data.authorizationUrl, {
    username: 'john',
    password: 'doe',
    redirectUriPrefix: REDIRECT_URI.split('?')[0],
  });

  log(`Playwright OAuth (${label})`, !!oauth.code, {
    hasCode: !!oauth.code,
    redirect: oauth.finalUrl?.slice(0, 120),
  });

  const cb = await oauthCallback(
    '/funding/integrations/open-banking/callback',
    oauth.code,
    oauth.state,
  );
  log(`GET callback (${label})`, integrationCallbackOk(cb, 'open-banking'), {
    status: cb.status,
    detail: cb.data?.detail ?? cb.data?.title ?? cb.data?.status,
  });

  if (!integrationCallbackOk(cb, 'open-banking')) return false;
  const connections = await apiGet('/funding/integrations/open-banking/connections', token);
  log(`GET connections (${label})`, connections.status === 200 && (connections.data?.connections?.length ?? 0) >= 1, {
    status: connections.status,
    count: connections.data?.connections?.length,
  });

  return connections.status === 200 && (connections.data?.connections?.length ?? 0) >= 1;
}

async function main() {
  let apiProcess = null;
  try {
    const secrets = loadTrueLayerSecrets();
    const missing = requiredTrueLayerSecrets(secrets);
    if (missing.length > 0) {
      console.error(`Missing in secrets.env: ${missing.join(', ')}`);
      console.error('Copy api/sandbox/truelayer/secrets.env.example → secrets.env and fill TrueLayer sandbox keys.');
      process.exit(1);
    }

    console.log(`TrueLayer sandbox E2E`);
    console.log(`API base: ${BASE}`);
    console.log(`Redirect URI (must be whitelisted in TrueLayer Console): ${REDIRECT_URI}`);
    console.log(`E2E OTP file: ${otpFile}\n`);

    writeFileSync(otpFile, '');

    if (process.env.E2E_SPAWN_API === '1') {
      if (!(await assertPortFree(BASE))) {
        console.error(`Port already in use at ${BASE}. Stop the existing process or set E2E_PORT to a free port.`);
        console.error('Then whitelist the matching redirect URI in TrueLayer Console (see script header).');
        process.exit(1);
      }
      apiProcess = await spawnApi(secrets);
      await apiProcess.waitUntilReady();
      log('API spawned with real TrueLayer credentials', true, BASE);
    } else {
      const healthy = await waitForHealth(5_000);
      if (!healthy) {
        console.error(`API not reachable at ${BASE}. Run with E2E_SPAWN_API=1 or start juskel.Api locally.`);
        process.exit(1);
      }
    }

    const token = await registerAndLogin(apiProcess);

    const create = await api('POST', '/onboarding/applications', token);
    log('POST /onboarding/applications', create.status === 201, { status: create.status });

    const company = await api('PUT', '/onboarding/applications/current/company-setup', token, companySetupBody);
    log('PUT company-setup', company.status === 200, { status: company.status });

    await connectViaTrueLayer(token, secrets, 'mock-bank-1');

    const profileBefore = await apiGet('/funding/applications/current/financial-profile', token);
    log('GET financial-profile (after connect)', profileBefore.status === 200
      && profileBefore.data?.bankingIntegrationMetrics != null
      && profileBefore.data?.bandsLockedByIntegration === true, {
      status: profileBefore.status,
      bandsLocked: profileBefore.data?.bandsLockedByIntegration,
      accountCount: profileBefore.data?.bankingIntegrationMetrics?.accountCount,
    });

    const completeness = await api(
      'PUT',
      '/funding/integrations/open-banking/completeness',
      token,
      { allRelevantAccountsConnected: true },
    );
    log('PUT completeness', completeness.status === 204, { status: completeness.status });

    const profileAfter = await apiGet('/funding/applications/current/financial-profile', token);
    log('GET financial-profile (after attestation)', profileAfter.status === 200
      && profileAfter.data?.bankingCompleteness?.allRelevantAccountsConnected === true, {
      status: profileAfter.status,
    });

    const delAll = await apiDelete('/funding/integrations/open-banking', token);
    log('DELETE all open banking', delAll.status === 204, { status: delAll.status });

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
