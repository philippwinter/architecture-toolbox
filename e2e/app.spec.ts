import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('starts at level 1 and supports deeper view profiles', async ({ page }) => {
  await expect(page.getByText('Dokument ist gültig')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(50);
  await expect(page.getByLabel('Gruppe Strategy & Governance')).toBeVisible();
  await expect(page.getByLabel('Gruppe Market & Customer')).toBeVisible();
  await expect(page.getByLabel('Gruppe Products & Operations')).toBeVisible();
  await expect(page.getByLabel('Gruppe People & Organisation')).toBeVisible();
  await expect(page.getByLabel('Gruppe Technology, Risk & Enablers')).toBeVisible();
  await expect(page.getByLabel('Gruppe Enterprise Direction')).toBeVisible();
  await expect
    .poll(async () => {
      const canvasBox = await page.locator('.map-canvas').boundingBox();
      const firstGroupBox = await page
        .locator('[data-id="strategy-governance-group"]')
        .boundingBox();
      const lastGroupBox = await page.locator('[data-id="enablers-risk-group"]').boundingBox();
      if (!canvasBox || !firstGroupBox || !lastGroupBox) return false;
      return (
        firstGroupBox.x >= canvasBox.x &&
        lastGroupBox.x + lastGroupBox.width <= canvasBox.x + canvasBox.width
      );
    })
    .toBe(true);

  const depth = page.getByRole('combobox', { name: 'Ansichtstiefe' });
  await expect(depth).toHaveValue('level-1');
  const corporateDevelopment = page.locator('[data-id="corporate-development"]');
  await expect(corporateDevelopment.locator('.capability-node__icon')).toBeVisible();
  await expect(corporateDevelopment.locator('article')).toHaveClass(/compact/);
  await expect(corporateDevelopment.locator('article')).not.toHaveClass(/minimal/);
  await depth.selectOption('all');
  await expect(page.getByRole('article')).toHaveCount(500);
  await depth.selectOption('level-1');
  await expect(page.getByRole('article')).toHaveCount(50);
});

test('wraps capability names only across the number of lines their height supports', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Ansichtstiefe' }).selectOption('level-2');

  const twoLineName = page.locator('[data-id="strategy-step-1"] strong');
  const twoLineMetrics = await twoLineName.evaluate((name) => ({
    clamp: name.getAttribute('style'),
    clientHeight: name.clientHeight,
    lineHeight: Number.parseFloat(getComputedStyle(name).lineHeight),
  }));
  expect(twoLineMetrics.clamp).toContain('-webkit-line-clamp: 2');
  expect(twoLineMetrics.clientHeight).toBeGreaterThan(twoLineMetrics.lineHeight * 1.8);
  expect(twoLineMetrics.clientHeight).toBeLessThan(twoLineMetrics.lineHeight * 2.2);

  const threeLineName = page.locator('[data-id="enterprise-portfolio-step-9"] strong');
  const threeLineMetrics = await threeLineName.evaluate((name) => ({
    clamp: name.getAttribute('style'),
    clientHeight: name.clientHeight,
    scrollHeight: name.scrollHeight,
  }));
  expect(threeLineMetrics.clamp).toContain('-webkit-line-clamp: 3');
  expect(threeLineMetrics.clientHeight).toBeLessThan(threeLineMetrics.scrollHeight);
});

test('renders value streams in both directions and preserves the collapse anchor', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Ansichtstiefe' }).selectOption('level-2');
  const strategy = page.getByRole('article', { name: 'Strategy', exact: true });
  const horizontalStream = page.locator('[data-id="strategy-step-1"] article');
  await expect(horizontalStream).toHaveClass(/shape-chevron direction-vertical chevron-continues/);
  const verticalChevronStyle = await horizontalStream.locator('.capability-node__surface').evaluate(
    (surface) => ({
      outlineColor: getComputedStyle(surface).backgroundColor,
      fillColor: getComputedStyle(surface, '::before').backgroundColor,
      clipPath: getComputedStyle(surface).clipPath,
    }),
  );
  expect(verticalChevronStyle.outlineColor).not.toBe(verticalChevronStyle.fillColor);
  expect(verticalChevronStyle.clipPath).not.toBe('none');

  await page.getByRole('combobox', { name: 'Ansichtstiefe' }).selectOption('all');
  const verticalStream = page.locator('[data-id="enterprise-portfolio-step-1"] article');
  await expect(verticalStream).toHaveClass(/shape-box direction-horizontal/);
  await expect(verticalStream).not.toHaveClass(/shape-chevron/);

  await page.getByRole('combobox', { name: 'Ansichtstiefe' }).selectOption('level-2');
  await page.getByRole('button', { name: 'Fit View' }).click();
  await page.getByRole('button', { name: 'Zoom In' }).click();
  await page.getByRole('button', { name: 'Zoom In' }).click();
  const centerBefore = await strategy.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  await page
    .getByRole('button', { name: 'Strategy einklappen', exact: true })
    .evaluate((element) => (element as HTMLButtonElement).click());
  await expect(page.getByRole('combobox', { name: 'Ansichtstiefe' })).toHaveValue('custom');
  await page.waitForTimeout(50);
  const centerAfter = await strategy.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  expect(Math.abs(centerAfter.x - centerBefore.x)).toBeLessThan(3);
  expect(Math.abs(centerAfter.y - centerBefore.y)).toBeLessThan(3);
});

test('tiles an all-collapsed horizontal group track with vertical labels', async ({ page }) => {
  await page
    .getByRole('button', { name: 'Enterprise Direction einklappen', exact: true })
    .evaluate((element) => (element as HTMLButtonElement).click());
  await page
    .getByRole('button', { name: 'Portfolio & Investment einklappen', exact: true })
    .evaluate((element) => (element as HTMLButtonElement).click());

  const first = page.locator('[data-id="enterprise-direction-group"] section');
  const second = page.locator('[data-id="portfolio-investment-group"] section');
  const comparison = page.locator('[data-id="governance-performance-group"] section');
  await expect(first).toHaveClass(/collapsed-track-fill/);
  await expect(second).toHaveClass(/collapsed-track-fill/);

  const metrics = await page.locator('.map-canvas').evaluate((canvas) => {
    const node = (id: string) =>
      canvas.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`);
    const firstNode = node('enterprise-direction-group');
    const secondNode = node('portfolio-investment-group');
    const comparisonNode = node('governance-performance-group');
    const firstLabel = firstNode?.querySelector('strong');
    const secondLabel = secondNode?.querySelector('strong');
    return {
      firstHeight: Number.parseFloat(firstNode?.style.height ?? '0'),
      secondHeight: Number.parseFloat(secondNode?.style.height ?? '0'),
      comparisonHeight: Number.parseFloat(comparisonNode?.style.height ?? '0'),
      firstWritingMode: firstLabel ? getComputedStyle(firstLabel).writingMode : '',
      secondWritingMode: secondLabel ? getComputedStyle(secondLabel).writingMode : '',
    };
  });

  expect(metrics.firstHeight + metrics.secondHeight + 12).toBeCloseTo(
    metrics.comparisonHeight,
  );
  expect(metrics.firstWritingMode).toBe('vertical-rl');
  expect(metrics.secondWritingMode).toBe('vertical-rl');
  await expect(comparison).not.toHaveClass(/collapsed/);
});

test('focuses by double click and restores the previous viewport', async ({ page }) => {
  const viewport = page.locator('.react-flow__viewport');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Zoom In' }).click();
  const viewportBefore = await viewport.getAttribute('style');

  await page.getByRole('article', { name: 'Strategy', exact: true }).dblclick();
  await expect(page.getByLabel('Details zu Strategy')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Customer', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enterprise Capability Map', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Customer', exact: true })).toBeVisible();
  await expect.poll(() => viewport.getAttribute('style')).toBe(viewportBefore);
});

test('keeps the last valid preview when YAML becomes invalid', async ({ page }) => {
  await page.locator('.cm-content').fill('version: [broken');

  await expect(page.getByText('Vorschau nicht aktuell')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Enterprise Capability Map' })).toBeVisible();
  await expect(page.getByText('Problem')).toBeVisible();
});

test('switches between map and editor at tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await page.reload();

  await expect(page.getByRole('region', { name: 'Capability Map' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'YAML-Editor' })).toBeHidden();

  await page.getByRole('button', { name: 'YAML', exact: true }).click();
  await expect(page.getByRole('region', { name: 'YAML-Editor' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Capability Map' })).toBeHidden();
});
