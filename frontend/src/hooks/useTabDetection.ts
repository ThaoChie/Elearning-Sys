import { useCallback, useEffect, useRef, useState } from 'react'
import apiClient from '../api/apiClient'

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_VIOLATIONS = 3

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseTabDetectionOptions {
  /** ID của phiên thi hiện tại — bắt buộc để gọi API */
  examSessionId: string
  /** Callback khi số vi phạm đạt ngưỡng MAX_VIOLATIONS → force submit */
  onMaxViolations?: () => void
}

interface UseTabDetectionReturn {
  violationCount: number
  isWarningVisible: boolean
  dismissWarning: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Phát hiện chuyển tab / ẩn cửa sổ trong khi thi.
 *
 * Khi `document.visibilityState === 'hidden'`:
 *   1. Tăng bộ đếm vi phạm cục bộ.
 *   2. Gọi API báo cáo vi phạm lên server (idempotent — không block UI).
 *   3. Hiển thị cảnh báo cho thí sinh.
 *   4. Nếu đạt MAX_VIOLATIONS → gọi `onMaxViolations` để nộp bài bắt buộc.
 *
 * Cleanup: xóa event listener khi component unmount hoặc deps thay đổi.
 */
export function useTabDetection({
  examSessionId,
  onMaxViolations,
}: UseTabDetectionOptions): UseTabDetectionReturn {
  const [violationCount, setViolationCount] = useState<number>(0)
  const [isWarningVisible, setIsWarningVisible] = useState<boolean>(false)

  // Dùng ref để đọc giá trị mới nhất bên trong event handler mà không cần re-register listener
  const violationCountRef = useRef<number>(0)
  const onMaxViolationsRef = useRef<(() => void) | undefined>(onMaxViolations)

  // Đồng bộ ref mỗi khi callback thay đổi
  useEffect(() => {
    onMaxViolationsRef.current = onMaxViolations
  }, [onMaxViolations])

  // Gọi API báo cáo vi phạm — không throw để không block luồng chính
  const reportViolation = useCallback(
    async (count: number) => {
      try {
        await apiClient.post(`/exams/sessions/${examSessionId}/violations`, {
          violationCount: count,
          reason: 'TAB_SWITCH',
          occurredAt: new Date().toISOString(),
        })
      } catch (err) {
        // Ghi log nhưng không crash — server sẽ đồng bộ lại qua heartbeat
        console.error('[useTabDetection] Không thể báo cáo vi phạm:', err)
      }
    },
    [examSessionId],
  )

  useEffect(() => {
    if (!examSessionId) return

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return

      // Cập nhật ref trước để giá trị đúng trong async callback
      const newCount = violationCountRef.current + 1
      violationCountRef.current = newCount

      setViolationCount(newCount)
      setIsWarningVisible(true)

      // Báo cáo server bất đồng bộ — không await để không block
      reportViolation(newCount)

      // Kiểm tra ngưỡng force submit
      if (newCount >= MAX_VIOLATIONS) {
        onMaxViolationsRef.current?.()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [examSessionId, reportViolation])

  const dismissWarning = useCallback(() => {
    setIsWarningVisible(false)
  }, [])

  return { violationCount, isWarningVisible, dismissWarning }
}
