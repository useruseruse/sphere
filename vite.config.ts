import { defineConfig } from 'vite';

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
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  }
});
