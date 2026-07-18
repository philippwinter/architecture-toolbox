# Architecture Toolbox

[![CI](https://github.com/philippwinter/architecture-toolbox/actions/workflows/ci.yml/badge.svg)](https://github.com/philippwinter/architecture-toolbox/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/philippwinter/architecture-toolbox/actions/workflows/ci.yml/badge.svg?event=push)](https://philippwinter.github.io/architecture-toolbox/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A growing collection of browser-based tools for enterprise and business architecture.
Every tool is designed to run locally in the browser and to keep user data on the device.

## Available tools

### Capability Map Studio

Create interactive capability maps from validated YAML, explore nested structures and
export the current view to SVG, PNG, PDF or PowerPoint.

- [Open Capability Map Studio](https://philippwinter.github.io/architecture-toolbox/capability-map-studio/)
- [Tool documentation](./tools/capability-map-studio/README.md)
- [Specification](./tools/capability-map-studio/spec.md)

## Development

The repository uses npm workspaces. Node.js 24 and npm 11.16.0 are required.

```bash
npm ci
npm run dev
```

Quality and build commands run from the repository root:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run build:standalone
npm run verify:standalone
npm run build:pages
npm run verify:pages
```

Browser tests require the corresponding Playwright browsers:

```bash
npx playwright install
npm run test:e2e
```

## Builds and releases

Each successful CI run provides temporary web and standalone artifacts. Versioned
downloads are published through [GitHub Releases](https://github.com/philippwinter/architecture-toolbox/releases).

## License

This project is licensed under the [MIT License](./LICENSE).
