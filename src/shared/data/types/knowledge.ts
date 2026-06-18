export type KnowledgeBase = {
  id: string
  name: string
  description: string
  documentCount: number
  createdAt: number
  updatedAt: number
}

export type KnowledgeDocument = {
  id: string
  knowledgeBaseId: string
  name: string
  content: string
  /** 'text' | 'markdown' | 'url' */
  type: string
  createdAt: number
}
