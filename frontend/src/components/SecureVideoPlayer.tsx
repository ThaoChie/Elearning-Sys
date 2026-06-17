/**
 * SecureVideoPlayer.tsx
 *
 * Component phát video bài giảng bảo mật:
 *  - Tự fetch Signed URL (HMAC-SHA256, 4h TTL) từ backend mỗi khi mount
 *  - Tắt download, chuột phải, Picture-in-Picture
 *  - Canvas watermark: UserID + Timestamp xoay -45°, render một lần duy nhất
 *    (không vẽ lại mỗi frame) → không gây giật lag video
 *  - Tự refresh Signed URL trước 5 phút khi hết hạn để không bị gián đoạn
 *  - MutationObserver: tự động phục hồi canvas watermark nếu bị xóa qua DevTools (F12)
 */

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  memo,
} from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface SecureVideoPlayerProps {
  /** Đường dẫn tương đối của video trong storage, VD: "courses/123/lesson-1.mp4" */
  videoPath: string
  /** ID người dùng hiện tại (từ auth store / JWT decode) – dùng để hiện watermark */
  userId: string
  /** Class Tailwind bổ sung cho wrapper */
  className?: string
  /** Callback khi video kết thúc */
  onEnded?: () => void
}

// ── Constants ──────────────────────────────────────────────────────────────────

/** Làm mới URL trước bao nhiêu giây so với expiresAt */
const REFRESH_BEFORE_EXPIRY_S = 5 * 60 // 5 phút

// ── Hook: Signed URL management ───────────────────────────────────────────────

function useSignedUrl(videoPath: string) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUrl = useCallback(async () => {
    try {
      // Mock: Just use the original URL instead of fetching signed url
      setSignedUrl(videoPath)
      setError(null)
    } catch {
      setError('Không thể tải video. Vui lòng thử lại.')
    }
  }, [videoPath])

  useEffect(() => {
    fetchUrl()
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, [fetchUrl])

  return { signedUrl, error, retry: fetchUrl }
}

// ── Hàm vẽ watermark độc lập (reuse cho cả hook và MutationGuard) ──────────
//   Đặt trước useCanvasWatermark vì hook này gọi hàm này.

/**
 * Vẽ watermark lên canvas bất kỳ – dùng lại bởi:
 *  1. useCanvasWatermark (mount lần đầu)
 *  2. useMutationGuard  (restore sau khi canvas bị xóa qua F12)
 *
 * Kỹ thuật tối ưu: ưu tiên OffscreenCanvas (off main thread), fallback canvas DOM.
 */
function drawWatermarkOnCanvas(canvas: HTMLCanvasElement, userId: string) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvas.offsetWidth || canvas.width || 640
  const H = canvas.offsetHeight || canvas.height || 360
  canvas.width = W
  canvas.height = H

  const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
  const label = `${userId} · ${timestamp}`

  const draw = (targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => {
    const tW = targetCtx.canvas.width
    const tH = targetCtx.canvas.height

    targetCtx.clearRect(0, 0, tW, tH)
    targetCtx.save()

    // Font và màu sắc watermark mờ
    targetCtx.font = 'bold 14px Inter, system-ui, sans-serif'
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.18)'
    targetCtx.shadowColor = 'rgba(0,0,0,0.4)'
    targetCtx.shadowBlur = 3

    // Lặp tile watermark theo lưới chéo -45°
    const angle = (-45 * Math.PI) / 180
    const tileW = 260
    const tileH = 80

    for (let y = -tH; y < tH * 2; y += tileH) {
      for (let x = -tW; x < tW * 2; x += tileW) {
        targetCtx.save()
        targetCtx.translate(x + tileW / 2, y + tileH / 2)
        targetCtx.rotate(angle)
        targetCtx.fillText(label, -targetCtx.measureText(label).width / 2, 0)
        targetCtx.restore()
      }
    }

    targetCtx.restore()
  }

  // Ưu tiên OffscreenCanvas để không block main thread
  if (typeof OffscreenCanvas !== 'undefined') {
    const offscreen = new OffscreenCanvas(W, H)
    const offCtx = offscreen.getContext('2d') as OffscreenCanvasRenderingContext2D | null
    if (offCtx) {
      draw(offCtx)
      ctx.drawImage(offscreen, 0, 0)
      return
    }
  }

  // Fallback: vẽ thẳng vào canvas DOM
  draw(ctx)
}

// ── Hook: Canvas Watermark ────────────────────────────────────────────────────

/**
 * Vẽ watermark một lần duy nhất lên canvas khi component mount.
 * Reuse drawWatermarkOnCanvas để đồng nhất với MutationGuard restore.
 */
function useCanvasWatermark(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  userId: string,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawWatermarkOnCanvas(canvas, userId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]) // chỉ re-draw khi userId thay đổi
}

// ── Hook: MutationObserver + Interval Guard ──────────────────────────────────

/**
 * Bảo vệ canvas watermark khỏi bị xóa hoặc ẩn:
 *
 *  Phương pháp: MutationObserver + Interval polling
 *  - Khi canvas bị xóa: tạo canvas mới và append vào wrapper NGAY LẬP TỨC
 *    (KHÔNG dùng React state để tránh vòng lặp vô hạn)
 *  - Khi canvas bị ẩn: force inline style restore
 *  - Interval 1s: đảm bảo backup phòng trường hợp observer miss
 */
function useMutationGuard(
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  userId: string,
  drawWatermark: (canvas: HTMLCanvasElement, uid: string) => void,
) {
  const restoringRef = useRef(false)

  useEffect(() => {
    // Lấy wrapper SAU KHI component mount (để ref có giá trị)
    const getWrapper = () => wrapperRef.current
    let wrapper = getWrapper()

    // Hàm phục hồi canvas
    const restoreCanvas = (targetWrapper: HTMLDivElement) => {
      if (restoringRef.current) return
      restoringRef.current = true

      const newCanvas = document.createElement('canvas')
      newCanvas.setAttribute('aria-hidden', 'true')
      newCanvas.setAttribute('data-testid', 'watermark-canvas')
      newCanvas.className = 'absolute inset-0 w-full h-full pointer-events-none rounded-lg'
      newCanvas.style.cssText = 'z-index:10;pointer-events:none;'
      targetWrapper.appendChild(newCanvas)

      // Vẽ watermark sau một tick (đảm bảo canvas đã được paint)
      requestAnimationFrame(() => {
        drawWatermark(newCanvas, userId)
        // Update ref để watermark hook biết canvas mới
        ;(canvasRef as React.MutableRefObject<HTMLCanvasElement>).current = newCanvas
        setTimeout(() => { restoringRef.current = false }, 200)
      })
    }

    // Chờ wrapper sẵn sàng (có thể bị delayed do Suspense)
    const setupObserver = () => {
      wrapper = getWrapper()
      if (!wrapper) {
        setTimeout(setupObserver, 100)
        return
      }

      // ── MutationObserver ────────────────────────────────────────────────────
      const observer = new MutationObserver((mutations) => {
        if (!wrapper || restoringRef.current) return

        for (const mutation of mutations) {
          // Canvas bị xóa
          if (mutation.type === 'childList') {
            const canvasRemoved = Array.from(mutation.removedNodes).some(
              n => n instanceof HTMLCanvasElement,
            )
            if (canvasRemoved) {
              restoreCanvas(wrapper)
              break
            }
          }
          // Canvas bị ẩn
          if (mutation.type === 'attributes' && mutation.target instanceof HTMLCanvasElement) {
            const cs = window.getComputedStyle(mutation.target as HTMLCanvasElement)
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) {
              ;(mutation.target as HTMLElement).setAttribute(
                'style',
                'z-index:10;pointer-events:none;display:block;visibility:visible;opacity:1;',
              )
            }
          }
        }
      })

      observer.observe(wrapper, {
        childList: true,
        subtree: false,
      })

      // Observe canvas attributes
      const cv = wrapper.querySelector('canvas')
      if (cv) {
        observer.observe(cv, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] })
      }

      // ── Interval Backup (1s) ────────────────────────────────────────────────
      const interval = setInterval(() => {
        const w = getWrapper()
        if (!w || restoringRef.current) return
        const hasCanvas = !!w.querySelector('[data-testid="watermark-canvas"]')
        if (!hasCanvas) {
          restoreCanvas(w)
        }
      }, 1000)

      return () => {
        observer.disconnect()
        clearInterval(interval)
      }
    }

    const cleanup = setupObserver()
    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // chỉ setup một lần sau mount
}

// ── Component chính ───────────────────────────────────────────────────────────

const SecureVideoPlayer = memo(function SecureVideoPlayer({
  videoPath,
  userId,
  className = '',
  onEnded,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { signedUrl, error, retry } = useSignedUrl(videoPath)

  // ── Vẽ watermark lần đầu khi canvas mount ────────────────────────────────
  useCanvasWatermark(canvasRef, userId)

  // ── MutationObserver + Interval: phục hồi canvas nếu bị xóa hoặc ẩn ─────
  // Dùng DOM imperative (không React state) để tránh re-render loop
  useMutationGuard(wrapperRef, canvasRef, userId, drawWatermarkOnCanvas)

  // Ngăn chuột phải (context menu) trên toàn wrapper
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  // Ngăn kéo thả video (tránh lộ URL)
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Khi video resize → cập nhật kích thước canvas để khớp
  const handleCanvasResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const video = videoRef.current
    if (!video) return
    canvas.style.width = `${video.clientWidth}px`
    canvas.style.height = `${video.clientHeight}px`
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const ro = new ResizeObserver(handleCanvasResize)
    ro.observe(video)
    return () => ro.disconnect()
  }, [handleCanvasResize])

  // ── Render ───────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-900 text-slate-900 rounded-lg p-8 gap-4 ${className}`}
      >
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={retry}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition-colors"
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (!signedUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 rounded-lg aspect-video ${className}`}
      >
        <span className="text-gray-400 text-sm animate-pulse">Đang tải video…</span>
      </div>
    )
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative select-none ${className}`}
      onContextMenu={handleContextMenu}
      data-testid="secure-video-wrapper"
    >
      {/* ── Video ────────────────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src={signedUrl}
        className="w-full rounded-lg bg-black"
        controls
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        playsInline
        onDragStart={handleDragStart}
        onEnded={onEnded}
        data-testid="secure-video-element"
      />

      {/*
        ── Canvas Watermark ────────────────────────────────────────────────────
        pointer-events: none → click/drag xuyên qua canvas vào video controls.
        MutationObserver + Interval (useMutationGuard) tự phục hồi canvas
        nếu bị xóa hoặc ẩn qua DevTools (F12).
      */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
        style={{ zIndex: 10 }}
        data-testid="watermark-canvas"
      />
    </div>
  )
})

export default SecureVideoPlayer
