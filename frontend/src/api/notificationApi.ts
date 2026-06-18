import apiClient from './apiClient'
import type { Notification } from '../types/notification'

export const notificationApi = {
  // ── F-N01: Lấy danh sách thông báo ────────────────────────────────────────
  getMyNotifications: async (
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> => {
    const params = new URLSearchParams()
    if (limit !== 50)    params.set('limit', String(limit))
    if (unreadOnly)      params.set('unreadOnly', 'true')

    const url = `/notifications${params.toString() ? '?' + params.toString() : ''}`
    const { data } = await apiClient.get<Notification[]>(url)
    return data || []
  },

  // ── F-N02: Đánh dấu 1 thông báo đã đọc ───────────────────────────────────
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`)
  },

  // ── F-N03: Đánh dấu tất cả đã đọc ────────────────────────────────────────
  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read')
  },

  // ── Tiện ích: lấy số lượng thông báo chưa đọc (dùng cho badge header) ────
  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<{ unreadCount: number }>(
      '/notifications/unread-count'
    )
    return data.unreadCount ?? 0
  },
}
