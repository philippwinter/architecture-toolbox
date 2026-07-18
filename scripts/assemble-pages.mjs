import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const siteSource = resolve(root, 'site');
const appSource = resolve(root, 'tools/capability-map-studio/dist');
const output = resolve(root, 'dist-pages');
const appOutput = resolve(output, 'capability-map-studio');
const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

await rm(output, { recursive: true, force: true });
await mkdir(appOutput, { recursive: true });
await cp(siteSource, output, { recursive: true });
await cp(appSource, appOutput, { recursive: true });

const landingPath = resolve(output, 'index.html');
const landing = await readFile(landingPath, 'utf8');
await writeFile(landingPath, landing.replaceAll('{{VERSION}}', packageJson.version));
await writeFile(resolve(output, '.nojekyll'), '');

console.log(`GitHub-Pages-Artefakt erzeugt: ${output}`);
