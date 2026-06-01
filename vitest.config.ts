import { defineConfig } from 'vitest/config'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Load .env.test without requiring dotenv as a dependency
const envPath = resolve(__dirname, '.env.test')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  }
  // Windows: Node.js doesn't use the system cert store by default.
  // Safe to disable here — test-only process, .env.test is gitignored.
  if (!process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }
}

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 20000,
  },
})
