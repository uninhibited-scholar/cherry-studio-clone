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
  TOPICS_NAME: 'topics:name',
  TOPIC_NAMED: 'topic:named',

  // History
  HISTORY_SEARCH: 'history:search',
  HISTORY_LIST_ALL: 'history:list-all',

  // Library (prompt templates)
  LIBRARY_LIST: 'library:list',
  LIBRARY_CREATE: 'library:create',
  LIBRARY_DELETE: 'library:delete',

  // Messages
  MESSAGES_LIST: 'messages:list',
  MESSAGES_CREATE: 'messages:create',
  MESSAGES_DELETE: 'messages:delete',

  // Knowledge
  KNOWLEDGE_LIST: 'knowledge:list',
  KNOWLEDGE_CREATE: 'knowledge:create',
  KNOWLEDGE_DELETE: 'knowledge:delete',
  KNOWLEDGE_SEARCH: 'knowledge:search',

  // Notes
  NOTES_LIST: 'notes:list',
  NOTES_CREATE: 'notes:create',
  NOTES_UPDATE: 'notes:update',
  NOTES_DELETE: 'notes:delete',

  // Translate
  TRANSLATE_RUN: 'translate:run',
  TRANSLATE_CHUNK: 'translate:chunk',
  TRANSLATE_HISTORY_LIST: 'translate:history:list',
  TRANSLATE_HISTORY_CLEAR: 'translate:history:clear',

  // Paintings
  PAINTINGS_LIST: 'paintings:list',
  PAINTINGS_GENERATE: 'paintings:generate',
  PAINTINGS_DELETE: 'paintings:delete',

  // MCP
  MCP_LIST: 'mcp:list',
  MCP_UPSERT: 'mcp:upsert',
  MCP_DELETE: 'mcp:delete',
  MCP_TOOLS: 'mcp:tools',
  MCP_CALL_TOOL: 'mcp:call-tool',
  MCP_CONNECT: 'mcp:connect',
  MCP_DISCONNECT: 'mcp:disconnect',

  // Mini Apps
  MINI_APPS_OPEN: 'mini-apps:open',

  // Web Search
  WEB_SEARCH: 'web:search',
  WEB_SEARCH_CONFIG_GET: 'web-search:config:get',
  WEB_SEARCH_CONFIG_SET: 'web-search:config:set',

  // Export
  EXPORT_TOPIC: 'export:topic',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Notifications
  NOTIFY: 'notify',

  // Backup
  BACKUP_EXPORT: 'backup:export',
  BACKUP_IMPORT: 'backup:import',

  // Paintings (additional)
  PAINTINGS_SAVE: 'paintings:save',

  // File utilities
  FILE_SELECT: 'file:select',
  FILE_READ: 'file:read',
  OPEN_PATH: 'open:path',
  OPEN_WEBSITE: 'open:website',

  // Menu events (main → renderer)
  MENU_NEW_TOPIC: 'menu:new-topic',
  MENU_EXPORT_TOPIC: 'menu:export-topic',

  // Storage
  STORAGE_INFO: 'storage:info',

  // Provider test
  PROVIDER_TEST: 'provider:test',

  // App system
  APP_LAUNCH_ON_BOOT_GET: 'app:launch-on-boot:get',
  APP_LAUNCH_ON_BOOT_SET: 'app:launch-on-boot:set',
  APP_CACHE_SIZE: 'app:cache-size',
  APP_CACHE_CLEAR: 'app:cache-clear',

  // App
  APP_VERSION: 'app:version',
  APP_READY: 'app:ready'
} as const

export type IpcChannelKey = keyof typeof IpcChannel
export type IpcChannelValue = (typeof IpcChannel)[IpcChannelKey]
