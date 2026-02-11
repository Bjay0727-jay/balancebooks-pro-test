import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify('2.0.3'),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
