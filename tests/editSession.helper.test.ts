/**
 * Unit tests for editSession.helper — focus on generateShortCode using a CSPRNG.
 *
 * npx vitest run tests/editSession.helper.test.ts
 */
import { describe, it, expect, afterEach } from 'vitest'
import { generateShortCode, isEditSessionUsable } from '../src/helpers/editSession.helper'

describe('generateShortCode', () => {
  const realCrypto = globalThis.crypto
  afterEach(() => {
    // Restore in case a test replaced it
    Object.defineProperty(globalThis, 'crypto', { value: realCrypto, configurable: true })
  })

  it('returns a 6-digit numeric string within 100000–999999', () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateShortCode()
      expect(code).toMatch(/^\d{6}$/)
      const n = Number(code)
      expect(n).toBeGreaterThanOrEqual(100000)
      expect(n).toBeLessThanOrEqual(999999)
    }
  })

  it('produces varied output (not a constant)', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 200; i++) seen.add(generateShortCode())
    // With a real CSPRNG, 200 draws over 900k values should be nearly all unique.
    expect(seen.size).toBeGreaterThan(190)
  })

  it('throws instead of falling back to weak randomness when no secure RNG exists', () => {
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true })
    expect(() => generateShortCode()).toThrow(/secure RNG/)
  })
})

describe('isEditSessionUsable', () => {
  it('is usable only while active and not expired', () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    const past = new Date(Date.now() - 60_000).toISOString()
    expect(isEditSessionUsable('active', future)).toBe(true)
    expect(isEditSessionUsable('active', past)).toBe(false)
    expect(isEditSessionUsable('completed', future)).toBe(false)
    expect(isEditSessionUsable('expired', future)).toBe(false)
  })
})
