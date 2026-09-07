#!/usr/bin/env node
/** One-off: dump TrueLayer OAuth page structure for selector tuning. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTrueLayerSecrets } from './lib/truelayer-secrets.mjs';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const secrets = loadTrueLayerSecrets();
const redirectUri = 'http://localhost:5242/funding/integrations/open-banking/callback';
const params = new URLSearchParams({
  response_type: 'code',
  client_id: secrets.TRUELAYER_CLIENT_ID,
  redirect_uri: redirectUri,
  scope: 'info accounts balance transactions offline_access',
  state: 'debug-state',
  providers: 'uk-cs-mock',
});
const url = `https://auth.truelayer-sandbox.com/?${params.toString()}`;
console.log('Auth URL:', url);

const { chromium } = await import('playwright');
const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '.e2e-debug');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 120_000 });
await page.waitForTimeout(5_000);

writeFileSync(resolve(outDir, 'page.html'), await page.content());
writeFileSync(resolve(outDir, 'meta.json'), JSON.stringify({
  url: page.url(),
  title: await page.title(),
  text: (await page.locator('body').innerText().catch(() => '')).slice(0, 3000),
  frames: page.frames().map((f) => f.url()),
  inputs: await page.locator('input').evaluateAll((els) =>
    els.map((el) => ({
      type: el.type,
      name: el.name,
      id: el.id,
      placeholder: el.placeholder,
      visible: el.offsetParent !== null,
    })),
  ),
}, null, 2));
await page.screenshot({ path: resolve(outDir, 'page.png'), fullPage: true });
await browser.close();
console.log('Saved to', outDir);
