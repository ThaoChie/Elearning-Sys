import React, { useState, useEffect, useRef } from 'react';
import { notificationApi } from '../../api/notificationApi';
import type { Notification } from '../../types/notification';

export const NotificationDropdown: React.FC = () => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Lấy dữ liệu khi component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Xử lý click ra ngoài để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Gọi API thực tế
      const data = await notificationApi.getMyNotifications(5);
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      // Fallback mock nếu API lỗi/chưa có (để dev preview)
      const mockData = [
        { id: '1', title: 'Hệ thống', message: 'Chào mừng bạn đến với hệ thống LMS mới!', isRead: false, type: 'System', relatedEntityId: null, createdAt: new Date().toISOString() },
        { id: '2', title: 'Khóa học', message: 'Lịch học môn Toán CC đã thay đổi', isRead: true, type: 'Course', relatedEntityId: null, createdAt: new Date(Date.now() - 3600000).toISOString() },
      ] as Notification[];
      setNotifications(mockData);
      setUnreadCount(1);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setNotifOpen(!notifOpen)}
        className="relative w-9 h-9 flex items-center justify-center bg-slate-50 rounded-xl
          hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all group"
      >
        <svg className={`w-5 h-5 ${unreadCount > 0 ? 'group-hover:animate-bounce' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-red-500/50 ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {notifOpen && (
        <div className="absolute right-0 top-11 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 overflow-hidden transform transition-all opacity-100 scale-100 origin-top-right">
          <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-white/50">
            <p className="text-sm font-semibold text-slate-800">Thông Báo</p>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          
          <div className="max-h-[320px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-xs">
                Không có thông báo nào.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => handleMarkAsRead(n.id, n.isRead)}
                  className={`px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors relative ${!n.isRead ? 'bg-indigo-50/20' : ''}`}
                >
                  {!n.isRead && (
                    <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  )}
                  <div className={`${!n.isRead ? 'pl-2' : ''}`}>
                    <p className={`text-xs ${!n.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                      {n.title}: {n.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-slate-50 text-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors"
               onClick={() => window.location.href = '/dashboard/notifications'}>
            <span className="text-xs text-indigo-600 font-medium">
              Xem tất cả thông báo
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
