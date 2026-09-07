#!/usr/bin/env node
/**
 * juskel settings Identity APIs — real-API E2E (HTTP only).
 *
 * Usage:
 *   E2E_SPAWN_API=1 E2E_PORT=5246 node scripts/e2e-settings-api.mjs
 */
import { execSync, spawn } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiClient, createLogger } from './lib/e2e-http-client.mjs';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || (process.env.E2E_SPAWN_API === '1'
  ? `http://localhost:${process.env.E2E_PORT || '5246'}`
  : 'http://localhost:5242');
const tag = Date.now();
const email = `e2e-settings-${tag}@juskel.co.uk`;
const password = 'E2eTestPass123!';
const newPassword = 'E2eResetPass456!';
const { api, apiGet, apiDelete } = createApiClient(BASE);
const { log, summary } = createLogger();
const otpPattern = /\[E2E_OTP\]\s+([^:]+):\s+(\d{6})/;
const otpFile = process.env.E2E_OTP_FILE || join(tmpdir(), `juskel-e2e-settings-otp-${process.pid}.txt`);

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
    const port = process.env.E2E_PORT || '5246';
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
    lastName: 'Settings',
    email,
    password,
  });
  log('POST /identity/users', reg.status === 201, { status: reg.status, userId: reg.data?.userId });
  const userId = reg.data?.userId;
  const otp = await waitForOtp(email);
  const verify = await api('POST', '/identity/verification', null, { email, otpCode: otp });
  log('POST /identity/verification', verify.status === 200, { status: verify.status });
  const login = await api('POST', '/identity/sessions', null, { email, password });
  log('POST /identity/sessions', login.status === 201 && !!login.data?.accessToken, {
    status: login.status,
  });
  return { token: login.data.accessToken, userId };
}

async function runSettingsCoverage(token, userId) {
  const me = await apiGet('/identity/me', token);
  log('GET /identity/me (settings fields)', me.status === 200
    && me.data?.id === userId
    && me.data?.email === email
    && me.data?.jobTitle == null
    && me.data?.phone == null
    && me.data?.accountClosureRequestedAt == null, {
    status: me.status,
    keys: me.data && Object.keys(me.data),
  });

  const publicUser = await apiGet(`/identity/users/${userId}`);
  log('GET /identity/users/{id} (no phone/jobTitle)', publicUser.status === 200
    && publicUser.data?.id === userId
    && !('phone' in (publicUser.data ?? {}))
    && !('jobTitle' in (publicUser.data ?? {})), {
    status: publicUser.status,
    keys: publicUser.data && Object.keys(publicUser.data),
  });

  const patched = await api('PATCH', '/identity/me', token, {
    firstName: 'Ada',
    lastName: 'Lovelace',
    jobTitle: 'Founder & Managing Director',
    phone: '+44 117 000 0000',
  });
  log('PATCH /identity/me', patched.status === 200
    && patched.data?.firstName === 'Ada'
    && patched.data?.jobTitle === 'Founder & Managing Director'
    && patched.data?.phone === '+44 117 000 0000'
    && patched.data?.email === email, { status: patched.status });

  const emptyName = await api('PATCH', '/identity/me', token, {
    firstName: '  ',
    lastName: 'Lovelace',
    jobTitle: null,
    phone: null,
  });
  log('PATCH /identity/me (empty firstName → 400)', emptyName.status === 400, {
    status: emptyName.status,
  });

  const prefsGet = await apiGet('/identity/me/notification-preferences', token);
  log('GET /identity/me/notification-preferences (defaults on)', prefsGet.status === 200
    && prefsGet.data?.assessmentProgress === true
    && prefsGet.data?.newFundingMatches === true, { status: prefsGet.status });

  const prefsPut = await api('PUT', '/identity/me/notification-preferences', token, {
    assessmentProgress: true,
    submissionsNeedAttention: true,
    expertReviewUpdates: false,
    integrationSyncEvents: true,
    scoreUpdates: true,
    newFundingMatches: false,
  });
  log('PUT /identity/me/notification-preferences', prefsPut.status === 200
    && prefsPut.data?.expertReviewUpdates === false
    && prefsPut.data?.newFundingMatches === false, { status: prefsPut.status });

  const prefsReload = await apiGet('/identity/me/notification-preferences', token);
  log('GET preferences after PUT', prefsReload.status === 200
    && prefsReload.data?.expertReviewUpdates === false, { status: prefsReload.status });

  const unknownReset = await api('POST', '/identity/password-reset', null, {
    email: `missing-${tag}@juskel.co.uk`,
  });
  log('POST /identity/password-reset (unknown email still 200)', unknownReset.status === 200, {
    status: unknownReset.status,
  });

  const signupOtp = latestOtpFromFile(email);
  const resetReq = await api('POST', '/identity/me/password-reset', token, {});
  log('POST /identity/me/password-reset', resetReq.status === 200, { status: resetReq.status });
  const resetOtp = await waitForOtp(email, signupOtp);

  const verifyReset = await api('POST', '/identity/password-reset/verify', null, {
    email,
    code: resetOtp,
  });
  log('POST /identity/password-reset/verify', verifyReset.status === 200 && !!verifyReset.data?.token, {
    status: verifyReset.status,
  });

  const confirm = await api('POST', '/identity/password-reset/confirm', null, {
    token: verifyReset.data.token,
    password: newPassword,
  });
  log('POST /identity/password-reset/confirm', confirm.status === 204, { status: confirm.status });

  const oldLogin = await api('POST', '/identity/sessions', null, { email, password });
  log('POST /identity/sessions (old password rejected)', oldLogin.status === 400, {
    status: oldLogin.status,
  });

  const meAfterReset = await apiGet('/identity/me', token);
  log('GET /identity/me (old session revoked)', meAfterReset.status === 401, {
    status: meAfterReset.status,
  });

  const login2 = await api('POST', '/identity/sessions', null, { email, password: newPassword });
  log('POST /identity/sessions (new password)', login2.status === 201 && !!login2.data?.accessToken, {
    status: login2.status,
  });
  const token2 = login2.data.accessToken;

  const sessions = await apiGet('/identity/me/sessions', token2);
  const current = sessions.data?.sessions?.find((s) => s.isCurrent);
  log('GET /identity/me/sessions', sessions.status === 200
    && Array.isArray(sessions.data?.sessions)
    && sessions.data.sessions.length >= 1
    && !!current?.id
    && typeof current.deviceLabel === 'string', {
    status: sessions.status,
    count: sessions.data?.sessions?.length,
  });

  const otherId = sessions.data.sessions.find((s) => !s.isCurrent)?.id;
  if (otherId) {
    const revokeOther = await apiDelete(`/identity/me/sessions/${otherId}`, token2);
    log('DELETE /identity/me/sessions/{id}', revokeOther.status === 204, {
      status: revokeOther.status,
    });
  }

  const logout = await apiDelete('/identity/me/sessions/current', token2);
  log('DELETE /identity/me/sessions/current', logout.status === 204, { status: logout.status });

  const meLoggedOut = await apiGet('/identity/me', token2);
  log('GET /identity/me after logout', meLoggedOut.status === 401, { status: meLoggedOut.status });

  const login3 = await api('POST', '/identity/sessions', null, { email, password: newPassword });
  const token3 = login3.data.accessToken;

  const orgs = await apiGet('/identity/me/organisations', token3);
  const orgId = orgs.data?.[0]?.id;
  log('GET /identity/me/organisations', orgs.status === 200 && !!orgId, { status: orgs.status, orgId });

  const deprecatedClosure = await api('POST', '/identity/me/account-closure', token3, {});
  log('POST /identity/me/account-closure deprecated', deprecatedClosure.status === 410, {
    status: deprecatedClosure.status,
  });

  const closure = await api('POST', `/identity/organisations/${orgId}/closure`, token3, {}, orgId);
  log('POST /identity/organisations/{id}/closure', closure.status === 200
    && closure.data?.status === 'requested'
    && !!closure.data?.requestedAt, { status: closure.status });

  const closureAgain = await api('POST', `/identity/organisations/${orgId}/closure`, token3, {}, orgId);
  log('POST organisation-closure idempotent', closureAgain.status === 200
    && closureAgain.data?.status === 'requested'
    && Date.parse(closureAgain.data?.requestedAt) === Date.parse(closure.data?.requestedAt), {
    status: closureAgain.status,
  });

  const orgsAfterClose = await apiGet('/identity/me/organisations', token3);
  log('GET organisations shows closed flag', orgsAfterClose.status === 200
    && orgsAfterClose.data?.[0]?.isClosed === true, {
    status: orgsAfterClose.status,
    isClosed: orgsAfterClose.data?.[0]?.isClosed,
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

    const { token, userId } = await registerAndLogin();
    await runSettingsCoverage(token, userId);

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
