import React from 'react';

// --- Kiểu dữ liệu Activity ---
type ActivityType = 'submission' | 'login_fail' | 'exam_started' | 'grade_updated' | 'violation';

type Activity = {
  id: string;
  type: ActivityType;
  actor: string;       // Tên người dùng (hiển thị)
  actorId: string;     // UserID (từ JWT Claims trong Audit Log)
  message: string;
  time: string;
  /** Liên kết đến Audit Log entry để truy vết */
  auditLogId?: string;
};

// --- Dữ liệu mô phỏng hoạt động gần đây ---
// Trong thực tế: fetch từ GET /api/instructor/audit-log?limit=10
// Đây là dữ liệu từ bảng AuditLogs bất biến (Section 2.5 - HMAC signed, no UPDATE/DELETE).
const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'a1', type: 'submission', actor: 'Trần Minh Khoa', actorId: 'SV-00142',
    message: 'Nộp bài: "Phân tích mã độc WannaCry"', time: '5 phút trước', auditLogId: 'LOG-9921',
  },
  {
    id: 'a2', type: 'violation', actor: 'Lê Thu Hà', actorId: 'SV-00088',
    message: 'Vi phạm Tab Switch lần 2 - Bài thi cuối kỳ', time: '12 phút trước', auditLogId: 'LOG-9918',
  },
  {
    id: 'a3', type: 'exam_started', actor: 'Phạm Quốc Bảo', actorId: 'SV-00205',
    message: 'Bắt đầu thi: "Mật Mã Học - Giữa kỳ"', time: '18 phút trước', auditLogId: 'LOG-9915',
  },
  {
    id: 'a4', type: 'grade_updated', actor: 'GV. Nguyễn Thành', actorId: 'GV-001',
    message: 'Cập nhật điểm SV-00142: 8.5/10', time: '1 giờ trước', auditLogId: 'LOG-9890',
  },
  {
    id: 'a5', type: 'login_fail', actor: 'Hoàng Văn Đức', actorId: 'SV-00317',
    message: 'Đăng nhập thất bại lần 3 (khóa sau 2 lần nữa)', time: '2 giờ trước', auditLogId: 'LOG-9872',
  },
  {
    id: 'a6', type: 'submission', actor: 'Nguyễn Thị Lan', actorId: 'SV-00099',
    message: 'Nộp bài: "Triển khai RSA từ đầu"', time: '3 giờ trước', auditLogId: 'LOG-9855',
  },
];

// --- Config màu sắc và icon theo loại activity ---
const ACTIVITY_CONFIG: Record<ActivityType, { bg: string; text: string; icon: React.ReactNode }> = {
  submission: {
    bg: 'bg-indigo-50', text: 'text-indigo-500',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>,
  },
  login_fail: {
    bg: 'bg-amber-50', text: 'text-amber-500',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>,
  },
  exam_started: {
    bg: 'bg-violet-50', text: 'text-violet-500',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>,
  },
  grade_updated: {
    bg: 'bg-emerald-50', text: 'text-emerald-500',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>,
  },
  violation: {
    bg: 'bg-red-50', text: 'text-red-500',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>,
  },
};

// ============================================================
// RECENT ACTIVITIES - Nhật ký hoạt động gần đây
// ============================================================
const RecentActivities: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Hoạt Động Gần Đây</h3>
          <p className="text-xs text-slate-400 mt-0.5">Nhật ký bất biến (HMAC-signed)</p>
        </div>
        {/* Section 2.5: Nhật ký được ký HMAC-SHA256, không thể xóa/sửa */}
        <button className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
          Xem tất cả →
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {MOCK_ACTIVITIES.map((activity) => {
          const config = ACTIVITY_CONFIG[activity.type];
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 group"
            >
              {/* Icon */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.bg} ${config.text} flex items-center justify-center mt-0.5`}>
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {activity.actor}
                  </span>
                  {/* ActorID từ Audit Log - hiển thị nhỏ để truy vết */}
                  <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                    {activity.actorId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5 truncate">
                  {activity.message}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400">{activity.time}</span>
                  {/* Section 2.5: Link đến Audit Log entry để truy vết */}
                  {activity.auditLogId && (
                    <span className="text-[10px] font-mono text-indigo-300 group-hover:text-indigo-500 transition-colors cursor-pointer">
                      #{activity.auditLogId}
                    </span>
                  )}
                </div>
              </div>

              {/* Violation highlight indicator */}
              {activity.type === 'violation' && (
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-400 mt-2 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer - integrity note */}
      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-[10px] text-slate-400">
          Log bất biến · HMAC-SHA256 · Không thể xóa/sửa (Section 2.5)
        </p>
      </div>
    </div>
  );
};

export default RecentActivities;
