import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Entorno: Node (tests puros, sin DOM)
    environment: 'node',
    // Glob para encontrar archivos de test
    include: ['src/**/*.test.{js,jsx}'],
    // Sin globals para mantener imports explícitos
    globals: false,
  },
});
