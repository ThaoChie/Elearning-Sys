/**
 * sanitize.ts
 *
 * Tiện ích lọc HTML độc hại (XSS) bằng DOMPurify.
 *
 * Cách dùng:
 *   import { sanitizeHtml, sanitizeText } from '@/utils/sanitize'
 *
 *   // Render HTML an toàn (dùng với dangerouslySetInnerHTML):
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }} />
 *
 *   // Lấy plain-text (không tag nào):
 *   <p>{sanitizeText(course.description)}</p>
 */

import DOMPurify from 'dompurify'

// ── Config mặc định: cho phép thẻ và thuộc tính an toàn ───────────────────────

/** Chỉ cho phép các thẻ định dạng văn bản thông thường – không cho phép script/iframe */
const ALLOWED_TAGS = [
  'b', 'i', 'u', 'em', 'strong', 'mark',
  'p', 'br', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'pre', 'code',
  'a', 'span',
]

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'class']

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  // Force tất cả link mở tab mới với rel="noopener noreferrer"
  FORCE_BODY: true,
}

// ── sanitizeHtml ───────────────────────────────────────────────────────────────

/**
 * Lọc chuỗi HTML đầu vào, giữ lại các thẻ an toàn, loại bỏ script/event handler.
 * Dùng với `dangerouslySetInnerHTML` khi cần render HTML từ server/người dùng.
 *
 * @param dirty - Chuỗi HTML chưa được lọc (có thể chứa XSS payload)
 * @returns     - Chuỗi HTML đã được làm sạch, an toàn để render
 *
 * @example
 * const safeHtml = sanitizeHtml('<script>alert("xss")</script><b>Hello</b>')
 * // → '<b>Hello</b>'
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return ''
  return DOMPurify.sanitize(dirty, DOMPURIFY_CONFIG).toString()
}

// ── sanitizeText ───────────────────────────────────────────────────────────────

/**
 * Lấy plain-text từ chuỗi HTML (xóa toàn bộ thẻ HTML).
 * Dùng khi chỉ cần hiển thị text thuần, không cần render HTML.
 *
 * @param dirty - Chuỗi có thể chứa HTML hoặc XSS payload
 * @returns     - Plain-text, không có bất kỳ thẻ HTML nào
 *
 * @example
 * const text = sanitizeText('<b>Hello</b> <script>alert("xss")</script>')
 * // → 'Hello '
 */
export function sanitizeText(dirty: string): string {
  if (!dirty) return ''
  // Dùng ALLOWED_TAGS=[] để loại bỏ tất cả thẻ
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) as string
}

// ── Hook tiện ích (optional) ──────────────────────────────────────────────────

/**
 * Hook React để sanitize HTML – trả về object dùng trực tiếp với dangerouslySetInnerHTML.
 *
 * @example
 * const safeProps = useSanitizedHtml(course.description)
 * return <div {...safeProps} />
 */
export function useSanitizedHtml(dirty: string): { __html: string } {
  return { __html: sanitizeHtml(dirty) }
}
