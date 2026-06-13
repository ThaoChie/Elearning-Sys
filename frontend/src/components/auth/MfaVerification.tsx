import { useRef, type KeyboardEvent, type ClipboardEvent, type ChangeEvent } from 'react'

interface MfaVerificationProps {
  /** 6 chữ số OTP hiện tại */
  otp: string[]
  /** Callback khi người dùng thay đổi một ô */
  onChange: (otp: string[]) => void
  /** Đang trong trạng thái loading */
  loading?: boolean
  /** Thông báo lỗi (nếu có) */
  error?: string | null
  /** Callback khi submit (nhấn Enter ở ô cuối hoặc nút Xác thực) */
  onSubmit: () => void
  /** Email hiển thị để user biết mình đang xác thực cho tài khoản nào */
  email?: string
}

export default function MfaVerification({
  otp,
  onChange,
  loading = false,
  error = null,
  onSubmit,
  email,
}: MfaVerificationProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '') // Chỉ nhận số
    if (!val) return

    const digit = val.slice(-1) // Lấy ký tự cuối nếu user paste nhiều
    const next = [...otp]
    next[index] = digit
    onChange(next)

    // Tự động focus ô tiếp theo
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        // Xoá ký tự ở ô hiện tại
        const next = [...otp]
        next[index] = ''
        onChange(next)
      } else if (index > 0) {
        // Nhảy về ô trước và xoá
        const next = [...otp]
        next[index - 1] = ''
        onChange(next)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === 'Enter' && index === 5) {
      onSubmit()
    }
  }

  // Xử lý paste: phân phối 6 số vào 6 ô
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const next = [...otp]
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? ''
    }
    onChange(next)

    // Focus ô cuối đã điền hoặc ô tiếp theo sau phần paste
    const focusIdx = Math.min(pasted.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Icon shield */}
      <div className="w-16 h-16 rounded-full bg-[#EBF3FA] flex items-center justify-center">
        <svg
          className="w-8 h-8 text-[#2E75B6]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6
               1.75 1.75 0 013 7.75v1.5C3 14.814 7.07 19.25 12 21c4.93-1.75
               9-6.186 9-11.75V7.75c0-.54-.196-1.057-.55-1.452A11.96 11.96 0
               0112 2.714z"
          />
        </svg>
      </div>

      {/* Tiêu đề */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#1F3864] mb-1">Xác thực hai bước</h2>
        <p className="text-sm text-gray-500">
          Nhập mã 6 số từ ứng dụng Authenticator
          {email && (
            <>
              {' '}cho tài khoản{' '}
              <span className="font-semibold text-[#2E75B6]">{email}</span>
            </>
          )}
        </p>
      </div>

      {/* 6 ô OTP */}
      <div className="flex justify-center gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={loading}
            aria-label={`Ký tự OTP thứ ${index + 1}`}
            className={[
              'w-12 h-12 text-center text-xl font-bold',
              'bg-[#F2F2F2] rounded-lg border-2 outline-none',
              'transition-all duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error
                ? 'border-[#C00000] focus:border-[#C00000]'
                : digit
                  ? 'border-[#2E75B6] text-[#1F3864]'
                  : 'border-transparent focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6]',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <p className="text-sm text-[#C00000] text-center" role="alert">
          {error}
        </p>
      )}

      {/* Nút xác thực */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || otp.some((d) => !d)}
        className="w-full bg-[#2E75B6] text-slate-900 font-semibold py-3 rounded-lg
                   hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                   disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0
                   disabled:shadow-none focus:outline-none focus:ring-2
                   focus:ring-[#2E75B6] focus:ring-offset-2"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Đang xác thực…
          </span>
        ) : (
          'Xác thực'
        )}
      </button>

      {/* Link thử lại */}
      <p className="text-xs text-gray-400 text-center">
        Không nhận được mã?{' '}
        <button
          type="button"
          className="text-[#2E75B6] underline underline-offset-2 hover:opacity-80"
        >
          Thử lại sau 30 giây
        </button>
      </p>
    </div>
  )
}
