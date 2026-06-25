/**
 * BM25 ranking service.
 *
 * Implements Okapi BM25 (k1=1.5, b=0.75) — a classic probabilistic retrieval
 * model that outperforms TF-IDF and serves as the "embedding" layer for this
 * offline app without any external model download.
 *
 * Interface is designed to be drop-in replaceable with a future vector
 * embedding service: just swap `index` / `search` / `clear` implementations.
 */

// BM25 hyperparameters
const K1 = 1.5
const B = 0.75

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

interface DocEntry {
  id: string
  termFreqs: Map<string, number>
  length: number
}

export class BM25Service {
  private docs: DocEntry[] = []
  private idToIndex = new Map<string, number>()
  /** df[term] = number of documents containing term */
  private df = new Map<string, number>()
  private avgDocLength = 0

  /** Replace the current index with a new set of documents. */
  index(documents: { id: string; text: string }[]): void {
    this.clear()

    for (const { id, text } of documents) {
      const tokens = tokenize(text)
      const termFreqs = new Map<string, number>()
      for (const t of tokens) {
        termFreqs.set(t, (termFreqs.get(t) ?? 0) + 1)
      }
      this.idToIndex.set(id, this.docs.length)
      this.docs.push({ id, termFreqs, length: tokens.length })
    }

    // Build df
    for (const doc of this.docs) {
      for (const term of doc.termFreqs.keys()) {
        this.df.set(term, (this.df.get(term) ?? 0) + 1)
      }
    }

    this.avgDocLength =
      this.docs.length === 0 ? 0 : this.docs.reduce((s, d) => s + d.length, 0) / this.docs.length
  }

  /** Search and return top-K results sorted by descending BM25 score. */
  search(query: string, topK: number): Array<{ id: string; score: number }> {
    const queryTerms = tokenize(query)
    if (queryTerms.length === 0 || this.docs.length === 0) return []

    const N = this.docs.length
    const scores = new Map<string, number>()

    for (const term of queryTerms) {
      const df = this.df.get(term) ?? 0
      if (df === 0) continue

      // IDF component (BM25 variant with smoothing)
      const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1)

      for (const doc of this.docs) {
        const tf = doc.termFreqs.get(term) ?? 0
        if (tf === 0) continue

        const tfNorm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (doc.length / this.avgDocLength)))
        scores.set(doc.id, (scores.get(doc.id) ?? 0) + idf * tfNorm)
      }
    }

    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([id, score]) => ({ id, score }))
  }

  clear(): void {
    this.docs = []
    this.idToIndex.clear()
    this.df.clear()
    this.avgDocLength = 0
  }

  get size(): number {
    return this.docs.length
  }
}
