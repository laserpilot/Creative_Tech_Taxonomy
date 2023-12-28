import { defineConfig } from 'vite';
import autoprefixer from "autoprefixer";

export default defineConfig({
  base: '/<REPO>/',
  root: './src',
  publicDir: '../public',
  plugins: [],
  build: {
      outDir: '../dist',
      emptyOutDir: true,
      css: {
        devSourcemap: true,
        postcss: {
          plugins: [autoprefixer()],
        },
      },
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true
  },
});