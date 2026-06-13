import React, { useState, useEffect } from 'react';
import { notificationApi } from '../api/notificationApi';
import type { Notification } from '../types/notification';
import Sidebar from '../components/instructor/dashboard/Sidebar'; // Assuming instructor for now, ideally dynamically wrapper

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getMyNotifications(100);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      // Fallback mock
      setNotifications([
        { id: '1', title: 'Hệ thống', message: 'Hệ thống bảo trì vào lúc 00:00 ngày mai', isRead: false, type: 'System', relatedEntityId: null, createdAt: new Date().toISOString() },
        { id: '2', title: 'Khóa học', message: 'Tài liệu môn Toán học rời rạc đã được cập nhật', isRead: true, type: 'Course', relatedEntityId: null, createdAt: new Date(Date.now() - 86400000).toISOString() }
      ] as Notification[]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8 min-h-full">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Tất cả thông báo</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý và xem lại thông báo hệ thống</p>
        </div>
        <button 
          onClick={handleMarkAllAsRead}
          className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors shadow-sm"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="font-semibold text-slate-700">Bạn chưa có thông báo nào.</p>
            <p className="text-sm mt-1">Khi có cập nhật mới, chúng sẽ hiển thị ở đây.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100/60">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => handleMarkAsRead(n.id, n.isRead)}
                className={`p-5 flex items-start gap-4 transition-all cursor-pointer ${!n.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50/80'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${!n.isRead ? 'bg-blue-100 text-blue-600' : 'bg-slate-100/80 text-slate-500'}`}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {n.type === 'System' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : n.type === 'Course' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    : n.type === 'Exam' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                  </svg>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-base ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap ml-4 bg-white/60 px-2 py-1 rounded-md border border-slate-100">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 leading-relaxed ${!n.isRead ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                    {n.message}
                  </p>
                  {n.relatedEntityId && (
                    <div className="mt-3">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-bold transition-colors">
                        Xem chi tiết &rarr;
                      </button>
                    </div>
                  )}
                </div>
                {!n.isRead && (
                  <div className="w-3 h-3 rounded-full bg-blue-500 self-center shadow-sm shadow-blue-500/40"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
