// ============================================================
// ADMIN DASHBOARD – MOCK DATA
// Phản ánh các kịch bản bảo mật SRS v1.0
// BR-02: Account Lockout / BR-22: HMAC Audit Log Integrity
// ============================================================

export interface MockUser {
  id: string
  email: string
  fullName: string
  role: 'Student' | 'Instructor' | 'Admin'
  status: 'Active' | 'Locked' | 'Suspended'
  failedLogins: number
  lastSeen: string
}

export interface AuditLogEntry {
  logId: string
  timestamp: string
  actorId: string
  actorName: string
  action: string
  actionType: 'LOGIN_FAIL' | 'LOGIN_OK' | 'EXAM_SUBMIT' | 'GRADE_UPDATE' | 'ROLE_CHANGE' | 'LOGOUT' | 'ANTICHEAT' | 'FILE_UPLOAD' | 'COURSE_CREATE' | 'ENROLL_COURSE'
  ip: string
  hmacValid: boolean
}

export interface SecurityIncident {
  month: string
  bruteForce: number
  authErrors: number
}

import { dbGetAuditLogs, dbAddAuditLog } from '../../data/mockDatabase'

// ── Role Distribution ──────────────────────────────────────
export const ROLE_DISTRIBUTION = {
  students: 1284,
  instructors: 47,
  admins: 5,
}

export const TOTAL_ACTIVE_USERS =
  ROLE_DISTRIBUTION.students + ROLE_DISTRIBUTION.instructors + ROLE_DISTRIBUTION.admins

// ── Quick Alert Counts ─────────────────────────────────────
export const ALERT_COUNTS = {
  lockedAccounts: 7,        // BR-02: vượt 5 lần đăng nhập sai
  anticheatViolations: 3,   // BR-13: Tab switch >= 3
  auditIntegrityOk: true,   // BR-22: HMAC chain intact
}

// ── Monthly Security Incidents (recharts-ready) ────────────
export const SECURITY_INCIDENTS: SecurityIncident[] = [
  { month: 'T1', bruteForce: 12, authErrors: 34 },
  { month: 'T2', bruteForce: 8,  authErrors: 27 },
  { month: 'T3', bruteForce: 15, authErrors: 41 },
  { month: 'T4', bruteForce: 6,  authErrors: 19 },
  { month: 'T5', bruteForce: 20, authErrors: 53 },
  { month: 'T6', bruteForce: 9,  authErrors: 31 },
  { month: 'T7', bruteForce: 17, authErrors: 38 },
  { month: 'T8', bruteForce: 22, authErrors: 60 },
  { month: 'T9', bruteForce: 11, authErrors: 44 },
  { month: 'T10', bruteForce: 5, authErrors: 22 },
  { month: 'T11', bruteForce: 14, authErrors: 36 },
  { month: 'T12', bruteForce: 9,  authErrors: 28 },
]

// ── Recent Audit Logs (HMAC-signed records) ────────────────
export const RECENT_AUDIT_LOGS = dbGetAuditLogs()

export const addAuditLog = (action: string, actionType: string) => {
  dbAddAuditLog(action, actionType)
}

// ── User Table Data ────────────────────────────────────────
export const MOCK_USERS: MockUser[] = [
  {
    id: 'USR-0042',
    email: 'nguyenvanan@lms.edu.vn',
    fullName: 'Nguyễn Văn An',
    role: 'Student',
    status: 'Locked',         // BR-02: 5 lần sai → khóa 15 phút
    failedLogins: 5,
    lastSeen: '14:32 09/06',
  },
  {
    id: 'USR-0198',
    email: 'tranthib@lms.edu.vn',
    fullName: 'Trần Thị Bình',
    role: 'Student',
    status: 'Active',
    failedLogins: 0,
    lastSeen: '14:28 09/06',
  },
  {
    id: 'USR-0011',
    email: 'leminhcuong@lms.edu.vn',
    fullName: 'Lê Minh Cường',
    role: 'Instructor',
    status: 'Active',
    failedLogins: 0,
    lastSeen: '14:15 09/06',
  },
  {
    id: 'USR-0077',
    email: 'hoangthilan@lms.edu.vn',
    fullName: 'Hoàng Thị Lan',
    role: 'Student',
    status: 'Suspended',
    failedLogins: 3,
    lastSeen: '13:40 09/06',
  },
  {
    id: 'USR-0031',
    email: 'danghuphuoc@lms.edu.vn',
    fullName: 'Đặng Hữu Phúc',
    role: 'Student',
    status: 'Active',
    failedLogins: 3,
    lastSeen: '12:58 09/06',
  },
  {
    id: 'USR-0003',
    email: 'phamquocdung@lms.edu.vn',
    fullName: 'Phạm Quốc Dũng',
    role: 'Admin',
    status: 'Active',
    failedLogins: 0,
    lastSeen: '13:55 09/06',
  },
  {
    id: 'USR-0055',
    email: 'vothanhmy@lms.edu.vn',
    fullName: 'Võ Thanh Em',
    role: 'Student',
    status: 'Active',
    failedLogins: 1,
    lastSeen: '13:22 09/06',
  },
  {
    id: 'USR-0089',
    email: 'nguyenthifao@lms.edu.vn',
    fullName: 'Nguyễn Thị Fao',
    role: 'Instructor',
    status: 'Locked',
    failedLogins: 5,
    lastSeen: '11:10 09/06',
  },
]
