import {
  useState,
  useRef,
  type FormEvent,
  type ChangeEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, GraduationCap, ShieldCheck, Lock } from 'lucide-react'
import { loginApi, type AccountLockedError, type InvalidCredentialsError } from '../api/authApi'
import MfaVerification from '../components/auth/MfaVerification'
import type { AxiosError } from 'axios'

// ──────────────────────────────────────────────────────────────────────────────
// Kiểu dữ liệu nội bộ
// ──────────────────────────────────────────────────────────────────────────────
type LoginStep = 'credentials' | 'mfa'

interface FormState {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
  lockout?: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: validate client-side trước khi gọi API
// ──────────────────────────────────────────────────────────────────────────────
function validate(form: FormState): FormErrors {
  const errs: FormErrors = {}
  if (!form.email.trim()) {
    errs.email = 'Email không được để trống.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errs.email = 'Địa chỉ email không hợp lệ.'
  }
  if (!form.password) {
    errs.password = 'Mật khẩu không được để trống.'
  } else if (form.password.length < 8) {
    errs.password = 'Mật khẩu phải có ít nhất 8 ký tự.'
  }
  return errs
}

// ──────────────────────────────────────────────────────────────────────────────
// Component chính
// ──────────────────────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate()

  // Bước hiện tại: nhập credentials hoặc xác thực MFA
  const [step, setStep] = useState<LoginStep>('credentials')

  // Form credentials
  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loadingCredentials, setLoadingCredentials] = useState(false)

  // MFA
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [loadingMfa, setLoadingMfa] = useState(false)
  const [mfaError, setMfaError] = useState<string | null>(null)
  // Email lưu lại sau bước 1 để hiển thị ở bước MFA
  const loggedEmail = useRef<string>('')

  // ── Handlers credentials ────────────────────────────────────────────────────
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Xoá lỗi inline khi user gõ lại
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleCredentialSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate client-side
    const clientErrors = validate(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setLoadingCredentials(true)
    try {
      const res = await loginApi({ email: form.email.trim(), password: form.password })

      // Lưu tokens (backend chưa implement MFA riêng → chuyển thẳng vào app)
      localStorage.setItem('access_token', res.accessToken)
      localStorage.setItem('refresh_token', res.refreshToken)

      // Nếu backend trả về yêu cầu MFA (giả lập: luôn sang bước MFA)
      // Trong thực tế: kiểm tra res.requiresMfa hoặc HTTP 202
      loggedEmail.current = res.email
      setStep('mfa')
    } catch (err) {
      const axiosErr = err as AxiosError
      const status = axiosErr.response?.status

      if (status === 423) {
        const data = axiosErr.response!.data as AccountLockedError
        // Format lockoutEnd thành giờ:phút
        const lockTime = new Date(data.lockoutEnd).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })
        setErrors({
          lockout: `Tài khoản đang bị khoá tạm thời đến ${lockTime}. Vui lòng thử lại sau.`,
        })
      } else if (status === 401) {
        const data = axiosErr.response!.data as InvalidCredentialsError
        setErrors({ general: data.message })
      } else if (status === 400) {
        setErrors({ general: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.' })
      } else {
        setErrors({ general: 'Không thể kết nối máy chủ. Vui lòng thử lại.' })
      }
    } finally {
      setLoadingCredentials(false)
    }
  }

  // ── Handlers MFA ────────────────────────────────────────────────────────────
  const handleMfaSubmit = async () => {
    const code = otp.join('')
    if (code.length < 6) return

    setLoadingMfa(true)
    setMfaError(null)
    try {
      // TODO: gọi POST /api/auth/verify-mfa khi backend implement
      // await apiClient.post('/auth/verify-mfa', { code })
      console.log('MFA code:', code) // placeholder
      navigate('/dashboard')
    } catch {
      setMfaError('Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.')
      setOtp(Array(6).fill(''))
    } finally {
      setLoadingMfa(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/*
       * ── BÊN TRÁI: Abstract Education Background ──────────────────────────
       * Ẩn trên mobile (hidden), hiện từ md trở lên (md:flex)
       */}
      <aside
        className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden
                   bg-gradient-to-br from-[#1F3864] via-[#2E75B6] to-[#1F3864]
                   items-center justify-center"
        aria-hidden="true"
      >
        {/* Vòng tròn trang trí trừu tượng */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute bottom-10 -right-16 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-white/5" />

        {/* Nội dung trung tâm */}
        <div className="relative z-10 text-white text-center px-12 max-w-md">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white/15 flex items-center justify-center
                            backdrop-blur-sm border border-white/20">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Hệ thống Học trực tuyến
            <br />
            <span className="text-white/80 text-2xl font-normal">An toàn &amp; Bảo mật</span>
          </h1>

          <p className="text-white/70 text-sm leading-relaxed mb-10">
            Nền tảng giáo dục được bảo vệ bằng mã hoá RSA-256, xác thực đa yếu tố
            và hệ thống chống gian lận tiên tiến.
          </p>

          {/* Badge bảo mật */}
          <div className="flex flex-col gap-3">
            {[
              { icon: <ShieldCheck className="w-4 h-4" />, text: 'JWT RS256 + MFA (TOTP)' },
              { icon: <Lock className="w-4 h-4" />, text: 'Kết nối mã hoá TLS 1.3' },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3
                           backdrop-blur-sm border border-white/10"
              >
                <span className="text-white/80">{icon}</span>
                <span className="text-sm text-white/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/*
       * ── BÊN PHẢI: Form Container ─────────────────────────────────────────
       */}
      <main
        className="flex-1 flex items-center justify-center
                   bg-[#F8F9FA] p-6 sm:p-10"
      >
        <div className="w-full max-w-md">
          {/* Card nổi */}
          <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10">

            {/* Logo mobile (chỉ hiện khi aside ẩn) */}
            <div className="flex items-center gap-3 mb-8 md:hidden">
              <div className="w-10 h-10 rounded-xl bg-[#EBF3FA] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-[#2E75B6]" />
              </div>
              <span className="font-bold text-[#1F3864]">LMS Security</span>
            </div>

            {/* ── BƯỚC 1: Credentials ──────────────────────────────────────── */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialSubmit} noValidate>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-[#1F3864] mb-1">Đăng nhập</h2>
                  <p className="text-sm text-gray-500">Chào mừng trở lại! Vui lòng nhập thông tin.</p>
                </div>

                {/* Thông báo khoá tài khoản (ưu tiên cao nhất) */}
                {errors.lockout && (
                  <div
                    className="mb-5 p-4 rounded-lg bg-[#FCE4D6] border border-[#C00000]/30
                               text-sm text-[#C00000] flex items-start gap-2"
                    role="alert"
                  >
                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{errors.lockout}</span>
                  </div>
                )}

                {/* Lỗi chung (401, 500…) */}
                {errors.general && !errors.lockout && (
                  <div
                    className="mb-5 p-4 rounded-lg bg-[#FCE4D6] border border-[#C00000]/30
                               text-sm text-[#C00000]"
                    role="alert"
                  >
                    {errors.general}
                  </div>
                )}

                {/* Email */}
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-[#1F3864] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loadingCredentials}
                    placeholder="ten@truong.edu.vn"
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    aria-invalid={!!errors.email}
                    className={[
                      'w-full px-4 py-3 rounded-lg text-sm outline-none transition-all',
                      'bg-[#F2F2F2] border',
                      'disabled:opacity-60 disabled:cursor-not-allowed',
                      errors.email
                        ? 'border-[#C00000] focus:border-[#C00000] focus:ring-1 focus:ring-[#C00000]'
                        : 'border-transparent focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6]',
                    ].join(' ')}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-1.5 text-xs text-[#C00000]">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="mb-6">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#1F3864] mb-1.5"
                  >
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      disabled={loadingCredentials}
                      placeholder="Tối thiểu 8 ký tự"
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      aria-invalid={!!errors.password}
                      className={[
                        'w-full px-4 py-3 pr-11 rounded-lg text-sm outline-none transition-all',
                        'bg-[#F2F2F2] border',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                        errors.password
                          ? 'border-[#C00000] focus:border-[#C00000] focus:ring-1 focus:ring-[#C00000]'
                          : 'border-transparent focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6]',
                      ].join(' ')}
                    />
                    {/* Toggle show/hide password */}
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-3 top-1/2 -translate-y-1/2
                                 text-gray-400 hover:text-[#2E75B6] transition-colors"
                    >
                      {showPassword
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="mt-1.5 text-xs text-[#C00000]">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loadingCredentials}
                  className="w-full bg-[#2E75B6] text-white font-semibold py-3 rounded-lg
                             hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                             disabled:opacity-60 disabled:cursor-not-allowed
                             disabled:translate-y-0 disabled:shadow-none
                             focus:outline-none focus:ring-2 focus:ring-[#2E75B6] focus:ring-offset-2"
                >
                  {loadingCredentials ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10"
                          stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Đang xử lý…
                    </span>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>

                {/* Quên mật khẩu */}
                <p className="mt-5 text-center text-xs text-gray-400">
                  <a
                    href="/forgot-password"
                    className="text-[#2E75B6] underline underline-offset-2 hover:opacity-80"
                  >
                    Quên mật khẩu?
                  </a>
                </p>
              </form>
            )}

            {/* ── BƯỚC 2: MFA ──────────────────────────────────────────────── */}
            {step === 'mfa' && (
              <MfaVerification
                otp={otp}
                onChange={setOtp}
                loading={loadingMfa}
                error={mfaError}
                onSubmit={handleMfaSubmit}
                email={loggedEmail.current}
              />
            )}
          </div>

          {/* Footer: security badge */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1
                             bg-[#F4EFFF] text-[#7030A0] text-xs font-semibold">
              <Lock className="w-3 h-3" />
              Kết nối an toàn TLS 1.3
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
