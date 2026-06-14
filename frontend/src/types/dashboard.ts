// ============================================================
// DASHBOARD TYPE DEFINITIONS
// Nguồn chân lý cho toàn bộ Unified Dashboard System
// ============================================================

export type UserRole = 'Admin' | 'Instructor' | 'Student'

export type SubsystemKey =
  | 'auth'
  | 'courses'
  | 'exams'
  | 'submissions'
  | 'grading'
  | 'storage'
  | 'audit'
  | 'users'
  | 'notifications'
  | 'reports'
  | 'student_home'
  | 'profile'

export type SystemHealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown'

export interface NavItem {
  key: SubsystemKey
  label: string
  icon: string // Lucide icon name
  path: string
  roles: UserRole[]
  badge?: number // notification count
}

export interface SubsystemHealth {
  key: SubsystemKey
  label: string
  status: SystemHealthStatus
  latencyMs?: number
  lastChecked: string // ISO timestamp
  message?: string
}

export interface SystemIntegrityReport {
  overallScore: number // 0–100
  totalLogs: number
  tamperedLogs: number
  lastAuditAt: string
  subsystems: SubsystemHealth[]
}

export interface DashboardUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarUrl?: string
}
