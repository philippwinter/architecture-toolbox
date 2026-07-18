import { expect, test, type Download, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function downloadExport(page: Page, format: 'PDF' | 'PNG' | 'PPTX' | 'SVG'): Promise<Download> {
  await page.getByLabel('Exportieren', { exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: `Als ${format} exportieren` }).click();
  return downloadPromise;
}

function nativeShapeByName(slideXml: string, objectName: string): string {
  const shape = (slideXml.match(/<p:sp>[\s\S]*?<\/p:sp>/g) ?? [])
    .find((candidate) => candidate.includes(`name="${objectName}"`));
  if (!shape) throw new Error(`PowerPoint-Form fehlt: ${objectName}`);
  return shape;
}

function roundedShapeGeometry(shapeXml: string): { adjustment: number; radiusEmu: number } {
  const extent = shapeXml.match(/<a:ext cx="(\d+)" cy="(\d+)"/);
  const adjustment = shapeXml.match(/<a:gd name="adj" fmla="val (\d+)"/);
  if (!extent || !adjustment) throw new Error('Explizite Rundungsgeometrie fehlt');
  const shortSide = Math.min(Number(extent[1]), Number(extent[2]));
  return {
    adjustment: Number(adjustment[1]),
    radiusEmu: Number(adjustment[1]) * shortSide / 100_000,
  };
}

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

test('downloads the current capability map as a self-contained SVG', async ({ page }) => {
  const download = await downloadExport(page, 'SVG');
  const downloadPath = await download.path();
  const svg = await readFile(downloadPath, 'utf8');

  expect(download.suggestedFilename()).toMatch(
    /^enterprise-capabilities-level-1-\d{8}-\d{6}\.svg$/,
  );
  expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
  expect(svg).toContain('Enterprise Capability Map');
  expect(svg).toContain('data-id="corporate-development"');
  expect(svg).not.toContain('<foreignObject');
  expect(svg).not.toMatch(/(?:href|src)=["'](?:https?:|\/\/)/);
  await expect(page.getByText('SVG erstellt')).toBeVisible();
});

test('keeps SVG capability icons and text vertically centered across renderers', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Ansichtstiefe' }).selectOption('level-2');
  const download = await downloadExport(page, 'SVG');
  const svg = await readFile(await download.path(), 'utf8');
  await page.setContent(svg);

  const alignment = await page.locator('[data-id="strategy"]').evaluate((capability) => {
    const surface = capability.querySelector(':scope > rect');
    const icon = capability.querySelector(':scope > g[transform]');
    const text = capability.querySelector(':scope > text');
    if (!surface || !icon || !text) throw new Error('SVG capability presentation is incomplete');
    const surfaceRect = surface.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    const headerCenter = surfaceRect.top + 47 / 2;
    return {
      iconDelta: iconRect.top + iconRect.height / 2 - headerCenter,
      textDelta: textRect.top + textRect.height / 2 - headerCenter,
      pairDelta:
        textRect.top + textRect.height / 2 - (iconRect.top + iconRect.height / 2),
    };
  });

  expect(Math.abs(alignment.iconDelta)).toBeLessThan(1);
  expect(Math.abs(alignment.textDelta)).toBeLessThan(1);
  expect(Math.abs(alignment.pairDelta)).toBeLessThan(1);
});

test('rasterizes the canonical SVG into a non-empty white-background PNG at 2x', async ({ page }) => {
  const pngDownload = await downloadExport(page, 'PNG');
  const png = await readFile(await pngDownload.path());
  const svgDownload = await downloadExport(page, 'SVG');
  const svg = await readFile(await svgDownload.path(), 'utf8');
  const viewBox = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!viewBox) throw new Error('SVG viewBox fehlt');

  expect(pngDownload.suggestedFilename()).toMatch(
    /^enterprise-capabilities-level-1-\d{8}-\d{6}\.png$/,
  );
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(png.readUInt32BE(16)).toBe(Math.round(Number(viewBox[1]) * 2));
  expect(png.readUInt32BE(20)).toBe(Math.round(Number(viewBox[2]) * 2));

  const pixels = await page.evaluate(async (dataUrl) => {
    const image = new Image();
    image.src = dataUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas fehlt');
    context.drawImage(image, 0, 0);
    const corner = [...context.getImageData(0, 0, 1, 1).data];
    let nonWhite = 0;
    for (let y = 0; y < image.height; y += Math.max(1, Math.floor(image.height / 20))) {
      for (let x = 0; x < image.width; x += Math.max(1, Math.floor(image.width / 20))) {
        const [red = 255, green = 255, blue = 255, alpha = 0] = context.getImageData(x, y, 1, 1).data;
        if (alpha > 0 && (red < 250 || green < 250 || blue < 250)) nonWhite += 1;
      }
    }
    return { corner, nonWhite };
  }, `data:image/png;base64,${png.toString('base64')}`);

  expect(pixels.corner).toEqual([255, 255, 255, 255]);
  expect(pixels.nonWhite).toBeGreaterThan(0);
  await expect(page.getByText('SVG erstellt')).toBeVisible();
});

test('exports a single-page vector PDF in A3 landscape with metadata and text', async ({ page }) => {
  const download = await downloadExport(page, 'PDF');
  const pdf = await readFile(await download.path());
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await getDocument({ data: new Uint8Array(pdf) }).promise;
  const firstPage = await document.getPage(1);
  const viewport = firstPage.getViewport({ scale: 1 });
  const text = await firstPage.getTextContent();
  const operators = await firstPage.getOperatorList();
  const metadata = await document.getMetadata();
  const documentInfo = metadata.info as Record<string, unknown>;
  const extractedText = text.items.flatMap((item) => ('str' in item ? [item.str] : [])).join(' ');

  expect(download.suggestedFilename()).toMatch(
    /^enterprise-capabilities-level-1-\d{8}-\d{6}\.pdf$/,
  );
  expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(document.numPages).toBe(1);
  expect(viewport.width).toBeCloseTo(1190.55, 0);
  expect(viewport.height).toBeCloseTo(841.89, 0);
  expect(extractedText).toContain('Enterprise Capability Map');
  expect(documentInfo['Title']).toBe('Enterprise Capability Map');
  expect(documentInfo['Creator']).toBe('Capability Map Studio');
  expect(operators.fnArray.filter((operator) => operator === OPS.constructPath).length).toBeGreaterThan(100);
  expect(operators.fnArray).not.toContain(OPS.paintImageXObject);
  await expect(page.getByText('PDF erstellt')).toBeVisible();
});

test('exports one editable 16:9 PowerPoint slide with native shapes and text', async ({ page }) => {
  test.setTimeout(120_000);
  await page.getByRole('combobox', { name: 'Ansichtstiefe' }).selectOption('level-2');
  const download = await downloadExport(page, 'PPTX');
  const pptx = await readFile(await download.path());
  const { default: JSZip } = await import('jszip');
  const archive = await JSZip.loadAsync(pptx);
  const presentation = await archive.file('ppt/presentation.xml')?.async('text');
  const slide = await archive.file('ppt/slides/slide1.xml')?.async('text');
  const media = Object.keys(archive.files).filter((path) => path.startsWith('ppt/media/'));

  expect(download.suggestedFilename()).toMatch(
    /^enterprise-capabilities-level-2-\d{8}-\d{6}\.pptx$/,
  );
  expect(pptx.subarray(0, 2).toString('ascii')).toBe('PK');
  expect(Object.keys(archive.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))).toHaveLength(1);
  expect(presentation).toContain('cx="12191695" cy="6858000"');
  expect(slide).toContain('Enterprise Capability Map');
  expect(slide).toContain('Strategy');
  expect(slide?.match(/<p:sp>/g)?.length ?? 0).toBeGreaterThan(100);
  expect(slide?.match(/prst="roundRect"/g)?.length ?? 0).toBeGreaterThan(20);
  expect(slide).toContain('prst="chevron"');
  expect(slide).toContain('strategy capability name');
  expect(media.some((path) => path.endsWith('.svg'))).toBe(true);

  if (!slide) throw new Error('PowerPoint-Folie fehlt');
  const rootGroup = roundedShapeGeometry(
    nativeShapeByName(slide, 'strategy-governance-group group surface'),
  );
  const nestedGroup = roundedShapeGeometry(
    nativeShapeByName(slide, 'enterprise-direction-group group surface'),
  );
  const capability = roundedShapeGeometry(
    nativeShapeByName(slide, 'strategy capability surface'),
  );
  const legendGroup = roundedShapeGeometry(nativeShapeByName(slide, 'Legend group'));

  expect(rootGroup.adjustment).not.toBe(nestedGroup.adjustment);
  expect(rootGroup.radiusEmu).toBeCloseTo(nestedGroup.radiusEmu, -1);
  expect(capability.radiusEmu / rootGroup.radiusEmu).toBeCloseTo(0.9, 2);
  expect(legendGroup.radiusEmu / rootGroup.radiusEmu).toBeCloseTo(0.3, 2);
  await expect(page.getByText('PPTX erstellt')).toBeVisible();
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
