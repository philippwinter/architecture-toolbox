import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders, searches, collapses and focuses the example map', async ({ page }) => {
  await expect(page.getByText('Dokument ist gültig')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Technology', exact: true })).toBeVisible();
  await expect(page.getByLabel('Gruppe Management Capabilities')).toBeVisible();
  await expect(page.getByLabel('Gruppe Enabling Capabilities')).toBeVisible();
  await expect(page.getByLabel('Gruppe Management Capabilities').locator('svg')).toHaveCount(0);

  const customerCard = page.getByRole('article', { name: 'Customer', exact: true });
  const customerHeaderBottom = await customerCard.evaluate(
    (element) => element.querySelector('header')?.getBoundingClientRect().bottom ?? 0,
  );
  const firstCustomerChildTop = await page
    .getByRole('article', { name: 'Customer Insights', exact: true })
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(firstCustomerChildTop - customerHeaderBottom).toBeGreaterThan(2);

  const enablerGroup = page.getByLabel('Gruppe Enabling Capabilities');
  const enablerHeaderBottom = await enablerGroup.evaluate(
    (element) =>
      element.querySelector('.capability-group__label')?.getBoundingClientRect().bottom ?? 0,
  );
  const firstEnablerTop = await page
    .getByRole('article', { name: 'Technology', exact: true })
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(firstEnablerTop - enablerHeaderBottom).toBeGreaterThan(2);

  const verticalChild = page.getByRole('article', { name: 'Supply Chain', exact: true });
  const verticalHeaderMetrics = await verticalChild.evaluate((element) => {
    const card = element.getBoundingClientRect();
    const header = element.querySelector('header')?.getBoundingClientRect();
    return {
      cardHeight: card.height,
      headerHeight: header?.height ?? card.height,
      headerOffset: (header?.top ?? card.top) - card.top,
    };
  });
  expect(verticalHeaderMetrics.headerOffset).toBeLessThan(2);
  expect(verticalHeaderMetrics.headerHeight).toBeLessThan(verticalHeaderMetrics.cardHeight / 2);

  await page.getByRole('button', { name: 'Management Capabilities einklappen' }).click();
  await expect(page.getByRole('article', { name: 'Strategy', exact: true })).toHaveCount(0);
  const collapsedHorizontalGroup = page.getByLabel('Gruppe Management Capabilities');
  await expect(collapsedHorizontalGroup.locator('strong')).toHaveCount(0);
  const collapsedHorizontalMetrics = await collapsedHorizontalGroup.evaluate((element) => ({
    height: element.getBoundingClientRect().height,
  }));
  expect(collapsedHorizontalMetrics.height).toBeLessThan(30);
  await page.getByRole('button', { name: 'Management Capabilities ausklappen' }).click();
  await expect(page.getByRole('article', { name: 'Strategy', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Enabling Capabilities einklappen' }).click();
  await expect(page.getByRole('article', { name: 'Technology', exact: true })).toHaveCount(0);
  const collapsedVerticalGroup = page.getByLabel('Gruppe Enabling Capabilities');
  await expect(collapsedVerticalGroup.locator('strong')).toHaveCount(0);
  const collapsedVerticalMetrics = await collapsedVerticalGroup.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
  }));
  expect(collapsedVerticalMetrics.width).toBeLessThan(30);
  await page.getByRole('button', { name: 'Enabling Capabilities ausklappen' }).click();
  await expect(page.getByRole('article', { name: 'Technology', exact: true })).toBeVisible();

  await page.getByRole('searchbox').fill('Technology');
  await expect(page.getByRole('article', { name: 'Technology', exact: true })).toHaveClass(
    /search-match/,
  );
  await page.getByRole('button', { name: 'Suche löschen' }).click();

  await page.getByRole('button', { name: 'Operations einklappen' }).click();
  await expect(page.getByRole('article', { name: 'Production', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Operations ausklappen' }).click();
  await expect(page.getByRole('article', { name: 'Production', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Operations fokussieren' }).click();
  await expect(page.getByRole('article', { name: 'Strategy', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Details zu Operations')).toBeVisible();
});

test('keeps the last valid preview when YAML becomes invalid', async ({ page }) => {
  const editor = page.locator('.cm-content');
  await editor.fill('version: [broken');

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
