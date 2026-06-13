// ============================================================
// useStudentDashboard — Custom Hook
// Quản lý state cho Student Dashboard: courses, exams, security
// SECURITY: UserID luôn lấy từ JWT Claims (prop user.id), không từ URL
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { StudentCourse, UpcomingExam, SecurityStatus, DeadlineEvent, StudentStats } from '../types/student'
import {
  MOCK_COURSES,
  MOCK_EXAMS,
  MOCK_SECURITY_STATUS,
  MOCK_DEADLINES,
  MOCK_STATS,
} from '../pages/student/mockData.student'

export interface StudentDashboardState {
  courses: StudentCourse[]
  exams: UpcomingExam[]
  securityStatus: SecurityStatus
  deadlines: DeadlineEvent[]
  stats: StudentStats
  isLoading: boolean
  error: string | null
}

interface UseStudentDashboardOptions {
  // userId luôn từ JWT Claims được truyền xuống từ parent (KHÔNG từ URL)
  userId: string
}

export function useStudentDashboard({ userId }: UseStudentDashboardOptions): StudentDashboardState & {
  refreshSecurity: () => void
  continueCourse: (courseId: string) => void
} {
  const [state, setState] = useState<StudentDashboardState>({
    courses: [],
    exams: [],
    securityStatus: MOCK_SECURITY_STATUS,
    deadlines: [],
    stats: MOCK_STATS,
    isLoading: true,
    error: null,
  })

  // Simulate API fetch — production: replace với axios calls + JWT bearer token
  useEffect(() => {
    if (!userId) return

    const timer = setTimeout(() => {
      setState({
        courses: MOCK_COURSES, // Giữ tất cả để show locked state (BR-07 demo)
        exams: MOCK_EXAMS,
        securityStatus: MOCK_SECURITY_STATUS,
        deadlines: MOCK_DEADLINES,
        stats: MOCK_STATS,
        isLoading: false,
        error: null,
      })
    }, 800)

    return () => clearTimeout(timer)
  }, [userId])

  const refreshSecurity = useCallback(() => {
    // Production: re-fetch /api/v1/auth/sessions với JWT
    console.info('[SecurityWidget] Refreshing session data for user:', userId)
  }, [userId])

  const navigate = useNavigate()

  const continueCourse = useCallback((courseId: string) => {
    navigate(`/dashboard/student/courses/${courseId}/learn`)
  }, [navigate])

  return { ...state, refreshSecurity, continueCourse }
}
