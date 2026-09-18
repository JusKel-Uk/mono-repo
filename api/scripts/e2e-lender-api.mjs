#!/usr/bin/env node
/**
 * juskel lender portal — real-API E2E (HTTP only).
 *
 * Usage:
 *   E2E_SPAWN_API=1 E2E_PORT=5248 node scripts/e2e-lender-api.mjs
 *
 * Optional env:
 *   BASE_URL, E2E_SPAWN_API, E2E_PORT, E2E_OTP, E2E_OTP_FILE, E2E_INVITE_FILE
 */
import { execSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiClient, createLogger } from './lib/e2e-http-client.mjs';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || (process.env.E2E_SPAWN_API === '1'
  ? `http://localhost:${process.env.E2E_PORT || '5248'}`
  : 'http://localhost:5242');
const tag = Date.now();
const lenderEmail = `e2e-lender-${tag}@juskel.co.uk`;
const adminEmail = `e2e-lender-admin-${tag}@juskel.co.uk`;
const password = 'E2eLenderPass123!';
const lenderPassword = 'SecureLend123!@#';

const { api, apiGet } = createApiClient(BASE);
const { log, summary } = createLogger();

const otpPattern = /\[E2E_OTP\]\s+([^:]+):\s+(\d{6})/;
const invitePattern = /\[E2E_INVITE\]\s+([^:]+):\s+(.+)/;
const otpFile = process.env.E2E_OTP_FILE || join(tmpdir(), `juskel-e2e-lender-otp-${process.pid}.txt`);
const inviteFile = process.env.E2E_INVITE_FILE || join(tmpdir(), `juskel-e2e-lender-invite-${process.pid}.txt`);

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
    const port = process.env.E2E_PORT || '5248';
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
          E2E_INVITE_FILE: inviteFile,
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
            throw new Error('API process failed during startup (check DB / connection strings).');
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

function latestInviteFromFile(targetEmail) {
  const normalized = targetEmail.trim().toLowerCase();
  try {
    const lines = readFileSync(inviteFile, 'utf8').split('\n');
    let found = null;
    for (const line of lines) {
      const trimmed = line.trim();
      const fileMatch = trimmed.match(/^([^:]+):(.+)$/);
      if (fileMatch && fileMatch[1].trim().toLowerCase() === normalized) found = fileMatch[2].trim();
      const logMatch = trimmed.match(invitePattern);
      if (logMatch && logMatch[1].trim().toLowerCase() === normalized) found = logMatch[2].trim();
    }
    return found;
  } catch {
    return null;
  }
}

async function resolveFromAzureLogs(targetEmail, pattern, timeoutMs = 120_000) {
  const normalized = targetEmail.trim().toLowerCase();
  const appName = process.env.AZURE_CONTAINER_APP || 'juskel-api';
  const resourceGroup = process.env.AZURE_RESOURCE_GROUP || 'DevTest';
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const logs = execSync(
        `az containerapp logs show -n "${appName}" -g "${resourceGroup}" --tail 300 --type console 2>/dev/null`,
        { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 },
      );
      for (const line of logs.split('\n')) {
        let text = line.trim();
        if (!text) continue;
        if (text.startsWith('{')) {
          try {
            const parsed = JSON.parse(text);
            text = parsed.Log ?? parsed.log ?? text;
          } catch {
            // keep raw
          }
        }
        const match = text.match(pattern);
        if (match && match[1].trim().toLowerCase() === normalized) return match[2].trim();
      }
    } catch {
      // az not ready
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return null;
}

async function waitForOtp(targetEmail, timeoutMs = 30_000) {
  if (process.env.E2E_OTP) return process.env.E2E_OTP;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const code = latestOtpFromFile(targetEmail);
    if (code) return code;
    await new Promise((r) => setTimeout(r, 250));
  }
  if (BASE.includes('azurecontainerapps.io')) {
    const fromAzure = await resolveFromAzureLogs(targetEmail, otpPattern);
    if (fromAzure) return fromAzure;
  }
  throw new Error(`OTP not found for ${targetEmail}`);
}

async function waitForInvite(targetEmail, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const token = latestInviteFromFile(targetEmail);
    if (token) return token;
    await new Promise((r) => setTimeout(r, 250));
  }
  if (BASE.includes('azurecontainerapps.io')) {
    const fromAzure = await resolveFromAzureLogs(targetEmail, invitePattern);
    if (fromAzure) return fromAzure;
  }
  throw new Error(`Invite token not found for ${targetEmail}`);
}

async function registerVerifySignIn(email) {
  const reg = await api('POST', '/identity/users', null, {
    firstName: 'E2E',
    lastName: 'Admin',
    email,
    password,
  });
  log(`POST /identity/users (${email})`, reg.status === 201, { status: reg.status });

  const otp = await waitForOtp(email);
  const verify = await api('POST', '/identity/verification', null, { email, otpCode: otp });
  log(`POST /identity/verification (${email})`, verify.status === 200, { status: verify.status });

  const login = await api('POST', '/identity/sessions', null, { email, password });
  log(`POST /identity/sessions (${email})`, login.status === 201, { status: login.status });

  return { userId: reg.data.userId, token: login.data.accessToken };
}

async function main() {
  const admin = await registerVerifySignIn(adminEmail);

  const accepted = await api('POST', '/lender/access-requests', null, {
    firstName: 'E2E',
    lastName: 'Lender',
    workEmail: lenderEmail,
    organisation: 'E2E Lending Ltd',
    website: 'https://example.co.uk',
    role: 'Analyst',
    message: 'E2E test request',
  });
  log('POST /lender/access-requests', accepted.status === 202, {
    status: accepted.status,
    requestId: accepted.data?.requestId,
  });
  const requestId = accepted.data.requestId;

  const detail = await apiGet(`/lender/admin/access-requests/${requestId}`, admin.token);
  log(`GET /lender/admin/access-requests/${requestId}`, detail.status === 200, {
    status: detail.status,
  });

  const approved = await api(
    'POST',
    `/lender/admin/access-requests/${requestId}/approve`,
    admin.token,
  );
  log(`POST /lender/admin/access-requests/${requestId}/approve`, approved.status === 200, {
    status: approved.status,
    approvedStatus: approved.data?.status,
  });

  const inviteToken = await waitForInvite(lenderEmail);
  const preview = await apiGet(
    `/lender/invites/preview?token=${encodeURIComponent(inviteToken)}`,
  );
  log('GET /lender/invites/preview', preview.status === 200, {
    status: preview.status,
    email: preview.data?.email,
  });

  const account = await api('POST', '/lender/accounts', null, {
    firstName: 'E2E',
    lastName: 'Lender',
    email: lenderEmail,
    password: lenderPassword,
    inviteToken,
  });
  log('POST /lender/accounts', account.status === 201, {
    status: account.status,
    userId: account.data?.userId,
  });

  const me = await apiGet('/lender/me', account.data.accessToken);
  log('GET /lender/me', me.status === 200, {
    status: me.status,
    org: me.data?.organisation?.name,
  });

  const session = await api('POST', '/lender/sessions', null, {
    email: lenderEmail,
    password: lenderPassword,
  });
  log('POST /lender/sessions', session.status === 201, {
    status: session.status,
    userId: session.data?.userId,
  });

  const { failed } = summary();
  if (failed > 0) process.exit(1);
}

let apiProcess;
(async () => {
  if (process.env.E2E_SPAWN_API === '1') {
    apiProcess = await spawnApi();
    await apiProcess.waitUntilReady();
  } else if (!(await waitForHealth())) {
    throw new Error(`API not reachable at ${BASE}. Start it or set E2E_SPAWN_API=1.`);
  }

  await main();
})()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    if (apiProcess) apiProcess.stop();
  });
