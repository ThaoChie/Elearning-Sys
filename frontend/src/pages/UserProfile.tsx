import { useState, useEffect } from 'react'
import { User, Key, Smartphone, ShieldCheck, Monitor, LogOut } from 'lucide-react'
import type { DashboardUser } from '../types/dashboard'
import { getTwoFactorStatus, setupTwoFactor, verifyTwoFactor, disableTwoFactor, changePassword } from '../api/profileApi'
import { QRCodeSVG } from 'qrcode.react'
import { AxiosError } from 'axios'

interface Props {
  user: DashboardUser
}

export default function UserProfile({ user }: Props) {
  // Mock mfaEnabled explicitly if it's not present on DashboardUser
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [isMfaLoading, setIsMfaLoading] = useState(false)
  const [showMfaModal, setShowMfaModal] = useState(false)
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUri: string } | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await getTwoFactorStatus()
        setMfaEnabled(status)
      } catch (err) {
        console.error('Lỗi khi lấy trạng thái 2FA', err)
      }
    }
    fetchStatus()
  }, [])

  // Mock sessions
  const sessions = [
    { id: 1, device: 'MacBook Pro - Chrome', ip: '118.69.123.45', time: 'Đang hoạt động', current: true },
    { id: 2, device: 'iPhone 13 - Safari', ip: '14.161.78.90', time: '2 giờ trước', current: false }
  ]

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' })
      return
    }

    try {
      setIsPasswordLoading(true)
      await changePassword(currentPassword, newPassword)
      setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>
      const errorMsg = axiosErr.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
      setPasswordMessage({ type: 'error', text: errorMsg })
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleToggleMfa = async () => {
    if (mfaEnabled) {
      if (!confirm('Bạn có chắc chắn muốn tắt Xác thực 2 bước (2FA)?')) return
      try {
        setIsMfaLoading(true)
        await disableTwoFactor()
        setMfaEnabled(false)
      } catch (err) {
        alert('Không thể tắt 2FA. Vui lòng thử lại.')
        console.error(err)
      } finally {
        setIsMfaLoading(false)
      }
    } else {
      try {
        setIsMfaLoading(true)
        const data = await setupTwoFactor()
        setSetupData(data)
        setShowMfaModal(true)
        setMfaCode('')
        setMfaError('')
      } catch (err) {
        alert('Không thể khởi tạo 2FA.')
        console.error(err)
      } finally {
        setIsMfaLoading(false)
      }
    }
  }

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setMfaError('')
    setIsMfaLoading(true)
    try {
      await verifyTwoFactor(mfaCode)
      setMfaEnabled(true)
      setShowMfaModal(false)
      setSetupData(null)
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>
      setMfaError(axiosErr.response?.data?.message || 'Mã xác thực không đúng.')
    } finally {
      setIsMfaLoading(false)
    }
  }

  return (
    <div className="min-h-full space-y-6 pb-8 max-w-5xl mx-auto">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#1F3864] flex items-center justify-center shadow-sm">
              <User size={16} className="text-slate-900" />
            </div>
            <h1 className="text-xl font-bold text-[#1F3864] tracking-tight">
              Hồ sơ cá nhân
            </h1>
          </div>
          <p className="text-xs text-slate-500 ml-10.5">
            Quản lý thông tin tài khoản và cấu hình bảo mật
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Thông tin & Đổi mật khẩu */}
        <div className="md:col-span-1 space-y-6">
          {/* Card: User Info */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/50 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <User size={32} className="text-slate-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">{user.name}</h2>
              <p className="text-sm text-slate-500 mb-4">{user.email}</p>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold uppercase tracking-wider">
                {user.role}
              </div>
            </div>
          </div>

          {/* Card: Change Password */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/50 p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-4">
              <Key size={18} className="text-[#2E75B6]" />
              Đổi mật khẩu
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">MẬT KHẨU HIỆN TẠI</label>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">MẬT KHẨU MỚI</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] outline-none" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">XÁC NHẬN MẬT KHẨU MỚI</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] outline-none" 
                  required 
                />
              </div>
              {passwordMessage && (
                <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {passwordMessage.text}
                </div>
              )}
              <button 
                type="submit" 
                disabled={isPasswordLoading}
                className="w-full py-2.5 bg-[#1F3864] hover:bg-[#152643] text-slate-900 rounded-lg text-sm font-semibold transition-colors disabled:opacity-70 flex justify-center items-center"
              >
                {isPasswordLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Cập nhật mật khẩu'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Cột phải: Bảo mật & Phiên */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Cấu hình bảo mật */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/50 p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-6">
              <ShieldCheck size={18} className="text-[#2E75B6]" />
              Xác thực & Bảo mật (MFA)
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-200">
                  <Smartphone className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">Xác thực 2 bước (TOTP App)</h4>
                  <p className="text-xs text-slate-500">Tăng cường bảo mật bằng mã 6 số từ ứng dụng xác thực (Google Authenticator)</p>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={mfaEnabled} 
                  onChange={handleToggleMfa} 
                  disabled={isMfaLoading}
                />
                <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2E75B6]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#375623] ${isMfaLoading ? 'opacity-50' : ''}`}></div>
              </label>
            </div>
          </div>

          {/* Card: Thiết bị & Phiên hoạt động */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/50 p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-800 mb-6">
              <Monitor size={18} className="text-[#2E75B6]" />
              Thiết bị đang đăng nhập
            </h3>
            
            <div className="space-y-3">
              {sessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Monitor className="text-slate-500 w-5 h-5" />
                    <div>
                      <p className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                        {session.device}
                        {session.current && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full uppercase tracking-wide font-bold">Thiết bị này</span>}
                      </p>
                      <p className="text-xs text-slate-500">{session.ip} • {session.time}</p>
                    </div>
                  </div>
                  {!session.current && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C00000] hover:bg-[#FCE4D6] rounded-lg transition-colors border border-transparent hover:border-[#C00000]/20">
                      <LogOut size={14} />
                      Đăng xuất
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4 italic">
              * Thu hồi phiên sẽ ngay lập tức vô hiệu hóa Refresh Token và đưa Access Token vào Blacklist (BR-04).
            </p>
          </div>
        </div>
      </div>

      {/* ── Modal Cài đặt 2FA ─────────────────────────────────────── */}
      {showMfaModal && setupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 w-[400px] max-w-[90vw]">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Cài đặt Xác thực 2 bước</h3>
            <p className="text-sm text-slate-500 mb-6">
              Sử dụng ứng dụng Google Authenticator hoặc ứng dụng tương tự để quét mã QR dưới đây.
            </p>
            
            <div className="flex justify-center mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <QRCodeSVG value={setupData.qrCodeUri} size={160} level="M" />
            </div>
            
            <div className="text-center mb-6">
              <p className="text-xs text-slate-500 mb-1">Hoặc nhập thủ công mã bí mật này:</p>
              <code className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-mono text-xs font-bold tracking-widest">{setupData.secret}</code>
            </div>

            <form onSubmit={handleVerifyMfa}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1">NHẬP MÃ 6 SỐ</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-center text-xl tracking-[0.5em] font-mono focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] outline-none" 
                  required 
                  placeholder="000000"
                />
              </div>
              {mfaError && <p className="text-xs text-red-600 mb-4 text-center font-medium">{mfaError}</p>}
              
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowMfaModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isMfaLoading || mfaCode.length !== 6}
                  className="flex-1 py-2 bg-[#1F3864] hover:bg-[#152643] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-70"
                >
                  {isMfaLoading ? 'Đang xử lý...' : 'Xác nhận bật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
