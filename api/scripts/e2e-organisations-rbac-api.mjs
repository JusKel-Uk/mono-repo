#!/usr/bin/env node
/**
 * juskel organisation + RBAC — real-API E2E (HTTP only).
 *
 * Usage:
 *   E2E_SPAWN_API=1 E2E_PORT=5247 node scripts/e2e-organisations-rbac-api.mjs
 *
 * Optional env:
 *   BASE_URL, E2E_OTP_FILE, E2E_INVITE_FILE, E2E_SPAWN_API, E2E_PORT
 */
import { randomUUID } from 'node:crypto';
import { execSync, spawn } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApiClient, createLogger } from './lib/e2e-http-client.mjs';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || (process.env.E2E_SPAWN_API === '1'
  ? `http://localhost:${process.env.E2E_PORT || '5247'}`
  : 'http://localhost:5242');
const tag = Date.now();
const ownerEmail = `e2e-org-owner-${tag}@juskel.co.uk`;
const teammateEmail = `e2e-org-teammate-${tag}@juskel.co.uk`;
const multiEmail = `e2e-org-multi-${tag}@juskel.co.uk`;
const password = 'E2eTestPass123!';

/** OrganisationRole enum values (identity.Contracts). */
const Role = { Owner: 0, Admin: 1, Contributor: 2, Viewer: 3 };

const { api, apiGet, apiDelete } = createApiClient(BASE);
const { log, summary } = createLogger();

const otpPattern = /\[E2E_OTP\]\s+([^:]+):\s+(\d{6})/;
const invitePattern = /\[E2E_INVITE\]\s+([^:]+):\s+(.+)/;
const otpFile = process.env.E2E_OTP_FILE || join(tmpdir(), `juskel-e2e-org-otp-${process.pid}.txt`);
const inviteFile = process.env.E2E_INVITE_FILE || join(tmpdir(), `juskel-e2e-org-invite-${process.pid}.txt`);

const companySetupBody = {
  legalName: 'JusKel Org RBAC E2E Ltd',
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

const financialProfileBody = {
  annualRevenueBand: 2,
  ebitdaBand: 3,
  existingDebtBand: 1,
  cashReserves: 3,
  avgMonthlyRevenue: 3,
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

function latestInviteFromFile(targetEmail) {
  const normalized = targetEmail.trim().toLowerCase();
  try {
    const lines = readFileSync(inviteFile, 'utf8').split('\n');
    let found = null;
    for (const line of lines) {
      const trimmed = line.trim();
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx > 0) {
        const em = trimmed.slice(0, colonIdx).trim().toLowerCase();
        const token = trimmed.slice(colonIdx + 1).trim();
        if (em === normalized && token) found = token;
      }
      const logMatch = trimmed.match(invitePattern);
      if (logMatch && logMatch[1].trim().toLowerCase() === normalized) found = logMatch[2].trim();
    }
    return found;
  } catch {
    return null;
  }
}

async function latestOtpFromAzureLogs(targetEmail) {
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
      ?? (useAzureLogs ? await latestOtpFromAzureLogs(targetEmail) : null);
    if (code && code !== previousCode) return code;
    await new Promise((r) => setTimeout(r, useAzureLogs ? 2500 : 250));
  }
  throw new Error(`OTP not found for ${targetEmail}`);
}

async function waitForInvite(targetEmail, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const token = latestInviteFromFile(targetEmail);
    if (token) return token;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Invite token not found for ${targetEmail}`);
}

async function registerVerifySignIn(email, firstName, lastName) {
  const reg = await api('POST', '/identity/users', null, {
    firstName,
    lastName,
    email,
    password,
  });
  log(`POST /identity/users (${email})`, reg.status === 201 && !!reg.data?.userId, {
    status: reg.status,
    userId: reg.data?.userId,
    defaultOrganisationId: reg.data?.defaultOrganisationId,
  });

  const otp = await waitForOtp(email);
  const verify = await api('POST', '/identity/verification', null, { email, otpCode: otp });
  log(`POST /identity/verification (${email})`, verify.status === 200, { status: verify.status });

  const login = await api('POST', '/identity/sessions', null, { email, password });
  log(`POST /identity/sessions (${email})`, login.status === 201 && !!login.data?.accessToken, {
    status: login.status,
  });

  return {
    userId: reg.data.userId,
    defaultOrganisationId: reg.data.defaultOrganisationId,
    token: login.data.accessToken,
  };
}

async function registerViaInviteThenSignIn(email, firstName, lastName, inviteCode) {
  const preview = await api('POST', '/identity/invites/preview', null, { code: inviteCode });
  log(`POST /identity/invites/preview (${email})`, preview.status === 200
    && preview.data?.email === email
    && typeof preview.data?.organisationName === 'string'
    && preview.data.organisationName.length > 0, {
    status: preview.status,
    email: preview.data?.email,
    role: preview.data?.role,
  });

  const mismatch = await api('POST', '/identity/users', null, {
    firstName,
    lastName,
    email: `wrong-${tag}@juskel.co.uk`,
    password,
    inviteCode,
  });
  log('POST /identity/users (inviteCode + wrong email → 400)', mismatch.status === 400, {
    status: mismatch.status,
  });

  const reg = await api('POST', '/identity/users', null, {
    firstName,
    lastName,
    email,
    password,
    inviteCode,
  });
  log(`POST /identity/users inviteCode (${email})`, reg.status === 201
    && !!reg.data?.userId
    && reg.data?.emailVerified === true
    && (reg.data?.defaultOrganisationId === null
      || reg.data?.defaultOrganisationId === undefined), {
    status: reg.status,
    userId: reg.data?.userId,
    emailVerified: reg.data?.emailVerified,
    defaultOrganisationId: reg.data?.defaultOrganisationId,
  });

  const login = await api('POST', '/identity/sessions', null, { email, password });
  log(`POST /identity/sessions (invitee, no OTP) (${email})`, login.status === 201
    && !!login.data?.accessToken, {
    status: login.status,
  });

  return {
    userId: reg.data.userId,
    defaultOrganisationId: reg.data.defaultOrganisationId ?? null,
    token: login.data.accessToken,
    preview: preview.data,
  };
}

function findOrg(orgs, orgId) {
  return orgs?.find((o) => o.id === orgId);
}

async function runOrganisationRbacCoverage() {
  // ── 1. Owner A registers, verifies, signs in ─────────────────────────────
  const owner = await registerVerifySignIn(ownerEmail, 'Org', 'Owner');

  const ownerOrgsInitial = await apiGet('/identity/me/organisations', owner.token);
  log('GET /identity/me/organisations (owner — count 1)', ownerOrgsInitial.status === 200
    && Array.isArray(ownerOrgsInitial.data)
    && ownerOrgsInitial.data.length === 1, {
    status: ownerOrgsInitial.status,
    count: ownerOrgsInitial.data?.length,
  });

  const orgA = ownerOrgsInitial.data[0];
  log('GET /identity/me/organisations (owner — role Owner)', orgA?.role === Role.Owner, {
    role: orgA?.role,
    isCurrent: orgA?.isCurrent,
  });
  log('GET /identity/me/organisations (owner — isCurrent)', orgA?.isCurrent === true, {
    organisationId: orgA?.id,
  });
  log('register defaultOrganisationId matches orgA', owner.defaultOrganisationId === orgA?.id, {
    defaultOrganisationId: owner.defaultOrganisationId,
    orgA: orgA?.id,
  });

  // ── 2. Create onboarding application (org header optional for single org) ──
  const createApp = await api('POST', '/onboarding/applications', owner.token, null, orgA.id);
  log('POST /onboarding/applications (owner, with org header)', createApp.status === 201
    && !!createApp.data?.applicationId, {
    status: createApp.status,
    applicationId: createApp.data?.applicationId,
  });

  const createAppNoHeader = await api('POST', '/onboarding/applications', owner.token);
  log('POST /onboarding/applications (owner, no header — idempotent)', createAppNoHeader.status === 201
    && createAppNoHeader.data?.applicationId === createApp.data?.applicationId, {
    status: createAppNoHeader.status,
    sameId: createAppNoHeader.data?.applicationId === createApp.data?.applicationId,
  });

  // ── 3. Invite teammate as Viewer ─────────────────────────────────────────
  const invite = await api(
    'POST',
    `/identity/organisations/${orgA.id}/invites`,
    owner.token,
    { email: teammateEmail, role: Role.Viewer },
    orgA.id,
  );
  log('POST /identity/organisations/{orgA}/invites', invite.status === 201
    && invite.data?.role === Role.Viewer
    && invite.data?.email === teammateEmail, {
    status: invite.status,
    inviteId: invite.data?.inviteId,
    role: invite.data?.role,
  });

  const pendingInvites = await apiGet(
    `/identity/organisations/${orgA.id}/invites`,
    owner.token,
    orgA.id,
  );
  const pendingMatch = pendingInvites.data?.find((row) => row.id === invite.data?.inviteId);
  log('GET /identity/organisations/{orgA}/invites (pending)', pendingInvites.status === 200
    && pendingMatch?.email === teammateEmail
    && pendingMatch?.role === Role.Viewer, {
    status: pendingInvites.status,
    count: pendingInvites.data?.length,
    inviteId: pendingMatch?.id,
  });

  const resend = await api(
    'POST',
    `/identity/organisations/${orgA.id}/invites/${invite.data.inviteId}/resend`,
    owner.token,
    null,
    orgA.id,
  );
  log('POST /identity/organisations/{orgA}/invites/{id}/resend', resend.status === 200
    && resend.data?.inviteId === invite.data?.inviteId
    && resend.data?.email === teammateEmail
    && !!resend.data?.acceptToken
    && resend.data.acceptToken !== invite.data?.acceptToken, {
    status: resend.status,
    rotated: resend.data?.acceptToken !== invite.data?.acceptToken,
  });

  const originalInviteToken = invite.data?.acceptToken;
  const inviteToken = resend.data?.acceptToken ?? originalInviteToken ?? await waitForInvite(teammateEmail);
  log('invite token resolved', !!inviteToken, {
    source: resend.data?.acceptToken ? 'resend' : (invite.data?.acceptToken ? 'create' : 'E2E_INVITE_FILE/console'),
  });

  const badPreview = await api('POST', '/identity/invites/preview', null, { code: '000000' });
  log('POST /identity/invites/preview (invalid → 404)', badPreview.status === 404, {
    status: badPreview.status,
  });

  // ── 4. Invitee registers with inviteCode (no personal org, already verified) ─
  const teammate = await registerViaInviteThenSignIn(
    teammateEmail,
    'Org',
    'Teammate',
    inviteToken,
  );

  const teammateOrgsBefore = await apiGet('/identity/me/organisations', teammate.token);
  log('GET /identity/me/organisations (invitee before accept — count 0)', teammateOrgsBefore.status === 200
    && Array.isArray(teammateOrgsBefore.data)
    && teammateOrgsBefore.data.length === 0, {
    status: teammateOrgsBefore.status,
    count: teammateOrgsBefore.data?.length,
  });

  // ── 5. Accept invite ─────────────────────────────────────────────────────
  if (originalInviteToken && originalInviteToken !== inviteToken) {
    const staleAccept = await api('POST', `/identity/invites/${originalInviteToken}/accept`, teammate.token);
    log('POST accept rotated-away invite token → 404', staleAccept.status === 404, {
      status: staleAccept.status,
    });
  }

  const accept = await api('POST', `/identity/invites/${inviteToken}/accept`, teammate.token);
  log('POST /identity/invites/{token}/accept', accept.status === 200
    && accept.data?.organisationId === orgA.id
    && accept.data?.role === Role.Viewer, {
    status: accept.status,
    organisationId: accept.data?.organisationId,
    role: accept.data?.role,
  });

  const pendingAfterAccept = await apiGet(
    `/identity/organisations/${orgA.id}/invites`,
    owner.token,
    orgA.id,
  );
  log('GET invites after accept (accepted row gone)', pendingAfterAccept.status === 200
    && !pendingAfterAccept.data?.some((row) => row.id === invite.data?.inviteId), {
    status: pendingAfterAccept.status,
    count: pendingAfterAccept.data?.length,
  });

  const resendAccepted = await api(
    'POST',
    `/identity/organisations/${orgA.id}/invites/${invite.data.inviteId}/resend`,
    owner.token,
    null,
    orgA.id,
  );
  log('POST resend accepted invite → 404', resendAccepted.status === 404, {
    status: resendAccepted.status,
  });

  const teammateOrgsAfter = await apiGet('/identity/me/organisations', teammate.token);
  log('GET /identity/me/organisations (invitee after accept — count 1)', teammateOrgsAfter.status === 200
    && teammateOrgsAfter.data?.length === 1, {
    status: teammateOrgsAfter.status,
    count: teammateOrgsAfter.data?.length,
  });
  const teammateOrgA = findOrg(teammateOrgsAfter.data, orgA.id);
  log('GET /identity/me/organisations (invitee — only orgA Viewer)', teammateOrgA?.role === Role.Viewer
    && teammateOrgsAfter.data?.length === 1, {
    role: teammateOrgA?.role,
  });

  // Founder who later accepts → two orgs (org switcher coverage)
  const multiInvite = await api(
    'POST',
    `/identity/organisations/${orgA.id}/invites`,
    owner.token,
    { email: multiEmail, role: Role.Viewer },
    orgA.id,
  );
  log('POST invite multi-org user', multiInvite.status === 201 && !!multiInvite.data?.acceptToken, {
    status: multiInvite.status,
    inviteId: multiInvite.data?.inviteId,
  });
  const multiToken = multiInvite.data?.acceptToken ?? await waitForInvite(multiEmail);
  const multi = await registerVerifySignIn(multiEmail, 'Org', 'Multi');
  const orgB = (await apiGet('/identity/me/organisations', multi.token)).data?.[0];
  const multiAccept = await api('POST', `/identity/invites/${multiToken}/accept`, multi.token);
  log('POST accept (founder + invite → two orgs)', multiAccept.status === 200
    && multiAccept.data?.organisationId === orgA.id, {
    status: multiAccept.status,
  });
  const multiOrgs = await apiGet('/identity/me/organisations', multi.token);
  log('GET /identity/me/organisations (multi — count 2)', multiOrgs.status === 200
    && multiOrgs.data?.length === 2, {
    status: multiOrgs.status,
    count: multiOrgs.data?.length,
  });

  const wrongOrg = await apiGet('/onboarding/applications/current', teammate.token, randomUUID());
  log('GET /onboarding/.../current (wrong X-Organisation-Id → 403)', wrongOrg.status === 403, {
    status: wrongOrg.status,
  });

  const badAccept = await api('POST', '/identity/invites/not-a-valid-token/accept', teammate.token);
  log('POST /identity/invites/{bad}/accept → 404', badAccept.status === 404, {
    status: badAccept.status,
  });

  const strangerEmail = `e2e-org-stranger-${tag}@juskel.co.uk`;
  const stranger = await registerVerifySignIn(strangerEmail, 'Org', 'Stranger');
  const strangerMembers = await apiGet(
    `/identity/organisations/${orgA.id}/members`,
    stranger.token,
    orgA.id,
  );
  log('GET members (non-member → 403)', strangerMembers.status === 403, {
    status: strangerMembers.status,
  });

  const usedAccept = await api('POST', `/identity/invites/${inviteToken}/accept`, stranger.token);
  log('POST accept already-used invite → 404', usedAccept.status === 404, {
    status: usedAccept.status,
  });

  const setForeignOrg = await api(
    'PUT',
    '/identity/me/organisations/current',
    teammate.token,
    { organisationId: randomUUID() },
  );
  log('PUT /identity/me/organisations/current (non-member org → 404)', setForeignOrg.status === 404, {
    status: setForeignOrg.status,
  });

  // ── 6. Multi-org: default context uses LastOrganisationId (orgB) without header ─
  const currentNoHeader = await apiGet('/onboarding/applications/current', multi.token);
  log('GET /onboarding/applications/current (2 orgs, no header → last org context)', (currentNoHeader.status === 404
    || (currentNoHeader.status === 200
      && currentNoHeader.data?.applicationId !== createApp.data.applicationId)), {
    status: currentNoHeader.status,
    applicationId: currentNoHeader.data?.applicationId,
    orgAApplicationId: createApp.data.applicationId,
  });

  // ── 7. Multi-org: explicit org header works ──────────────────────────────
  const currentWithOrgA = await apiGet(
    '/onboarding/applications/current',
    multi.token,
    orgA.id,
  );
  log('GET /onboarding/applications/current (X-Organisation-Id orgA)', currentWithOrgA.status === 200
    && currentWithOrgA.data?.applicationId === createApp.data.applicationId, {
    status: currentWithOrgA.status,
    applicationId: currentWithOrgA.data?.applicationId,
  });

  // ── 8. Viewer cannot write company-setup ───────────────────────────────
  const viewerPut = await api(
    'PUT',
    '/onboarding/applications/current/company-setup',
    teammate.token,
    companySetupBody,
    orgA.id,
  );
  log('PUT /onboarding/.../company-setup (Viewer → 403)', viewerPut.status === 403, {
    status: viewerPut.status,
  });

  const viewerInvite = await api(
    'POST',
    `/identity/organisations/${orgA.id}/invites`,
    teammate.token,
    { email: `extra-${tag}@juskel.co.uk`, role: Role.Contributor },
    orgA.id,
  );
  log('POST invite (Viewer → 403)', viewerInvite.status === 403, { status: viewerInvite.status });

  const viewerListInvites = await apiGet(
    `/identity/organisations/${orgA.id}/invites`,
    teammate.token,
    orgA.id,
  );
  log('GET invites (Viewer → 403)', viewerListInvites.status === 403, {
    status: viewerListInvites.status,
  });

  const viewerResend = await api(
    'POST',
    `/identity/organisations/${orgA.id}/invites/${invite.data.inviteId}/resend`,
    teammate.token,
    null,
    orgA.id,
  );
  log('POST resend (Viewer → 403)', viewerResend.status === 403, { status: viewerResend.status });

  const viewerFunding = await api(
    'PUT',
    '/funding/applications/current/financial-profile',
    teammate.token,
    financialProfileBody,
    orgA.id,
  );
  log('PUT /funding/.../financial-profile (Viewer → 403)', viewerFunding.status === 403, {
    status: viewerFunding.status,
  });

  const viewerScoring = await api(
    'PUT',
    '/scoring/applications/current/sustainability-profile',
    teammate.token,
    sustainabilityBody,
    orgA.id,
  );
  log('PUT /scoring/.../sustainability-profile (Viewer → 403)', viewerScoring.status === 403, {
    status: viewerScoring.status,
  });

  // ── 9. Owner promotes B to Contributor — can write ───────────────────────
  const patchContributor = await api(
    'PATCH',
    `/identity/organisations/${orgA.id}/members/${teammate.userId}`,
    owner.token,
    { role: Role.Contributor },
    orgA.id,
  );
  log('PATCH member role → Contributor', patchContributor.status === 200
    && patchContributor.data?.role === Role.Contributor, {
    status: patchContributor.status,
    role: patchContributor.data?.role,
  });

  const contributorPut = await api(
    'PUT',
    '/onboarding/applications/current/company-setup',
    teammate.token,
    companySetupBody,
    orgA.id,
  );
  log('PUT /onboarding/.../company-setup (Contributor → 200)', contributorPut.status === 200
    && contributorPut.data?.legalName === companySetupBody.legalName, {
    status: contributorPut.status,
    legalName: contributorPut.data?.legalName,
  });

  const companyGet = await apiGet(
    '/onboarding/applications/current/company-setup',
    teammate.token,
    orgA.id,
  );
  log('GET /onboarding/.../company-setup (Contributor read)', companyGet.status === 200, {
    status: companyGet.status,
  });

  // ── 10. Contributor cannot submit ────────────────────────────────────────
  const contributorSubmit = await api(
    'POST',
    '/onboarding/applications/current/submit',
    teammate.token,
    null,
    orgA.id,
  );
  log('POST /onboarding/.../submit (Contributor → 403)', contributorSubmit.status === 403, {
    status: contributorSubmit.status,
  });

  // ── 11. Owner promotes B to Admin ────────────────────────────────────────
  const patchAdmin = await api(
    'PATCH',
    `/identity/organisations/${orgA.id}/members/${teammate.userId}`,
    owner.token,
    { role: Role.Admin },
    orgA.id,
  );
  log('PATCH member role → Admin', patchAdmin.status === 200
    && patchAdmin.data?.role === Role.Admin, {
    status: patchAdmin.status,
    role: patchAdmin.data?.role,
  });

  const adminClosure = await api(
    'POST',
    `/identity/organisations/${orgA.id}/closure`,
    teammate.token,
    null,
    orgA.id,
  );
  log('POST closure (Admin → 403)', adminClosure.status === 403, { status: adminClosure.status });

  const duplicateInvite = await api(
    'POST',
    `/identity/organisations/${orgA.id}/invites`,
    owner.token,
    { email: teammateEmail, role: Role.Viewer },
    orgA.id,
  );
  log('POST duplicate invite (already member → 400)', duplicateInvite.status === 400, {
    status: duplicateInvite.status,
  });

  const ownerRoleInvite = await api(
    'POST',
    `/identity/organisations/${orgA.id}/invites`,
    owner.token,
    { email: `owner-invite-${tag}@juskel.co.uk`, role: Role.Owner },
    orgA.id,
  );
  log('POST invite Owner role (invalid → 400)', ownerRoleInvite.status === 400, {
    status: ownerRoleInvite.status,
  });

  // TEMP: domain match disabled for frontend invite testing. Restore tomorrow.
  // const wrongDomainInvite = await api(
  //   'POST',
  //   `/identity/organisations/${orgA.id}/invites`,
  //   owner.token,
  //   { email: `wrong-domain-${tag}@other-company.co.uk`, role: Role.Viewer },
  //   orgA.id,
  // );
  // log('POST invite wrong domain (→ 400)', wrongDomainInvite.status === 400, {
  //   status: wrongDomainInvite.status,
  // });

  const demoteOwner = await api(
    'PATCH',
    `/identity/organisations/${orgA.id}/members/${owner.userId}`,
    owner.token,
    { role: Role.Admin },
    orgA.id,
  );
  log('PATCH demote last Owner → 409', demoteOwner.status === 409, { status: demoteOwner.status });

  const removeOwner = await apiDelete(
    `/identity/organisations/${orgA.id}/members/${owner.userId}`,
    owner.token,
    orgA.id,
  );
  log('DELETE last Owner → 409', removeOwner.status === 409, { status: removeOwner.status });

  const adminSubmit = await api(
    'POST',
    '/onboarding/applications/current/submit',
    teammate.token,
    null,
    orgA.id,
  );
  log('POST submit (incomplete app, Admin → 409)', adminSubmit.status === 409, {
    status: adminSubmit.status,
  });

  // ── 12. List organisation members ────────────────────────────────────────
  const members = await apiGet(`/identity/organisations/${orgA.id}/members`, owner.token, orgA.id);
  const memberList = Array.isArray(members.data) ? members.data : [];
  const ownerMember = memberList.find((m) => m.userId === owner.userId);
  const teammateMember = memberList.find((m) => m.userId === teammate.userId);
  log('GET /identity/organisations/{orgA}/members (count 3 — owner, teammate, multi)', members.status === 200
    && memberList.length === 3, {
    status: members.status,
    count: memberList.length,
  });
  log('GET members (owner is Owner)', ownerMember?.role === Role.Owner, {
    ownerRole: ownerMember?.role,
  });
  log('GET members (teammate is Admin)', teammateMember?.role === Role.Admin, {
    teammateRole: teammateMember?.role,
    teammateEmail: teammateMember?.email,
  });

  // ── 13. Switch default organisation ──────────────────────────────────────
  const switchOrg = await api(
    'PUT',
    '/identity/me/organisations/current',
    multi.token,
    { organisationId: orgB.id },
  );
  log('PUT /identity/me/organisations/current (switch to orgB)', switchOrg.status === 200
    && switchOrg.data?.id === orgB.id
    && switchOrg.data?.isCurrent === true, {
    status: switchOrg.status,
    organisationId: switchOrg.data?.id,
  });

  const multiOrgsSwitched = await apiGet('/identity/me/organisations', multi.token);
  const orgBCurrent = findOrg(multiOrgsSwitched.data, orgB.id);
  const orgANotCurrent = findOrg(multiOrgsSwitched.data, orgA.id);
  log('GET /identity/me/organisations (orgB isCurrent after switch)', orgBCurrent?.isCurrent === true, {
    orgBIsCurrent: orgBCurrent?.isCurrent,
  });
  log('GET /identity/me/organisations (orgA not current)', orgANotCurrent?.isCurrent === false, {
    orgAIsCurrent: orgANotCurrent?.isCurrent,
  });

  // ── 14. Owner closes orgA — subsequent scoped access → 403 ─────────────
  const closure = await api(
    'POST',
    `/identity/organisations/${orgA.id}/closure`,
    owner.token,
    null,
    orgA.id,
  );
  log('POST /identity/organisations/{orgA}/closure', closure.status === 200
    && closure.data?.status === 'requested'
    && !!closure.data?.requestedAt, {
    status: closure.status,
    closureStatus: closure.data?.status,
  });

  const ownerOrgsClosed = await apiGet('/identity/me/organisations', owner.token);
  const closedOrgA = findOrg(ownerOrgsClosed.data, orgA.id);
  log('GET /identity/me/organisations (orgA isClosed)', closedOrgA?.isClosed === true, {
    isClosed: closedOrgA?.isClosed,
  });

  const getAfterClosure = await apiGet(
    '/onboarding/applications/current',
    owner.token,
    orgA.id,
  );
  log('GET /onboarding/applications/current (orgA closed → 403)', getAfterClosure.status === 403
    && (getAfterClosure.data?.type === 'organisation-closed'
      || getAfterClosure.data?.title?.includes('Organisation closed')), {
    status: getAfterClosure.status,
    type: getAfterClosure.data?.type,
  });

  const teammateClosedOrgA = await apiGet(
    '/onboarding/applications/current/company-setup',
    teammate.token,
    orgA.id,
  );
  log('GET company-setup on closed orgA (teammate → 403)', teammateClosedOrgA.status === 403, {
    status: teammateClosedOrgA.status,
  });

  // ── 15. Multi-org user can still access own orgB after orgA closed ─────
  const teammateOrgBApp = await apiGet(
    '/onboarding/applications/current',
    multi.token,
    orgB.id,
  );
  log('GET /onboarding/applications/current (orgB after orgA closed — not 403)', teammateOrgBApp.status !== 403, {
    status: teammateOrgBApp.status,
    note: teammateOrgBApp.status === 404 ? 'no application yet on orgB (expected)' : 'application found',
  });

  const createOrgBApp = await api('POST', '/onboarding/applications', multi.token, null, orgB.id);
  log('POST /onboarding/applications (orgB after orgA closed)', createOrgBApp.status === 201
    && !!createOrgBApp.data?.applicationId, {
    status: createOrgBApp.status,
    applicationId: createOrgBApp.data?.applicationId,
  });

  const closureIdempotent = await api(
    'POST',
    `/identity/organisations/${orgA.id}/closure`,
    owner.token,
    null,
    orgA.id,
  );
  log('POST closure idempotent (already closed → 200)', closureIdempotent.status === 200
    && closureIdempotent.data?.status === 'requested', {
    status: closureIdempotent.status,
  });

  const unauthOrgs = await apiGet('/identity/me/organisations', null);
  log('GET /identity/me/organisations (no auth → 401)', unauthOrgs.status === 401, {
    status: unauthOrgs.status,
  });
}

async function main() {
  let apiProcess;
  try {
    writeFileSync(otpFile, '');
    writeFileSync(inviteFile, '');
    console.log(`E2E OTP file: ${otpFile}`);
    console.log(`E2E invite file: ${inviteFile}`);
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
      log('GET /health', true, BASE);
    }

    await runOrganisationRbacCoverage();

    const { failed } = summary();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    apiProcess?.stop();
    for (const file of [otpFile, inviteFile]) {
      try {
        unlinkSync(file);
      } catch {
        // ignore
      }
    }
  }
}

main();
