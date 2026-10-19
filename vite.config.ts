import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { ViteMinifyRawHtml } from './plugins/vite-plugin-minify-raw-html';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        about: resolve(root, 'about.html'),
      },
    },
  },
  plugins: [
    ViteMinifyPlugin(),
    ViteMinifyRawHtml(),
  ],
});
