# Capability Map Studio

Eine statisch deploybare React-/TypeScript-Anwendung, die hierarchische Capability Maps aus YAML live validiert und rendert.

Top-Level-Capabilities können optional in visuellen Gruppen mit eigener Hintergrundfarbe und horizontaler oder vertikaler Beschriftung organisiert werden. Gruppen lassen sich einklappen und bleiben dabei als schmale strukturelle Platzhalter sichtbar.

## Entwicklung

Voraussetzung ist eine aktuelle Node.js-Version.

```bash
npm install
npm run dev
```

Der Development-Server unterstützt Hot Reloading. Die Anwendung startet mit einem kommentierten Beispieldokument und speichert YAML sowie Collapse-Zustand getrennt im lokalen Browser-Speicher.

## Qualitätsprüfungen

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Optionale browserübergreifende End-to-End-Tests:

```bash
npx playwright install
npm run test:e2e
```

## Architektur

- React und Vite für Anwendung und Entwicklungsworkflow
- React Flow für verschachtelte Kacheln sowie Zoom und Pan
- CodeMirror 6 als YAML-Editor
- `yaml` und Zod für Parsing, Quelldiagnostik und Schema-Validierung
- pure TypeScript-Module für Sichtbarkeit, Vererbung und Layout
- Vitest, Testing Library und Playwright für automatisierte Tests

Die vollständige fachliche und technische Beschreibung steht in [`spec.md`](./spec.md).
