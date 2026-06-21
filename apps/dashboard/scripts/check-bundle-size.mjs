import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const currentDir = dirname(fileURLToPath(import.meta.url))
const assetsDir = join(currentDir, '..', '.output', 'public', 'assets')

const maxRawBytes = 1.6 * 1024 * 1024
const maxGzipBytes = 450 * 1024

const jsFiles = readdirSync(assetsDir).filter((file) => file.endsWith('.js'))

let rawTotal = 0
let gzipTotal = 0

for (const file of jsFiles) {
  const fullPath = join(assetsDir, file)
  const source = readFileSync(fullPath)

  rawTotal += statSync(fullPath).size
  gzipTotal += gzipSync(source).length
}

const rawKb = (rawTotal / 1024).toFixed(2)
const gzipKb = (gzipTotal / 1024).toFixed(2)

console.log(`Dashboard JS raw: ${rawKb} kB`)
console.log(`Dashboard JS gzip: ${gzipKb} kB`)

if (rawTotal > maxRawBytes) {
  throw new Error(`Dashboard raw JS exceeds limit: ${rawKb} kB`)
}

if (gzipTotal > maxGzipBytes) {
  throw new Error(`Dashboard gzip JS exceeds limit: ${gzipKb} kB`)
}
