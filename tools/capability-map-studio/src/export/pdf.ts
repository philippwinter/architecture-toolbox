import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import type { BuildExportSceneOptions } from './scene';
import { createSvgExport } from './exportSvg';

export const PDF_PAGE = {
  widthMm: 420,
  heightMm: 297,
  marginMm: 10,
} as const;

export interface PdfPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export function fitExportOnA3(width: number, height: number): PdfPlacement {
  if (width <= 0 || height <= 0) throw new Error('Die Exportfläche ist leer.');
  const availableWidth = PDF_PAGE.widthMm - PDF_PAGE.marginMm * 2;
  const availableHeight = PDF_PAGE.heightMm - PDF_PAGE.marginMm * 2;
  const scale = Math.min(availableWidth / width, availableHeight / height);
  const placedWidth = width * scale;
  const placedHeight = height * scale;
  return {
    x: (PDF_PAGE.widthMm - placedWidth) / 2,
    y: (PDF_PAGE.heightMm - placedHeight) / 2,
    width: placedWidth,
    height: placedHeight,
    scale,
  };
}

function parseSvg(svg: string): SVGElement {
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
  if (document.querySelector('parsererror') || document.documentElement.tagName !== 'svg') {
    throw new Error('Das kanonische SVG ist nicht gültig.');
  }
  return document.documentElement as unknown as SVGElement;
}

export async function createPdfExport(options: BuildExportSceneOptions): Promise<{
  blob: Blob;
  filename: string;
  placement: PdfPlacement;
}> {
  const createdAt = options.createdAt ?? new Date();
  const { filename: svgFilename, scene, svg } = createSvgExport({ ...options, createdAt });
  const placement = fitExportOnA3(scene.width, scene.height);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
    compress: true,
    putOnlyUsedFonts: true,
  });
  pdf.setProperties({
    title: scene.mapName,
    creator: 'Capability Map Studio',
  });
  pdf.setCreationDate(createdAt);
  await pdf.svg(parseSvg(svg), {
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
    loadExternalStyleSheets: false,
  });

  return {
    blob: pdf.output('blob'),
    filename: svgFilename.replace(/\.svg$/i, '.pdf'),
    placement,
  };
}
