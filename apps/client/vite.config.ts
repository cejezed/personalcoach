import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src')
    }
  },
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
