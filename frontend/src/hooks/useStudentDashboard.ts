// ============================================================
// useStudentDashboard — Custom Hook
// Quản lý state cho Student Dashboard: courses, exams, security
// SECURITY: UserID luôn lấy từ JWT Claims (prop user.id), không từ URL
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { StudentCourse, UpcomingExam, SecurityStatus, DeadlineEvent, StudentStats } from '../types/student'
import apiClient from '../api/apiClient'
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

  useEffect(() => {
    if (!userId) return

    let isMounted = true
    setState(prev => ({ ...prev, isLoading: true }))

    apiClient.get('/student/dashboard')
      .then(res => {
        if (!isMounted) return;
        const data = res.data;
        setState({
          courses: MOCK_COURSES, // TODO: Replace with real courses later
            exams: MOCK_EXAMS,
            securityStatus: MOCK_SECURITY_STATUS,
            deadlines: MOCK_DEADLINES,
            stats: {
              enrolledCourses: data.enrolledCourses ?? 0,
              completedCourses: 0,
              averageScore: 0,
              totalStudyHours: data.completedLessons ?? 0,
              upcomingExams: data.upcomingExams?.length ?? 0,
              weeklyGoalMinutes: 600,
              weeklyStudiedMinutes: 450,
            },
            isLoading: false,
            error: null,
          });
        })
        .catch(err => {
          console.error(err);
          if (isMounted) setState(prev => ({ ...prev, isLoading: false }));
        })

    return () => { isMounted = false; }
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
