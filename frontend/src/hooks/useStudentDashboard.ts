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

    apiClient.get('/courses')
      .then(res => {
        if (!isMounted) return;
        // /courses returns { items: [...] }
        const allCourses = res.data.items || res.data || [];
        
        // Transform the data to match StudentCourse type
        const mappedCourses = allCourses.map((c: any) => ({
          id: c.id || c.courseId,
          title: c.title,
          category: c.category || 'Backend',
          instructorName: c.instructorName || 'Admin',
          thumbnail: c.thumbnailUrl || 'https://via.placeholder.com/150',
          progress: c.progress || 0,
          isEnrolled: c.isEnrolled ?? false
        }));

        setState({
          courses: mappedCourses,
          exams: [],
          securityStatus: {
            mfaEnabled: false,
            securityScore: 100,
            activeSessions: [{
              id: 'sess-1',
              deviceType: 'desktop',
              deviceName: 'Web Browser',
              ipAddress: '127.0.0.1',
              location: 'Hanoi, VN',
              lastActiveAt: new Date().toISOString(),
              isCurrent: true
            }],
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
