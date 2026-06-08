import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseFullscreenOptions {
  /** Ref tới phần tử muốn ép fullscreen (thường là wrapper toàn màn hình phòng thi) */
  targetRef: React.RefObject<HTMLElement | null>
  /** Callback khi user thoát fullscreen (nhấn ESC hoặc F11) */
  onExitFullscreen?: () => void
}

interface UseFullscreenReturn {
  /** Trạng thái fullscreen hiện tại */
  isFullscreen: boolean
  /** Cảnh báo hiển thị khi user thoát fullscreen */
  isExitWarningVisible: boolean
  /** Gọi để yêu cầu vào fullscreen */
  enterFullscreen: () => Promise<void>
  /** Ẩn cảnh báo và thử vào fullscreen lại */
  handleReenter: () => Promise<void>
  /** Ẩn cảnh báo (dùng khi component tự xử lý) */
  dismissExitWarning: () => void
}

// ─── Helpers (cross-browser) ──────────────────────────────────────────────────
/** Kiểm tra trình duyệt đang ở chế độ fullscreen */
function getIsFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    // @ts-expect-error — vendor prefixes cũ
    document.webkitFullscreenElement ||
    // @ts-expect-error
    document.mozFullScreenElement ||
    // @ts-expect-error
    document.msFullscreenElement
  )
}

/** Yêu cầu fullscreen cho một phần tử (cross-browser) */
async function requestFullscreen(el: HTMLElement): Promise<void> {
  if (el.requestFullscreen) {
    await el.requestFullscreen()
  } else if ((el as any).webkitRequestFullscreen) {
    // Safari
    ;(el as any).webkitRequestFullscreen()
  } else if ((el as any).mozRequestFullScreen) {
    // Firefox cũ
    ;(el as any).mozRequestFullScreen()
  } else if ((el as any).msRequestFullscreen) {
    // IE/Edge cũ
    ;(el as any).msRequestFullscreen()
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Quản lý chế độ Fullscreen cho phòng thi.
 *
 * - Tự động vào fullscreen khi mount (nếu targetRef đã sẵn sàng).
 * - Lắng nghe `fullscreenchange` → phát hiện user thoát (ESC/F11).
 * - Hiển thị cảnh báo + cho phép thí sinh quay lại fullscreen.
 * - Cleanup tất cả event listener khi unmount.
 */
export function useFullscreen({
  targetRef,
  onExitFullscreen,
}: UseFullscreenOptions): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isExitWarningVisible, setIsExitWarningVisible] = useState<boolean>(false)

  const onExitFullscreenRef = useRef<(() => void) | undefined>(onExitFullscreen)

  useEffect(() => {
    onExitFullscreenRef.current = onExitFullscreen
  }, [onExitFullscreen])

  // ── Core: vào fullscreen ───────────────────────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    const el = targetRef.current
    if (!el) {
      console.warn('[useFullscreen] targetRef chưa được gán vào DOM element.')
      return
    }
    try {
      await requestFullscreen(el)
    } catch (err) {
      // Một số trình duyệt chặn nếu không có user gesture — log nhưng không crash
      console.error('[useFullscreen] Không thể vào fullscreen:', err)
    }
  }, [targetRef])

  // ── Xử lý fullscreenchange ─────────────────────────────────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      const nowFullscreen = getIsFullscreen()
      setIsFullscreen(nowFullscreen)

      if (!nowFullscreen) {
        // User vừa thoát fullscreen
        setIsExitWarningVisible(true)
        onExitFullscreenRef.current?.()
      }
    }

    // Đăng ký tất cả vendor prefixes để đảm bảo cross-browser
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // ── Tự động enter fullscreen khi hook mount ────────────────────────────────
  useEffect(() => {
    // Delay nhỏ để đảm bảo DOM đã render xong và có user gesture (ví dụ: click "Bắt đầu thi")
    const timer = setTimeout(() => {
      if (!getIsFullscreen()) {
        enterFullscreen()
      }
    }, 300)

    return () => clearTimeout(timer)
    // Chỉ chạy một lần khi mount — intentionally omit enterFullscreen dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Quay lại fullscreen sau khi bị thoát ──────────────────────────────────
  const handleReenter = useCallback(async () => {
    setIsExitWarningVisible(false)
    await enterFullscreen()
  }, [enterFullscreen])

  const dismissExitWarning = useCallback(() => {
    setIsExitWarningVisible(false)
  }, [])

  return {
    isFullscreen,
    isExitWarningVisible,
    enterFullscreen,
    handleReenter,
    dismissExitWarning,
  }
}
