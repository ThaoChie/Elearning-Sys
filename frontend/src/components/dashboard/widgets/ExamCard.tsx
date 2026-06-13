// ============================================================
// EXAM CARD WIDGET
// Hiển thị bài thi sắp tới với Anti-cheat flag (SRS §2.3)
// Server-side timer note, Fullscreen enforcement warning
// ============================================================

import { useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Shield,
  Timer,
  AlertCircle,
  CalendarClock,
  ChevronRight,
  Lock,
} from 'lucide-react'
import type { UpcomingExam } from '../../../types/student'

interface ExamCardProps {
  exam: UpcomingExam
}

// ─── Countdown label helper ───────────────────────────────────
function getCountdownLabel(startAt: string): { label: string; urgent: boolean } {
  const diff = new Date(startAt).getTime() - Date.now()
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)

  if (diff < 0) return { label: 'Đã kết thúc', urgent: false }
  if (hours < 1) return { label: 'Dưới 1 giờ nữa', urgent: true }
  if (hours < 24) return { label: `${hours} giờ nữa`, urgent: hours < 3 }
  return { label: `${days} ngày nữa`, urgent: days <= 1 }
}

export default function ExamCard({ exam }: ExamCardProps) {
  const navigate = useNavigate()
  const { label: countdownLabel, urgent } = getCountdownLabel(exam.startAt)

  const now = Date.now()
  const startTime = new Date(exam.startAt).getTime()
  const endTime = new Date(exam.endAt).getTime()
  const isLive = now >= startTime && now <= endTime
  const isUpcoming = now < startTime
  const isPast = now > endTime

  return (
    <article
      className={`
        rounded-xl border p-5 flex flex-col gap-4 relative overflow-hidden transition-all duration-300 shadow-sm
        ${isLive
          ? 'border-green-500/40 bg-green-50/50 shadow-md shadow-green-500/10'
          : urgent
          ? 'border-amber-500/50 bg-gradient-to-br from-amber-50/90 to-amber-100/60 shadow-amber-500/10'
          : isPast
          ? 'border-slate-200/50 bg-slate-50/30 opacity-60'
          : 'border-slate-200/60 bg-white/80'}
        hover:border-indigo-500/40 hover:shadow-indigo-500/10 hover:shadow-lg
      `}
      aria-label={`Bài thi: ${exam.title}`}
    >
      {/* Live badge */}
      {isLive && (
        <div className="absolute -top-2 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500 text-slate-900 text-[10px] font-bold shadow-lg shadow-green-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          ĐANG DIỄN RA
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start gap-3 pt-1">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-[#1F3864] to-slate-700 flex items-center justify-center border border-slate-600/30">
          <ClipboardList size={16} className="text-indigo-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-slate-800 font-semibold text-sm leading-tight truncate">
            {exam.title}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{exam.courseName}</p>
        </div>
      </div>

      {/* ── Anti-cheat flags (SRS §2.3) ── */}
      {exam.antiCheatEnabled && (
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-medium">
            <Shield size={9} />
            Anti-cheat
          </span>
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30 text-slate-500">
            <Lock size={9} />
            Fullscreen
          </span>
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600/30 text-slate-500">
            <Timer size={9} />
            Server Timer
          </span>
        </div>
      )}

      {/* ── Meta info ── */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <CalendarClock size={12} className="text-slate-500 flex-shrink-0" />
          <span className="truncate">
            {new Date(exam.startAt).toLocaleDateString('vi-VN', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Timer size={12} className="text-slate-500 flex-shrink-0" />
          <span>{exam.durationMinutes} phút</span>
        </div>
      </div>

      {/* ── Countdown / Status ── */}
      <div className={`flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-2 ${
        isLive ? 'text-green-300 bg-green-500/10 border border-green-500/20'
        : urgent ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20'
        : isPast ? 'text-slate-500 bg-white/70 border border-slate-200/50'
        : 'text-slate-500 bg-white/70 border border-slate-200/50'
      }`}>
        {urgent && !isLive && <AlertCircle size={12} />}
        {countdownLabel}
      </div>

      {/* ── CTA ── */}
      {(isLive || isUpcoming) && (
        <button
          onClick={() => navigate(`/exam/${exam.id}`)}
          disabled={!isLive}
          className={`
            w-full py-2 rounded-lg text-xs font-semibold
            flex items-center justify-center gap-1.5
            transition-all duration-150 active:scale-[0.98]
            ${isLive
              ? 'bg-green-500 text-slate-900 hover:bg-green-400 shadow-md shadow-green-500/20'
              : 'bg-white/60 text-slate-500 border border-slate-200/40 cursor-not-allowed'}
          `}
          aria-label={isLive ? `Vào thi ${exam.title}` : 'Chưa đến giờ thi'}
        >
          {isLive ? (
            <>
              <Shield size={13} />
              Vào phòng thi ngay
            </>
          ) : (
            <>
              <CalendarClock size={13} />
              Chưa đến giờ thi
            </>
          )}
          {isLive && <ChevronRight size={13} />}
        </button>
      )}
    </article>
  )
}
