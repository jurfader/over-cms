export interface MediaItem {
  id: string
  filename: string
  originalName: string
  url: string
  size: number
  mimeType: string
  width: number | null
  height: number | null
  alt: string | null
  caption: string | null
  folder: string
  tags: string[]
  uploadedBy: string | null
  createdAt: string
}

export interface MediaListResponse {
  data: MediaItem[]
  meta: { total: number; page: number; limit: number; pages: number }
}
