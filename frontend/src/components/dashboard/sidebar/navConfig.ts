// ============================================================
// DASHBOARD NAVIGATION CONFIG
// Render động theo Role – mỗi NavItem map đến 1 trong 10 phân hệ
// ============================================================

import {
  ShieldCheck,     // Auth & IAM
  BookOpen,        // Courses
  ClipboardList,   // Exams
  FileUp,          // Submissions
  Star,            // Grading
  HardDrive,       // Storage
  ScrollText,      // Audit Logs
  Users,           // User Management
  Bell,            // Notifications
  BarChart3,       // Reports
  LayoutDashboard, // Student Home
  UserCircle,      // Profile
  type LucideProps,
} from 'lucide-react'
import type { NavItem, UserRole } from '../../../types/dashboard'
import type { ComponentType } from 'react'

// Map từ string key → Lucide Component (tránh import động gây bundle lớn)
export const SUBSYSTEM_ICONS: Record<string, ComponentType<LucideProps>> = {
  auth: ShieldCheck,
  courses: BookOpen,
  exams: ClipboardList,
  submissions: FileUp,
  grading: Star,
  storage: HardDrive,
  audit: ScrollText,
  users: Users,
  notifications: Bell,
  reports: BarChart3,
  student_home: LayoutDashboard,
  profile: UserCircle,
}


// ─── 10 phân hệ ────────────────────────────────────────────
export const ALL_NAV_ITEMS: NavItem[] = [
  // ─ Student Home ─
  {
    key: 'student_home' as any,
    label: 'Tổng quan',
    icon: 'student_home',
    path: '/dashboard/student/home',
    roles: ['Student'],
  },
  {
    key: 'auth' as any,
    label: 'Dashboard',
    icon: 'auth',
    path: '/dashboard/system',
    roles: ['Admin'],
  },
  {
    key: 'users',
    label: 'Quản lý người dùng',
    icon: 'users',
    path: '/dashboard/system/users',
    roles: ['Admin'],
  },
  {
    key: 'audit',
    label: 'Audit Logs',
    icon: 'audit',
    path: '/dashboard/system/audit',
    roles: ['Admin'],
  },
  {
    key: 'storage',
    label: 'Storage & File',
    icon: 'storage',
    path: '/dashboard/system/storage',
    roles: ['Admin'],
  },
  {
    key: 'courses',
    label: 'Khóa học',
    icon: 'courses',
    path: '/dashboard/academic/courses',
    roles: ['Instructor'],
  },
  {
    key: 'exams',
    label: 'Thi & Kiểm tra',
    icon: 'exams',
    path: '/dashboard/academic/exams',
    roles: ['Instructor'],
  },
  {
    key: 'grading',
    label: 'Chấm điểm',
    icon: 'grading',
    path: '/dashboard/academic/grading',
    roles: ['Instructor'],
  },
  {
    key: 'submissions',
    label: 'Bài nộp',
    icon: 'submissions',
    path: '/dashboard/student/submissions',
    roles: ['Student'],
  },
  {
    key: 'notifications',
    label: 'Thông báo',
    icon: 'notifications',
    path: '/dashboard/notifications',
    roles: ['Admin', 'Instructor', 'Student'],
  },
  {
    key: 'reports',
    label: 'Báo cáo học tập',
    icon: 'reports',
    path: '/dashboard/student/reports',
    roles: ['Student'],
  },
  {
    key: 'profile',
    label: 'Hồ sơ cá nhân',
    icon: 'profile',
    path: '/dashboard/profile',
    roles: ['Admin', 'Instructor', 'Student'],
  },
]

export const getNavForRole = (role: UserRole): NavItem[] =>
  ALL_NAV_ITEMS.filter((item) => item.roles.includes(role))
