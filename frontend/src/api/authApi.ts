import apiClient from './apiClient'

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

export interface VerifyMfaRequest {
  pendingToken: string
  code: string
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
  const { data } = await apiClient.post<LoginResponse>('/auth/login', body)
  return data
}

/** POST /api/auth/verify-mfa — xác thực TOTP sau bước login khi RequiresMfa=true */
export async function verifyMfaApi(body: VerifyMfaRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/verify-mfa', body)
  return data
}
