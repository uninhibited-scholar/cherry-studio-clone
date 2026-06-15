/**
 * IPC channel constants shared between main and renderer.
 * All channels used anywhere in the app must be declared here.
 */
export const IpcChannel = {
  // AI
  AI_CHAT: 'ai:chat',
  AI_STREAM_CHUNK: 'ai:stream:chunk',
  AI_STREAM_END: 'ai:stream:end',
  AI_ABORT: 'ai:abort',

  // Providers / Models
  PROVIDERS_LIST: 'providers:list',
  PROVIDERS_UPSERT: 'providers:upsert',
  PROVIDERS_DELETE: 'providers:delete',
  MODELS_LIST: 'models:list',
  MODELS_UPSERT: 'models:upsert',
  MODELS_DELETE: 'models:delete',

  // Assistants
  ASSISTANTS_LIST: 'assistants:list',
  ASSISTANTS_UPSERT: 'assistants:upsert',
  ASSISTANTS_DELETE: 'assistants:delete',

  // Topics
  TOPICS_LIST: 'topics:list',
  TOPICS_CREATE: 'topics:create',
  TOPICS_DELETE: 'topics:delete',
  TOPICS_UPDATE: 'topics:update',

  // Messages
  MESSAGES_LIST: 'messages:list',
  MESSAGES_CREATE: 'messages:create',
  MESSAGES_DELETE: 'messages:delete',

  // Knowledge
  KNOWLEDGE_LIST: 'knowledge:list',
  KNOWLEDGE_CREATE: 'knowledge:create',
  KNOWLEDGE_DELETE: 'knowledge:delete',
  KNOWLEDGE_SEARCH: 'knowledge:search',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // App
  APP_VERSION: 'app:version',
  APP_READY: 'app:ready'
} as const

export type IpcChannelKey = keyof typeof IpcChannel
export type IpcChannelValue = (typeof IpcChannel)[IpcChannelKey]
