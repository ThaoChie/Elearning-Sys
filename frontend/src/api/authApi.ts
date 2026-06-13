import { dbGetUsers, dbAddAuditLog } from '../data/mockDatabase'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: string
  refreshTokenExpiresAt: string
  userId: string
  email: string
  requiresMfa?: boolean
}

export interface AccountLockedError {
  error: 'account_locked'
  message: string
  lockoutEnd: string
}

export interface InvalidCredentialsError {
  error: 'invalid_credentials'
  message: string
}

export async function loginApi(body: LoginRequest): Promise<LoginResponse> {
  const users = dbGetUsers()
  const user = users.find(u => u.email === body.email)

  if (!user) {
    dbAddAuditLog(`LOGIN_FAIL - Sai email (${body.email})`, 'LOGIN_FAIL')
    // Ném lỗi cấu trúc giống axios error
    throw { response: { status: 401, data: { error: 'invalid_credentials', message: 'Tài khoản không tồn tại' } } }
  }

  if (user.status === 'Locked') {
    dbAddAuditLog(`LOGIN_FAIL - Tài khoản đang bị khóa (${user.email})`, 'LOGIN_FAIL', user.id, user.fullName)
    throw { response: { status: 423, data: { error: 'account_locked', message: 'Tài khoản đã bị khóa', lockoutEnd: new Date(Date.now() + 15 * 60000).toISOString() } } }
  }

  // Chấp nhận mật khẩu "12345678" cho tất cả user trong mock
  if (body.password !== '12345678') {
    user.failedLogins += 1
    dbAddAuditLog(`LOGIN_FAIL - Sai mật khẩu (lần ${user.failedLogins})`, 'LOGIN_FAIL', user.id, user.fullName)
    if (user.failedLogins >= 5) {
      user.status = 'Locked'
      dbAddAuditLog(`LOCKOUT - Khóa tài khoản do sai mật khẩu 5 lần`, 'LOCKOUT', user.id, user.fullName)
    }
    throw { response: { status: 401, data: { error: 'invalid_credentials', message: 'Mật khẩu không chính xác' } } }
  }

  // Đăng nhập thành công
  user.failedLogins = 0
  dbAddAuditLog(`LOGIN_SUCCESS - Đăng nhập hệ thống`, 'LOGIN_SUCCESS', user.id, user.fullName)

  // Tạo mock JWT payload
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role
  }
  const fakeToken = 'header.' + btoa(JSON.stringify(payload)) + '.signature'

  return {
    accessToken: fakeToken,
    refreshToken: 'mock-refresh-token',
    accessTokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
    userId: user.id,
    email: user.email,
    requiresMfa: false
  }
}
