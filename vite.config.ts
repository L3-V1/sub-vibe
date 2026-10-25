import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  // Publicado em https://l3-v1.github.io/sub-vibe/; o dev continua em /.
  base: command === 'serve' && !isPreview ? '/' : '/sub-vibe/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      include: ['src/domain/**', 'src/db/**'],
    },
  },
}))
