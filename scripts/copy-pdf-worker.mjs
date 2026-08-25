import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

// Resolves the worker through react-pdf rather than from the top of
// node_modules: react-pdf pins pdfjs-dist exactly and does not expose it, so
// under pnpm (or any strict layout) it is not hoisted — and resolving it this
// way also guarantees the worker matches the pdfjs build react-pdf will use.
const require = createRequire(import.meta.url)
const reactPdfDir = dirname(require.resolve('react-pdf'))
const worker = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs', { paths: [reactPdfDir] })
const { version } = require(require.resolve('pdfjs-dist/package.json', { paths: [reactPdfDir] }))

const target = resolve(process.argv[2] ?? 'example/public')
mkdirSync(target, { recursive: true })
copyFileSync(worker, join(target, 'pdf.worker.min.mjs'))

console.log(`pdf.worker.min.mjs (pdfjs-dist@${version}) -> ${target}`)
