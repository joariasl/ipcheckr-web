import { Plugin } from 'vite';
import fsp from 'node:fs/promises';
import { minify } from 'html-minifier-terser';

export function ViteMinifyRawHtml(): Plugin {
  return {
    name: 'vite-plugin-minify-raw-html',
    enforce: 'pre',
    async load(id) {
      if (!id.endsWith('.html?raw') || !id.includes('.html?raw')) return;

      const filePath = id.replace(/\?raw$/, '');

      const rawHtml = await fsp.readFile(filePath, 'utf-8');

      const minifiedHtml = await minify(rawHtml, {
        collapseWhitespace: true,
        removeComments: true,
      });

      return `export default ${JSON.stringify(minifiedHtml)};`;
    }
  };
}
