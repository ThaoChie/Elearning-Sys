// ============================================================
// DASHBOARD SHELL  — Container chính
// Master-Detail layout: Sidebar (nav) + Main Area (routed content)
// Nhận vào navItems đã lọc theo Role từ parent
// ============================================================

import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './sidebar/Sidebar'
import { getNavForRole } from './sidebar/navConfig'
import type { DashboardUser } from '../../types/dashboard'

// ─── Lazy-load tất cả 10 phân hệ ───────────────────────────
// System (Admin)
const SystemOverview   = lazy(() => import('../../pages/system/SystemOverview'))
const AuthPage         = lazy(() => import('../../pages/system/AuthPage'))
const UsersPage        = lazy(() => import('../../pages/system/UsersPage'))
const AuditPage        = lazy(() => import('../../pages/system/AuditPage'))
const StoragePage      = lazy(() => import('../../pages/system/StoragePage'))

// Academic (Admin + Instructor)
const InstructorDashboard = lazy(() => import('../../pages/InstructorDashboard'))
const ExamsPage         = lazy(() => import('../../pages/academic/ExamsPage'))
const ExamBuilder       = lazy(() => import('../../pages/academic/ExamBuilder'))
const GradingPage       = lazy(() => import('../../pages/academic/GradingPage'))
const CoursesPage      = lazy(() => import('../../pages/academic/CoursesPage'))
const InstructorCourseDetail = lazy(() => import('../../pages/academic/InstructorCourseDetail'))

// Student
const SubmissionsPage   = lazy(() => import('../../pages/student/SubmissionsPage'))
const ReportsPage       = lazy(() => import('../../pages/student/ReportsPage'))
const StudentDashboard  = lazy(() => import('../../pages/student/StudentDashboard'))
const CourseDetail      = lazy(() => import('../../pages/student/CourseDetail'))
const LessonPlayer      = lazy(() => import('../../pages/student/LessonPlayer'))

// Shared
const NotificationsPage = lazy(() => import('../../pages/NotificationsPage'))
const UserProfile = lazy(() => import('../../pages/UserProfile'))

// ─── Fallback Spinner ────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Đang tải phân hệ...</p>
      </div>
    </div>
  )
}

// ─── Default redirect per role ───────────────────────────────
const ROLE_DEFAULT_PATH: Record<string, string> = {
  Admin: '/dashboard/system',
  Instructor: '/dashboard/academic/courses',
  Student: '/dashboard/student/home',
}

interface DashboardShellProps {
  user: DashboardUser
  onLogout: () => void
}

export default function DashboardShell({ user, onLogout }: DashboardShellProps) {
  const navItems = getNavForRole(user.role)
  const defaultPath = ROLE_DEFAULT_PATH[user.role] ?? '/dashboard/system'

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden font-sans text-slate-800"
      style={{
        backgroundImage: 'url("/assets/cloud-bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <Sidebar user={user} navItems={navItems} onLogout={onLogout} />

      {/* ── Main Content Area ────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white/40 backdrop-blur-md">
        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Default redirect */}
              <Route index element={<Navigate to={defaultPath} replace />} />

              {/* ─ Instructor routes ─ */}
              <Route path="instructor/home" element={<InstructorDashboard user={user} />} />

              {/* ─ System routes (Admin) ─ */}
              <Route path="system" element={<SystemOverview user={user} />} />
              <Route path="system/auth" element={<AuthPage />} />
              <Route path="system/users" element={<UsersPage />} />
              <Route path="system/audit" element={<AuditPage />} />
              <Route path="system/storage" element={<StoragePage />} />

              {/* ─ Academic routes (Admin + Instructor) ─ */}
              <Route path="academic/courses" element={<CoursesPage user={user} />} />
              <Route path="academic/courses/:courseId" element={<InstructorCourseDetail />} />
              <Route path="academic/exams" element={<ExamsPage />} />
              <Route path="academic/exams/:examId" element={<ExamBuilder />} />
              <Route path="academic/grading" element={<GradingPage />} />

              {/* ─ Student routes ─ */}
              <Route path="student/home" element={<StudentDashboard user={user} />} />
              <Route path="student/courses/:courseId" element={<CourseDetail />} />
              <Route path="student/courses/:courseId/learn" element={<LessonPlayer />} />
              <Route path="student/submissions" element={<SubmissionsPage />} />
              <Route path="student/reports" element={<ReportsPage />} />

              {/* ─ Shared ─ */}
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<UserProfile user={user} />} />

              {/* 404 fallback */}
              <Route path="*" element={<Navigate to={defaultPath} replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  )
}
