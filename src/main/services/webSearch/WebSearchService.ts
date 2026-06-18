import { loggerService } from '@logger'

const logger = loggerService.withContext('WebSearch')

export type SearchResult = {
  title: string
  url: string
  snippet: string
}

export type WebSearchProvider = 'duckduckgo' | 'tavily' | 'searxng'

export type WebSearchConfig = {
  provider: WebSearchProvider
  tavilyApiKey?: string
  searxngUrl?: string
}

let currentConfig: WebSearchConfig = { provider: 'duckduckgo' }

export function setWebSearchConfig(config: WebSearchConfig): void {
  currentConfig = config
  logger.info(`Web search provider set to: ${config.provider}`)
}

export function getWebSearchConfig(): WebSearchConfig {
  return currentConfig
}

export async function webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  logger.info(`Searching [${currentConfig.provider}]: "${query}"`)
  switch (currentConfig.provider) {
    case 'tavily':   return searchTavily(query, maxResults, currentConfig.tavilyApiKey ?? '')
    case 'searxng':  return searchSearXNG(query, maxResults, currentConfig.searxngUrl ?? 'http://localhost:8080')
    default:         return searchDuckDuckGo(query, maxResults)
  }
}

// ── DuckDuckGo (no key required) ─────────────────────────────────────────────

async function searchDuckDuckGo(query: string, maxResults: number): Promise<SearchResult[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json() as {
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>
      Abstract?: string; AbstractURL?: string; AbstractText?: string
    }
    const results: SearchResult[] = []
    if (data.AbstractText && data.AbstractURL) {
      results.push({ title: data.Abstract ?? query, url: data.AbstractURL, snippet: data.AbstractText.slice(0, 300) })
    }
    for (const topic of (data.RelatedTopics ?? []).slice(0, maxResults)) {
      if (!topic.Text || !topic.FirstURL) continue
      results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text.slice(0, 300) })
      if (results.length >= maxResults) break
    }
    return results
  } catch (err) {
    logger.error('DuckDuckGo search failed', err)
    return []
  }
}

// ── Tavily ────────────────────────────────────────────────────────────────────

async function searchTavily(query: string, maxResults: number, apiKey: string): Promise<SearchResult[]> {
  if (!apiKey) { logger.warn('Tavily API key not set'); return searchDuckDuckGo(query, maxResults) }
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, query, max_results: maxResults, search_depth: 'basic' }),
      signal: AbortSignal.timeout(10000)
    })
    const data = await res.json() as { results?: Array<{ title: string; url: string; content: string }> }
    return (data.results ?? []).map((r) => ({ title: r.title, url: r.url, snippet: r.content.slice(0, 300) }))
  } catch (err) {
    logger.error('Tavily search failed', err)
    return []
  }
}

// ── SearXNG ───────────────────────────────────────────────────────────────────

async function searchSearXNG(query: string, maxResults: number, baseUrl: string): Promise<SearchResult[]> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/search?q=${encodeURIComponent(query)}&format=json&categories=general`
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    const data = await res.json() as { results?: Array<{ title: string; url: string; content: string }> }
    return (data.results ?? []).slice(0, maxResults).map((r) => ({
      title: r.title, url: r.url, snippet: r.content?.slice(0, 300) ?? ''
    }))
  } catch (err) {
    logger.error('SearXNG search failed', err)
    return []
  }
}

export function formatSearchContext(results: SearchResult[], query: string): string {
  if (results.length === 0) return ''
  return [
    `[Web search results for "${query}"]:`,
    ...results.map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.url}`)
  ].join('\n\n')
}
