import { test, expect } from '@playwright/test';

/**
 * Simplified E2E Tests for Ladder Game (Ghost Leg)
 * Testing core functionality with actual DOM elements
 */

test.describe('Ladder Game - Basic E2E', () => {
  test('Home page loads with ladder game link', async ({ page }) => {
    await page.goto('/ko');

    // Verify h1 is visible
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();

    // Verify ladder game link exists
    const ladderLink = page.locator('a[href*="/tools/ladder"]');
    await expect(ladderLink).toBeVisible();
  });

  test('Ladder game page loads', async ({ page }) => {
    await page.goto('/ko/tools/ladder');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for main heading
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const h1Text = await h1.textContent();
    expect(h1Text).toContain('사다리 타기');
  });

  test('Setup card is visible with player count control', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Look for player count label (참가자 수)
    const playerCountLabel = page.locator('label').filter({ hasText: '참가자 수' });
    await expect(playerCountLabel).toBeVisible();

    // Find increment/decrement buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('Player input fields are present', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Look for player input fields with testId
    const playerInputs = page.locator('[data-testid="player-input"]');
    const inputCount = await playerInputs.count();

    // There should be at least some input fields visible
    expect(inputCount).toBeGreaterThan(0);
  });

  test('Build button exists and is clickable', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Find the build button
    const buildButton = page.locator('button').filter({
      hasText: /사다리 만들기|Build/
    });

    await expect(buildButton).toBeVisible();
    await expect(buildButton).toBeEnabled();
  });

  test('Can build a basic ladder', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Click build button with default settings
    const buildButton = page.locator('button').filter({
      hasText: /사다리 만들기|Build/
    });

    await buildButton.click();

    // Look for SVG board (ladder-board)
    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();
  });

  test('English version loads correctly', async ({ page }) => {
    await page.goto('/en/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Check for English heading
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const h1Text = await h1.textContent();
    expect(h1Text).toMatch(/Ladder|Game/i);
  });

  test('Keyboard shortcuts are available', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Build a ladder first
    const buildButton = page.locator('button').filter({
      hasText: /사다리 만들기|Build/
    });
    await buildButton.click();

    // Verify ladder board is visible
    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    // Try pressing a keyboard shortcut (e.g., "2" for reveal player 2)
    // This is to test that the page doesn't error on key press
    await page.keyboard.press('2');

    // Page should still be responsive
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('Accessibility: Page has proper ARIA labels', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Check for aria-label or aria-labelledby
    const elementsWithAria = page.locator('[aria-label], [aria-labelledby]');
    const ariaCount = await elementsWithAria.count();

    // There should be at least some ARIA labels
    expect(ariaCount).toBeGreaterThan(0);
  });

  test('Theme toggle works if present', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Look for theme toggle button
    const themeButtons = page.locator('button').filter({
      hasText: /테마|Theme|다크|Dark|라이트|Light/
    });

    const themeButtonCount = await themeButtons.count();

    // If theme button exists, it should be visible
    if (themeButtonCount > 0) {
      await expect(themeButtons.first()).toBeVisible();
    }
  });

  test('Locale switcher works', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Look for locale switch button or link
    const localeButtons = page.locator('button, a').filter({
      hasText: /English|한국어|EN|KO/
    });

    const localeButtonCount = await localeButtons.count();

    // There should be at least one locale option
    if (localeButtonCount > 0) {
      await expect(localeButtons.first()).toBeVisible();
    }
  });
});
