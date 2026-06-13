// ============================================================
// GLOBAL MOCK DATABASE
// In-memory data store for the prototype.
// Provides a unified data source across all roles (Admin, Instructor, Student)
// ============================================================

export interface DbUser {
  id: string
  email: string
  fullName: string
  role: 'Student' | 'Instructor' | 'Admin'
  status: 'Active' | 'Locked' | 'Suspended'
  failedLogins: number
  lastSeen: string
}

export interface DbCourse {
  id: string
  title: string
  instructorName: string
  description: string
  rating: number
  students: number
  duration: string
  lessonsCount: number
  thumbnail: string
  category: string
  status: 'Published' | 'Draft'
  isEnrolled: boolean // For the single mock student
  enrolledUserId: string
  progress: number
  completedLessons: number
  totalLessons: number
  remainingMinutes: number
  nextLessonId: string
  enrolledAt: string
  lastAccessAt: string
  syllabus: {
    id: string
    title: string
    lessons: {
      id: string
      title: string
      duration: string
      type: 'video' | 'pdf'
      completed: boolean
      isCurrent: boolean
      videoUrl?: string
    }[]
  }[]
}

export interface DbSubmission {
  id: string
  student: string
  course: string
  task: string
  time: string
  status: 'pending' | 'submitted' | 'graded'
  file: string | null
  grade: string | null
  feedback: string
  due: string
}

export interface DbAuditLog {
  logId: string
  timestamp: string
  actorId: string
  actorName: string
  action: string
  actionType: string
  ip: string
  hmacValid: boolean
}

// ── INITIAL DATA ─────────────────────────────────────────────

const MOCK_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"

let USERS: DbUser[] = [
  { id: 'USR-0042', email: 'nguyenvanan@lms.edu.vn', fullName: 'Nguyễn Văn An', role: 'Student', status: 'Locked', failedLogins: 5, lastSeen: '14:32 09/06' },
  { id: 'USR-0198', email: 'tranthib@lms.edu.vn', fullName: 'Trần Thị Bình', role: 'Student', status: 'Active', failedLogins: 0, lastSeen: '14:28 09/06' },
  { id: 'USR-0011', email: 'leminhcuong@lms.edu.vn', fullName: 'Lê Minh Cường', role: 'Instructor', status: 'Active', failedLogins: 0, lastSeen: '14:15 09/06' },
  { id: 'USR-0003', email: 'phamquocdung@lms.edu.vn', fullName: 'Phạm Quốc Dũng', role: 'Admin', status: 'Active', failedLogins: 0, lastSeen: '13:55 09/06' },
]

let COURSES: DbCourse[] = [
  {
    id: 'CRS-004',
    title: 'DevOps & CI/CD Pipeline',
    instructorName: 'Kỹ sư Ngô Bảo Châu',
    description: 'Khóa học thực chiến về tự động hóa quy trình phần mềm (CI/CD) với Docker, Jenkins, và Kubernetes. Bạn sẽ học cách xây dựng hạ tầng bảo mật cao cho môi trường doanh nghiệp.',
    rating: 4.8,
    students: 1240,
    duration: '48 giờ',
    lessonsCount: 16,
    thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
    category: 'DevOps',
    status: 'Published',
    isEnrolled: false,
    enrolledUserId: 'USR-0042',
    progress: 0,
    completedLessons: 0,
    totalLessons: 16,
    remainingMinutes: 480,
    nextLessonId: 'ls1',
    enrolledAt: '',
    lastAccessAt: '',
    syllabus: [
      { 
        id: 'ch1', title: 'Chương 1: Tổng quan về DevOps', 
        lessons: [
          { id: 'ls1', title: 'Lịch sử và tư duy DevOps', duration: '12:40', completed: false, isCurrent: true, type: 'video', videoUrl: MOCK_VIDEO_URL },
          { id: 'ls2', title: 'Giới thiệu Docker', duration: '25:15', completed: false, isCurrent: false, type: 'video', videoUrl: MOCK_VIDEO_URL },
          { id: 'ls3', title: 'Tài liệu hướng dẫn cài đặt', duration: '5 MB', completed: false, isCurrent: false, type: 'pdf' }
        ] 
      },
      { 
        id: 'ch2', title: 'Chương 2: Xây dựng CI Pipeline', 
        lessons: [
          { id: 'ls4', title: 'Tích hợp Git & Jenkins', duration: '30:00', completed: false, isCurrent: false, type: 'video', videoUrl: MOCK_VIDEO_URL },
        ] 
      }
    ]
  },
  {
    id: 'CRS-001',
    title: 'An ninh mạng cơ bản (CEH Foundation)',
    instructorName: 'TS. Trần Minh Khoa',
    description: 'Bảo mật hệ thống cơ bản.',
    rating: 4.9,
    students: 800,
    duration: '40 giờ',
    lessonsCount: 25,
    thumbnail: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=800&q=80',
    category: 'Cybersecurity',
    status: 'Published',
    isEnrolled: true,
    enrolledUserId: 'USR-0042',
    progress: 72,
    completedLessons: 18,
    totalLessons: 25,
    remainingMinutes: 210,
    nextLessonId: 'ls1',
    enrolledAt: '2024-09-01T00:00:00Z',
    lastAccessAt: '2024-12-08T14:30:00Z',
    syllabus: [
      { 
        id: 'ch1', title: 'Chương 1: Mở đầu', 
        lessons: [
          { id: 'ls1', title: 'Giới thiệu CEH', duration: '15:00', completed: true, isCurrent: false, type: 'video', videoUrl: MOCK_VIDEO_URL },
        ] 
      }
    ]
  }
]

let SUBMISSIONS: DbSubmission[] = [
  { id: 'sub1', student: 'Nguyễn Văn An', course: 'DevOps & CI/CD Pipeline', task: 'Bài tập cấu hình Jenkins', time: '10:30 15/12/2026', status: 'pending', file: null, grade: null, feedback: '', due: '15/12/2026' },
  { id: 'sub2', student: 'Nguyễn Văn An', course: 'An ninh mạng cơ bản', task: 'Lab 3: XSS Prevention', time: '14:20 14/12/2026', status: 'submitted', file: 'xss_report.pdf', grade: null, feedback: '', due: '10/12/2026' },
  { id: 'sub3', student: 'Nguyễn Văn An', course: 'Lập trình Web', task: 'Đồ án cuối kỳ', time: '09:15 14/12/2026', status: 'graded', file: 'web_project_final.zip', grade: '9.0/10', feedback: 'Bài làm rất tốt', due: '01/12/2026' },
  { id: 'sub4', student: 'Trần Thị Bích', course: 'An ninh mạng cơ bản', task: 'Lab 3: XSS Prevention', time: '14:20 14/12/2026', status: 'graded', file: 'xss_report.pdf', grade: '8.5', feedback: 'Cần phân tích sâu hơn.', due: '10/12/2026' },
]

let AUDIT_LOGS: DbAuditLog[] = [
  {
    logId: 'LOG-7F3A', timestamp: '2026-06-09 14:32:11', actorId: 'USR-0042', actorName: 'Nguyễn Văn An',
    action: 'LOGIN_FAIL (lần 5/5 → Lockout kích hoạt)', actionType: 'LOGIN_FAIL', ip: '203.113.45.17', hmacValid: true,
  },
]

// ── GETTERS ──────────────────────────────────────────────────

export const dbGetUsers = () => USERS
export const dbGetCourses = () => COURSES
export const dbGetCourseById = (id: string) => COURSES.find(c => c.id === id)
export const dbGetSubmissions = () => SUBMISSIONS
export const dbGetAuditLogs = () => AUDIT_LOGS

// ── SETTERS (Mutations) ──────────────────────────────────────

export const dbEnrollCourse = (courseId: string) => {
  const course = COURSES.find(c => c.id === courseId)
  if (course) {
    course.isEnrolled = true
    course.enrolledAt = new Date().toISOString()
    dbAddAuditLog(`ENROLL_COURSE - Ghi danh khóa học ${courseId}`, 'ENROLL_COURSE')
  }
}

export const dbSubmitAssignment = (subId: string, fileName: string) => {
  const sub = SUBMISSIONS.find(s => s.id === subId)
  if (sub) {
    sub.status = 'submitted'
    sub.file = fileName
    sub.time = new Date().toLocaleString('vi-VN')
    dbAddAuditLog(`FILE_UPLOAD - Nộp bài ${sub.task}`, 'FILE_UPLOAD')
  }
}

export const dbCancelSubmission = (subId: string) => {
  const sub = SUBMISSIONS.find(s => s.id === subId)
  if (sub) {
    sub.status = 'pending'
    sub.file = null
  }
}

export const dbGradeSubmission = (subId: string, grade: string, feedback: string) => {
  const sub = SUBMISSIONS.find(s => s.id === subId)
  if (sub) {
    sub.status = 'graded'
    sub.grade = grade
    sub.feedback = feedback
    dbAddAuditLog(`GRADE_UPDATE - Chấm điểm bài ${sub.task} của ${sub.student}`, 'GRADE_UPDATE')
  }
}

export const dbCreateCourse = (title: string, description: string) => {
  const newCourse: DbCourse = {
    id: 'CRS-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
    title,
    description,
    instructorName: 'Current User', // Could be dynamic
    rating: 0,
    students: 0,
    duration: '0 giờ',
    lessonsCount: 0,
    thumbnail: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=800&q=80',
    category: 'Uncategorized',
    status: 'Draft',
    isEnrolled: false,
    enrolledUserId: '',
    progress: 0,
    completedLessons: 0,
    totalLessons: 0,
    remainingMinutes: 0,
    nextLessonId: '',
    enrolledAt: '',
    lastAccessAt: '',
    syllabus: []
  }
  COURSES.push(newCourse)
  dbAddAuditLog(`COURSE_CREATE - Tạo mới khóa học ${title}`, 'COURSE_CREATE')
  return newCourse
}

export const dbUpdateCourseSyllabus = (courseId: string, newSyllabus: any[]) => {
  const course = COURSES.find(c => c.id === courseId)
  if (course) {
    course.syllabus = newSyllabus
    // update lessons count
    course.lessonsCount = newSyllabus.reduce((acc, ch) => acc + ch.lessons.length, 0)
    dbAddAuditLog(`COURSE_UPDATE - Cập nhật đề cương khóa học ${courseId}`, 'COURSE_UPDATE')
  }
}

export const EXAMS = [
  { id: 'ex1', title: 'Kiểm tra giữa kỳ - An ninh mạng', course: 'An ninh mạng cơ bản', duration: '60 phút', questions: 40, status: 'Active', antiCheat: true },
  { id: 'ex2', title: 'Quiz Tuần 6', course: 'Lập trình Web', duration: '15 phút', questions: 10, status: 'Draft', antiCheat: false },
]

export const dbGetExams = () => EXAMS
export const dbCreateExam = (exam: any) => {
  EXAMS.unshift(exam)
  dbAddAuditLog(`EXAM_CREATE - Tạo đề thi ${exam.title}`, 'EXAM_CREATE')
}
export const dbUpdateExam = (id: string, updatedExam: any) => {
  const idx = EXAMS.findIndex(e => e.id === id)
  if (idx !== -1) {
    EXAMS[idx] = { ...EXAMS[idx], ...updatedExam }
    dbAddAuditLog(`EXAM_UPDATE - Cập nhật đề thi ${updatedExam.title}`, 'EXAM_UPDATE')
  }
}
export const dbDeleteExam = (id: string) => {
  const idx = EXAMS.findIndex(e => e.id === id)
  if (idx !== -1) {
    dbAddAuditLog(`EXAM_DELETE - Xóa đề thi ${EXAMS[idx].title}`, 'EXAM_DELETE')
    EXAMS.splice(idx, 1)
  }
}

export const dbAddAuditLog = (action: string, actionType: string, actorId: string = 'SYSTEM', actorName: string = 'Hệ thống') => {
  AUDIT_LOGS.unshift({
    logId: 'LOG-' + Math.random().toString(16).substring(2, 6).toUpperCase(),
    timestamp: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }),
    actorId,
    actorName,
    action,
    actionType,
    ip: '192.168.1.10',
    hmacValid: true
  })
}
