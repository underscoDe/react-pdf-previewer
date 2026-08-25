import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // react-pdf pulls in pdfjs-dist, which needs canvas APIs jsdom does not
    // provide. The stub keeps the module boundary real while letting tests
    // decide what the document looks like.
    alias: { 'react-pdf': resolve(__dirname, 'test/react-pdf-stub.tsx') },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/index.ts'],
    },
  },
})
