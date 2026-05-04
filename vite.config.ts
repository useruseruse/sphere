import { defineConfig } from 'vite';
import { resolve } from 'path';

// GitHub Pages 프로젝트 페이지 (https://useruseruse.github.io/sphere/) 용 base
const isGhPages = process.env.DEPLOY_TARGET === 'gh-pages';

export default defineConfig({
  base: isGhPages ? '/sphere/' : '/',
  publicDir: 'public',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      // 멀티 페이지 — Pro (전체 기능) + Simple (입문자용)
      input: {
        main:   resolve(__dirname, 'index.html'),
        simple: resolve(__dirname, 'simple.html'),
      },
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
