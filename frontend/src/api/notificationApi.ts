import type { Notification } from '../types/notification';

export const notificationApi = {
  getMyNotifications: async (_limit: number = 50, _unreadOnly: boolean = false) => {
    return [
      {
        id: 'n1',
        title: 'Chào mừng bạn',
        message: 'Chào mừng bạn đến với hệ thống LMS Security!',
        type: 'System' as const,
        createdAt: new Date().toISOString(),
        isRead: false,
        relatedEntityId: null,
      }
    ] as Notification[];
  },

  markAsRead: async (_id: string) => {
    // Mock
  },

  markAllAsRead: async () => {
    // Mock
  },
};
