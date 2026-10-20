import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./client', import.meta.url)),
  publicDir: false,
  build: { outDir: 'dist', assetsDir: 'ui-assets', emptyOutDir: true },
});
