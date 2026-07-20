import { expect, test, type Download, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function downloadPptx(page: Page, label: string): Promise<Download> {
  await page.getByLabel('Exportieren', { exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: `Als ${label} exportieren` }).click();
  return downloadPromise;
}

async function slideCount(download: Download): Promise<number> {
  const pptx = await readFile(await download.path());
  const { default: JSZip } = await import('jszip');
  const archive = await JSZip.loadAsync(pptx);
  return Object.keys(archive.files).filter(
    (path) => /^ppt\/slides\/slide\d+\.xml$/.test(path),
  ).length;
}

test('exports the current view and complete deck from the standalone file', async ({ page }) => {
  test.setTimeout(240_000);
  const standaloneUrl = pathToFileURL(resolve('dist-standalone/index.html')).href;
  await page.goto(standaloneUrl);
  await expect(page.getByText('Dokument ist gültig')).toBeVisible();

  const current = await downloadPptx(page, 'PPTX – aktuelle Darstellung');
  expect(current.suggestedFilename()).toMatch(
    /^enterprise-capabilities-level-1-\d{8}-\d{6}\.pptx$/,
  );
  expect(await slideCount(current)).toBe(1);

  const full = await downloadPptx(page, 'PPTX – vollständige Map');
  expect(full.suggestedFilename()).toMatch(
    /^enterprise-capabilities-vollstaendig-\d{8}-\d{6}\.pptx$/,
  );
  expect(await slideCount(full)).toBe(95);
  await expect(page.getByText('PPTX – vollständige Map erstellt')).toBeVisible();
});
