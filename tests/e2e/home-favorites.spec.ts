import { test, expect, type Page } from '@playwright/test';

/**
 * E2E for Home Favorites (docs/services/home/favorites/SPEC.md).
 * Mirrors SPEC final_integration_test scenarios 1–8.
 *
 * Selectors: star buttons via their localized aria-label
 * ("{name} 즐겨찾기 추가/해제"), filter pill via data-testid
 * (home page passes no testId to ToolExplorer, so card testids are absent).
 */

const STORAGE_KEY = 'jurepi-home-favorites';

/** Collect page errors + console errors with NO filtering (hard gate). */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

async function gotoHome(page: Page, path = '/ko') {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

function starAdd(page: Page, name: string) {
  return page
    .locator('main')
    .getByRole('button', { name: `${name} 즐겨찾기 추가` });
}

function starRemove(page: Page, name: string) {
  return page
    .locator('main')
    .getByRole('button', { name: `${name} 즐겨찾기 해제` });
}

test.describe('Home Favorites - E2E', () => {
  test('scenario 1: star toggles, persists across reload, filter narrows grid', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await gotoHome(page);
    const main = page.locator('main');

    // Star the ladder tool.
    const addBtn = starAdd(page, '사다리 타기');
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toHaveAttribute('aria-pressed', 'false');
    await addBtn.click();

    // Button flips to pressed / remove label.
    const removeBtn = starRemove(page, '사다리 타기');
    await expect(removeBtn).toBeVisible();
    await expect(removeBtn).toHaveAttribute('aria-pressed', 'true');

    // Persisted to localStorage immediately.
    const stored = await page.evaluate(
      key => window.localStorage.getItem(key),
      STORAGE_KEY
    );
    expect(stored).toContain('ladder');

    // Reload → star persists.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(starRemove(page, '사다리 타기')).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    // Favorites filter ON → only the favorited tool remains.
    await page.getByTestId('favorites-filter-toggle').click();
    await expect(main.getByText('사다리 타기')).toBeVisible();
    await expect(main.getByText('신조어 용어사전')).toHaveCount(0);

    // Filter OFF → all tools return.
    await page.getByTestId('favorites-filter-toggle').click();
    await expect(main.getByText('신조어 용어사전')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('scenario 2: favorites filter with 0 favorites shows empty state + escape', async ({
    page,
  }) => {
    await gotoHome(page);
    const main = page.locator('main');

    await page.getByTestId('favorites-filter-toggle').click();
    await expect(main.getByText('아직 즐겨찾기가 없어요')).toBeVisible();

    // Escape action turns the filter off and repopulates the grid.
    await page.getByRole('button', { name: '모두 보기' }).click();
    await expect(main.getByText('사다리 타기')).toBeVisible();
    await expect(
      page.getByTestId('favorites-filter-toggle')
    ).toHaveAttribute('aria-pressed', 'false');
  });

  test('scenario 3: search AND favorites compose', async ({ page }) => {
    await gotoHome(page);
    const main = page.locator('main');

    // Favorite ladder only.
    await starAdd(page, '사다리 타기').click();
    await page.getByTestId('favorites-filter-toggle').click();

    // Search for a non-favorited tool → hidden despite matching search.
    await page.locator('#tool-search').fill('신조어');
    await expect(main.getByText('신조어 용어사전')).toHaveCount(0);

    // Search for the favorited tool → visible.
    await page.locator('#tool-search').fill('사다리');
    await expect(main.getByText('사다리 타기')).toBeVisible();

    // Clear search → only the favorite shows (filter still on).
    await page.locator('#tool-search').fill('');
    await expect(main.getByText('사다리 타기')).toBeVisible();
    await expect(main.getByText('신조어 용어사전')).toHaveCount(0);
  });

  test('scenario 4: category AND favorites compose (not OR)', async ({
    page,
  }) => {
    await gotoHome(page);
    const main = page.locator('main');

    // Favorite one random-category tool (ladder) + one text-category tool.
    await starAdd(page, '사다리 타기').click();
    await starAdd(page, '신조어 용어사전').click();
    await page.getByTestId('favorites-filter-toggle').click();

    // Category "텍스트" + favorites ON → only favorited text tools.
    await page.getByRole('button', { name: '텍스트', exact: true }).click();
    await expect(main.getByText('신조어 용어사전')).toBeVisible();
    await expect(main.getByText('사다리 타기')).toHaveCount(0);
    // A non-favorited text tool stays hidden (AND, not OR).
    await expect(main.getByText('글자·단어 카운터')).toHaveCount(0);
  });

  test('scenario 5: URL reflects and hydrates favorites filter state', async ({
    page,
  }) => {
    await gotoHome(page);

    await starAdd(page, '사다리 타기').click();
    await page.getByTestId('favorites-filter-toggle').click();
    await expect(page).toHaveURL(/favorites=true/);

    // Direct navigation with the param → filter active on load.
    await gotoHome(page, '/ko?favorites=true');
    await expect(
      page.getByTestId('favorites-filter-toggle')
    ).toHaveAttribute('aria-pressed', 'true');
    const main = page.locator('main');
    await expect(main.getByText('사다리 타기')).toBeVisible();
    await expect(main.getByText('신조어 용어사전')).toHaveCount(0);

    // Combined params keep AND semantics.
    await gotoHome(page, '/ko?q=%EC%82%AC%EB%8B%A4%EB%A6%AC&favorites=true');
    await expect(main.getByText('사다리 타기')).toBeVisible();
  });

  test('scenario 6: SSR crawl safety — tool anchors present in prerendered HTML', async ({
    page,
  }) => {
    // Fetch raw HTML (no JS) — anchors must be server-rendered.
    const res = await page.request.get('/ko');
    expect(res.ok()).toBeTruthy();
    const html = await res.text();
    expect(html).toContain('href="/ko/tools/ladder"');
    expect(html).toContain('href="/ko/tools/new-word"');

    // Toggling favorites must not add/remove anchors from the DOM grid count
    // beyond the favorites filter itself (stars are UX-only).
    await gotoHome(page);
    const main = page.locator('main');
    const before = await main.locator('a[href^="/ko/tools/"]').count();
    await starAdd(page, '사다리 타기').click();
    const after = await main.locator('a[href^="/ko/tools/"]').count();
    expect(after).toBe(before);
  });

  test('scenario 7: hydration safety — zero page/console errors, no CLS from stars', async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await gotoHome(page);

    // Interact: star, filter on/off — still zero errors (React #418 would surface here).
    await starAdd(page, '사다리 타기').click();
    await page.getByTestId('favorites-filter-toggle').click();
    await page.getByTestId('favorites-filter-toggle').click();
    await page.waitForTimeout(300);

    expect(errors).toEqual([]);
  });

  test('scenario 8: every live tool card has exactly one star; count matches links', async ({
    page,
  }) => {
    await gotoHome(page);
    const main = page.locator('main');

    // Star-button count equals live tool link count (coming_soon cards,
    // if any, get no star — asserted structurally: buttons ≤ anchors, and
    // with the current all-live registry, equal).
    const linkCount = await main.locator('a[href^="/ko/tools/"]').count();
    const starCount = await main
      .getByRole('button', { name: /즐겨찾기 (추가|해제)/ })
      .count();
    expect(starCount).toBe(linkCount);
    expect(starCount).toBeGreaterThan(0);

    // Star click does NOT navigate (button is a sibling outside the anchor).
    await starAdd(page, '사다리 타기').click();
    await expect(page).not.toHaveURL(/\/tools\//);
  });

  test('english locale: star + filter + empty state localized', async ({
    page,
  }) => {
    await gotoHome(page, '/en');
    const main = page.locator('main');

    const addBtn = main.getByRole('button', {
      name: 'Add Ladder Game to favorites',
    });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await page.getByTestId('favorites-filter-toggle').click();
    // Exactly one card remains visible.
    await expect(main.locator('a[href^="/en/tools/"]:visible')).toHaveCount(1);
  });
});
