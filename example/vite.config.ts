import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // Pinned off Vite's default so the demo never fights the app you are actually
  // building with the package.
  server: { port: 5273 },
  // No alias: `@underscode/react-pdf-previewer` resolves through the workspace link and its
  // exports map, so the example exercises what consumers actually get.
  optimizeDeps: {
    exclude: ['@underscode/react-pdf-previewer'],
  },
})
