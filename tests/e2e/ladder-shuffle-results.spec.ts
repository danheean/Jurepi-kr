import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Shuffle Results Feature
 * - Default 7 players (instead of 4)
 * - Shuffle results toggle (instead of hide results)
 * - Download button gating (only in done phase)
 * - Prize cards always show '?' until revealed
 */

test.describe('Ladder Game - Shuffle Results', () => {
  test('Setup page has default 7 player input fields', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    const playerInputs = page.locator('[data-testid="player-input"]');
    const count = await playerInputs.count();

    // Default should be 7 players
    expect(count).toBe(7);
  });

  test('Shuffle results toggle exists and is checked by default', async ({
    page,
  }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    const shuffleToggle = page.locator('[data-testid="shuffle-results-toggle"]');
    await expect(shuffleToggle).toBeVisible();

    // Should be checked by default
    const isChecked = await shuffleToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('true');
  });

  test('Can toggle shuffle results on and off', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    const shuffleToggle = page.locator('[data-testid="shuffle-results-toggle"]');

    // Toggle OFF
    await shuffleToggle.click();
    let isChecked = await shuffleToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('false');

    // Toggle ON
    await shuffleToggle.click();
    isChecked = await shuffleToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('true');
  });

  test('Prize cards show question marks before reveal', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Set minimal config and build
    const buildButton = page.locator('button').filter({
      hasText: /사다리 만들기|Build/,
    });
    await buildButton.click();

    // Wait for ladder board
    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    // Prize cards should show '?'
    const prizeCards = page.locator('[data-testid="prize-card"]');
    const count = await prizeCards.count();
    expect(count).toBe(7); // Default 7 players

    // All cards should show '?'
    for (let i = 0; i < count; i++) {
      const text = await prizeCards.nth(i).textContent();
      expect(text?.trim()).toBe('?');
    }
  });

  test('Download button only appears in done phase', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Build ladder
    const buildButton = page.locator('button').filter({
      hasText: /사다리 만들기|Build/,
    });
    await buildButton.click();

    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    // Download button should NOT be visible in ready phase
    let downloadBtn = page.locator('[data-testid="download-btn"]');
    let isVisible = await downloadBtn.isVisible().catch(() => false);
    expect(isVisible).toBe(false);

    // Reveal all results
    const revealAllBtn = page.locator('button').filter({ hasText: /전체 결과 보기|Reveal all/ });
    await expect(revealAllBtn).toBeVisible();
    await revealAllBtn.click();

    // Now download button should be visible (done phase)
    await expect(downloadBtn).toBeVisible({ timeout: 5000 });
  });

  test('Prize cards reveal on player click', async ({ page }) => {
    await page.goto('/ko/tools/ladder');
    await page.waitForLoadState('networkidle');

    // Set names and build
    const playerInputs = page.locator('[data-testid="player-input"]');
    await playerInputs.nth(0).fill('Alice');

    const buildButton = page.locator('button').filter({
      hasText: /사다리 만들기|Build/,
    });
    await buildButton.click();

    const svgBoard = page.locator('[data-testid="ladder-board"]');
    await expect(svgBoard).toBeVisible();

    // Click on a player chip to start trace
    const chips = page.locator('[data-testid="player-chip"]');
    await expect(chips.first()).toBeVisible({ timeout: 5000 });
    await chips.nth(0).click();

    // Wait for trace animation and reveal
    await page.waitForTimeout(1500);

    // At least one card should now be revealed (not all '?')
    const prizeCards = page.locator('[data-testid="prize-card"]');
    const count = await prizeCards.count();

    let hasReveal = false;
    for (let i = 0; i < count; i++) {
      const text = await prizeCards.nth(i).textContent();
      if (text?.trim() !== '?') {
        hasReveal = true;
        break;
      }
    }
    expect(hasReveal).toBe(true);
  });

  test('English version also has 7 players by default', async ({ page }) => {
    await page.goto('/en/tools/ladder');
    await page.waitForLoadState('networkidle');

    const playerInputs = page.locator('[data-testid="player-input"]');
    const count = await playerInputs.count();

    expect(count).toBe(7);
  });
});
