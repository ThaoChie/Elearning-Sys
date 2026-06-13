export type NotificationType = 'System' | 'Course' | 'Assignment' | 'Exam';

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  relatedEntityId: string | null;
  createdAt: string;
}
