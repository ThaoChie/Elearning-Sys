// ============================================================
// STUDENT DASHBOARD MOCK DATA
// Mô phỏng Domain Model SRS Chương 3 — dùng để dev/demo
// Trong production: thay bằng API calls với JWT auth
// SECURITY NOTE: UserID luôn lấy từ JWT Claims, không hardcode
// ============================================================

import type {
  StudentCourse,
  UpcomingExam,
  SecurityStatus,
  DeadlineEvent,
  StudentStats,
} from '../../types/student'

import { dbGetCourses, dbEnrollCourse } from '../../data/mockDatabase'

// Simulated JWT-extracted user ID (production: từ useAuth hook)
export const MOCK_USER_ID = 'USR-2024-0042'
export const MOCK_USER_NAME = 'Nguyễn Văn An'

// ─── Mock Courses ─────────────────────────────────────────────
export const MOCK_COURSES = dbGetCourses()

export const enrollInMockCourse = (courseId: string) => {
  dbEnrollCourse(courseId)
}

// ─── Mock Exams ───────────────────────────────────────────────
const now = new Date()
const inOneHour = new Date(now.getTime() + 60 * 60_000).toISOString()
const inTwoDays = new Date(now.getTime() + 2 * 86_400_000).toISOString()
const inFiveDays = new Date(now.getTime() + 5 * 86_400_000).toISOString()
const endInTwoHours = new Date(now.getTime() + 2 * 60 * 60_000).toISOString()

export const MOCK_EXAMS: UpcomingExam[] = [
  {
    id: 'EXM-2024-101',
    title: 'Kiểm tra giữa kỳ — An ninh mạng',
    courseName: 'An ninh mạng cơ bản (CEH Foundation)',
    courseId: 'CRS-001',
    startAt: inOneHour,
    endAt: endInTwoHours,
    durationMinutes: 60,
    antiCheatEnabled: true,
    fullscreenRequired: true,
    tabSwitchLimit: 3,
  },
  {
    id: 'EXM-2024-102',
    title: 'Quiz Tuần 6 — React Hooks & Context',
    courseName: 'Lập trình Web với React & TypeScript',
    courseId: 'CRS-002',
    startAt: inTwoDays,
    endAt: new Date(new Date(inTwoDays).getTime() + 45 * 60_000).toISOString(),
    durationMinutes: 45,
    antiCheatEnabled: true,
    fullscreenRequired: true,
    tabSwitchLimit: 3,
  },
  {
    id: 'EXM-2024-103',
    title: 'Bài tập thực hành CI/CD (Nộp bài)',
    courseName: 'DevOps & CI/CD Pipeline',
    courseId: 'CRS-004',
    startAt: inFiveDays,
    endAt: new Date(new Date(inFiveDays).getTime() + 120 * 60_000).toISOString(),
    durationMinutes: 120,
    antiCheatEnabled: false,
    fullscreenRequired: false,
    tabSwitchLimit: 0,
  },
]

// ─── Mock Security Status (SRS §2.1, UC-20) ──────────────────
export const MOCK_SECURITY_STATUS: SecurityStatus = {
  mfaEnabled: false, // sẽ kích hoạt warning
  securityScore: 62,
  lastPasswordChangeAt: '2024-10-01T00:00:00Z',
  recentFailedLogins: 2,
  activeSessions: [
    {
      id: 'SES-001',
      deviceName: 'Chrome trên Windows 11',
      deviceType: 'desktop',
      ipAddress: '118.70.xxx.xxx',
      location: 'Hà Nội, VN',
      lastActiveAt: 'Vừa xong',
      isCurrent: true,
    },
    {
      id: 'SES-002',
      deviceName: 'Safari trên iPhone 15',
      deviceType: 'mobile',
      ipAddress: '27.65.xxx.xxx',
      location: 'TP.HCM, VN',
      lastActiveAt: '2 giờ trước',
      isCurrent: false,
    },
    {
      id: 'SES-003',
      deviceName: 'Firefox trên Ubuntu',
      deviceType: 'desktop',
      ipAddress: '203.162.xxx.xxx',
      location: 'Đà Nẵng, VN',
      lastActiveAt: '1 ngày trước',
      isCurrent: false,
    },
  ],
}

// ─── Mock Deadline Events ─────────────────────────────────────
export const MOCK_DEADLINES: DeadlineEvent[] = [
  {
    id: 'DL-001',
    title: 'Kiểm tra giữa kỳ An ninh mạng',
    type: 'exam',
    courseId: 'CRS-001',
    dueAt: inOneHour,
  },
  {
    id: 'DL-002',
    title: 'Nộp bài tập Lab 3 — XSS Prevention',
    type: 'assignment',
    courseId: 'CRS-001',
    dueAt: inTwoDays,
  },
  {
    id: 'DL-003',
    title: 'Quiz React Hooks',
    type: 'exam',
    courseId: 'CRS-002',
    dueAt: inTwoDays,
  },
  {
    id: 'DL-004',
    title: 'Hoàn thành bài giảng Tuần 7 — Redux',
    type: 'lesson',
    courseId: 'CRS-002',
    dueAt: inFiveDays,
  },
  {
    id: 'DL-005',
    title: 'Nộp báo cáo CI/CD Pipeline',
    type: 'assignment',
    courseId: 'CRS-004',
    dueAt: inFiveDays,
  },
]

// ─── Mock Stats ───────────────────────────────────────────────
export const MOCK_STATS: StudentStats = {
  enrolledCourses: 3,
  completedCourses: 1,
  upcomingExams: 2,
  averageScore: 8.4,
  totalStudyHours: 147,
  weeklyGoalMinutes: 300,
  weeklyStudiedMinutes: 215,
}
