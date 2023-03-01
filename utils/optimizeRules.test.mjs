import { describe, expect, it } from 'vitest'

import { optimizeRules } from './optimizeRules'

it('should be defined', () => {
  expect(optimizeRules).toBeDefined()
})

describe('optimizeRules', () => {
  it('should return 1 output on 1 input', () => {
    const input = `
    DOMAIN-SUFFIX,1e100.net
    `
    const output = `
    DOMAIN-SUFFIX,1e100.net
    `
    expect(optimizeRules(input)).toBe(output.trim())
  })


  it('should return 1 output on duplicated inputs', () => {
    const input = `
    DOMAIN-SUFFIX,1e100.net
    DOMAIN-SUFFIX,1e100.net
    `
    const output = `
    DOMAIN-SUFFIX,1e100.net
    `
    expect(optimizeRules(input)).toBe(output.trim())
  })

  it('should remove more specific rules when a less specific rule is present', () => {
    const input = `
    DOMAIN-SUFFIX,more-specific.1e100.net
    DOMAIN-SUFFIX,1e100.net
    DOMAIN-SUFFIX,sub.1e100.net
    `
    const output = `
    DOMAIN-SUFFIX,1e100.net
    `
    expect(optimizeRules(input)).toBe(output.trim())
  })

  it('should remove all domains when tld is specified', () => {
    const input = `
    DOMAIN-SUFFIX,a.xyz
    DOMAIN-SUFFIX,xyz
    DOMAIN-SUFFIX,a.b.xyz
    `
    const output = `
    DOMAIN-SUFFIX,xyz
    `
    expect(optimizeRules(input)).toBe(output.trim())
  })
})