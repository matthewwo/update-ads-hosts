import { describe, expect, it } from 'vitest'
import fs from 'fs/promises'

describe('custom-rules.txt', async () => {
  const file = await fs.readFile('./custom-rules.txt')
  const fileContent = file.toString()

  it('should exist in the root directory', async () => {
    const files = await fs.readdir('./')
    expect(files).toContain('custom-rules.txt')
  })

  it('should be a text file', async () => {
    const file = await fs.readFile('./custom-rules.txt')
    expect(file).toBeInstanceOf(Buffer)
    expect(file.toString()).to.have.lengthOf.greaterThan(0)
  })

  it('should not be empty', async () => {
    expect(file.length).toBeGreaterThan(0)
  })

  it('should not contain any duplicate rules', async () => {
    const rules = fileContent.split('\n').filter(Boolean)

    const uniqueRules = new Set()
    for (const rule of rules) {
      if (uniqueRules.has(rule)) {
        expect.fail(`Duplicate rule: ${rule}`)
      }
      uniqueRules.add(rule)
    }
  })

  it('should not contain any invalid rules', async () => {
    const supportedTypes = ['DOMAIN-SUFFIX']

    const rules = fileContent.split('\n').filter(Boolean)

    for (const rule of rules) {
      const [type, domain] = rule.split(',')
      expect(supportedTypes, `Rule type should be one of these types: '${supportedTypes.join(', ')}'`).toContain(type)
      expect(domain, 'Domain should be defined').toBeTruthy()
      expect(domain, 'Domain should not contain invalid characters').not.toMatch(/[^a-zA-Z0-9.-]/)
      expect(domain, 'Domain should not contain any spaces').not.toMatch(/\s/)
      expect(domain, 'Domain should be within 2-63 characters').toMatch(/.{2,63}/)
    }
  })
})