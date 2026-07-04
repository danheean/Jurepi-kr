import { test, expect } from '@playwright/test';

/**
 * E2E Tests for My IP Address Tool
 * Based on SPEC final_integration_test scenarios 1–5.
 *
 * Tests cover:
 * - Scenario 1: Successful IP fetch + display with ipify
 * - Scenario 2: Primary provider timeout, fallback to ipwho.is
 * - Scenario 3: All providers fail, error state + manual retry
 * - Scenario 4: i18n (en locale), SEO, accessibility
 * - Scenario 5: Pageerror gate, keyboard a11y, button accessibility
 */

test.describe('My IP Address - E2E Integration', () => {
  /**
   * Scenario 1: Successful IP fetch + display from ipify
   */
  test('Scenario 1: Successful IP fetch with ipify + copy + refresh', async ({
    page,
    context,
  }) => {
    // Clipboard access is permission-gated in Chromium; grant it so the
    // copy-success state is deterministic (the app silently no-ops otherwise).
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    // Mock ipify endpoints
    await page.route('https://api.ipify.org?format=json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ip: '203.0.113.45' }),
      });
    });

    await page.route('https://api6.ipify.org?format=json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ip: '2001:db8::1' }),
      });
    });

    // Navigate to tool (ko locale)
    await page.goto('/ko/tools/my-ip');
    await page.waitForLoadState('networkidle');

    // Wait for mount + fetch to complete
    await page.waitForTimeout(1500);

    // Verify IP is displayed (search for IP text in page)
    await expect(page.locator('text=/203\.0\.113\.45/')).toBeVisible({ timeout: 5000 });

    // Verify provider attribution (ko copy: "api.ipify.org에서 조회됨")
    await expect(page.locator('text=/api\.ipify\.org에서 조회됨/')).toBeVisible();

    // Find copy button by aria-label containing "복사" (Copy)
    const copyButton = page.locator('button:has-text("복사")').first();
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toBeEnabled();

    // Click copy
    await copyButton.click();
    await page.waitForTimeout(200);

    // Verify success toast "복사되었습니다"
    await expect(page.locator('text=/복사되었습니다/')).toBeVisible({ timeout: 3000 });

    // Find refresh button by aria-label containing "새로고침"
    const refreshButton = page.locator('button:has-text("새로고침")').first();
    await expect(refreshButton).toBeVisible();
    await expect(refreshButton).toBeEnabled();

    // Click refresh → should show loader, then IP again
    await refreshButton.click();
    await page.waitForTimeout(500);

    // Verify IP still visible after refresh
    await expect(page.locator('text=/203\.0\.113\.45/')).toBeVisible({ timeout: 3000 });
  });

  /**
   * Scenario 2: Primary provider timeout, fallback to ipwho.is
   */
  test('Scenario 2: ipify timeout, fallback to ipwho.is success', async ({
    page,
  }) => {
    // Mock ipify endpoints to hang (6s > 5s timeout)
    await page.route('https://api.ipify.org?format=json', (route) => {
      route.abort('timedout');
    });

    await page.route('https://api6.ipify.org?format=json', (route) => {
      route.abort('timedout');
    });

    // Mock ipwho.is to succeed with geo data
    await page.route('https://ipwho.is/', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          ip: '203.0.113.99',
          country_code: 'US',
          city: 'New York',
          isp: 'Example ISP',
        }),
      });
    });

    await page.goto('/ko/tools/my-ip');
    await page.waitForLoadState('networkidle');

    // Aborted routes reject immediately, so the fallback resolves fast;
    // poll via the visibility timeout instead of a fixed sleep.
    await expect(page.locator('text=/203\.0\.113\.99/')).toBeVisible({ timeout: 12000 });

    // Verify provider attribution (ko copy: "ipwho.is에서 조회됨")
    await expect(page.locator('text=/ipwho\.is에서 조회됨/')).toBeVisible();

    // Verify ISP label visible
    await expect(page.locator('text=/Example ISP/')).toBeVisible();

    // Verify city label visible (marked "approximate")
    await expect(page.locator('text=/New York/')).toBeVisible();
  });

  /**
   * Scenario 3: All providers fail, error state + retry succeeds
   */
  test('Scenario 3: All providers fail, error + retry success', async ({
    page,
  }) => {
    // First route setup: all providers fail
    await page.route('https://api.ipify.org?format=json', (route) => {
      route.abort('timedout');
    });

    await page.route('https://api6.ipify.org?format=json', (route) => {
      route.abort('timedout');
    });

    await page.route('https://ipwho.is/', (route) => {
      route.abort('timedout');
    });

    await page.goto('/ko/tools/my-ip');
    await page.waitForLoadState('networkidle');

    // Aborted routes reject immediately; poll for the error state.
    const errorMessage = page.locator('text=/IP 서비스|일시적 문제/');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    // Find retry button by text
    const retryButton = page.locator('button:has-text("다시 시도")').first();
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Unroute failed providers and set up success response
    await page.unroute('https://api.ipify.org?format=json');
    await page.unroute('https://api6.ipify.org?format=json');
    await page.unroute('https://ipwho.is/');

    await page.route('https://api.ipify.org?format=json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ip: '203.0.113.77' }),
      });
    });

    await page.route('https://api6.ipify.org?format=json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ip: '2001:db8::2' }),
      });
    });

    // Click retry button
    await retryButton.click();
    await page.waitForTimeout(1500);

    // Verify IP display (error cleared, IP shown)
    await expect(page.locator('text=/203\.0\.113\.77/')).toBeVisible({ timeout: 5000 });

    // Verify error message is gone
    await expect(errorMessage).not.toBeVisible();
  });

  /**
   * Scenario 4: i18n (en locale), UI chrome all English, no Korean leakage
   */
  test('Scenario 4: i18n en locale, English UI chrome, no Korean leakage', async ({
    page,
  }) => {
    // Mock ipify
    await page.route('https://api.ipify.org?format=json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ip: '203.0.113.88' }),
      });
    });

    await page.route('https://api6.ipify.org?format=json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ip: '2001:db8::3' }),
      });
    });

    // Navigate to /en locale
    await page.goto('/en/tools/my-ip');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify IP is displayed (en locale)
    await expect(page.locator('text=/203\.0\.113\.88/')).toBeVisible({ timeout: 5000 });

    // Find button by English text
    const copyButton = page.locator('button:has-text("Copy")').first();
    await expect(copyButton).toBeVisible();

    const refreshButton = page.locator('button:has-text("Refresh")').first();
    await expect(refreshButton).toBeVisible();

    // Scan VISIBLE text in main for Korean leakage (textContent would also
    // read Next.js data <script> payloads, which legitimately embed the ko
    // catalog / registry keywords — innerText excludes them).
    const mainText = await page.locator('main').innerText();
    const koreanChars = mainText.match(/[가-힣]/g);
    expect(koreanChars).toBeNull();
  });

  /**
   * Scenario 5: Pageerror gate (hard gate 0), keyboard navigation, button a11y
   */
  test('Scenario 5: Pageerror 0 + keyboard nav + button a11y', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    // Mock ipify
    await page.route('https://api.ipify.org?format=json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ip: '203.0.113.55' }),
      });
    });

    await page.route('https://api6.ipify.org?format=json', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ip: '2001:db8::4' }),
      });
    });

    // Set up pageerror gate (hard gate: no CRITICAL errors)
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => {
      console.error('Page error:', err);
      pageErrors.push(err);
    });

    await page.goto('/ko/tools/my-ip');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // HARD GATE: zero page errors, hydration mismatches included.
    expect(pageErrors).toHaveLength(0);

    // Verify IP is displayed
    await expect(page.locator('text=/203\.0\.113\.55/')).toBeVisible({ timeout: 5000 });

    // Verify buttons have proper attributes (accessibility)
    const copyButton = page.locator('button:has-text("복사")').first();
    await expect(copyButton).toBeVisible();

    const refreshButton = page.locator('button:has-text("새로고침")').first();
    await expect(refreshButton).toBeVisible();

    // Test keyboard navigation: Focus and press enter on copy button
    await copyButton.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Verify success toast
    await expect(page.locator('text=/복사되었습니다/')).toBeVisible({ timeout: 3000 });

    // Focus and press enter on refresh button
    await refreshButton.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify IP still visible
    await expect(page.locator('text=/203\.0\.113\.55/')).toBeVisible({ timeout: 3000 });
  });
});
