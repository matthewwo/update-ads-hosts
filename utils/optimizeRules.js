export const optimizeRules = (input) => {
  const domains = new Map()

  const cleanedInput = input.trim().split('\n').map(line => line.replace(/DOMAIN-SUFFIX,/, '').trim())
  const sortedInput = Array.from(new Set(cleanedInput)).sort((a, b) => { return a.length - b.length })

  sortedInput.forEach(domain => {
    const domainParts = domain.split('.')
    const subDomainDepth = domainParts.length - 1

    for (let i = 1; i <= subDomainDepth + 1; i += 1) {
      const key = domainParts.slice(-i).join('.')
      if (domains.has(key)) {
        domains.get(key).push(domain)
        break
      } else if (i === subDomainDepth + 1) {
        domains.set(domain, [])
      }
    }
  })

  const sortedDomains = Array.from(domains.keys()).sort((a, b) => { return (a.length - b.length) + (a > b ? 1 : a !== b ? -1 : 0) })

  return sortedDomains.map(domain => `DOMAIN-SUFFIX,${domain}`).join('\n')
}
