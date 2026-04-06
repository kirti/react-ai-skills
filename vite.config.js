import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,             // ✅ provide 'expect', 'describe', 'it'
    environment: 'jsdom',      // ✅ simulate browser environment
    setupFiles: './vitest.setup.js',
  },
});