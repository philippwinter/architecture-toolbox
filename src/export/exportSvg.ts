import type { BuildExportSceneOptions } from './scene';
import { buildExportScene } from './scene';
import { renderSvg } from './svg';

function fileSafe(value: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return normalized || 'capability-map';
}

function localTimestamp(date: Date): string {
  const part = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}-${part(date.getHours())}${part(date.getMinutes())}${part(date.getSeconds())}`;
}

export function createSvgExport(options: BuildExportSceneOptions): {
  filename: string;
  scene: ReturnType<typeof buildExportScene>;
  svg: string;
} {
  const createdAt = options.createdAt ?? new Date();
  const scene = buildExportScene({ ...options, createdAt });
  return {
    filename: `${fileSafe(scene.mapId)}-${fileSafe(scene.profile)}-${localTimestamp(createdAt)}.svg`,
    scene,
    svg: renderSvg(scene),
  };
}

export function downloadSvg(filename: string, svg: string): void {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
