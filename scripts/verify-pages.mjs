import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist-pages');
const expected = [
  'index.html',
  'styles.css',
  '.nojekyll',
  'capability-map-studio/index.html',
];

await Promise.all(expected.map((entry) => access(resolve(output, entry))));

const landing = await readFile(resolve(output, 'index.html'), 'utf8');
const app = await readFile(resolve(output, 'capability-map-studio/index.html'), 'utf8');

if (landing.includes('{{VERSION}}') || !landing.includes('./capability-map-studio/')) {
  throw new Error('Landingpage enthält einen ungelösten Platzhalter oder keinen Tool-Link.');
}
if (!app.includes('/architecture-toolbox/capability-map-studio/')) {
  throw new Error('Capability Map Studio wurde nicht mit dem erwarteten Pages-Basispfad gebaut.');
}
if (/\b(?:src|href)=["']\/assets\//.test(app)) {
  throw new Error('Capability Map Studio enthält einen Root-Asset-Pfad, der auf Project Pages fehlschlägt.');
}

console.log('GitHub-Pages-Artefakt erfolgreich strukturell geprüft.');
