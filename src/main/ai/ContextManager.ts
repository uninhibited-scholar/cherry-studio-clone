import type { ChatMessage } from './AiService'

const DEFAULT_MAX_TOKENS = 100_000
const CHARS_PER_TOKEN = 4

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Truncate messages to fit within maxTokens.
 * Always keeps: system prompt (passed separately) + last user message.
 * Drops oldest messages first when over limit.
 */
export function truncateContext(
  messages: ChatMessage[],
  maxTokens: number = DEFAULT_MAX_TOKENS,
  systemPrompt?: string
): ChatMessage[] {
  const systemTokens = systemPrompt ? estimateTokens(systemPrompt) : 0
  const budget = maxTokens - systemTokens

  if (messages.length === 0) return messages

  // Always preserve the last user message
  const lastMsg = messages[messages.length - 1]
  const lastTokens = estimateTokens(lastMsg.content)

  if (lastTokens >= budget) {
    // Even the last message is too long — truncate its content
    const maxChars = budget * CHARS_PER_TOKEN
    return [{ ...lastMsg, content: lastMsg.content.slice(-maxChars) }]
  }

  // Fill from end backwards within budget
  let used = lastTokens
  const kept: ChatMessage[] = [lastMsg]

  for (let i = messages.length - 2; i >= 0; i--) {
    const tokens = estimateTokens(messages[i].content)
    if (used + tokens > budget) break
    used += tokens
    kept.unshift(messages[i])
  }

  return kept
}
