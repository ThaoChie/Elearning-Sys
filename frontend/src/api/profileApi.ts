import apiClient from './apiClient'

interface TwoFactorStatusResponse {
  twoFactorEnabled: boolean
}

export const getTwoFactorStatus = async (): Promise<boolean> => {
  const { data } = await apiClient.get<TwoFactorStatusResponse>('/profile/security/2fa')
  return data.twoFactorEnabled
}

export const setupTwoFactor = async (): Promise<{ secret: string; qrCodeUri: string }> => {
  const { data } = await apiClient.get('/profile/security/2fa/setup')
  return data
}

export const verifyTwoFactor = async (code: string): Promise<void> => {
  await apiClient.post('/profile/security/2fa/verify', { code })
}

export const disableTwoFactor = async (): Promise<void> => {
  await apiClient.delete('/profile/security/2fa')
}

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await apiClient.put('/profile/security/password', { currentPassword, newPassword })
}

export const updateTwoFactorStatus = async (enabled: boolean): Promise<boolean> => {
  // Stub function to fix missing export
  // In a real flow, this might call a backend endpoint to toggle the status
  return enabled
}
