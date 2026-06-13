// ============================================================
// DEADLINE CALENDAR WIDGET
// Sidebar phải: Hiển thị calendar tích hợp deadlines
// ============================================================

import { CalendarDays, AlertCircle, Clock } from 'lucide-react'
import type { DeadlineEvent } from '../../../types/student'

interface DeadlineCalendarProps {
  events: DeadlineEvent[]
}

function getDaysBetween(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86_400_000)
}

export default function DeadlineCalendar({ events }: DeadlineCalendarProps) {
  // Sort by date ascending
  const sorted = [...events].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  )

  return (
    <section
      className="
        rounded-xl border border-slate-200/60
        bg-white/80 backdrop-blur-md p-5 flex flex-col gap-4 shadow-sm
      "
      aria-labelledby="deadline-calendar-title"
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5">
        <CalendarDays size={18} className="text-indigo-400" />
        <h2 id="deadline-calendar-title" className="text-slate-800 font-semibold text-sm">
          Lịch & Deadlines
        </h2>
      </div>

      {/* ── Current date display ── */}
      <div className="text-center py-3 rounded-xl bg-indigo-50 border border-indigo-100 shadow-inner">
        <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1">Hôm nay</p>
        <p className="text-indigo-900 font-bold text-xl mt-0.5">
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
          })}
        </p>
        <p className="text-slate-500 text-xs">
          {new Date().toLocaleDateString('vi-VN', { year: 'numeric' })}
        </p>
      </div>

      {/* ── Deadline Events ── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Sắp tới
        </p>

        {sorted.length === 0 ? (
          <p className="text-slate-500 text-xs text-center py-4">Không có deadline sắp tới</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((event) => {
              const daysLeft = getDaysBetween(event.dueAt)
              const isUrgent = daysLeft <= 1
              const isPast = daysLeft < 0

              return (
                <div
                  key={event.id}
                  className={`
                    flex items-start gap-2.5 p-2.5 rounded-lg border text-xs
                    ${isUrgent && !isPast
                      ? 'bg-red-500/8 border-red-500/20'
                      : isPast
                      ? 'bg-white/60 border-slate-200/20 opacity-50'
                      : 'bg-white/70 border-slate-200/50'}
                  `}
                >
                  {/* Type indicator dot */}
                  <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                    event.type === 'exam' ? 'bg-red-400'
                    : event.type === 'assignment' ? 'bg-amber-400'
                    : 'bg-indigo-400'
                  }`} />

                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isPast ? 'text-slate-500' : 'text-slate-700'}`}>
                      {event.title}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5 flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(event.dueAt).toLocaleDateString('vi-VN', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Days badge */}
                  <div className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isPast ? 'text-slate-600 bg-white'
                    : isUrgent ? 'text-red-700 bg-red-100'
                    : daysLeft <= 3 ? 'text-amber-700 bg-amber-100'
                    : 'text-slate-600 bg-slate-100'
                  }`}>
                    {isPast ? 'Quá hạn'
                     : daysLeft === 0 ? 'Hôm nay'
                     : `${daysLeft}d`}
                  </div>

                  {isUrgent && !isPast && (
                    <AlertCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
