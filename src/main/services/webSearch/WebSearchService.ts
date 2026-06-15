import { loggerService } from '@logger'

const logger = loggerService.withContext('WebSearch')

export type SearchResult = {
  title: string
  url: string
  snippet: string
}

/**
 * Simple web search using DuckDuckGo's JSON API (no key required).
 * Returns top N results as plain objects.
 *
 * For production, swap with Tavily / Exa / SearXNG.
 */
export async function webSearch(query: string, maxResults = 5): Promise<SearchResult[]> {
  logger.info(`Searching: "${query}"`)

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json() as {
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Result?: string }>
      Abstract?: string
      AbstractURL?: string
      AbstractText?: string
    }

    const results: SearchResult[] = []

    // Abstract (if present)
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.Abstract ?? query,
        url: data.AbstractURL,
        snippet: data.AbstractText.slice(0, 300)
      })
    }

    // Related topics
    for (const topic of (data.RelatedTopics ?? []).slice(0, maxResults)) {
      if (!topic.Text || !topic.FirstURL) continue
      results.push({
        title: topic.Text.slice(0, 80),
        url: topic.FirstURL,
        snippet: topic.Text.slice(0, 300)
      })
      if (results.length >= maxResults) break
    }

    logger.info(`Got ${results.length} results for "${query}"`)
    return results
  } catch (err) {
    logger.error('Search failed', err)
    return []
  }
}

/** Format search results into a context block to inject before user message */
export function formatSearchContext(results: SearchResult[], query: string): string {
  if (results.length === 0) return ''
  const lines = [
    `[Web search results for "${query}"]:`,
    ...results.map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   Source: ${r.url}`)
  ]
  return lines.join('\n\n')
}
