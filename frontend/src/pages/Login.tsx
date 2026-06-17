import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type ChangeEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  GraduationCap,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { loginApi, type AccountLockedError, type InvalidCredentialsError } from '../api/authApi'
import MfaVerification from '../components/auth/MfaVerification'
import type { AxiosError } from 'axios'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS_BEFORE_CAPTCHA = 3
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 phút

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type LoginStep = 'credentials' | 'mfa'

interface FormState {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate client-side
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Hook: Countdown timer khi tài khoản bị khoá
// ─────────────────────────────────────────────────────────────────────────────
function useCountdown(endsAt: Date | null) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!endsAt) { setRemaining(0); return }
    const tick = () => {
      const diff = Math.max(0, endsAt.getTime() - Date.now())
      setRemaining(diff)
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [endsAt])

  const mm = String(Math.floor(remaining / 60000)).padStart(2, '0')
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0')
  return { remaining, formatted: `${mm}:${ss}` }
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Illustration – Flat design / blob shapes
// ─────────────────────────────────────────────────────────────────────────────
function EducationIllustration() {
  return (
    <svg
      viewBox="0 0 500 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-lg drop-shadow-2xl"
      aria-hidden="true"
    >
      {/* Blob nền sau */}
      <ellipse cx="260" cy="230" rx="200" ry="160" fill="white" fillOpacity="0.07" />
      <ellipse cx="120" cy="320" rx="110" ry="90" fill="white" fillOpacity="0.06" />

      {/* Màn hình laptop */}
      <rect x="110" y="100" width="280" height="180" rx="14" fill="white" fillOpacity="0.18" />
      <rect x="110" y="100" width="280" height="180" rx="14" stroke="white" strokeOpacity="0.3" strokeWidth="2" />
      {/* Màn hình trong laptop */}
      <rect x="124" y="114" width="252" height="152" rx="8" fill="#1a2f54" fillOpacity="0.8" />
      {/* Thanh menu giả */}
      <rect x="132" y="122" width="236" height="16" rx="4" fill="white" fillOpacity="0.08" />
      <circle cx="141" cy="130" r="4" fill="#C00000" fillOpacity="0.7" />
      <circle cx="153" cy="130" r="4" fill="#F59E0B" fillOpacity="0.7" />
      <circle cx="165" cy="130" r="4" fill="#10B981" fillOpacity="0.7" />
      {/* Dòng code / nội dung giả */}
      <rect x="132" y="146" width="140" height="8" rx="3" fill="white" fillOpacity="0.15" />
      <rect x="132" y="160" width="180" height="8" rx="3" fill="white" fillOpacity="0.10" />
      <rect x="132" y="174" width="100" height="8" rx="3" fill="white" fillOpacity="0.12" />
      <rect x="132" y="188" width="160" height="8" rx="3" fill="white" fillOpacity="0.08" />
      <rect x="132" y="202" width="120" height="8" rx="3" fill="white" fillOpacity="0.10" />
      <rect x="132" y="216" width="80" height="8" rx="3" fill="white" fillOpacity="0.08" />
      {/* Thanh bên phải */}
      <rect x="294" y="146" width="82" height="78" rx="6" fill="white" fillOpacity="0.07" />
      <circle cx="335" cy="175" r="20" fill="#2E75B6" fillOpacity="0.5" />
      <rect x="304" y="199" width="62" height="6" rx="3" fill="white" fillOpacity="0.12" />
      <rect x="310" y="210" width="50" height="6" rx="3" fill="white" fillOpacity="0.08" />
      {/* Đế laptop */}
      <path d="M85 282 L165 282 L165 288 Q165 294 171 294 L329 294 Q335 294 335 288 L335 282 L415 282 Q422 290 415 300 L85 300 Q78 290 85 282Z" fill="white" fillOpacity="0.15" />
      <ellipse cx="250" cy="282" rx="55" ry="5" fill="white" fillOpacity="0.12" />

      {/* Mũ tốt nghiệp nổi */}
      <g transform="translate(50, 160)">
        <polygon points="0,20 40,0 80,20 40,40" fill="white" fillOpacity="0.85" />
        <rect x="60" y="18" width="4" height="22" rx="2" fill="white" fillOpacity="0.7" />
        <circle cx="62" cy="44" r="6" fill="#C00000" fillOpacity="0.9" />
        <line x1="40" y1="40" x2="40" y2="58" stroke="white" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="40" cy="58" rx="12" ry="5" fill="white" fillOpacity="0.4" />
      </g>

      {/* Shield bảo mật */}
      <g transform="translate(378, 140)">
        <path d="M22 4 L40 10 L40 26 Q40 38 22 44 Q4 38 4 26 L4 10 Z" fill="#2E75B6" fillOpacity="0.7" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
        <path d="M13 24 L19 30 L31 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Sách nổi góc dưới trái */}
      <g transform="translate(68, 305)">
        <rect x="0" y="0" width="58" height="44" rx="4" fill="#2E75B6" fillOpacity="0.7" />
        <rect x="6" y="6" width="46" height="6" rx="2" fill="white" fillOpacity="0.3" />
        <rect x="6" y="16" width="38" height="4" rx="2" fill="white" fillOpacity="0.2" />
        <rect x="6" y="24" width="42" height="4" rx="2" fill="white" fillOpacity="0.2" />
        <rect x="6" y="32" width="30" height="4" rx="2" fill="white" fillOpacity="0.2" />
        <rect x="0" y="0" width="6" height="44" rx="4" fill="white" fillOpacity="0.25" />
      </g>

      {/* Stars trang trí */}
      <circle cx="90" cy="110" r="3" fill="white" fillOpacity="0.5" />
      <circle cx="420" cy="95" r="2" fill="white" fillOpacity="0.4" />
      <circle cx="445" cy="320" r="4" fill="white" fillOpacity="0.3" />
      <circle cx="75" cy="270" r="2.5" fill="white" fillOpacity="0.4" />
      <circle cx="395" cy="270" r="3" fill="white" fillOpacity="0.35" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Component chính: LoginPage
// ─────────────────────────────────────────────────────────────────────────────
interface LoginPageProps {
  onLoginSuccess?: (user: any) => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps = {}) {
  const navigate = useNavigate()

  // Bước xác thực
  const [step, setStep] = useState<LoginStep>('credentials')

  // Form state
  const [form, setForm] = useState<FormState>({ email: '', password: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Brute-force tracking (BR-02) per email
  const [failCounts, setFailCounts] = useState<Record<string, number>>({})
  const [lockoutEndsAt, setLockoutEndsAt] = useState<Date | null>(null)
  const [lockedEmail, setLockedEmail] = useState<string | null>(null)
  const { remaining: lockRemaining, formatted: lockFormatted } = useCountdown(lockoutEndsAt)

  const currentNormalizedEmail = form.email.trim().toLowerCase()
  const failCount = failCounts[currentNormalizedEmail] || 0

  // Tự động mở khoá khi countdown hết
  useEffect(() => {
    if (lockRemaining === 0 && lockoutEndsAt !== null) {
      setLockoutEndsAt(null)
      if (lockedEmail) {
        setFailCounts(prev => ({ ...prev, [lockedEmail]: 0 }))
        setLockedEmail(null)
      }
    }
  }, [lockRemaining, lockoutEndsAt, lockedEmail])

  // MFA
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [loadingMfa, setLoadingMfa] = useState(false)
  const [mfaError, setMfaError] = useState<string | null>(null)
  const loggedEmail = useRef<string>('')

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }))
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (lockoutEndsAt) return

    setErrors({})
    const clientErrors = validate(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      return
    }

    setLoading(true)
    try {
      const res = await loginApi({ email: form.email.trim(), password: form.password })

      // Lưu tokens (SRS §2.1 – Token storage)
      localStorage.setItem('access_token', res.accessToken)
      localStorage.setItem('refresh_token', res.refreshToken)

      if (res.requiresMfa) {
        loggedEmail.current = res.email
        setStep('mfa')
        return
      }

      // Decode JWT
      const payload = JSON.parse(atob(res.accessToken.split('.')[1]))
      if (onLoginSuccess) {
        onLoginSuccess({
          id: payload.sub || 'unknown',
          email: payload.email || '',
          name: payload.email?.split('@')[0] || 'Người dùng',
          role: payload.role || 'Student'
        })
      }

      navigate('/dashboard')
    } catch (err) {
      const axiosErr = err as AxiosError
      const status = axiosErr.response?.status

      if (status === 423) {
        // Backend khoá tài khoản – lấy thời điểm mở khoá
        const data = axiosErr.response!.data as AccountLockedError
        setLockoutEndsAt(new Date(data.lockoutEnd))
        setLockedEmail(currentNormalizedEmail)
        setFailCounts(prev => ({ ...prev, [currentNormalizedEmail]: MAX_ATTEMPTS_BEFORE_CAPTCHA }))
      } else if (status === 401) {
        // BR-01: Generic error message – không tiết lộ email/password sai
        const data = axiosErr.response!.data as InvalidCredentialsError
        const newCount = failCount + 1
        setFailCounts(prev => ({ ...prev, [currentNormalizedEmail]: newCount }))

        // Client-side lockout fallback nếu backend không trả 423
        if (newCount >= 5) {
          setLockoutEndsAt(new Date(Date.now() + LOCKOUT_DURATION_MS))
          setLockedEmail(currentNormalizedEmail)
        } else {
          setErrors({ general: data.message || 'Email hoặc mật khẩu không đúng.' })
        }
      } else if (status === 400) {
        setErrors({ general: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.' })
      } else {
        setErrors({ general: 'Không thể kết nối máy chủ. Vui lòng thử lại.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async () => {
    const code = otp.join('')
    if (code.length < 6) return
    setLoadingMfa(true)
    setMfaError(null)
    try {
      // TODO: gọi POST /api/auth/verify-mfa khi backend triển khai
      console.log('MFA code submitted:', code)
      navigate('/dashboard')
    } catch {
      setMfaError('Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.')
      setOtp(Array(6).fill(''))
    } finally {
      setLoadingMfa(false)
    }
  }

  const isLockedOut = lockoutEndsAt !== null && lockRemaining > 0
  const showCaptchaPlaceholder = failCount >= MAX_ATTEMPTS_BEFORE_CAPTCHA && !isLockedOut

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* ════════════════════════════════════════════════════════════════════════
          CỘT TRÁI – Illustration (60% desktop, ẩn trên mobile)
      ════════════════════════════════════════════════════════════════════════ */}
      <aside
        className="hidden md:flex md:w-[55%] lg:w-[60%] relative overflow-hidden
                   flex-col items-center justify-center px-10 py-16
                   bg-gradient-to-br from-[#1a2f54] via-[#2E75B6] to-[#1F3864]"
        aria-hidden="true"
      >
        {/* Blob trang trí */}
        <div className="absolute -top-32 -left-24 w-[460px] h-[460px] rounded-full
                        bg-white/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-[380px] h-[380px] rounded-full
                        bg-white/[0.06] blur-2xl pointer-events-none" />
        <div className="absolute top-[42%] left-[38%] w-56 h-56 rounded-full
                        bg-white/[0.03] pointer-events-none" />

        {/* Nội dung */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          {/* Logo + tên trường */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/25
                            backdrop-blur-sm flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-slate-900" />
            </div>
            <div className="text-left">
              <p className="text-slate-900/60 text-xs uppercase tracking-widest font-medium">
                Hệ thống học trực tuyến
              </p>
              <p className="text-slate-900 font-bold text-base leading-tight">Trường Đại học Việt Nhật</p>
            </div>
          </div>

          {/* Illustration */}
          <EducationIllustration />

          {/* Tagline */}
          <h1 className="mt-8 text-slate-900 text-2xl font-bold leading-snug">
            Học tập không giới hạn
          </h1>
          <p className="mt-2 text-slate-900/60 text-sm leading-relaxed max-w-xs">
            Công nghệ tiên tiến, Giáo dục khai phóng, Đổi mới sáng tạo hướng đến phát triển bền vững
          </p>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════════════
          CỘT PHẢI – Form đăng nhập (40% desktop, 100% mobile)
      ════════════════════════════════════════════════════════════════════════ */}
      <main
        className="flex-1 flex flex-col items-center justify-center
                   bg-white px-6 py-10 sm:px-12"
      >

        {/* ── Card form ────────────────────────────────────────────────────── */}
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3FA] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#2E75B6]" />
            </div>
            <span className="font-bold text-[#1F3864] text-sm">LMS Security</span>
          </div>

          {/* ── Credentials step ─────────────────────────────────────────── */}
          {step === 'credentials' && (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h2 className="text-[2rem] font-light text-[#1F3864] tracking-tight">
                  Đăng nhập
                </h2>
                <p className="mt-1 text-sm text-gray-400 font-normal">
                  Chào mừng trở lại! Vui lòng nhập thông tin đăng nhập.
                </p>
              </div>

              {/* ── Lockout UI (BR-02) ──────────────────────────────────── */}
              {isLockedOut ? (
                <LockoutScreen 
                  countdown={lockFormatted} 
                  onBack={() => {
                    setLockoutEndsAt(null)
                    setLockedEmail(null)
                    setForm({ email: '', password: '' })
                    setErrors({})
                  }}
                />
              ) : (
                <form onSubmit={handleSubmit} noValidate>

                  {/* Alert lỗi chung – Generic (BR-01) */}
                  {errors.general && (
                    <div
                      role="alert"
                      className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl
                                 bg-[#FCE4D6] border border-[#C00000]/20 text-[#C00000] text-sm
                                 animate-[fadeIn_0.2s_ease]"
                    >
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{errors.general}</span>
                    </div>
                  )}

                  {/* Email */}
                  <div className="mb-5">
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-semibold text-gray-500 uppercase
                                 tracking-wider mb-2"
                    >
                      Email
                    </label>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      value={form.email}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="ten@truong.edu.vn"
                      aria-describedby={errors.email ? 'email-err' : undefined}
                      aria-invalid={!!errors.email}
                      className={[
                        'w-full px-4 py-3 rounded-xl text-sm text-gray-800',
                        'bg-gray-50 border outline-none transition-all duration-200',
                        'placeholder:text-gray-300 disabled:opacity-50',
                        errors.email
                          ? 'border-[#C00000] ring-1 ring-[#C00000]/30'
                          : 'border-gray-200 focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6]/30',
                      ].join(' ')}
                    />
                    {errors.email && (
                      <p id="email-err" className="mt-1.5 text-xs text-[#C00000]">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Password
                      </label>
                      <a
                        href="/forgot-password"
                        className="text-xs text-[#C00000] hover:text-[#a00000] transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={form.password}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Tối thiểu 8 ký tự"
                        aria-describedby={errors.password ? 'pass-err' : undefined}
                        aria-invalid={!!errors.password}
                        className={[
                          'w-full px-4 py-3 pr-12 rounded-xl text-sm text-gray-800',
                          'bg-gray-50 border outline-none transition-all duration-200',
                          'placeholder:text-gray-300 disabled:opacity-50',
                          errors.password
                            ? 'border-[#C00000] ring-1 ring-[#C00000]/30'
                            : 'border-gray-200 focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6]/30',
                        ].join(' ')}
                      />
                      {/* Toggle eye */}
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2
                                   text-gray-400 hover:text-[#2E75B6] transition-colors p-0.5"
                      >
                        {showPassword
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p id="pass-err" className="mt-1.5 text-xs text-[#C00000]">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* hCaptcha placeholder (hiện sau BR-02 threshold) */}
                  {showCaptchaPlaceholder && (
                    <div
                      className="mt-4 mb-2 p-4 rounded-xl border-2 border-dashed border-amber-300
                                 bg-amber-50 text-amber-700 text-xs text-center"
                    >
                      <p className="font-semibold mb-1">Xác minh bảo mật</p>
                      <p className="text-amber-600">
                        Vui lòng hoàn thành captcha để tiếp tục đăng nhập.
                      </p>
                      {/* Mount hCaptcha widget tại đây khi tích hợp thực tế */}
                      <div className="mt-3 h-16 rounded-lg bg-amber-100 flex items-center
                                      justify-center text-amber-500 font-mono text-[11px]">
                        [ hCaptcha Widget ]
                      </div>
                    </div>
                  )}

                  {/* Nút Login */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full bg-[#C00000] text-slate-900 font-semibold py-3.5
                               rounded-full shadow-md shadow-[#C00000]/25
                               hover:bg-[#a80000] hover:shadow-lg hover:shadow-[#C00000]/30
                               hover:-translate-y-0.5
                               active:translate-y-0 active:shadow-md
                               transition-all duration-200
                               disabled:opacity-55 disabled:cursor-not-allowed
                               disabled:translate-y-0 disabled:shadow-none
                               focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-[#C00000] focus-visible:ring-offset-2"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle
                            className="opacity-25"
                            cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Đang xử lý…
                      </span>
                    ) : (
                      'Login'
                    )}
                  </button>

                  {/* Failure count hint */}
                  {failCount > 0 && !isLockedOut && (
                    <p className="mt-3 text-center text-xs text-amber-600">
                      Lần thử không thành công: {failCount}/5.
                      Tài khoản sẽ bị khoá 15 phút sau 5 lần thất bại.
                    </p>
                  )}
                </form>
              )}
            </>
          )}
        </div>

      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Màn hình khoá tài khoản (BR-02)
// ─────────────────────────────────────────────────────────────────────────────
interface LockoutScreenProps {
  countdown: string
  onBack: () => void
}

function LockoutScreen({ countdown, onBack }: LockoutScreenProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center text-center py-6 px-4
                 rounded-2xl bg-[#FCE4D6] border border-[#C00000]/20"
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-[#C00000]/10 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-[#C00000]" />
      </div>

      <h3 className="text-lg font-bold text-[#C00000] mb-2">
        Tài khoản tạm thời bị khoá
      </h3>
      <p className="text-sm text-[#C00000]/80 mb-6 leading-relaxed">
        Bạn đã đăng nhập sai quá 5 lần.<br />
        Vui lòng thử lại sau khi đồng hồ đếm ngược kết thúc.
      </p>

      {/* Countdown */}
      <div className="flex items-center gap-3 px-6 py-4 rounded-xl
                      bg-white border border-[#C00000]/15 shadow-sm">
        <Clock className="w-5 h-5 text-[#C00000]" />
        <span
          className="text-3xl font-mono font-bold text-[#C00000] tabular-nums tracking-wider"
          aria-label={`Còn lại ${countdown}`}
        >
          {countdown}
        </span>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Nếu bạn không thực hiện những lần đăng nhập này,<br />
        vui lòng đổi mật khẩu ngay lập tức.
      </p>

      <button 
        onClick={onBack} 
        className="mt-6 text-sm font-semibold text-[#2E75B6] hover:text-[#1F3864] transition-colors"
      >
        Đăng nhập bằng tài khoản khác
      </button>
    </div>
  )
}
