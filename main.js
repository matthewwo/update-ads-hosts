import fs from 'fs/promises'
import { optimizeRules } from './utils/optimizeRules.js'

const neoHostsURL = "https://cdn.jsdelivr.net/gh/geekdada/surge-list/domain-set/neohosts.txt"

const chineseFiltersURL = "https://cdn.jsdelivr.net/gh/geekdada/surge-list/domain-set/chinese-filter.txt"

const dnsFilter = "https://cdn.jsdelivr.net/gh/geekdada/surge-list/domain-set/dns-filter.txt"

const trackingProtection = "https://cdn.jsdelivr.net/gh/geekdada/surge-list/domain-set/tracking-protection-filter.txt"

const urls = [neoHostsURL, chineseFiltersURL, dnsFilter, trackingProtection]

const customRulesText = await (await fs.readFile('./custom-rules.txt')).toString()
const customRules = customRulesText.trim().split('\n')

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

async function convertSurgeRulesToAdguardRules(surgeRules) {
  const adguardRules = surgeRules.split('\n').map(rule => {
    const [type, domain] = rule.split(',')
    if (type === 'DOMAIN-SUFFIX') {
      if (domain.includes('.')) {
        return `||${domain}^`
      } else {
        // domain is a top level domain
        return `||*.${domain}^`
      }
    } else {
      return null
    }
  }).filter(Boolean).join('\n')
  return adguardRules
}

async function convertSurgeRulesToQuanmultXRules(surgeRules) {
  const adguardRules = surgeRules.split('\n').map(rule => {
    const [type, domain] = rule.split(',')
    if (type === 'DOMAIN-SUFFIX') {
      return `DOMAIN-SUFFIX,${domain},reject`
    } else {
      return null
    }
  }).filter(Boolean).join('\n')
  return adguardRules
} 

async function uploadToGist(files) {
  const ghToken = process.env.GH_TOKEN
  const gistId = process.env.GIST_ID

  if (!ghToken || !gistId) {
    throw new Error('missing GH_TOKEN or GIST_ID')
  }

  const headers = {
    Accepts: "application/vnd.github+json",
    Authorization: `Bearer ${ghToken}`,
    ["X-GitHub-Api-Version"]: "2022-11-28",
  }

  const body = {
    description: "Ads rules for Surge and Adguard",
    public: false,
    files
  }

  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers,
    method: 'PATCH',
    body: JSON.stringify(body),
  })

  const githubRes = await res.json()
  // console.log(githubRes)
	console.log('Uploaded to gist.')
}

const surgeRules = await batchFetchSurgeRules(urls)
const adguardRules = await convertSurgeRulesToAdguardRules(surgeRules)
const quanmultXRules = await convertSurgeRulesToQuanmultXRules(surgeRules)

console.log(`Generated ${surgeRules.split('\n').length} rules`)


console.log('Uploading rules to gist...')
const gistFiles = {
  "surge-rules.txt": {
    content: surgeRules
  },
  "adguard-rules.txt": {
    content: adguardRules
  },
  "quanmultx-rules.txt": {
    content: quanmultXRules
  }, 
}
await uploadToGist(gistFiles)
