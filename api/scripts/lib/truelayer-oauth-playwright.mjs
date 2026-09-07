/**
 * Complete TrueLayer sandbox Mock Bank OAuth in a headless browser.
 * Uses john / doe on Mock Bank; captures code without hitting juskel.Api (codes are single-use).
 */
export async function completeTrueLayerMockBankOAuth(
  authorizationUrl,
  {
    username = 'john',
    password = 'doe',
    redirectUriPrefix,
    timeoutMs = 120_000,
  },
) {
  const { chromium } = await import('playwright');

  const browser = await chromium.launch({ headless: process.env.E2E_HEADED !== '1' });
  const context = await browser.newContext();
  const page = await context.newPage();

  let capturedCallback = null;
  if (redirectUriPrefix) {
    const prefix = redirectUriPrefix;
    await context.route(
      (url) => url.toString().startsWith(prefix) && url.toString().includes('code='),
      async (route) => {
        capturedCallback = new URL(route.request().url());
        await route.abort();
      },
    );
  }

  try {
    await page.goto(authorizationUrl, { waitUntil: 'networkidle', timeout: timeoutMs });

    const bodyText = await page.locator('body').innerText({ timeout: 10_000 }).catch(() => '');
    if (/invalid redirect_uri/i.test(bodyText)) {
      throw new Error(
        `TrueLayer rejected redirect_uri. Whitelist exactly: ${redirectUriPrefix || '(see script)'}.`,
      );
    }

    const allowBtn = page.getByRole('button', { name: /^allow$/i }).first();
    if (await allowBtn.isVisible({ timeout: 20_000 }).catch(() => false)) {
      await allowBtn.click();
      await page.waitForLoadState('networkidle').catch(() => {});
    }

    const callbackWait = redirectUriPrefix
      ? page.waitForRequest(
          (req) => req.url().startsWith(redirectUriPrefix) && req.url().includes('code='),
          { timeout: timeoutMs },
        )
      : null;

    await page.getByPlaceholder('User Name').waitFor({ state: 'visible', timeout: 60_000 });
    await page.getByPlaceholder('User Name').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    await page.locator('button[type="submit"]').first().click();

    if (callbackWait) {
      const req = await callbackWait;
      capturedCallback ??= new URL(req.url());
    }

    const deadline = Date.now() + 5_000;
    while (!capturedCallback && Date.now() < deadline) {
      await page.waitForTimeout(200);
    }

    if (!capturedCallback) {
      throw new Error(
        `OAuth redirect not captured. Last URL: ${page.url()}. Title: ${await page.title()}`,
      );
    }

    const code = capturedCallback.searchParams.get('code');
    const state = capturedCallback.searchParams.get('state');
    const error = capturedCallback.searchParams.get('error');

    if (error) {
      throw new Error(`TrueLayer OAuth error: ${error} — ${capturedCallback.searchParams.get('error_description') || ''}`);
    }
    if (!code || !state) {
      throw new Error(`OAuth redirect missing code/state. URL: ${capturedCallback.toString()}`);
    }

    return { code, state, finalUrl: capturedCallback.toString() };
  } finally {
    await context.close();
    await browser.close();
  }
}
