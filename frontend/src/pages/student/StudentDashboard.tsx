// ============================================================
// STUDENT DASHBOARD PAGE
// Layout: Main Content (2/3) + Right Sidebar (1/3)
// Widgets: StatsBar, LearningProgressCard, ExamCard,
//          SecurityStatusWidget, DeadlineCalendar
// Design: Navy #1F3864, Glassmorphism, Card-based Modern Education
// SECURITY: user.id từ JWT Claims, không từ URL/params
// ============================================================

import {
  BookOpen,
  ClipboardList,
  Trophy,
  Clock,
  TrendingUp,
  Flame,
  GraduationCap,
  RefreshCw,
} from 'lucide-react'
import LearningProgressCard from '../../components/dashboard/widgets/LearningProgressCard'
import SecurityStatusWidget from '../../components/dashboard/widgets/SecurityStatusWidget'
import ExamCard from '../../components/dashboard/widgets/ExamCard'
import DeadlineCalendar from '../../components/dashboard/widgets/DeadlineCalendar'
import { useState } from 'react'
import { useStudentDashboard } from '../../hooks/useStudentDashboard'
import type { DashboardUser } from '../../types/dashboard'
import { useNavigate } from 'react-router-dom'

interface StudentDashboardProps {
  // user được truyền từ DashboardShell — UserID lấy từ JWT, không từ URL
  user: DashboardUser
}

// ─── Skeleton Loader ─────────────────────────────────────────
function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200/50 bg-white/50 animate-pulse shadow-sm ${className}`}>
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-16 bg-slate-50 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Stats Bar Card ───────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  accent?: string
}

function StatCard({ icon, label, value, sub, accent = 'indigo' }: StatCardProps) {
  const accentMap: Record<string, string> = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    green: 'text-green-400 bg-green-500/10 border-green-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  }

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200/40 bg-slate-50/60 backdrop-blur-sm hover:border-slate-600/50 transition-colors">
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${accentMap[accent] ?? accentMap.indigo}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-slate-500 text-xs truncate">{label}</p>
        <p className="text-slate-900 font-bold text-lg leading-tight">{value}</p>
        {sub && <p className="text-slate-500 text-[10px] truncate">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Weekly Progress Bar ──────────────────────────────────────
function WeeklyGoalBar({ studied, goal }: { studied: number; goal: number }) {
  const percent = Math.min(100, Math.round((studied / goal) * 100))
  const hours = Math.floor(studied / 60)
  const minutes = studied % 60

  return (
    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-500" />
          <span className="text-slate-800 text-sm font-semibold">Mục tiêu tuần này</span>
        </div>
        <span className="text-indigo-600 font-bold text-sm">{percent}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden mb-2 shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${percent}%`,
            background: percent >= 80
              ? 'linear-gradient(90deg, #22c55e, #4ade80)'
              : 'linear-gradient(90deg, #4f46e5, #818cf8)',
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} đã học
        </span>
        <span>Mục tiêu: {Math.floor(goal / 60)}h/tuần</span>
      </div>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  count,
  action,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0 text-indigo-400">{icon}</div>
        <h2 className="text-slate-800 font-semibold text-base">{title}</h2>
        {count !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 font-medium">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────────
export default function StudentDashboard({ user }: StudentDashboardProps) {
  // SECURITY: userId lấy từ user.id (prop từ JWT), tuyệt đối không từ URL
  const {
    courses,
    exams,
    securityStatus,
    deadlines,
    stats,
    isLoading,
    continueCourse,
    refreshSecurity,
  } = useStudentDashboard({ userId: user.id })

  const enrolledCourses = courses.filter((c) => c.isEnrolled)
  const exploreCourses = courses.filter((c) => !c.isEnrolled)

  const [activeTab, setActiveTab] = useState<'enrolled' | 'explore'>('enrolled')
  const navigate = useNavigate()

  const handleExploreClick = (courseId: string) => {
    navigate(`/dashboard/student/courses/${courseId}`)
  }

  return (
    <div className="min-h-full space-y-6">

      {/* ══════════════════════════════════════════════════════
          WELCOME HEADER
      ══════════════════════════════════════════════════════ */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            Xin chào,{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {user.name.split(' ').slice(-1)[0]}
            </span>{' '}
            👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tiếp tục hành trình học tập của bạn hôm nay
          </p>
        </div>

        <button
          onClick={refreshSecurity}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200/40 hover:border-slate-600/50 transition-all"
          aria-label="Làm mới dữ liệu dashboard"
        >
          <RefreshCw size={12} />
          Làm mới
        </button>
      </header>

      {/* ══════════════════════════════════════════════════════
          STATS BAR (5 metrics)
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          icon={<BookOpen size={18} />}
          label="Đang học"
          value={stats.enrolledCourses}
          sub="khóa học"
          accent="indigo"
        />
        <StatCard
          icon={<Trophy size={18} />}
          label="Hoàn thành"
          value={stats.completedCourses}
          sub="khóa học"
          accent="green"
        />
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Thi sắp tới"
          value={stats.upcomingExams}
          sub="bài thi"
          accent="amber"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Điểm TB"
          value={`${stats.averageScore}/10`}
          sub="tất cả môn"
          accent="sky"
        />
        <StatCard
          icon={<GraduationCap size={18} />}
          label="Tổng giờ học"
          value={`${stats.totalStudyHours}h`}
          sub="tích lũy"
          accent="rose"
        />
      </div>

      {/* Weekly Goal full width */}
      <WeeklyGoalBar
        studied={stats.weeklyStudiedMinutes}
        goal={stats.weeklyGoalMinutes}
      />

      {/* ══════════════════════════════════════════════════════
          2-COLUMN LAYOUT: Main + Right Sidebar
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── MAIN CONTENT (2/3) ─────────────────────────── */}
        <div className="xl:col-span-2 space-y-8">

          {/* ── My Courses & Explore ── */}
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
              <div className="flex gap-6">
                <button 
                  onClick={() => setActiveTab('enrolled')}
                  className={`flex items-center gap-2 font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'enrolled' ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                >
                  <BookOpen size={18} />
                  Khóa học của tôi
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white text-slate-600 ml-1">
                    {enrolledCourses.length}
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('explore')}
                  className={`flex items-center gap-2 font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'explore' ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
                >
                  <TrendingUp size={18} />
                  Khám phá
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white text-slate-600 ml-1">
                    {exploreCourses.length}
                  </span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeTab === 'enrolled' 
                  ? enrolledCourses.map((course) => (
                      <LearningProgressCard
                        key={course.id}
                        course={course}
                        onContinue={continueCourse}
                      />
                    ))
                  : exploreCourses.map((course) => (
                      <div key={course.id} className="bg-white/70 border border-slate-200/50 rounded-xl p-5 hover:border-slate-600 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-indigo-500/20 text-indigo-300">
                            {course.category}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">16 bài học</span>
                        </div>
                        <h3 className="text-slate-900 font-bold mb-1 truncate">{course.title}</h3>
                        <p className="text-sm text-slate-500 mb-4">{course.instructorName}</p>
                        <button 
                          onClick={() => handleExploreClick(course.id)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-slate-900 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    ))
                }
              </div>
            )}
          </section>

          {/* ── Upcoming Exams ── */}
          <section>
            <SectionHeader
              icon={<ClipboardList size={18} />}
              title="Bài thi sắp tới"
              count={exams.length}
              action={
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Server-side Timer
                </span>
              }
            />

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => <SkeletonCard key={i} className="h-48" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exams.map((exam) => (
                  <ExamCard key={exam.id} exam={exam} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT SIDEBAR (1/3) ────────────────────────── */}
        <aside className="xl:col-span-1 space-y-5">
          {/* Security Status Widget */}
          {isLoading ? (
            <SkeletonCard className="h-72" />
          ) : (
            <SecurityStatusWidget status={securityStatus} />
          )}

          {/* Deadline Calendar */}
          {isLoading ? (
            <SkeletonCard className="h-64" />
          ) : (
            <DeadlineCalendar events={deadlines} />
          )}
        </aside>
      </div>
    </div>
  )
}
