import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type ChangeEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  RefreshCw,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const OTP_LENGTH = 6
const RESEND_COOLDOWN_SEC = 60

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type RecoveryStep = 'request' | 'verify' | 'reset' | 'success'

type PasswordStrength = 'empty' | 'weak' | 'medium' | 'strong'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email không được để trống.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Địa chỉ email không hợp lệ.'
  return null
}

// BR-05: Password policy – ≥8 chars, uppercase, lowercase, digit, special char
function validatePassword(pw: string): string | null {
  if (!pw) return 'Mật khẩu không được để trống.'
  if (pw.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
  if (!/[A-Z]/.test(pw)) return 'Phải có ít nhất 1 chữ hoa (A–Z).'
  if (!/[a-z]/.test(pw)) return 'Phải có ít nhất 1 chữ thường (a–z).'
  if (!/[0-9]/.test(pw)) return 'Phải có ít nhất 1 chữ số (0–9).'
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Phải có ít nhất 1 ký tự đặc biệt (!@#…).'
  return null
}

function getPasswordStrength(pw: string): PasswordStrength {
  if (!pw) return 'empty'
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return 'weak'
  if (score <= 3) return 'medium'
  return 'strong'
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; bars: number }> = {
  empty:  { label: '',       color: 'bg-gray-200',   bars: 0 },
  weak:   { label: 'Yếu',    color: 'bg-red-500',    bars: 1 },
  medium: { label: 'Trung bình', color: 'bg-amber-400', bars: 2 },
  strong: { label: 'Mạnh',   color: 'bg-emerald-500', bars: 3 },
}

// Spinner SVG (reused from Login)
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Illustration – bảo mật / khóa (dùng cho cột trái)
// ─────────────────────────────────────────────────────────────────────────────
function SecurityIllustration() {
  return (
    <svg
      viewBox="0 0 500 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-lg drop-shadow-2xl"
      aria-hidden="true"
    >
      {/* Blob nền */}
      <ellipse cx="255" cy="225" rx="195" ry="155" fill="white" fillOpacity="0.06" />
      <ellipse cx="120" cy="330" rx="110" ry="80" fill="white" fillOpacity="0.05" />

      {/* Shield trung tâm */}
      <path
        d="M250 60 L360 100 L360 200 Q360 300 250 340 Q140 300 140 200 L140 100 Z"
        fill="white"
        fillOpacity="0.12"
        stroke="white"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M250 80 L345 115 L345 205 Q345 290 250 323 Q155 290 155 205 L155 115 Z"
        fill="#1a2f54"
        fillOpacity="0.6"
        stroke="white"
        strokeOpacity="0.2"
        strokeWidth="1.5"
      />

      {/* Ổ khóa bên trong shield */}
      {/* Thân khóa */}
      <rect x="213" y="185" width="74" height="58" rx="10" fill="white" fillOpacity="0.85" />
      {/* Cung khóa */}
      <path
        d="M225 185 L225 163 Q225 138 250 138 Q275 138 275 163 L275 185"
        stroke="white"
        strokeOpacity="0.85"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lỗ khóa */}
      <circle cx="250" cy="207" r="10" fill="#2E75B6" fillOpacity="0.85" />
      <rect x="246" y="208" width="8" height="16" rx="4" fill="#2E75B6" fillOpacity="0.85" />

      {/* Check mark bên dưới shield */}
      <circle cx="250" cy="370" r="28" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.25" strokeWidth="2" />
      <path
        d="M238 370 L246 378 L264 360"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ngôi sao / hạt nhỏ trang trí */}
      <circle cx="95"  cy="120" r="4"   fill="white" fillOpacity="0.4" />
      <circle cx="415" cy="95"  r="2.5" fill="white" fillOpacity="0.35" />
      <circle cx="435" cy="310" r="5"   fill="white" fillOpacity="0.25" />
      <circle cx="78"  cy="275" r="3"   fill="white" fillOpacity="0.35" />
      <circle cx="400" cy="265" r="3.5" fill="white" fillOpacity="0.3" />
      <circle cx="160" cy="60"  r="2"   fill="white" fillOpacity="0.4" />
      <circle cx="345" cy="385" r="2.5" fill="white" fillOpacity="0.3" />

      {/* Email icon góc trên trái */}
      <g transform="translate(60, 130)">
        <rect x="0" y="0" width="62" height="44" rx="8" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
        <path d="M4 4 L31 24 L58 4" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Key icon góc phải */}
      <g transform="translate(378, 155)">
        <circle cx="18" cy="18" r="18" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" />
        <circle cx="18" cy="18" r="8"  fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="2.5" />
        <line x1="24"  y1="24"  x2="38"  y2="38" stroke="white" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="34"  y1="34"  x2="34"  y2="40" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        <line x1="30"  y1="38"  x2="30"  y2="42" stroke="white" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: Toast notification
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, visible: true })
    timerRef.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500)
  }, [])

  return { toast, showToast }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook: Resend OTP countdown (60 giây)
// ─────────────────────────────────────────────────────────────────────────────
function useResendCountdown(active: boolean) {
  const [seconds, setSeconds] = useState(RESEND_COOLDOWN_SEC)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (!active) return
    setSeconds(RESEND_COOLDOWN_SEC)
    setCanResend(false)

    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id)
          setCanResend(true)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(id)
  }, [active])

  const reset = useCallback(() => {
    setSeconds(RESEND_COOLDOWN_SEC)
    setCanResend(false)
  }, [])

  return { seconds, canResend, reset }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Alert Error Block
// ─────────────────────────────────────────────────────────────────────────────
function AlertError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl
                 bg-[#FCE4D6] border border-[#C00000]/20 text-[#C00000] text-sm
                 animate-[fadeIn_0.2s_ease]"
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Password Strength Indicator
// ─────────────────────────────────────────────────────────────────────────────
function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password)
  const cfg = strengthConfig[strength]

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1.5 mb-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              cfg.bars >= i ? cfg.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      {cfg.label && (
        <p
          className={`text-xs font-medium ${
            strength === 'weak'
              ? 'text-red-500'
              : strength === 'medium'
              ? 'text-amber-500'
              : 'text-emerald-600'
          }`}
        >
          Độ mạnh: {cfg.label}
        </p>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Toast
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50
                  flex items-center gap-3 px-5 py-3.5 rounded-2xl
                  bg-emerald-600 text-white text-sm font-medium shadow-xl
                  transition-all duration-300
                  ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
    >
      <CheckCircle2 className="w-5 h-5 shrink-0" />
      {message}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component: ForgotPasswordPage
// ─────────────────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { toast, showToast } = useToast()

  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<RecoveryStep>('request')

  // ── Step 1: Email ─────────────────────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [loadingRequest, setLoadingRequest] = useState(false)

  // ── Step 2: OTP ───────────────────────────────────────────────────────────
  const [otpValues, setOtpValues] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpError, setOtpError] = useState<string | null>(null)
  const [loadingOtp, setLoadingOtp] = useState(false)
  const otpRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))
  const [resendActive, setResendActive] = useState(false)
  const { seconds: resendSeconds, canResend, reset: resetResend } = useResendCountdown(resendActive)

  // ── Step 3: New password ──────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwErrors, setPwErrors] = useState<{ newPw?: string; confirm?: string }>({})
  const [loadingReset, setLoadingReset] = useState(false)

  // ── Trigger resend countdown khi sang step verify ─────────────────────────
  useEffect(() => {
    if (step === 'verify') {
      setResendActive(true)
    }
  }, [step])

  // ── Transition effect: success → login sau 3 giây ─────────────────────────
  useEffect(() => {
    if (step === 'success') {
      const id = setTimeout(() => navigate('/login'), 3000)
      return () => clearTimeout(id)
    }
  }, [step, navigate])

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 HANDLERS
  // ══════════════════════════════════════════════════════════════════════════
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setEmailError(null)
  }

  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setEmailError(err); return }

    setLoadingRequest(true)
    try {
      // SECURITY – Email Enumeration Prevention (SRS §2.2):
      // Dù email có tồn tại hay không, luôn giả vờ thành công và chuyển Step 2.
      // Backend API cũng phải phản hồi giống nhau cho cả 2 trường hợp.
      await new Promise((r) => setTimeout(r, 900)) // simulate API call
      setStep('verify')
    } finally {
      setLoadingRequest(false)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 HANDLERS – OTP
  // ══════════════════════════════════════════════════════════════════════════
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1) // chỉ nhận 1 chữ số
    if (digit === '' && value !== '') return

    const next = [...otpValues]
    next[index] = digit
    setOtpValues(next)
    setOtpError(null)

    // Auto-focus next
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const next = [...otpValues]
      if (next[index]) {
        next[index] = ''
        setOtpValues(next)
      } else if (index > 0) {
        next[index - 1] = ''
        setOtpValues(next)
        otpRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  // Paste 6 digits at once
  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setOtpValues(next)
    const lastFilledIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    otpRefs.current[lastFilledIdx]?.focus()
  }

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const code = otpValues.join('')
    if (code.length < OTP_LENGTH) {
      setOtpError('Vui lòng nhập đủ 6 chữ số.')
      return
    }

    setLoadingOtp(true)
    try {
      // Simulate API verify OTP
      await new Promise((r) => setTimeout(r, 800))
      // Demo: mã "000000" = sai, còn lại = đúng
      if (code === '000000') {
        throw new Error('invalid')
      }
      setStep('reset')
    } catch {
      setOtpError('Mã OTP không đúng hoặc đã hết hạn. Vui lòng thử lại.')
      setOtpValues(Array(OTP_LENGTH).fill(''))
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } finally {
      setLoadingOtp(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    resetResend()
    // Simulate resend API (vẫn không tiết lộ email status)
    await new Promise((r) => setTimeout(r, 500))
    setOtpValues(Array(OTP_LENGTH).fill(''))
    setOtpError(null)
    showToast('Mã OTP mới đã được gửi đến email của bạn.')
    setTimeout(() => otpRefs.current[0]?.focus(), 50)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 HANDLERS – Reset Password
  // ══════════════════════════════════════════════════════════════════════════
  const handleNewPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value)
    setPwErrors((p) => ({ ...p, newPw: undefined }))
  }

  const handleConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    setPwErrors((p) => ({ ...p, confirm: undefined }))
  }

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof pwErrors = {}

    const pwErr = validatePassword(newPassword)
    if (pwErr) errs.newPw = pwErr
    if (!confirmPassword) {
      errs.confirm = 'Vui lòng xác nhận mật khẩu.'
    } else if (newPassword !== confirmPassword) {
      errs.confirm = 'Hai mật khẩu không khớp nhau.'
    }

    if (Object.keys(errs).length > 0) { setPwErrors(errs); return }

    setLoadingReset(true)
    try {
      // Simulate API update password
      await new Promise((r) => setTimeout(r, 900))
      setStep('success')
      showToast('Mật khẩu đã được cập nhật! Đang chuyển hướng về trang đăng nhập…')
    } finally {
      setLoadingReset(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Step label for progress indicator
  // ─────────────────────────────────────────────────────────────────────────
  const stepIndex = step === 'request' ? 0 : step === 'verify' ? 1 : 2
  const progressSteps = ['Email', 'Xác minh', 'Mật khẩu']

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">

      {/* Toast notification (global) */}
      <Toast message={toast.message} visible={toast.visible} />

      {/* ══════════════════════════════════════════════════════════════════════
          CỘT TRÁI – Illustration (60% desktop, ẩn trên mobile)
      ══════════════════════════════════════════════════════════════════════ */}
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
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/25
                            backdrop-blur-sm flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white/60 text-xs uppercase tracking-widest font-medium">
                Hệ thống học trực tuyến
              </p>
              <p className="text-white font-bold text-base leading-tight">Trường Đại học Việt Nhật</p>
            </div>
          </div>

          {/* Illustration */}
          <SecurityIllustration />

          {/* Tagline */}
          <h1 className="mt-8 text-white text-2xl font-bold leading-snug">
            Bảo mật tài khoản của bạn
          </h1>
          <p className="mt-2 text-white/60 text-sm leading-relaxed max-w-xs">
            Quá trình phục hồi mật khẩu được bảo vệ bởi mã xác thực một lần (OTP)
            và tiêu chuẩn bảo mật cao nhất.
          </p>

          {/* Security badge */}
          <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full
                          bg-white/10 border border-white/20">
            <ShieldCheck className="w-4 h-4 text-white/80" />
            <span className="text-white/70 text-xs font-medium">
              Được mã hóa bởi Argon2id & HMAC-SHA256
            </span>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          CỘT PHẢI – Form (40% desktop, 100% mobile)
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col items-center justify-center
                       bg-white px-6 py-10 sm:px-12">

        <div className="w-full max-w-sm">

          {/* Logo – mobile only */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#EBF3FA] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#2E75B6]" />
            </div>
            <span className="font-bold text-[#1F3864] text-sm">LMS Security</span>
          </div>

          {/* ── Success screen ──────────────────────────────────────────── */}
          {step === 'success' ? (
            <SuccessScreen />
          ) : (
            <>
              {/* Progress steps (step 1/2/3 – ẩn ở success) */}
              <ProgressBar current={stepIndex} labels={progressSteps} />

              {/* ── STEP 1: Enter Email ─────────────────────────────────── */}
              {step === 'request' && (
                <StepRequest
                  email={email}
                  emailError={emailError}
                  loading={loadingRequest}
                  onEmailChange={handleEmailChange}
                  onSubmit={handleRequestSubmit}
                  onBack={() => navigate('/login')}
                />
              )}

              {/* ── STEP 2: OTP Verification ────────────────────────────── */}
              {step === 'verify' && (
                <StepVerify
                  email={email}
                  otpValues={otpValues}
                  otpError={otpError}
                  loading={loadingOtp}
                  canResend={canResend}
                  resendSeconds={resendSeconds}
                  otpRefs={otpRefs}
                  onOtpChange={handleOtpChange}
                  onOtpKeyDown={handleOtpKeyDown}
                  onOtpPaste={handleOtpPaste}
                  onSubmit={handleOtpSubmit}
                  onResend={handleResend}
                  onBack={() => setStep('request')}
                />
              )}

              {/* ── STEP 3: Reset Password ──────────────────────────────── */}
              {step === 'reset' && (
                <StepReset
                  newPassword={newPassword}
                  confirmPassword={confirmPassword}
                  showNew={showNew}
                  showConfirm={showConfirm}
                  pwErrors={pwErrors}
                  loading={loadingReset}
                  onNewChange={handleNewPasswordChange}
                  onConfirmChange={handleConfirmChange}
                  onToggleNew={() => setShowNew((v) => !v)}
                  onToggleConfirm={() => setShowConfirm((v) => !v)}
                  onSubmit={handleResetSubmit}
                  onBack={() => setStep('verify')}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Progress Bar (1→2→3)
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ current, labels }: { current: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div className="flex items-center w-full">
            {/* Line trái */}
            {i > 0 && (
              <div
                className={`h-0.5 flex-1 transition-colors duration-300 ${
                  i <= current ? 'bg-[#C00000]' : 'bg-gray-200'
                }`}
              />
            )}
            {/* Circle */}
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                          transition-all duration-300 shrink-0 ${
                            i < current
                              ? 'bg-[#C00000] text-white'
                              : i === current
                              ? 'bg-[#C00000] text-white ring-4 ring-[#C00000]/20'
                              : 'bg-gray-200 text-gray-400'
                          }`}
            >
              {i < current ? (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {/* Line phải */}
            {i < labels.length - 1 && (
              <div
                className={`h-0.5 flex-1 transition-colors duration-300 ${
                  i < current ? 'bg-[#C00000]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
          {/* Label */}
          <span
            className={`mt-1.5 text-[10px] font-medium transition-colors duration-300 ${
              i <= current ? 'text-[#C00000]' : 'text-gray-400'
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Step 1 – Request OTP
// ─────────────────────────────────────────────────────────────────────────────
interface StepRequestProps {
  email: string
  emailError: string | null
  loading: boolean
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent) => void
  onBack: () => void
}

function StepRequest({ email, emailError, loading, onEmailChange, onSubmit, onBack }: StepRequestProps) {
  return (
    <>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#2E75B6]
                   transition-colors mb-6 -ml-0.5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Quay lại đăng nhập
      </button>

      {/* Heading */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#FCE4D6] flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-[#C00000]" />
        </div>
        <h2 className="text-[1.8rem] font-light text-[#1F3864] tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-1 text-sm text-gray-400 leading-relaxed">
          Nhập email của bạn và chúng tôi sẽ gửi mã OTP để xác minh danh tính.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        {/* Email input */}
        <div className="mb-6">
          <label
            htmlFor="fp-email"
            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
          >
            Email Address
          </label>
          <input
            id="fp-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={onEmailChange}
            disabled={loading}
            placeholder="ten@truong.edu.vn"
            aria-describedby={emailError ? 'fp-email-err' : undefined}
            aria-invalid={!!emailError}
            className={[
              'w-full px-4 py-3 rounded-xl text-sm text-gray-800',
              'bg-gray-50 border outline-none transition-all duration-200',
              'placeholder:text-gray-300 disabled:opacity-50',
              emailError
                ? 'border-[#C00000] ring-1 ring-[#C00000]/30'
                : 'border-gray-200 focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6]/30',
            ].join(' ')}
          />
          {emailError && (
            <p id="fp-email-err" className="mt-1.5 text-xs text-[#C00000]">
              {emailError}
            </p>
          )}
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          Nếu email của bạn đã đăng ký trong hệ thống, bạn sẽ nhận được mã OTP.
          Vì lý do bảo mật, chúng tôi không tiết lộ email nào đã được đăng ký.
        </p>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C00000] text-white font-semibold py-3.5
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
              <Spinner />
              Đang gửi mã OTP…
            </span>
          ) : (
            'Send OTP Code'
          )}
        </button>
      </form>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Step 2 – OTP Verification
// ─────────────────────────────────────────────────────────────────────────────
interface StepVerifyProps {
  email: string
  otpValues: string[]
  otpError: string | null
  loading: boolean
  canResend: boolean
  resendSeconds: number
  otpRefs: React.MutableRefObject<Array<HTMLInputElement | null>>
  onOtpChange: (index: number, value: string) => void
  onOtpKeyDown: (index: number, e: KeyboardEvent<HTMLInputElement>) => void
  onOtpPaste: (e: ClipboardEvent<HTMLInputElement>) => void
  onSubmit: (e: FormEvent) => void
  onResend: () => void
  onBack: () => void
}

function StepVerify({
  email,
  otpValues,
  otpError,
  loading,
  canResend,
  resendSeconds,
  otpRefs,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  onSubmit,
  onResend,
  onBack,
}: StepVerifyProps) {
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)
    : '***@***.***'

  return (
    <>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#2E75B6]
                   transition-colors mb-6 -ml-0.5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Quay lại
      </button>

      {/* Heading */}
      <div className="mb-7">
        <div className="w-12 h-12 rounded-2xl bg-[#EBF3FA] flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6 text-[#2E75B6]" />
        </div>
        <h2 className="text-[1.8rem] font-light text-[#1F3864] tracking-tight">
          Enter Verification Code
        </h2>
        <p className="mt-1 text-sm text-gray-400 leading-relaxed">
          Một mã OTP gồm 6 chữ số đã được gửi đến{' '}
          <span className="font-semibold text-gray-600">{maskedEmail}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        {/* OTP error alert */}
        {otpError && <AlertError message={otpError} />}

        {/* 6-digit OTP input */}
        <div className="mb-6">
          <div
            className="flex gap-2.5 justify-center"
            role="group"
            aria-label="Nhập mã OTP 6 chữ số"
          >
            {Array.from({ length: OTP_LENGTH }).map((_, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otpValues[i]}
                onChange={(e) => onOtpChange(i, e.target.value)}
                onKeyDown={(e) => onOtpKeyDown(i, e)}
                onPaste={i === 0 ? onOtpPaste : undefined}
                disabled={loading}
                aria-label={`Chữ số thứ ${i + 1}`}
                className={[
                  'w-11 h-12 text-center text-lg font-bold rounded-xl',
                  'border-2 outline-none transition-all duration-200',
                  'bg-gray-50 text-gray-800 caret-[#C00000]',
                  'disabled:opacity-50',
                  otpError
                    ? 'border-[#C00000] bg-[#FCE4D6]/40'
                    : otpValues[i]
                    ? 'border-[#2E75B6] bg-[#EBF3FA]/60'
                    : 'border-gray-200 focus:border-[#2E75B6] focus:bg-[#EBF3FA]/30',
                ].join(' ')}
              />
            ))}
          </div>
        </div>

        {/* Resend section */}
        <div className="text-center mb-6">
          {canResend ? (
            <button
              type="button"
              onClick={onResend}
              className="inline-flex items-center gap-1.5 text-sm font-semibold
                         text-[#C00000] hover:text-[#a80000] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resend Code
            </button>
          ) : (
            <p className="text-sm text-gray-400">
              Gửi lại mã sau{' '}
              <span className="font-mono font-semibold text-gray-600 tabular-nums">
                {String(resendSeconds).padStart(2, '0')}s
              </span>
            </p>
          )}
        </div>

        {/* Verify button */}
        <button
          type="submit"
          disabled={loading || otpValues.join('').length < OTP_LENGTH}
          className="w-full bg-[#C00000] text-white font-semibold py-3.5
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
              <Spinner />
              Đang xác minh…
            </span>
          ) : (
            'Verify OTP'
          )}
        </button>
      </form>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Step 3 – Reset Password
// ─────────────────────────────────────────────────────────────────────────────
interface StepResetProps {
  newPassword: string
  confirmPassword: string
  showNew: boolean
  showConfirm: boolean
  pwErrors: { newPw?: string; confirm?: string }
  loading: boolean
  onNewChange: (e: ChangeEvent<HTMLInputElement>) => void
  onConfirmChange: (e: ChangeEvent<HTMLInputElement>) => void
  onToggleNew: () => void
  onToggleConfirm: () => void
  onSubmit: (e: FormEvent) => void
  onBack: () => void
}

function StepReset({
  newPassword,
  confirmPassword,
  showNew,
  showConfirm,
  pwErrors,
  loading,
  onNewChange,
  onConfirmChange,
  onToggleNew,
  onToggleConfirm,
  onSubmit,
  onBack,
}: StepResetProps) {
  return (
    <>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#2E75B6]
                   transition-colors mb-6 -ml-0.5 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Quay lại
      </button>

      {/* Heading */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[#EBF3FA] flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-[#2E75B6]" />
        </div>
        <h2 className="text-[1.8rem] font-light text-[#1F3864] tracking-tight">
          Create New Password
        </h2>
        <p className="mt-1 text-sm text-gray-400 leading-relaxed">
          Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        {/* New Password */}
        <div className="mb-5">
          <label
            htmlFor="fp-new-pw"
            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="fp-new-pw"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={onNewChange}
              disabled={loading}
              placeholder="Tối thiểu 8 ký tự"
              aria-describedby={pwErrors.newPw ? 'fp-new-err' : undefined}
              aria-invalid={!!pwErrors.newPw}
              className={[
                'w-full px-4 py-3 pr-12 rounded-xl text-sm text-gray-800',
                'bg-gray-50 border outline-none transition-all duration-200',
                'placeholder:text-gray-300 disabled:opacity-50',
                pwErrors.newPw
                  ? 'border-[#C00000] ring-1 ring-[#C00000]/30'
                  : 'border-gray-200 focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6]/30',
              ].join(' ')}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={onToggleNew}
              aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2
                         text-gray-400 hover:text-[#2E75B6] transition-colors p-0.5"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {pwErrors.newPw && (
            <p id="fp-new-err" className="mt-1.5 text-xs text-[#C00000]">
              {pwErrors.newPw}
            </p>
          )}
          {/* Password Strength Indicator */}
          <PasswordStrengthBar password={newPassword} />
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label
            htmlFor="fp-confirm-pw"
            className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="fp-confirm-pw"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={onConfirmChange}
              disabled={loading}
              placeholder="Nhập lại mật khẩu mới"
              aria-describedby={pwErrors.confirm ? 'fp-confirm-err' : undefined}
              aria-invalid={!!pwErrors.confirm}
              className={[
                'w-full px-4 py-3 pr-12 rounded-xl text-sm text-gray-800',
                'bg-gray-50 border outline-none transition-all duration-200',
                'placeholder:text-gray-300 disabled:opacity-50',
                pwErrors.confirm
                  ? 'border-[#C00000] ring-1 ring-[#C00000]/30'
                  : confirmPassword && newPassword === confirmPassword
                  ? 'border-emerald-400 ring-1 ring-emerald-300/40'
                  : 'border-gray-200 focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6]/30',
              ].join(' ')}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={onToggleConfirm}
              aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2
                         text-gray-400 hover:text-[#2E75B6] transition-colors p-0.5"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {pwErrors.confirm && (
            <p id="fp-confirm-err" className="mt-1.5 text-xs text-[#C00000]">
              {pwErrors.confirm}
            </p>
          )}
          {/* Match indicator */}
          {confirmPassword && newPassword === confirmPassword && !pwErrors.confirm && (
            <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Mật khẩu khớp nhau
            </p>
          )}
        </div>

        {/* Update button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#C00000] text-white font-semibold py-3.5
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
              <Spinner />
              Đang cập nhật…
            </span>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-component: Success Screen (sau khi reset thành công)
// ─────────────────────────────────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <div className="flex flex-col items-center text-center py-8 px-2 animate-[fadeIn_0.3s_ease]">
      {/* Icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6
                   bg-emerald-50 ring-8 ring-emerald-100"
      >
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>

      <h2 className="text-2xl font-bold text-[#1F3864] mb-2">Mật khẩu đã được cập nhật!</h2>
      <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
        Tài khoản của bạn đã được bảo vệ bởi mật khẩu mới.
        Bạn sẽ được chuyển về trang đăng nhập trong vài giây…
      </p>

      {/* Countdown dots */}
      <div className="mt-8 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
