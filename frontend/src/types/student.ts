// ============================================================
// STUDENT TYPE DEFINITIONS
// Domain Model theo SRS Chương 3 — Student-facing entities
// ============================================================

// ─── Enrollment & Course (BR-07 guard) ───────────────────────
export interface StudentCourse {
  id: string
  title: string
  instructorName: string
  thumbnailUrl?: string

  // Enrollment guard — bắt buộc kiểm tra trước khi render (BR-07)
  isEnrolled: boolean
  enrolledUserId: string  // Lấy từ JWT Claims, không từ URL

  // Progress tracking
  progress: number           // 0–100
  completedLessons: number
  totalLessons: number
  remainingMinutes: number

  // Next lesson (nếu có video preview)
  nextLessonId?: string

  // Metadata
  category: string
  enrolledAt: string   // ISO timestamp
  lastAccessAt?: string
}

// ─── Exam (SRS §2.3 Anti-cheat) ──────────────────────────────
export interface UpcomingExam {
  id: string
  title: string
  courseName: string
  courseId: string

  // Scheduling
  startAt: string   // ISO timestamp — Server là nguồn chân lý Timer
  endAt: string
  durationMinutes: number

  // Anti-cheat flags (SRS §2.3)
  antiCheatEnabled: boolean
  fullscreenRequired: boolean
  tabSwitchLimit: number   // default: 3 lần vi phạm -> Force Submit

  // Status
  submittedAt?: string  // nếu đã nộp
  score?: number
}

// ─── Security & Sessions (SRS §2.1, UC-20) ───────────────────
export type DeviceType = 'mobile' | 'desktop' | 'web'

export interface ActiveSession {
  id: string
  deviceName: string
  deviceType: DeviceType
  ipAddress: string
  location: string
  lastActiveAt: string
  isCurrent: boolean
}

export interface SecurityStatus {
  mfaEnabled: boolean
  securityScore: number       // 0–100 computed từ MFA, sessions, recent logins
  activeSessions: ActiveSession[]
  lastPasswordChangeAt: string
  recentFailedLogins: number  // SRS §2.1 Account Lockout tracking
}

// ─── Calendar / Deadlines ─────────────────────────────────────
export type DeadlineType = 'exam' | 'assignment' | 'lesson'

export interface DeadlineEvent {
  id: string
  title: string
  type: DeadlineType
  courseId: string
  dueAt: string   // ISO timestamp
}

// ─── Dashboard Summary Stats ──────────────────────────────────
export interface StudentStats {
  enrolledCourses: number
  completedCourses: number
  upcomingExams: number
  averageScore: number   // 0–10
  totalStudyHours: number
  weeklyGoalMinutes: number
  weeklyStudiedMinutes: number
}
