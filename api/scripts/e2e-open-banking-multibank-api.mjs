#!/usr/bin/env node
/**
 * Open Banking multi-bank E2E (stub mode — no TrueLayer keys required).
 *
 * Usage:
 *   E2E_SPAWN_API=1 E2E_PORT=5246 node scripts/e2e-open-banking-multibank-api.mjs
 */
import { spawn } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiClient, createLogger, e2eSpawnIntegrationEnv, integrationCallbackOk } from './lib/e2e-http-client.mjs';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const BASE = process.env.BASE_URL || (process.env.E2E_SPAWN_API === '1'
  ? `http://localhost:${process.env.E2E_PORT || '5246'}`
  : 'http://localhost:5242');
const tag = Date.now();
const email = `e2e-ob-${tag}@juskel.co.uk`;
const password = 'E2eTestPass123!';
const { api, apiGet, apiDelete, oauthCallback } = createApiClient(BASE);
const { log, summary } = createLogger();

const otpPattern = /\[E2E_OTP\]\s+([^:]+):\s+(\d{6})/;
const otpFile = process.env.E2E_OTP_FILE || join(tmpdir(), `juskel-e2e-otp-ob-${process.pid}.txt`);

const companySetupBody = {
  legalName: 'JusKel OB E2E Ltd',
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
    const port = process.env.E2E_PORT || '5246';
    const apiBase = `http://localhost:${port}`;

    const child = spawn(
      'dotnet',
      ['run', '--project', 'src/Host/juskel.Api/juskel.Api.csproj', '--no-launch-profile'],
      {
        cwd: apiRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ASPNETCORE_ENVIRONMENT: 'Development',
          ASPNETCORE_URLS: apiBase,
          E2E_OTP_FILE: otpFile,
          ...e2eSpawnIntegrationEnv(port),
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
      // file not ready
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
    lastName: 'OB',
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

async function connectBank(token, code, label) {
  const auth = await api('POST', '/funding/integrations/open-banking/authorize', token);
  log(`POST authorize (${label})`, auth.status === 200 && !!auth.data?.state, { status: auth.status });

  const cb = await oauthCallback(
    '/funding/integrations/open-banking/callback',
    code,
    auth.data.state,
  );
  log(`GET callback (${label})`, integrationCallbackOk(cb, 'open-banking'), {
    status: cb.status,
    detail: cb.data?.detail ?? cb.data?.title ?? cb.data?.status,
    redirected: cb.data?.redirected,
  });
}

async function main() {
  let apiProcess = null;
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
      const healthy = await waitForHealth(5_000);
      log('GET /health', healthy, { base: BASE });
      if (!healthy) {
        summary();
        process.exit(1);
      }
    }

    const token = await registerAndLogin(apiProcess);

  const create = await api('POST', '/onboarding/applications', token);
  log('POST /onboarding/applications', create.status === 201, { status: create.status });

  const company = await api('PUT', '/onboarding/applications/current/company-setup', token, companySetupBody);
  log('PUT company-setup', company.status === 200, { status: company.status });

  await connectBank(token, 'e2e-stub-auth-code', 'bank1');

  const connections1 = await apiGet('/funding/integrations/open-banking/connections', token);
  log('GET connections (after bank1)', connections1.status === 200 && connections1.data?.connections?.length === 1, {
    status: connections1.status,
    count: connections1.data?.connections?.length,
  });

  await connectBank(token, 'e2e-stub-auth-code-bank2', 'bank2');

  const connections2 = await apiGet('/funding/integrations/open-banking/connections', token);
  log('GET connections (after bank2)', connections2.status === 200 && connections2.data?.connections?.length === 2, {
    status: connections2.status,
    count: connections2.data?.connections?.length,
  });

  const profileBeforeAttest = await apiGet('/funding/applications/current/financial-profile', token);
  log('GET financial-profile (before attestation)', profileBeforeAttest.status === 200
    && profileBeforeAttest.data?.bankingIntegrationMetrics?.connectionCount === 2
    && profileBeforeAttest.data?.bankingCompleteness == null, {
    status: profileBeforeAttest.status,
    connectionCount: profileBeforeAttest.data?.bankingIntegrationMetrics?.connectionCount,
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
    && profileAfter.data?.bankingCompleteness?.allRelevantAccountsConnected === true
    && profileAfter.data?.bandsLockedByIntegration === true
    && profileAfter.data?.connectedBanks?.length === 2, {
    status: profileAfter.status,
    bandsLocked: profileAfter.data?.bandsLockedByIntegration,
  });

  const connectionId = connections2.data?.connections?.[0]?.connectionId;
  if (connectionId) {
    const delOne = await apiDelete(`/funding/integrations/open-banking/connections/${connectionId}`, token);
    log('DELETE single connection', delOne.status === 204, { status: delOne.status });
  } else {
    log('DELETE single connection', false, { error: 'missing connectionId' });
  }

  const connections3 = await apiGet('/funding/integrations/open-banking/connections', token);
  log('GET connections (after single delete)', connections3.status === 200 && connections3.data?.connections?.length === 1, {
    status: connections3.status,
    count: connections3.data?.connections?.length,
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
