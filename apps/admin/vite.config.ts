import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@paygate/domain': path.resolve(__dirname, '../../packages/domain/src/index.ts'),
      '@paygate/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@paygate/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@paygate/i18n': path.resolve(__dirname, '../../packages/i18n/src/index.ts'),
    },
  },
  publicDir: '../../public',
  base: '/admin/',
  build: {
    outDir: '../../dist/admin',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
