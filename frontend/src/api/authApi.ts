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

/**
 * Gọi POST /api/auth/login.
 * Ném AxiosError với response.status:
 *   401 → InvalidCredentialsError
 *   423 → AccountLockedError
 *   400 → validation errors
 */
export async function loginApi(body: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', body)
  return data
}
