import React from 'react';

// --- Kiểu dữ liệu ---
type StatCard = {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  /** BR-19: highlight đỏ nếu có bài quá hạn */
  isUrgent?: boolean;
  urgentLabel?: string;
};

// --- Dữ liệu mô phỏng từ SRS v1.0 (Role: Instructor) ---
// Trong thực tế, dữ liệu này được fetch từ API có bảo vệ RBAC.
// UserID được lấy từ JWT Claims, KHÔNG từ URL param (chống IDOR - Section 2.2).

// ============================================================
// STAT CARD - Component con hiển thị từng chỉ số
// ============================================================
const StatCardItem: React.FC<{ card: StatCard }> = ({ card }) => {
  /**
   * BR-19 (Anti-cheat & Integrity): Nếu có bài tập quá hạn chưa được chấm,
   * card hiển thị viền đỏ và badge cảnh báo để nhắc Instructor hành động.
   * Màu sắc là tín hiệu UX quan trọng trong hệ thống LMS có kiểm soát.
   */
  const isUrgent = card.isUrgent;

  return (
    <div
      className={`
        relative bg-white rounded-2xl p-5 shadow-sm border
        transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
        ${isUrgent
          ? 'border-red-200 ring-1 ring-red-100'
          : 'border-slate-100'}
      `}
    >
      {/* Urgent Badge - BR-19 */}
      {isUrgent && card.urgentLabel && (
        <span className="
          absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-slate-900
          text-[10px] font-bold rounded-full shadow-sm shadow-red-200 animate-pulse
        ">
          {card.urgentLabel}
        </span>
      )}

      <div className="flex items-start justify-between">
        {/* Icon container */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${isUrgent
            ? 'bg-red-50 text-red-500'
            : 'bg-indigo-50 text-indigo-500'}
        `}>
          {card.icon}
        </div>

        {/* Trend indicator */}
        {card.trend && (
          <div className={`
            flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full
            ${card.trend.positive
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-red-50 text-red-500'}
          `}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d={card.trend.positive ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
            </svg>
            {card.trend.value}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        <p className={`text-2xl font-bold tracking-tight ${isUrgent ? 'text-red-600' : 'text-slate-800'}`}>
          {card.value}
        </p>
        <p className="mt-0.5 text-sm font-medium text-slate-500">{card.title}</p>
        <p className={`mt-1 text-xs ${isUrgent ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
          {card.subtitle}
        </p>
      </div>

      {/* Bottom accent line */}
      <div className={`
        absolute bottom-0 left-5 right-5 h-0.5 rounded-full
        ${isUrgent ? 'bg-gradient-to-r from-red-300 to-orange-300' : 'bg-gradient-to-r from-indigo-100 to-violet-100'}
      `} />
    </div>
  );
};

// ============================================================
// DASHBOARD STATS - Container cho 3 Stat Cards
// ============================================================
const DashboardStats: React.FC<{ data: any, loading: boolean }> = ({ data, loading }) => {
  if (loading) return <div className="p-4 text-center text-slate-500 bg-white/70 backdrop-blur-md rounded-2xl border border-white/50">Đang tải thống kê...</div>;
  if (!data) return <div className="p-4 text-center text-red-500 bg-white/70 backdrop-blur-md rounded-2xl border border-white/50">Lỗi tải dữ liệu.</div>;

  const stats: StatCard[] = [
    {
      id: 'pending-grading',
      title: 'Tổng Bài Tập',
      value: data.totalAssignments ?? 0,
      subtitle: `${data.totalExams ?? 0} bài kiểm tra`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      isUrgent: false,
    },
    {
      id: 'active-students',
      title: 'Sinh Viên Đang Học',
      value: data.totalStudents ?? 0,
      subtitle: `Trên ${data.totalCourses ?? 0} khóa học đang mở`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      isUrgent: false,
    },
    {
      id: 'avg-score',
      title: 'Điểm Trung Bình',
      value: `${data.avgRating ?? '0'} / 5`,
      subtitle: 'Đánh giá trung bình từ học viên',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      isUrgent: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {stats.map((card) => (
        <StatCardItem key={card.id} card={card} />
      ))}
    </div>
  );
};

export default DashboardStats;
