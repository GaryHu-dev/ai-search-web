export interface FileItem {
  id: string
  filename: string
  contentType: string
  size: number
  createdAt: string
}

export interface FilesPageData {
  items: FileItem[]
  nextCursor: string | null
}
