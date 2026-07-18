import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'tools/capability-map-studio/dist-standalone');
const entries = await readdir(output, { recursive: true });

if (entries.length !== 1 || entries[0] !== 'index.html') {
  throw new Error(`Standalone-Ausgabe muss ausschließlich index.html enthalten: ${entries.join(', ')}`);
}

const html = await readFile(resolve(output, 'index.html'), 'utf8');
const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
const styles = html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? [];

if (scripts.length !== 1 || styles.length !== 1) {
  throw new Error(`Erwartet wurden ein Inline-Script und ein Inline-Style, gefunden: ${scripts.length}/${styles.length}.`);
}
if (/<script\b[^>]*\bsrc=/i.test(html) || /<link\b[^>]*rel=["']stylesheet["']/i.test(html)) {
  throw new Error('Standalone-Ausgabe enthält externe JavaScript- oder CSS-Ressourcen.');
}
if (/\b__VITE_[A-Z0-9_]+__\b/.test(html)) {
  throw new Error('Standalone-Ausgabe enthält einen nicht aufgelösten Vite-Platzhalter.');
}

console.log('Standalone-Artefakt erfolgreich strukturell geprüft.');
