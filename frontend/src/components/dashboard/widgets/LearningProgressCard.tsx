// ============================================================
// LEARNING PROGRESS CARD
// Hiển thị tiến độ khóa học với Radial Progress + Enrollment guard (BR-07)
// Security: Không render nếu chưa enroll; placeholder watermark cho video preview
// Design: Navy #1F3864, Neutral #595959 — Card-based glassmorphism
// ============================================================

import { BookOpen, Clock, Lock, Play, CheckCircle2 } from 'lucide-react'
import type { StudentCourse } from '../../../types/student'

interface LearningProgressCardProps {
  course: StudentCourse
  onContinue?: (courseId: string) => void
}

// ─── Radial Progress SVG ─────────────────────────────────────
function RadialProgress({ percent, size = 64 }: { percent: number; size?: number }) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - percent / 100)

  const color =
    percent >= 80 ? '#22c55e'  // green-500
    : percent >= 50 ? '#6366f1' // indigo-500
    : '#f59e0b'                 // amber-500

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={6}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {/* Text */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={size * 0.22}
        fontWeight="700"
      >
        {percent}%
      </text>
    </svg>
  )
}

// ─── Video Preview với Watermark Placeholder ─────────────────
function VideoPreviewPlaceholder({ courseId, userId }: { courseId: string; userId: string }) {
  return (
    // SRS §2.4: Watermark canvas overlay — placeholder cho SecureVideoPlayer thật
    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-white/60 border border-slate-200/40 flex items-center justify-center group cursor-pointer select-none">
      {/* Thumbnail placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1F3864]/40 to-slate-900/60" />

      {/* Dynamic watermark overlay (SRS §2.4) */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none"
        aria-hidden="true"
      >
        <span className="text-[10px] text-slate-900 font-mono rotate-[-25deg] whitespace-nowrap tracking-widest">
          {userId} • {new Date().toLocaleDateString('vi-VN')}
        </span>
      </div>

      {/* Play button */}
      <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-indigo-500/30 group-hover:border-indigo-400/50 transition-all duration-200">
        <Play size={16} className="text-slate-900 ml-0.5" fill="white" />
      </div>

      {/* Lock icon ở góc trên phải (nhắc nhở Signed URL) */}
      <div className="absolute top-2 right-2 opacity-50">
        <Lock size={10} className="text-slate-500" />
      </div>

      {/* Hidden: data attributes cho SecureVideoPlayer tích hợp sau */}
      <span
        className="sr-only"
        data-course-id={courseId}
        data-watermark-user={userId}
        aria-label="Video bài giảng — sẽ phát qua Signed URL"
      />
    </div>
  )
}

// ─── Main Card Component ──────────────────────────────────────
export default function LearningProgressCard({ course, onContinue }: LearningProgressCardProps) {
  // BR-07: Không render nếu chưa có enrollment hợp lệ
  if (!course.isEnrolled) {
    return (
      <div className="rounded-xl border border-slate-200/40 bg-slate-50/50 p-5 flex items-center gap-3 opacity-60">
        <Lock size={20} className="text-slate-500 flex-shrink-0" />
        <div>
          <p className="text-slate-500 text-sm font-medium">{course.title}</p>
          <p className="text-slate-600 text-xs mt-0.5">Chưa đăng ký khóa học này</p>
        </div>
      </div>
    )
  }

  const statusLabel =
    course.progress === 100
      ? 'Hoàn thành'
      : course.progress > 0
      ? 'Đang học'
      : 'Chưa bắt đầu'

  const statusColor =
    course.progress === 100
      ? 'text-green-400 bg-green-500/10 border-green-500/25'
      : course.progress > 0
      ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/25'
      : 'text-slate-500 bg-slate-700/30 border-slate-600/30'

  return (
    <article
      className="
        group relative rounded-xl border border-slate-200/60
        bg-white/80 backdrop-blur-md p-5 flex flex-col gap-4
        hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10
        transition-all duration-300 cursor-pointer
      "
      aria-label={`Khóa học: ${course.title}`}
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        {/* Course Icon / Category Badge */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#1F3864] to-indigo-700 flex items-center justify-center shadow-md">
          <BookOpen size={18} className="text-indigo-200" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-slate-800 font-semibold text-sm leading-snug truncate group-hover:text-slate-900 transition-colors">
            {course.title}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5 truncate">{course.instructorName}</p>
        </div>

        {/* Status badge */}
        <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* ── Video Preview (nếu có bài giảng tiếp theo) ── */}
      {course.nextLessonId && (
        <VideoPreviewPlaceholder courseId={course.id} userId={course.enrolledUserId} />
      )}

      {/* ── Progress Row ── */}
      <div className="flex items-center gap-4">
        {/* Radial Progress */}
        <div className="flex-shrink-0">
          <RadialProgress percent={course.progress} size={60} />
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-1.5">
          {/* Linear bar */}
          <div className="w-full bg-white rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${course.progress}%`,
                background: 'linear-gradient(90deg, #4f46e5, #818cf8)',
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={11} className="text-indigo-400" />
              {course.completedLessons}/{course.totalLessons} bài
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              ~{course.remainingMinutes} phút còn lại
            </span>
          </div>
        </div>
      </div>

      {/* ── CTA Button ── */}
      {course.progress < 100 && (
        <button
          onClick={() => onContinue?.(course.id)}
          className="
            w-full py-2 rounded-lg text-xs font-semibold
            bg-indigo-500/10 border border-indigo-500/25 text-indigo-300
            hover:bg-indigo-500/20 hover:border-indigo-400/40 hover:text-indigo-200
            active:scale-[0.98] transition-all duration-150
          "
          aria-label={`Tiếp tục học khóa ${course.title}`}
        >
          {course.progress === 0 ? 'Bắt đầu học' : 'Tiếp tục học'}
        </button>
      )}

      {course.progress === 100 && (
        <div className="w-full py-2 rounded-lg text-xs font-semibold text-center text-green-400 bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-1.5">
          <CheckCircle2 size={13} />
          Đã hoàn thành
        </div>
      )}
    </article>
  )
}
