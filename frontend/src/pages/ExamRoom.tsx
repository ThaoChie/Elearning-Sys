import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAntiCheat } from '../hooks/useAntiCheat'
import { useTabDetection } from '../hooks/useTabDetection'
import { useFullscreen } from '../hooks/useFullscreen'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: string
  order: number
  content: string
  options: { key: string; text: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ─── Mock data (thay bằng API call thực tế) ───────────────────────────────────
const MOCK_EXAM = {
  title: 'Kiểm tra giữa kỳ — An ninh thông tin',
  durationSeconds: 45 * 60,
  questions: Array.from({ length: 5 }, (_, i) => ({
    id: `q${i + 1}`,
    order: i + 1,
    content: `Câu ${i + 1}: Đây là nội dung câu hỏi mẫu số ${i + 1}?`,
    options: [
      { key: 'A', text: 'Phương án A' },
      { key: 'B', text: 'Phương án B' },
      { key: 'C', text: 'Phương án C' },
      { key: 'D', text: 'Phương án D' },
    ],
  })) as Question[],
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Topbar cố định — nền #1F3864, chữ trắng, đồng hồ đỏ khi < 5 phút */
function ExamTopbar({
  title,
  remainingSeconds,
  questionCount,
  currentQuestion,
  onSubmit,
}: {
  title: string
  remainingSeconds: number
  questionCount: number
  currentQuestion: number
  onSubmit: () => void
}) {
  const isCritical = remainingSeconds < 5 * 60
  const isExpired = remainingSeconds <= 0

  return (
    <div
      style={{ backgroundColor: '#1F3864' }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 shadow-lg select-none"
    >
      {/* Tiêu đề */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-white font-semibold text-sm truncate max-w-xs lg:max-w-md">
          {title}
        </span>
      </div>

      {/* Tiến độ câu hỏi */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-blue-200 text-xs">Câu</span>
        <span className="text-white font-bold text-sm">
          {currentQuestion}/{questionCount}
        </span>
      </div>

      {/* Đồng hồ đếm ngược */}
      <div className="flex items-center gap-4">
        <div
          className={[
            'flex items-center gap-2 px-4 py-1.5 rounded-md font-mono font-bold text-base',
            isCritical || isExpired
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-blue-900 text-white',
          ].join(' ')}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {isExpired ? '00:00' : formatTime(remainingSeconds)}
        </div>

        <button
          onClick={onSubmit}
          className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-semibold px-4 py-1.5 rounded-md transition-colors duration-150 whitespace-nowrap"
        >
          Nộp bài
        </button>
      </div>
    </div>
  )
}

/** Banner cảnh báo vi phạm — màu #FCE4D6, trượt xuống khi violationCount > 0 */
function ViolationBanner({
  violationCount,
  isVisible,
  onDismiss,
}: {
  violationCount: number
  isVisible: boolean
  onDismiss: () => void
}) {
  const MAX_VIOLATIONS = 3

  if (!isVisible || violationCount === 0) return null

  return (
    <div
      style={{ backgroundColor: '#FCE4D6', top: '60px' }}
      className="fixed left-0 right-0 z-40 flex items-center justify-between px-6 py-2.5 shadow-md
                 animate-[slideDown_0.3s_ease-out]"
    >
      <div className="flex items-center gap-3">
        <svg
          className="w-5 h-5 text-orange-600 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.008v.008H12v-.008z" />
        </svg>
        <div>
          <span className="text-orange-800 font-semibold text-sm">
            ⚠ Cảnh báo vi phạm ({violationCount}/{MAX_VIOLATIONS}):
          </span>
          <span className="text-orange-700 text-sm ml-2">
            {violationCount < MAX_VIOLATIONS
              ? `Bạn đã rời khỏi cửa sổ thi. Còn ${MAX_VIOLATIONS - violationCount} lần trước khi bị nộp bài bắt buộc.`
              : 'Đạt ngưỡng vi phạm tối đa! Bài thi sẽ được nộp tự động.'}
          </span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="ml-4 text-orange-600 hover:text-orange-800 transition-colors"
        aria-label="Đóng cảnh báo"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

/** Modal cảnh báo thoát fullscreen */
function FullscreenWarningModal({
  isVisible,
  onReenter,
}: {
  isVisible: boolean
  onReenter: () => void
}) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-red-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Thoát chế độ toàn màn hình</h3>
        <p className="text-gray-600 text-sm mb-6">
          Phòng thi yêu cầu bật chế độ toàn màn hình. Hành động này đã được ghi lại. Vui lòng quay
          lại toàn màn hình để tiếp tục làm bài.
        </p>
        <button
          onClick={onReenter}
          style={{ backgroundColor: '#1F3864' }}
          className="w-full py-2.5 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Quay lại toàn màn hình
        </button>
      </div>
    </div>
  )
}

/** Modal xác nhận nộp bài */
function SubmitConfirmModal({
  isVisible,
  answeredCount,
  totalCount,
  onConfirm,
  onCancel,
}: {
  isVisible: boolean
  answeredCount: number
  totalCount: number
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Xác nhận nộp bài</h3>
        <p className="text-gray-600 text-sm mb-1">
          Bạn đã trả lời{' '}
          <span className="font-semibold text-blue-700">
            {answeredCount}/{totalCount}
          </span>{' '}
          câu hỏi.
        </p>
        {answeredCount < totalCount && (
          <p className="text-orange-600 text-sm mb-4">
            ⚠ Còn {totalCount - answeredCount} câu chưa trả lời. Bạn có chắc muốn nộp?
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Tiếp tục làm bài
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Nộp bài
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExamRoom() {
  const { sessionId = 'demo-session' } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [remainingSeconds, setRemainingSeconds] = useState(MOCK_EXAM.durationSeconds)
  const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const roomRef = useRef<HTMLDivElement>(null)

  // ── Anti-cheat hooks ───────────────────────────────────────────────────────
  const handleForceSubmit = useCallback(() => {
    handleSubmitConfirm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { violationCount, isWarningVisible, dismissWarning } = useTabDetection({
    examSessionId: sessionId,
    onMaxViolations: handleForceSubmit,
  })

  const { isExitWarningVisible, handleReenter } = useFullscreen({
    targetRef: roomRef,
    onExitFullscreen: () => {
      // Vi phạm fullscreen được ghi nhận qua useTabDetection
    },
  })

  useAntiCheat({
    enabled: !isSubmitted,
    onCheatAttempt: (action) => {
      console.warn('[ExamRoom] Cheat attempt detected:', action)
    },
  })

  // ── Server-side timer (heartbeat mỗi 30s) ─────────────────────────────────
  useEffect(() => {
    if (isSubmitted) return

    const tick = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0) {
          clearInterval(tick)
          handleForceSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [isSubmitted, handleForceSubmit])

  // Heartbeat mỗi 30s đồng bộ timer với server
  useEffect(() => {
    if (isSubmitted) return

    const heartbeat = setInterval(async () => {
      try {
        // TODO: gọi API đồng bộ thời gian
        // const { data } = await apiClient.post(`/exams/sessions/${sessionId}/heartbeat`)
        // setRemainingSeconds(data.remainingSeconds)
      } catch {
        // Không crash nếu mất mạng tạm thời
      }
    }, 30_000)

    return () => clearInterval(heartbeat)
  }, [sessionId, isSubmitted])

  // ── Chặn DevTools resize (print media) ────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'exam-print-block'
    style.textContent = `@media print { body { display: none !important; } }`
    document.head.appendChild(style)
    return () => document.getElementById('exam-print-block')?.remove()
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAnswer = (questionId: string, optionKey: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }))
  }

  const handleSubmitConfirm = useCallback(() => {
    setIsSubmitted(true)
    setIsSubmitModalVisible(false)
    // TODO: gọi API nộp bài
    // await apiClient.post(`/exams/sessions/${sessionId}/submit`, { answers })
    navigate('/exam/result', { replace: true })
  }, [navigate])

  const currentQuestion = MOCK_EXAM.questions[currentQuestionIndex]
  const answeredCount = Object.keys(answers).length

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={roomRef}
      className="min-h-screen bg-gray-100 select-none"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* ── Topbar ── */}
      <ExamTopbar
        title={MOCK_EXAM.title}
        remainingSeconds={remainingSeconds}
        questionCount={MOCK_EXAM.questions.length}
        currentQuestion={currentQuestionIndex + 1}
        onSubmit={() => setIsSubmitModalVisible(true)}
      />

      {/* ── Violation Banner ── */}
      <ViolationBanner
        violationCount={violationCount}
        isVisible={isWarningVisible}
        onDismiss={dismissWarning}
      />

      {/* ── Main content (offset = topbar height 60px) ── */}
      <div
        className="flex gap-0 transition-all duration-300"
        style={{ paddingTop: violationCount > 0 && isWarningVisible ? '108px' : '60px' }}
      >
        {/* ─── Question Navigator Sidebar ─── */}
        <aside className="hidden lg:flex flex-col w-56 min-h-[calc(100vh-60px)] bg-white border-r border-gray-200 p-4 gap-2 sticky top-[60px] self-start">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Danh sách câu hỏi
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {MOCK_EXAM.questions.map((q, idx) => {
              const isAnswered = !!answers[q.id]
              const isCurrent = idx === currentQuestionIndex
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={[
                    'w-8 h-8 rounded-md text-xs font-semibold transition-all duration-150',
                    isCurrent
                      ? 'ring-2 ring-offset-1 ring-blue-500 text-white'
                      : '',
                    isAnswered && !isCurrent
                      ? 'bg-green-500 text-white'
                      : !isAnswered && !isCurrent
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : '',
                    isCurrent ? 'bg-blue-600' : '',
                  ].join(' ')}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-4 h-4 rounded bg-green-500 inline-block" />
              Đã trả lời ({answeredCount})
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-4 h-4 rounded bg-gray-100 border border-gray-300 inline-block" />
              Chưa trả lời ({MOCK_EXAM.questions.length - answeredCount})
            </div>
          </div>
        </aside>

        {/* ─── Question Content ─── */}
        <main className="flex-1 max-w-3xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
            {/* Question header */}
            <div className="flex items-start gap-3 mb-5">
              <span
                style={{ backgroundColor: '#1F3864' }}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              >
                {currentQuestionIndex + 1}
              </span>
              <p className="text-gray-800 font-medium leading-relaxed text-base">
                {currentQuestion.content}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 pl-11">
              {currentQuestion.options.map((option) => {
                const isSelected = answers[currentQuestion.id] === option.key
                return (
                  <label
                    key={option.key}
                    className={[
                      'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-150',
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option.key}
                      checked={isSelected}
                      onChange={() => handleAnswer(currentQuestion.id, option.key)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span
                      className={[
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                        isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600',
                      ].join(' ')}
                    >
                      {option.key}
                    </span>
                    <span
                      className={[
                        'text-sm',
                        isSelected ? 'text-blue-800 font-medium' : 'text-gray-700',
                      ].join(' ')}
                    >
                      {option.text}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Câu trước
            </button>

            <span className="text-sm text-gray-400">
              {currentQuestionIndex + 1} / {MOCK_EXAM.questions.length}
            </span>

            {currentQuestionIndex < MOCK_EXAM.questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentQuestionIndex((i) =>
                    Math.min(MOCK_EXAM.questions.length - 1, i + 1),
                  )
                }
                style={{ backgroundColor: '#1F3864' }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Câu tiếp theo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setIsSubmitModalVisible(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors"
              >
                Nộp bài
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      <FullscreenWarningModal
        isVisible={isExitWarningVisible}
        onReenter={handleReenter}
      />

      <SubmitConfirmModal
        isVisible={isSubmitModalVisible}
        answeredCount={answeredCount}
        totalCount={MOCK_EXAM.questions.length}
        onConfirm={handleSubmitConfirm}
        onCancel={() => setIsSubmitModalVisible(false)}
      />
    </div>
  )
}
