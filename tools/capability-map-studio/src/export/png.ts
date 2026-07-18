import type { BuildExportSceneOptions } from './scene';
import { createSvgExport } from './exportSvg';
import { svgBlob } from './download';

export const PNG_SCALE = 2;

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(svgBlob(svg));
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Das SVG konnte nicht für den PNG-Export geladen werden.'));
    };
    image.src = url;
  });
}

function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Der Browser konnte keine PNG-Datei erzeugen.'));
    }, 'image/png');
  });
}

export async function createPngExport(options: BuildExportSceneOptions): Promise<{
  blob: Blob;
  filename: string;
  height: number;
  width: number;
}> {
  const { filename: svgFilename, scene, svg } = createSvgExport(options);
  const width = Math.round(scene.width * PNG_SCALE);
  const height = Math.round(scene.height * PNG_SCALE);
  if (width <= 0 || height <= 0) throw new Error('Die Exportfläche ist leer.');

  const image = await loadSvgImage(svg);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Der Browser unterstützt keine Canvas-Rasterisierung.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return {
    blob: await canvasPng(canvas),
    filename: svgFilename.replace(/\.svg$/i, '.png'),
    height,
    width,
  };
}
