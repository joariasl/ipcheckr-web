import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { ViteMinifyRawHtml } from './plugins/vite-plugin-minify-raw-html.ts';
import { cloudflare } from "@cloudflare/vite-plugin";

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    minify: 'oxc',
    build: {
      rolldownOptions: {
        input: {
          main: resolve(root, 'index.html'),
          about: resolve(root, 'about.html'),
        },
        output: {
          minify: {
            compress: {
              dropConsole: !isDevelopment,
              dropDebugger: !isDevelopment,
            },
          },
        }
      },
    },
    plugins: [
      ViteMinifyPlugin(),
      ViteMinifyRawHtml(),
      cloudflare({ persistState: false }),
    ],
  }
});
