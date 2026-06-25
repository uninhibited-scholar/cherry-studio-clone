import { providerService } from './ProviderService'
import { loggerService } from '@logger'
import { ENDPOINT_TYPE } from '@shared/data/types/provider'
import { getDb } from '../db/DbService'
import { userProvider } from '../db/schemas/provider'

const logger = loggerService.withContext('DefaultProviderSeeder')

interface ProviderSeed {
  id: string
  name: string
  apiHost?: string
  defaultEndpointType: string
  isBuiltin: true
}

const DEFAULT_PROVIDERS: ProviderSeed[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiHost: 'https://api.openai.com/v1',
    defaultEndpointType: ENDPOINT_TYPE.OPENAI_CHAT_COMPLETIONS,
    isBuiltin: true
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    apiHost: 'https://api.anthropic.com',
    defaultEndpointType: ENDPOINT_TYPE.ANTHROPIC_MESSAGES,
    isBuiltin: true
  },
  {
    id: 'google-gemini',
    name: 'Google Gemini',
    defaultEndpointType: ENDPOINT_TYPE.GOOGLE_GEMINI,
    isBuiltin: true
  },
  {
    id: 'groq',
    name: 'Groq',
    apiHost: 'https://api.groq.com/openai/v1',
    defaultEndpointType: ENDPOINT_TYPE.GROQ,
    isBuiltin: true
  },
  {
    id: 'ollama',
    name: 'Ollama',
    apiHost: 'http://localhost:11434/v1',
    defaultEndpointType: ENDPOINT_TYPE.CUSTOM,
    isBuiltin: true
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    apiHost: 'https://api.moonshot.cn/v1',
    defaultEndpointType: ENDPOINT_TYPE.CUSTOM,
    isBuiltin: true
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    apiHost: 'https://api.deepseek.com/v1',
    defaultEndpointType: ENDPOINT_TYPE.CUSTOM,
    isBuiltin: true
  },
  {
    id: 'zhipu-glm',
    name: 'Zhipu GLM',
    apiHost: 'https://open.bigmodel.cn/api/paas/v4',
    defaultEndpointType: ENDPOINT_TYPE.CUSTOM,
    isBuiltin: true
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    apiHost: 'https://api.siliconflow.cn/v1',
    defaultEndpointType: ENDPOINT_TYPE.CUSTOM,
    isBuiltin: true
  }
]

export async function seedDefaultProviders(): Promise<void> {
  const db = getDb()

  // Check if any providers already exist — skip if so
  const existing = await db.select().from(userProvider).limit(1)
  if (existing.length > 0) {
    logger.info('Providers already seeded, skipping')
    return
  }

  logger.info('Seeding default providers…')

  for (const seed of DEFAULT_PROVIDERS) {
    try {
      await providerService.upsertProvider({
        id: seed.id,
        name: seed.name,
        apiHost: seed.apiHost,
        defaultEndpointType: seed.defaultEndpointType as (typeof ENDPOINT_TYPE)[keyof typeof ENDPOINT_TYPE],
        isBuiltin: true,
        isEnabled: true
      })
    } catch (err) {
      logger.warn(`Failed to seed provider ${seed.id}`, err)
    }
  }

  logger.info(`Seeded ${DEFAULT_PROVIDERS.length} default providers`)
}
