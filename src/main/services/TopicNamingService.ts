import { generateText } from 'ai'
import { buildLanguageModel } from '../ai/provider/factory'
import { providerService } from '../data/services/ProviderService'
import { topicService } from '../data/services/TopicService'
import { loggerService } from '@logger'

const logger = loggerService.withContext('TopicNaming')

export class TopicNamingService {
  async name(
    topicId: string,
    firstUserMessage: string,
    firstAssistantReply: string,
    providerId: string,
    modelId: string,
    webContents?: Electron.WebContents
  ): Promise<string> {
    try {
      const providers = await providerService.listProviders()
      const provider = providers.find((p) => p.id === providerId)
      if (!provider) return 'New Conversation'

      const models = await providerService.listModels(providerId)
      const model = models.find((m) => m.id === modelId)
      if (!model) return 'New Conversation'

      const lm = buildLanguageModel(provider, model)

      const { text } = await generateText({
        model: lm,
        messages: [
          {
            role: 'user',
            content: `Generate a concise 3-6 word title for this conversation. Reply with ONLY the title, no punctuation, no quotes.

User: ${firstUserMessage.slice(0, 300)}
Assistant: ${firstAssistantReply.slice(0, 300)}`
          }
        ],
        maxTokens: 20,
        temperature: 0.5
      })

      const title = text.trim().replace(/^["'`]|["'`]$/g, '').slice(0, 80) || 'New Conversation'
      await topicService.updateTitle(topicId, title)
      logger.info(`Named topic ${topicId}: "${title}"`)

      if (webContents && !webContents.isDestroyed()) {
        webContents.send('topic:named', { topicId, title })
      }

      return title
    } catch (err) {
      logger.warn(`Topic naming failed: ${err}`)
      return 'New Conversation'
    }
  }
}

export const topicNamingService = new TopicNamingService()
