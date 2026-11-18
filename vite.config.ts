import legacy from '@vitejs/plugin-legacy';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vitest/config';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), legacy()],
  optimizeDeps: {
    // O jeep-sqlite (SQLite no navegador) é carregado sob demanda; declarar aqui evita que o Vite
    // reprocesse as dependências no meio da execução e quebre a primeira abertura do banco.
    include: ['@capacitor/core', '@capacitor-community/sqlite', 'jeep-sqlite/loader'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Playwright e2e specs live in tests/e2e.
    include: ['tests/unit/**/*.spec.{js,ts}'],
  },
});
