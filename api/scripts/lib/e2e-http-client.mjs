/** HTTP + logging helpers — adapted from ~/Space/powerhouse/snippets/e2e-http-client.mjs */

export const ORG_HEADER = 'X-Organisation-Id';

export function orgHeaders(organisationId) {
  return organisationId ? { [ORG_HEADER]: organisationId } : {};
}

export function createApiClient(baseUrl) {
  async function parseResponse(res) {
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  }

  function mergeHeaders(token, organisationId, extraHeaders = {}) {
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...orgHeaders(organisationId),
      ...extraHeaders,
    };
  }

  async function api(method, path, token, body, organisationId = null, extraHeaders = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...mergeHeaders(token, organisationId, extraHeaders),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return { status: 204, data: null };
    return parseResponse(res);
  }

  async function apiGet(path, token, organisationId = null) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: mergeHeaders(token, organisationId),
    });
    return parseResponse(res);
  }

  async function apiDelete(path, token, organisationId = null) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'DELETE',
      headers: mergeHeaders(token, organisationId),
    });
    if (res.status === 204) return { status: 204, data: null };
    return parseResponse(res);
  }

  async function apiMultipart(path, token, formData, organisationId = null) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: mergeHeaders(token, organisationId),
      body: formData,
    });
    return parseResponse(res);
  }

  /** Binary GET — returns status, contentType, byteLength (no JSON parse). */
  async function apiDownload(path, token, organisationId = null) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: mergeHeaders(token, organisationId),
    });
    const buffer = await res.arrayBuffer();
    return {
      status: res.status,
      contentType: res.headers.get('content-type'),
      byteLength: buffer.byteLength,
    };
  }

  async function oauthCallback(path, code, state) {
    const url = new URL(`${baseUrl}${path}`);
    url.searchParams.set('code', code);
    url.searchParams.set('state', state);
    const res = await fetch(url.toString(), { redirect: 'manual' });
    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get('location');
      return {
        status: res.status,
        data: { redirected: true, location },
        ok: true,
      };
    }
    return { ...(await parseResponse(res)), ok: res.ok };
  }

  return { api, apiGet, apiDelete, apiMultipart, apiDownload, oauthCallback };
}

export function createLogger() {
  const results = [];
  function log(step, ok, detail) {
    results.push({ step, ok, detail });
    const mark = ok ? 'PASS' : 'FAIL';
    console.log(
      `[${mark}] ${step}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`,
    );
  }
  function summary() {
    const passed = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===\n`);
    return { passed, failed, results };
  }
  return { log, summary, results };
}

export function integrationCallbackOk(cb, provider) {
  if (cb.status === 200 && cb.data?.status === 'connected' && cb.data?.provider === provider) {
    return true;
  }
  const location = cb.data?.location ?? '';
  return Boolean(
    cb.data?.redirected
    && location.includes(`integration=${provider}`)
    && location.includes('status=connected'),
  );
}

export function e2eSpawnIntegrationEnv(port) {
  const apiBase = `http://localhost:${port}`;
  return {
    JUSKEL_FRONTEND_URL: '',
    INTEGRATIONS__QUICKBOOKS__CLIENTID: '',
    INTEGRATIONS__QUICKBOOKS__CLIENTSECRET: '',
    INTEGRATIONS__QUICKBOOKS__REDIRECTURI: `${apiBase}/funding/integrations/quickbooks/callback`,
    INTEGRATIONS__OPENBANKING__REDIRECTURI: `${apiBase}/funding/integrations/open-banking/callback`,
    INTEGRATIONS__XERO__REDIRECTURI: `${apiBase}/funding/integrations/xero/callback`,
  };
}

/** Minimal 1×1 PNG */
export function tinyPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}
