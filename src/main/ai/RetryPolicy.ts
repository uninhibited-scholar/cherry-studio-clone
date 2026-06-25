import { loggerService } from '@logger'

const logger = loggerService.withContext('RetryPolicy')

const TRANSIENT_PATTERNS = ['429', '503', 'ECONNRESET', 'ETIMEDOUT', 'fetch failed']
const NON_RETRYABLE_PATTERNS = ['401', '403', '400']

function isTransient(err: unknown): boolean {
  const msg = String(err)
  if (NON_RETRYABLE_PATTERNS.some((p) => msg.includes(p))) return false
  return TRANSIENT_PATTERNS.some((p) => msg.includes(p))
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts = { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 10000 }
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs } = opts
  let lastErr: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (!isTransient(err) || attempt === maxAttempts - 1) throw err
      const jitter = Math.random() * 500
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + jitter, maxDelayMs)
      logger.warn(`Transient error (attempt ${attempt + 1}/${maxAttempts}), retrying in ${Math.round(delay)}ms`, err)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastErr
}
