import { test, expect } from '@playwright/test';

/**
 * Covers the themed character illustrations: the per-tool character banner in
 * the shared tool template, and the home welcome character. Assets are the
 * pre-sliced webp tiles under /characters/ (static export serves them raw).
 */

test.describe('Tool characters', () => {
  test('a tool page shows its themed character banner (ko)', async ({ page }) => {
    await page.goto('/ko/tools/roulette');
    const character = page.locator('img[src*="/characters/roulette.webp"]');
    await expect(character).toBeVisible();
    await expect(character).toHaveAttribute('alt', 'Jurepi 캐릭터');
  });

  test('the character alt is localized on /en', async ({ page }) => {
    await page.goto('/en/tools/roulette');
    const character = page.locator('img[src*="/characters/roulette.webp"]');
    await expect(character).toBeVisible();
    await expect(character).toHaveAttribute('alt', 'Jurepi character');
  });

  test('the home hero shows the welcome character', async ({ page }) => {
    await page.goto('/ko');
    const welcome = page.locator(
      'section[aria-labelledby="hero-heading"] img[src*="/characters/home.webp"]'
    );
    await expect(welcome).toBeVisible();
  });

  test('tool page has no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/ko/tools/qr-code');
    await expect(
      page.locator('img[src*="/characters/qr-code.webp"]')
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });
});
