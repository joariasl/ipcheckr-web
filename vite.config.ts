import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { ViteMinifyRawHtml } from './plugins/vite-plugin-minify-raw-html';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    build: {
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          about: resolve(root, 'about.html'),
        },
      },
    },
    esbuild: {
      pure: isDevelopment ? [] : ['console.log', 'console.info'],
      drop: isDevelopment ? [] : ['debugger'],
    },
    plugins: [
      ViteMinifyPlugin(),
      ViteMinifyRawHtml(),
    ],
  }
});
