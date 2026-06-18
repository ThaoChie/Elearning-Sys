import React from 'react';

interface RecentActivitiesProps {
  data: any;
  loading: boolean;
}

// --- Kiểu nội bộ sau khi merge từ API ---
type MergedActivity = {
  id: string;
  type: 'assignment' | 'exam';
  title: string;
  course: string;
  date: string;   // ISO string dùng để sort
  isOverdue?: boolean;
  questions?: number;
};

// Icon upload (assignment)
const IconUpload = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

// Icon clipboard (exam/quiz)
const IconClipboard = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

// ============================================================
// RECENT ACTIVITIES - Nhật ký hoạt động gần đây
// ============================================================
const RecentActivities: React.FC<RecentActivitiesProps> = ({ data, loading }) => {
  // Merge recentAssignments + recentQuizzes, sort desc by date, lấy 6 items
  const activities: MergedActivity[] = React.useMemo(() => {
    if (!data) return [];

    const assignments: MergedActivity[] = (data.recentAssignments ?? []).map((a: any) => ({
      id: `assignment-${a.id}`,
      type: 'assignment' as const,
      title: a.title,
      course: a.course,
      date: a.dueAt,
      isOverdue: a.isOverdue,
    }));

    const quizzes: MergedActivity[] = (data.recentQuizzes ?? []).map((q: any) => ({
      id: `quiz-${q.id}`,
      type: 'exam' as const,
      title: q.title,
      course: q.course,
      date: q.createdAt,
      questions: q.questions,
    }));

    return [...assignments, ...quizzes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [data]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Hoạt Động Gần Đây</h3>
          <p className="text-xs text-slate-500 mt-0.5">Nhật ký bất biến (HMAC-signed)</p>
        </div>
        {/* Section 2.5: Nhật ký được ký HMAC-SHA256, không thể xóa/sửa */}
        <button className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
          Xem tất cả →
        </button>
      </div>

      {/* Activity List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {loading ? (
          /* Skeleton */
          <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400">Đang tải hoạt động…</p>
          </div>
        ) : activities.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-2 py-8 text-center">
            <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-400 font-medium">Chưa có hoạt động nào</p>
          </div>
        ) : (
          activities.map((activity) => {
            const isAssignment = activity.type === 'assignment';

            // Style theo loại
            const iconBg = isAssignment ? 'bg-indigo-50' : 'bg-violet-50';
            const iconText = isAssignment ? 'text-indigo-500' : 'text-violet-500';

            // Format date
            const formattedDate = activity.date
              ? new Date(activity.date).toLocaleDateString('vi-VN')
              : '';

            // Message
            const messageNode = isAssignment ? (
              <span>
                {activity.title}
                {activity.course && (
                  <span className="text-slate-400"> · {activity.course}</span>
                )}
                {activity.isOverdue && (
                  <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-red-50 text-red-500">
                    Quá hạn
                  </span>
                )}
              </span>
            ) : (
              <span>
                {activity.title}
                {activity.course && (
                  <span className="text-slate-400"> · {activity.course}</span>
                )}
                {activity.questions != null && (
                  <span className="text-slate-400"> · {activity.questions} câu</span>
                )}
              </span>
            );

            return (
              <div key={activity.id} className="flex items-start gap-3 group">
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${iconBg} ${iconText} flex items-center justify-center mt-0.5`}>
                  {isAssignment ? <IconUpload /> : <IconClipboard />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      isAssignment
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-violet-50 text-violet-600'
                    }`}>
                      {isAssignment ? 'Bài tập' : 'Đề thi'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    {messageNode}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">{formattedDate}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer - integrity note */}
      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-[10px] text-slate-500">
          Log bất biến · HMAC-SHA256 · Không thể xóa/sửa (Section 2.5)
        </p>
      </div>
    </div>
  );
};

export default RecentActivities;
