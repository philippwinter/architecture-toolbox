import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

function standaloneBundle(): Plugin {
  return {
    name: 'capability-map-standalone-bundle',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlEntry = Object.entries(bundle).find(
        ([, output]) => output.type === 'asset' && output.fileName === 'index.html',
      );
      if (!htmlEntry || htmlEntry[1].type !== 'asset') {
        this.error('Der Standalone-Build enthält keine index.html.');
        return;
      }

      const [htmlKey, htmlAsset] = htmlEntry;
      let html =
        typeof htmlAsset.source === 'string'
          ? htmlAsset.source
          : Buffer.from(htmlAsset.source).toString('utf8');

      for (const [key, output] of Object.entries(bundle)) {
        if (key === htmlKey) continue;
        const escapedFileName = output.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        if (output.type === 'chunk') {
          const scriptPattern = new RegExp(
            `<script\\b[^>]*\\bsrc=(['"])[^'"]*${escapedFileName}\\1[^>]*>\\s*</script>`,
          );
          const resolvedCode = output.code.replace(/\b__VITE_PRELOAD__\b/g, '[]');
          const unresolvedPlaceholder = resolvedCode.match(/\b__VITE_[A-Z0-9_]+__\b/);
          if (unresolvedPlaceholder) {
            this.error(
              `Nicht aufgelöster Vite-Platzhalter ${unresolvedPlaceholder[0]} im Standalone-Bundle.`,
            );
            return;
          }
          const inlineCode = resolvedCode.replace(/<\/script/gi, '<\\/script');
          const updatedHtml = html.replace(
            scriptPattern,
            () => `<script type="module">${inlineCode}</script>`,
          );
          if (updatedHtml === html) {
            this.error(`JavaScript-Bundle ${output.fileName} konnte nicht eingebettet werden.`);
            return;
          }
          html = updatedHtml;
          delete bundle[key];
          continue;
        }

        if (output.fileName.endsWith('.css')) {
          const stylePattern = new RegExp(
            `<link\\b[^>]*\\bhref=(['"])[^'"]*${escapedFileName}\\1[^>]*>`,
          );
          const css =
            typeof output.source === 'string'
              ? output.source
              : Buffer.from(output.source).toString('utf8');
          const updatedHtml = html.replace(stylePattern, () => `<style>${css}</style>`);
          if (updatedHtml === html) {
            this.error(`Stylesheet ${output.fileName} konnte nicht eingebettet werden.`);
            return;
          }
          html = updatedHtml;
          delete bundle[key];
          continue;
        }

        this.error(`Asset ${output.fileName} wurde im Standalone-Build nicht eingebettet.`);
        return;
      }

      htmlAsset.source = html;
    },
  };
}

export default defineConfig(({ mode }) => {
  const standalone = mode === 'standalone';

  return {
    base: standalone ? './' : '/',
    plugins: [react(), ...(standalone ? [standaloneBundle()] : [])],
    build: standalone
      ? {
          outDir: 'dist-standalone',
          assetsInlineLimit: () => true,
          cssCodeSplit: false,
          modulePreload: false,
          rollupOptions: {
            output: { codeSplitting: false },
          },
        }
      : undefined,
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      exclude: ['e2e/**', 'node_modules/**'],
      environmentOptions: {
        jsdom: { url: 'http://localhost/' },
      },
      css: true,
    },
  };
});
