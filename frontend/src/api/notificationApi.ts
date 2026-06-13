import type { Notification } from '../types/notification';

export const notificationApi = {
  getMyNotifications: async (limit: number = 50, unreadOnly: boolean = false) => {
    return [
      {
        id: 'n1',
        title: 'Chào mừng bạn',
        message: 'Chào mừng bạn đến với hệ thống LMS Security!',
        type: 'info',
        createdAt: new Date().toISOString(),
        isRead: false
      }
    ] as Notification[];
  },

  markAsRead: async (id: string) => {
    // Mock
  },

  markAllAsRead: async () => {
    // Mock
  },
};
