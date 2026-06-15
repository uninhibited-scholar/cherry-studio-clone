import { z } from 'zod'

export const NoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().default('Untitled'),
  content: z.string().default(''),
  folderId: z.string().optional(),
  isPinned: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number()
})

export type Note = z.infer<typeof NoteSchema>
