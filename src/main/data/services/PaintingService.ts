import { eq, desc } from 'drizzle-orm'
import { experimental_generateImage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { getDb } from '../db/DbService'
import { painting } from '../db/schemas/painting'
import type { Painting } from '@shared/data/types/painting'
import { providerService } from './ProviderService'
import { loggerService } from '@logger'
import { nanoid } from 'nanoid'

const logger = loggerService.withContext('PaintingService')

export type GenerateParams = {
  providerId: string
  modelName: string
  prompt: string
  negativePrompt?: string
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
}

export class PaintingService {
  async list(): Promise<Painting[]> {
    const db = getDb()
    const rows = await db.select().from(painting).orderBy(desc(painting.createdAt))
    return rows.map(rowToPainting)
  }

  async generate(params: GenerateParams): Promise<Painting> {
    const { providerId, modelName, prompt, negativePrompt = '', size = '1024x1024' } = params

    const providers = await providerService.listProviders()
    const provider = providers.find((p) => p.id === providerId)
    if (!provider) throw new Error(`Provider not found: ${providerId}`)

    logger.info(`Generating image: ${modelName} — "${prompt.slice(0, 60)}"`)

    const client = createOpenAI({
      apiKey: provider.apiKey ?? '',
      baseURL: provider.apiHost || undefined,
      compatibility: provider.apiHost ? 'compatible' : 'strict'
    })

    const [widthStr, heightStr] = size.split('x')
    const width = parseInt(widthStr)
    const height = parseInt(heightStr)

    const result = await experimental_generateImage({
      model: client.image(modelName),
      prompt,
      size,
      n: 1
    })

    const imageData = result.images[0].base64

    const db = getDb()
    const id = nanoid()
    const now = Date.now()
    await db.insert(painting).values({ id, prompt, negativePrompt, imageData, width, height, modelName, providerId, createdAt: now })

    const rows = await db.select().from(painting).where(eq(painting.id, id))
    return rowToPainting(rows[0])
  }

  async delete(id: string): Promise<void> {
    const db = getDb()
    await db.delete(painting).where(eq(painting.id, id))
  }
}

function rowToPainting(row: typeof painting.$inferSelect): Painting {
  return {
    id: row.id,
    prompt: row.prompt,
    negativePrompt: row.negativePrompt,
    imageData: row.imageData,
    width: row.width,
    height: row.height,
    modelName: row.modelName,
    providerId: row.providerId,
    createdAt: row.createdAt
  }
}

export const paintingService = new PaintingService()
