import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const defaultSecretsPath = resolve(apiRoot, 'sandbox/truelayer/secrets.env');

/** Parse api/sandbox/truelayer/secrets.env (KEY=value, optional quotes). */
export function loadTrueLayerSecrets(secretsPath = process.env.TRUELAYER_SECRETS_PATH || defaultSecretsPath) {
  const text = readFileSync(secretsPath, 'utf8');
  const env = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

export function e2eSpawnTrueLayerSandboxEnv(port, secrets) {
  const apiBase = `http://localhost:${port}`;
  const redirectUri = `${apiBase}/funding/integrations/open-banking/callback`;
  return {
    JUSKEL_FRONTEND_URL: process.env.JUSKEL_FRONTEND_URL || 'http://localhost:3000',
    INTEGRATIONS__QUICKBOOKS__CLIENTID: '',
    INTEGRATIONS__QUICKBOOKS__CLIENTSECRET: '',
    INTEGRATIONS__QUICKBOOKS__REDIRECTURI: `${apiBase}/funding/integrations/quickbooks/callback`,
    INTEGRATIONS__OPENBANKING__CLIENTID: secrets.TRUELAYER_CLIENT_ID,
    INTEGRATIONS__OPENBANKING__CLIENTSECRET: secrets.TRUELAYER_CLIENT_SECRET,
    INTEGRATIONS__OPENBANKING__REDIRECTURI: redirectUri,
    INTEGRATIONS__OPENBANKING__AUTHBASEURL: secrets.TRUELAYER_AUTH_BASE_URL || 'https://auth.truelayer-sandbox.com',
    INTEGRATIONS__OPENBANKING__APIBASEURL: secrets.TRUELAYER_API_BASE_URL || 'https://api.truelayer-sandbox.com',
    INTEGRATIONS__OPENBANKING__PROVIDERS: secrets.TRUELAYER_SANDBOX_PROVIDER || 'uk-cs-mock',
    INTEGRATIONS__XERO__REDIRECTURI: `${apiBase}/funding/integrations/xero/callback`,
  };
}

export function requiredTrueLayerSecrets(secrets) {
  const missing = [];
  if (!secrets.TRUELAYER_CLIENT_ID?.trim()) missing.push('TRUELAYER_CLIENT_ID');
  if (!secrets.TRUELAYER_CLIENT_SECRET?.trim()) missing.push('TRUELAYER_CLIENT_SECRET');
  return missing;
}
