# Capability Map Studio

Eine statisch deploybare React-/TypeScript-Anwendung, die hierarchische Capability Maps aus YAML live validiert und rendert.

Top-Level-Capabilities können optional in visuellen Gruppen mit eigener Hintergrundfarbe und horizontaler oder vertikaler Beschriftung organisiert werden. Gruppen lassen sich einklappen und bleiben dabei als schmale strukturelle Platzhalter sichtbar.

## Entwicklung

Voraussetzung sind Node.js 24 und npm 11.16.0. Abhängigkeiten werden aus dem
gemeinsamen Lockfile im Repository-Root installiert.

```bash
npm ci
npm run dev
```

Die Befehle werden im Root-Verzeichnis der Architecture Toolbox ausgeführt.

Der Development-Server unterstützt Hot Reloading. Die Anwendung startet mit einem kommentierten Beispieldokument und speichert YAML sowie Collapse-Zustand getrennt im lokalen Browser-Speicher.

## Standalone-Build ohne Webserver

```bash
npm run build:standalone
```

Der Befehl erzeugt `tools/capability-map-studio/dist-standalone/index.html`.
JavaScript, CSS und weitere Assets sind vollständig in diese eine Datei eingebettet.
Sie kann direkt über den Dateimanager oder eine `file://`-Adresse in einem
unterstützten Browser geöffnet und ohne Webserver verwendet werden.

## Qualitätsprüfungen

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run build:standalone
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
