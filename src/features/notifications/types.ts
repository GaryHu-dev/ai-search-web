// Mirrors the backend NotificationResponse (dates arrive as ISO strings).
export interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

export interface NotificationsPageData {
  items: Notification[]
  nextCursor: string | null
}
