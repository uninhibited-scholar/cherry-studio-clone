import { desc } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { translateHistory } from '../db/schemas/translateHistory'
import { streamText } from 'ai'
import { buildLanguageModel } from '../../ai/provider/factory'
import { providerService } from './ProviderService'
import type { TranslateHistory } from '@shared/data/types/translate'
import { nanoid } from 'nanoid'
import { loggerService } from '@logger'

const logger = loggerService.withContext('TranslateService')

export type TranslateParams = {
  sourceText: string
  sourceLang: string
  targetLang: string
  providerId: string
  modelId: string
  onChunk: (text: string) => void
}

export class TranslateService {
  async translate(params: TranslateParams): Promise<string> {
    const { sourceText, sourceLang, targetLang, providerId, modelId, onChunk } = params

    const providers = await providerService.listProviders()
    const provider = providers.find((p) => p.id === providerId)
    if (!provider) throw new Error(`Provider not found: ${providerId}`)

    const models = await providerService.listModels(providerId)
    const model = models.find((m) => m.id === modelId)
    if (!model) throw new Error(`Model not found: ${modelId}`)

    const sourceLabel = sourceLang === 'auto' ? 'the source language' : sourceLang
    const systemPrompt = `You are a professional translator. Translate the text from ${sourceLabel} to ${targetLang}. Output only the translated text with no explanation, no prefix, no quotes.`

    const lm = buildLanguageModel(provider, model)
    const result = streamText({
      model: lm,
      system: systemPrompt,
      prompt: sourceText
    })

    let full = ''
    for await (const chunk of result.textStream) {
      full += chunk
      onChunk(chunk)
    }

    logger.info(`Translated ${sourceText.length} chars → ${targetLang}`)
    return full
  }

  async saveHistory(data: Omit<TranslateHistory, 'id' | 'createdAt'>): Promise<void> {
    const db = getDb()
    await db.insert(translateHistory).values({
      id: nanoid(),
      ...data,
      createdAt: Date.now()
    })
  }

  async listHistory(limit = 50): Promise<TranslateHistory[]> {
    const db = getDb()
    const rows = await db
      .select()
      .from(translateHistory)
      .orderBy(desc(translateHistory.createdAt))
      .limit(limit)
    return rows.map((r) => ({
      id: r.id,
      sourceText: r.sourceText,
      targetText: r.targetText,
      sourceLang: r.sourceLang,
      targetLang: r.targetLang,
      providerId: r.providerId ?? undefined,
      modelId: r.modelId ?? undefined,
      createdAt: r.createdAt
    }))
  }

  async clearHistory(): Promise<void> {
    const db = getDb()
    await db.delete(translateHistory)
  }
}

export const translateService = new TranslateService()
