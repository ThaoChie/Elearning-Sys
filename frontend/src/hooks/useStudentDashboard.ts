// ============================================================
// useStudentDashboard — Custom Hook
// Quản lý state cho Student Dashboard: courses, exams, security
// SECURITY: UserID luôn lấy từ JWT Claims (prop user.id), không từ URL
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { StudentCourse, UpcomingExam, SecurityStatus, DeadlineEvent, StudentStats } from '../types/student'
import apiClient from '../api/apiClient'

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
    securityStatus: {
      mfaEnabled: false,
      securityScore: 100,
      activeSessions: [],
      lastPasswordChangeAt: new Date().toISOString(),
      recentFailedLogins: 0
    },
    deadlines: [],
    stats: {
      enrolledCourses: 0,
      completedCourses: 0,
      averageScore: 0,
      totalStudyHours: 0,
      upcomingExams: 0,
      weeklyGoalMinutes: 600,
      weeklyStudiedMinutes: 0
    },
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
          courses: data.courses || [],
          exams: data.exams || [],
          securityStatus: data.securityStatus || {
            lastLogin: new Date().toISOString(),
            ipAddress: '127.0.0.1',
            device: 'Web Browser',
            location: 'Unknown',
            suspiciousLogins: 0,
            mfaEnabled: false,
            activeSessions: 1
          },
          deadlines: data.deadlines || [],
          stats: {
            enrolledCourses: data.enrolledCourses ?? 0,
            completedCourses: data.completedCourses ?? 0,
            averageScore: data.averageScore ?? 0,
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
