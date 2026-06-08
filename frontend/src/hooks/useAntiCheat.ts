import { useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface UseAntiCheatOptions {
  /** Tắt hook (ví dụ: sau khi nộp bài) — mặc định: true (bật) */
  enabled?: boolean
  /** Callback khi phát hiện hành vi gian lận — để ghi log hoặc cảnh báo thêm */
  onCheatAttempt?: (action: CheatAction) => void
}

type CheatAction = 'COPY' | 'PASTE' | 'CUT' | 'RIGHT_CLICK' | 'SELECT_ALL' | 'PRINT' | 'DRAG'

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Chặn event và tùy chọn gọi callback */
function blockEvent(
  event: Event,
  action: CheatAction,
  onCheatAttempt?: (a: CheatAction) => void,
) {
  event.preventDefault()
  event.stopPropagation()
  onCheatAttempt?.(action)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Chặn các hành vi sao chép / gian lận trong phòng thi:
 *
 * | Hành vi bị chặn          | Event                     |
 * |--------------------------|---------------------------|
 * | Copy (Ctrl+C)            | `copy`                    |
 * | Paste (Ctrl+V)           | `paste`                   |
 * | Cut (Ctrl+X)             | `cut`                     |
 * | Chuột phải               | `contextmenu`             |
 * | Chọn tất cả (Ctrl+A)     | `keydown` (Ctrl/Cmd + A)  |
 * | In trang (Ctrl+P)        | `keydown` (Ctrl/Cmd + P)  |
 * | Kéo thả văn bản          | `dragstart`               |
 *
 * CSS bổ sung (user-select: none) nên được đặt ở component cha.
 *
 * Cleanup: tất cả listener được xóa khi `enabled` chuyển false hoặc unmount.
 */
export function useAntiCheat({
  enabled = true,
  onCheatAttempt,
}: UseAntiCheatOptions = {}): void {
  useEffect(() => {
    if (!enabled) return

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleCopy = (e: ClipboardEvent) => blockEvent(e, 'COPY', onCheatAttempt)
    const handlePaste = (e: ClipboardEvent) => blockEvent(e, 'PASTE', onCheatAttempt)
    const handleCut = (e: ClipboardEvent) => blockEvent(e, 'CUT', onCheatAttempt)
    const handleContextMenu = (e: MouseEvent) => blockEvent(e, 'RIGHT_CLICK', onCheatAttempt)
    const handleDragStart = (e: DragEvent) => blockEvent(e, 'DRAG', onCheatAttempt)

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey // Cmd trên macOS

      // Ctrl/Cmd + A: chọn tất cả
      if (isCtrlOrCmd && e.key === 'a') {
        blockEvent(e, 'SELECT_ALL', onCheatAttempt)
        return
      }

      // Ctrl/Cmd + P: in trang
      if (isCtrlOrCmd && e.key === 'p') {
        blockEvent(e, 'PRINT', onCheatAttempt)
        return
      }

      // Chặn F12 / DevTools shortcuts (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (
        e.key === 'F12' ||
        (isCtrlOrCmd && e.shiftKey && ['i', 'j', 'c', 'I', 'J', 'C'].includes(e.key))
      ) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
    }

    // ── Đăng ký listeners (capture phase để chặn trước khi bubble) ────────────
    const opts: AddEventListenerOptions = { capture: true }

    document.addEventListener('copy', handleCopy, opts)
    document.addEventListener('paste', handlePaste, opts)
    document.addEventListener('cut', handleCut, opts)
    document.addEventListener('contextmenu', handleContextMenu, opts)
    document.addEventListener('dragstart', handleDragStart, opts)
    document.addEventListener('keydown', handleKeyDown, opts)

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      document.removeEventListener('copy', handleCopy, opts)
      document.removeEventListener('paste', handlePaste, opts)
      document.removeEventListener('cut', handleCut, opts)
      document.removeEventListener('contextmenu', handleContextMenu, opts)
      document.removeEventListener('dragstart', handleDragStart, opts)
      document.removeEventListener('keydown', handleKeyDown, opts)
    }
  }, [enabled, onCheatAttempt])
}
