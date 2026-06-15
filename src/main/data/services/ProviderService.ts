import { eq } from 'drizzle-orm'
import { getDb } from '../db/DbService'
import { userProvider, userModel } from '../db/schemas/provider'
import type { Provider } from '@shared/data/types/provider'
import type { Model } from '@shared/data/types/model'
import { loggerService } from '@logger'
import { nanoid } from 'nanoid'

const logger = loggerService.withContext('ProviderService')

export class ProviderService {
  // ── Providers ────────────────────────────────────────────────────────────

  async listProviders(): Promise<Provider[]> {
    const db = getDb()
    const rows = await db.select().from(userProvider)
    return rows.map(rowToProvider)
  }

  async upsertProvider(data: Partial<Provider> & { name: string }): Promise<Provider> {
    const db = getDb()
    const now = Date.now()
    const id = data.id ?? nanoid()

    await db
      .insert(userProvider)
      .values({
        id,
        name: data.name,
        apiKey: data.apiKey,
        apiHost: data.apiHost,
        defaultEndpointType: data.defaultEndpointType ?? 'openai_chat_completions',
        isEnabled: data.isEnabled ?? true,
        isBuiltin: data.isBuiltin ?? false,
        website: data.website ?? null,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: userProvider.id,
        set: {
          name: data.name,
          apiKey: data.apiKey,
          apiHost: data.apiHost,
          defaultEndpointType: data.defaultEndpointType ?? 'openai_chat_completions',
          isEnabled: data.isEnabled ?? true,
          website: data.website ?? null,
          updatedAt: now
        }
      })

    logger.info(`Upserted provider: ${id}`)
    const rows = await db.select().from(userProvider).where(eq(userProvider.id, id))
    return rowToProvider(rows[0])
  }

  async deleteProvider(id: string): Promise<void> {
    const db = getDb()
    await db.delete(userProvider).where(eq(userProvider.id, id))
    logger.info(`Deleted provider: ${id}`)
  }

  // ── Models ───────────────────────────────────────────────────────────────

  async listModels(providerId?: string): Promise<Model[]> {
    const db = getDb()
    const query = db.select().from(userModel)
    const rows = providerId
      ? await query.where(eq(userModel.providerId, providerId))
      : await query
    return rows.map(rowToModel)
  }

  async upsertModel(data: Partial<Model> & { name: string; providerId: string }): Promise<Model> {
    const db = getDb()
    const now = Date.now()
    const id = data.id ?? `${data.providerId}/${data.name}`

    await db
      .insert(userModel)
      .values({
        id,
        providerId: data.providerId,
        name: data.name,
        displayName: data.displayName,
        endpointType: data.endpointType,
        capabilities: data.capabilities ?? [],
        contextWindow: data.contextWindow,
        maxOutputTokens: data.maxOutputTokens,
        isEnabled: data.isEnabled ?? true,
        isCustom: data.isCustom ?? false,
        pricing: data.pricing ?? null,
        createdAt: now,
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: userModel.id,
        set: {
          displayName: data.displayName,
          endpointType: data.endpointType,
          capabilities: data.capabilities ?? [],
          contextWindow: data.contextWindow,
          maxOutputTokens: data.maxOutputTokens,
          isEnabled: data.isEnabled ?? true,
          pricing: data.pricing ?? null,
          updatedAt: now
        }
      })

    const rows = await db.select().from(userModel).where(eq(userModel.id, id))
    return rowToModel(rows[0])
  }

  async deleteModel(id: string): Promise<void> {
    const db = getDb()
    await db.delete(userModel).where(eq(userModel.id, id))
  }
}

function rowToProvider(row: typeof userProvider.$inferSelect): Provider {
  return {
    id: row.id,
    name: row.name,
    apiKey: row.apiKey ?? undefined,
    apiHost: row.apiHost ?? undefined,
    defaultEndpointType: (row.defaultEndpointType as Provider['defaultEndpointType']) ?? 'openai_chat_completions',
    isEnabled: row.isEnabled,
    isBuiltin: row.isBuiltin,
    website: (row.website as Provider['website']) ?? undefined
  }
}

function rowToModel(row: typeof userModel.$inferSelect): Model {
  return {
    id: row.id,
    providerId: row.providerId,
    name: row.name,
    displayName: row.displayName ?? undefined,
    endpointType: (row.endpointType as Model['endpointType']) ?? undefined,
    capabilities: (row.capabilities as Model['capabilities']) ?? [],
    contextWindow: row.contextWindow ?? undefined,
    maxOutputTokens: row.maxOutputTokens ?? undefined,
    isEnabled: row.isEnabled,
    isCustom: row.isCustom
  }
}

export const providerService = new ProviderService()
