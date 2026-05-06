import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// GitHub Pages 프로젝트 페이지 (https://useruseruse.github.io/sphere/) 용 base
const isGhPages = process.env.DEPLOY_TARGET === 'gh-pages';

export default defineConfig({
  base: isGhPages ? '/sphere/' : '/',
  publicDir: 'public',
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      // 멀티 페이지 — Pro / Simple / React-demo
      input: {
        main:   resolve(__dirname, 'index.html'),
        simple: resolve(__dirname, 'simple.html'),
        react:  resolve(__dirname, 'react-demo.html'),
      },
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
