export type Painting = {
  id: string
  prompt: string
  negativePrompt: string
  /** base64-encoded PNG/JPEG image data */
  imageData: string
  width: number
  height: number
  modelName: string
  providerId: string
  createdAt: number
}
