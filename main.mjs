const neoHostsURL = "https://cdn.jsdelivr.net/gh/geekdada/surge-list/domain-set/neohosts.txt"

const chineseFiltersURL = "https://cdn.jsdelivr.net/gh/geekdada/surge-list/domain-set/chinese-filter.txt"

const dnsFilter = "https://cdn.jsdelivr.net/gh/geekdada/surge-list/domain-set/dns-filter.txt"

const trackingProtection = "https://cdn.jsdelivr.net/gh/geekdada/surge-list/domain-set/tracking-protection-filter.txt"

const urls = [neoHostsURL, chineseFiltersURL, dnsFilter, trackingProtection]

const customRules = `
DOMAIN-SUFFIX,applvn.com
DOMAIN-SUFFIX,ingest.sentry.io
DOMAIN-SUFFIX,smaato.net
DOMAIN-SUFFIX,paasmi.com
DOMAIN-SUFFIX,pz.pe
DOMAIN-SUFFIX,adv.lihkg.com
DOMAIN-SUFFIX,appier.net
DOMAIN-SUFFIX,advertising.com
DOMAIN-SUFFIX,ybp.yahoo.com
DOMAIN-SUFFIX,geo.yahoo.com
DOMAIN-SUFFIX,yap.yahoo.com
DOMAIN-SUFFIX,ssp.yahoo.com
DOMAIN-SUFFIX,actonservice.com
DOMAIN-SUFFIX,apps.iocnt.de
`.trim().split('\n')

const domains = new Map()

function optimizeRules(input) {
  const cleanedInput = input.trim().split('\n').map(line => line.replace(/DOMAIN-SUFFIX,/, ''))
  const sortedInput = Array.from(new Set(cleanedInput)).sort((a, b) => { return a.length - b.length })

  sortedInput.forEach(domain => {
    const domainParts = domain.split('.')
    const subDomainDepth = domainParts.length - 1

    for (let i = 2; i <= subDomainDepth + 1; i += 1) {
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

async function fetchSurgeRules(url) {
  const res = await fetch(url)

	const neoHosts = await res.text()

  return neoHosts.replace(/^(\.)/gm, 'DOMAIN-SUFFIX,')
}

async function batchFetchSurgeRules(urls) {
  const merged = new Set()
  for (const url of urls) {
    const surgeRules = await fetchSurgeRules(url)
    for (const rule of surgeRules.split('\n')){
      merged.add(rule)
    }
  }

  for (const rule of customRules) {
    merged.add(rule)
  }

  const rules = Array.from(merged).sort().join('\n')

  return optimizeRules(rules)
}

async function uploadToGist(hosts) {
  const ghToken = process.env.GH_TOKEN
  const gistId = process.env.GIST_ID

  if (!ghToken || !gistId) {
    throw new Error('missing GH_TOKEN or GIST_ID')
  }

  const fileName = "surge-rules.txt"
  const description = "Ads hosts for Surge"

  const headers = {
    Accepts: "application/vnd.github+json",
    Authorization: `Bearer ${ghToken}`,
    ["X-GitHub-Api-Version"]: "2022-11-28",
  }

  const body = {
    description,
    public: false,
    files: {
        [fileName]: {
            content: hosts
        }
    }
  }

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers,
    method: 'PATCH',
    body: JSON.stringify(body),
  })

  const githubRes = await res.json()
  //console.log(githubRes)
	console.log('uploaded to gist')
}

const rules = await batchFetchSurgeRules(urls)
uploadToGist(rules)