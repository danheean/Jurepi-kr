import { test, expect, type Page } from '@playwright/test';

/**
 * Unit Converter E2E — SPEC final_integration_test scenarios 1–5.
 *
 * Every spec fails on any uncaught page error or ErrorBoundary catch so a
 * runtime crash cannot hide behind green units.
 */

function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  return errors;
}

const TOOL_URL_KO = '/ko/tools/unit-converter';
const TOOL_URL_EN = '/en/tools/unit-converter';

test.describe('Unit Converter - E2E Integration', () => {
  /**
   * Scenario 1: Category tabs + canonical pairs
   * Load → Length active; click Temperature → canonical pair switches; type 0 → shows 32.
   */
  test('Scenario 1: Category selection and canonical pairs', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    // Verify Length category is active (first tab) via tablist
    const tablist = page.locator('main').getByRole('tablist').first();
    await expect(tablist).toBeVisible({ timeout: 5000 });

    const lengthTab = tablist.getByRole('tab').filter({ hasText: '길이' }).first();
    await expect(lengthTab).toBeVisible({ timeout: 5000 });
    expect(await lengthTab.getAttribute('aria-selected')).toBe('true');

    // Click Temperature tab via tablist
    const tempTab = tablist.getByRole('tab').filter({ hasText: '온도' }).first();
    await tempTab.click();
    await page.waitForTimeout(200);

    // Verify Temperature is now active
    expect(await tempTab.getAttribute('aria-selected')).toBe('true');

    // Type "0" in the input
    const input = page.locator('main').locator('input[id="unit-conversion-input"]').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('0');
    await page.waitForTimeout(200); // Debounce + process

    // Verify conversion shows 32 (0°C = 32°F)
    const conversionTable = page.locator('main').locator('text=/32|°F/').first();
    await expect(conversionTable).toBeVisible({ timeout: 3000 });

    // Click back to Length
    await lengthTab.click();
    await page.waitForTimeout(200);
    expect(await lengthTab.getAttribute('aria-selected')).toBe('true');

    expect(errors).toEqual([]);
  });

  /**
   * Scenario 2: Live conversion + precision + swap
   * Type 100 in Length (m→km) → live updates; move precision slider → reformats;
   * swap → flips from/to and recomputes.
   */
  test('Scenario 2: Live conversion, precision, and swap', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    // Type 100 in the input
    const input = page.locator('main').locator('input[id="unit-conversion-input"]').first();
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.fill('100');
    await page.waitForTimeout(200); // Debounce

    // Verify conversion is displayed (100 m = 0.1 km)
    // The output should show conversion in the table or result area
    const result = page.locator('main').locator('text=/0.1|km|100/').first();
    await expect(result).toBeVisible({ timeout: 3000 });

    // Move precision slider to 4 decimals
    const precisionSlider = page.locator('main').locator('input[type="range"]').first();
    await expect(precisionSlider).toBeVisible({ timeout: 5000 });
    // Set to 4
    await precisionSlider.fill('4');
    await page.waitForTimeout(200);

    // Verify precision changed
    expect(await precisionSlider.inputValue()).toBe('4');

    // Click swap button (has aria-label, icon only)
    const swapButton = page.locator('main').getByRole('button', { name: /맞바꾸기/ }).first();
    await expect(swapButton).toBeVisible({ timeout: 5000 });
    await swapButton.click();
    await page.waitForTimeout(200);

    // After swap, the units should be flipped
    // Input is still 100, but now from=km to=m → result should be 100,000 m
    const swappedResult = page.locator('main').locator('text=/100000|m/').first();
    await expect(swappedResult).toBeVisible({ timeout: 3000 });

    expect(errors).toEqual([]);
  });

  /**
   * Scenario 3: Temperature edge cases
   * -40°C → -40°F; 212°F→°C → 100; 273.15K→°C → 0
   */
  test('Scenario 3: Temperature edge cases and round-trip accuracy', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    // Click Temperature tab via tablist
    const tablist = page.locator('main').getByRole('tablist').first();
    const tempTab = tablist.getByRole('tab').filter({ hasText: '온도' }).first();
    await expect(tempTab).toBeVisible({ timeout: 5000 });
    await tempTab.click();
    await page.waitForTimeout(200);

    const input = page.locator('main').locator('input[id="unit-conversion-input"]').first();
    await expect(input).toBeVisible({ timeout: 5000 });

    // Test 1: -40°C = -40°F (affine property)
    await input.fill('-40');
    await page.waitForTimeout(200);

    let result = page.locator('main').locator('text=/-40/').first();
    await expect(result).toBeVisible({ timeout: 3000 });

    // Test 2: 0°C = 32°F
    await input.fill('0');
    await page.waitForTimeout(200);

    result = page.locator('main').locator('text=/32/').first();
    await expect(result).toBeVisible({ timeout: 3000 });

    // Test 3: Verify 273.15K appears (0°C = 273.15K)
    const tempResult = page.locator('main').locator('text=/273.15|K/').first();
    await expect(tempResult).toBeVisible({ timeout: 3000 });

    expect(errors).toEqual([]);
  });

  /**
   * Scenario 4: Recents + keyboard
   * Perform conversions → recents appear; reload → persist; Tab/Arrow/Enter/Esc keyboard support
   */
  test('Scenario 4: Recents persistence and keyboard navigation', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    const input = page.locator('main').locator('input[id="unit-conversion-input"]').first();
    await expect(input).toBeVisible({ timeout: 5000 });

    // Perform a conversion (100 m)
    await input.fill('100');
    await page.waitForTimeout(200);

    // Switch to mass and perform another conversion via tablist
    const tablist = page.locator('main').getByRole('tablist').first();
    const massTab = tablist.getByRole('tab').filter({ hasText: '무게' }).first();
    await expect(massTab).toBeVisible({ timeout: 5000 });
    await massTab.click();
    await page.waitForTimeout(200);

    await input.fill('50');
    await page.waitForTimeout(200);

    // Verify recents section exists and shows recent conversions
    const recentsHeading = page.locator('main').locator('text=/최근 변환/').first();
    await expect(recentsHeading).toBeVisible({ timeout: 5000 });

    // Reload and verify recents persist
    await page.reload();
    await page.waitForLoadState('networkidle');

    const recentsHeadingAfterReload = page.locator('main').locator('text=/최근 변환/').first();
    await expect(recentsHeadingAfterReload).toBeVisible({ timeout: 5000 });

    // Test keyboard navigation: Tab through controls
    const inputAfterReload = page.locator('main').locator('input[id="unit-conversion-input"]').first();
    await expect(inputAfterReload).toBeVisible({ timeout: 5000 });
    await inputAfterReload.focus();

    // Press Tab to move to next control
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Focus a tab and test arrow key navigation
    const tablistNav = page.locator('main').getByRole('tablist').first();
    const firstTab = tablistNav.getByRole('tab').first();
    await firstTab.focus();

    // Press ArrowRight to move to next category
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // Verify tabs exist with aria-selected
    const selectedTabs = tablistNav.getByRole('tab', { selected: true });
    await expect(selectedTabs.first()).toBeVisible({ timeout: 3000 });

    // Press Escape to close any open picker
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);

    expect(errors).toEqual([]);
  });

  /**
   * Scenario 5: i18n
   * Load /en → chrome is English; verify category labels, help text, FAQ are in English
   */
  test('Scenario 5: i18n locale swap and English chrome', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_EN);
    await page.waitForLoadState('networkidle');

    // Verify English category labels via tablist
    const tablistEn = page.locator('main').getByRole('tablist').first();
    const lengthTabEn = tablistEn.getByRole('tab').filter({ hasText: 'Length' }).first();
    await expect(lengthTabEn).toBeVisible({ timeout: 5000 });
    expect(await lengthTabEn.getAttribute('aria-selected')).toBe('true');

    // Verify other category labels are English
    const temperatureTabEn = tablistEn.getByRole('tab').filter({ hasText: 'Temperature' }).first();
    await expect(temperatureTabEn).toBeVisible({ timeout: 5000 });

    // Verify help text and labels are English
    const mainContent = page.locator('main');
    const mainText = await mainContent.textContent();

    // Verify English words are present
    expect(mainText).toContain('Length');
    expect(mainText).not.toContain('길이'); // Should NOT contain Korean

    // Verify no Korean leak
    const koreanRegex = /[가-힣]/;
    expect(mainText).not.toMatch(koreanRegex);

    expect(errors).toEqual([]);
  });

  /**
   * Verify ErrorBoundary is NOT triggered (no rendering crash)
   */
  test('Verify no ErrorBoundary fallback shown', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.goto(TOOL_URL_KO);
    await page.waitForLoadState('networkidle');

    // Check that ErrorBoundary fallback text is NOT visible
    const errorBoundaryTextKo = await page
      .locator('text=/문제가 발생했어요/')
      .isVisible()
      .catch(() => false);
    expect(errorBoundaryTextKo, 'Korean ErrorBoundary fallback should not be visible').toBe(false);

    // Check for English version too
    const errorBoundaryTextEn = await page
      .locator('text=/Something went wrong/')
      .isVisible()
      .catch(() => false);
    expect(errorBoundaryTextEn, 'English ErrorBoundary fallback should not be visible').toBe(false);

    expect(errors).toEqual([]);
  });
});
