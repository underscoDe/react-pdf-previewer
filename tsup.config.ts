import { copyFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  outExtension: ({ format }) => ({ js: format === 'esm' ? '.js' : '.cjs' }),
  dts: true,
  clean: true,
  sourcemap: true,
  // Off because tsup treeshakes through Rollup, which strips the banner below.
  treeshake: false,
  // The whole bundle touches the DOM, so it cannot be imported from an RSC.
  banner: { js: '"use client";' },
  external: ['react', 'react-dom', 'react-pdf', 'pdfjs-dist'],
  onSuccess: async () => {
    copyFileSync('src/styles.css', 'dist/styles.css')
  },
})
