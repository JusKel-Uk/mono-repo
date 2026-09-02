/** HTTP + logging helpers — adapted from ~/Space/powerhouse/snippets/e2e-http-client.mjs */

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

  async function api(method, path, token, body, extraHeaders = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return parseResponse(res);
  }

  async function apiGet(path, token) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return parseResponse(res);
  }

  async function apiDelete(path, token) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 204) return { status: 204, data: null };
    return parseResponse(res);
  }

  async function apiMultipart(path, token, formData) {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    return parseResponse(res);
  }

  /** Binary GET — returns status, contentType, byteLength (no JSON parse). */
  async function apiDownload(path, token) {
    const res = await fetch(`${baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    const res = await fetch(url.toString());
    return parseResponse(res);
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

/** Minimal 1×1 PNG */
export function tinyPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
}
