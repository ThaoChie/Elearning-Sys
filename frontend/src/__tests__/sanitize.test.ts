/**
 * sanitize.test.ts
 *
 * Unit tests cho DOMPurify sanitize utilities:
 *   - sanitizeHtml(): lọc HTML nguy hiểm, giữ lại thẻ an toàn
 *   - sanitizeText(): loại bỏ tất cả thẻ HTML, trả về plain-text
 *   - useSanitizedHtml(): trả về object { __html: string } an toàn
 *
 * Câu 10: Chống XSS bằng Sanitizer (DOMPurify)
 */

import { describe, it, expect } from 'vitest'
import { sanitizeHtml, sanitizeText, useSanitizedHtml } from '../utils/sanitize'

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeHtml
// ─────────────────────────────────────────────────────────────────────────────
describe('sanitizeHtml()', () => {

  it('[XSS-01] loại bỏ thẻ <script> hoàn toàn', () => {
    const input = '<script>alert("xss")</script><b>Nội dung an toàn</b>'
    const output = sanitizeHtml(input)

    expect(output).not.toContain('<script>')
    expect(output).not.toContain('alert')
    expect(output).toContain('Nội dung an toàn')
  })

  it('[XSS-02] loại bỏ thuộc tính event handler onerror', () => {
    const input = '<img src="x" onerror="alert(\'hack\')" />'
    const output = sanitizeHtml(input)

    expect(output).not.toContain('onerror')
    expect(output).not.toContain('alert')
    expect(output).not.toContain("hack")
  })

  it('[XSS-03] loại bỏ onclick, onmouseover và các event handler khác', () => {
    const input = '<div onclick="stealCookies()" onmouseover="xss()">Hover me</div>'
    const output = sanitizeHtml(input)

    expect(output).not.toContain('onclick')
    expect(output).not.toContain('onmouseover')
    expect(output).not.toContain('stealCookies')
  })

  it('[XSS-04] loại bỏ <iframe> chứa javascript:', () => {
    const input = '<iframe src="javascript:alert(1)"></iframe>'
    const output = sanitizeHtml(input)

    expect(output).not.toContain('<iframe>')
    expect(output).not.toContain('javascript:')
  })

  it('[XSS-05] loại bỏ <object> và <embed> tags', () => {
    const input = '<object data="evil.swf"></object><embed src="bad.swf" />'
    const output = sanitizeHtml(input)

    expect(output).not.toContain('<object>')
    expect(output).not.toContain('<embed>')
  })

  it('[XSS-06] giữ lại thẻ định dạng an toàn: <b>, <i>, <p>, <ul>, <li>', () => {
    const input = '<b>In đậm</b> <i>In nghiêng</i> <p>Đoạn văn</p> <ul><li>Mục 1</li></ul>'
    const output = sanitizeHtml(input)

    expect(output).toContain('<b>In đậm</b>')
    expect(output).toContain('<i>In nghiêng</i>')
    expect(output).toContain('Đoạn văn')
    expect(output).toContain('Mục 1')
  })

  it('[XSS-07] giữ lại thẻ <a> nhưng loại bỏ href javascript:', () => {
    const input = '<a href="javascript:void(0)">Click</a><a href="https://example.com">Safe</a>'
    const output = sanitizeHtml(input)

    expect(output).not.toContain('javascript:')
    expect(output).toContain('https://example.com')
  })

  it('[XSS-08] xử lý chuỗi rỗng và whitespace', () => {
    expect(sanitizeHtml('')).toBe('')
    // DOMPurify giữ nguyên whitespace-only (không trim) – hành vi chuẩn
    const whitespace = sanitizeHtml('   ')
    expect(whitespace.trim()).toBe('')
    expect(whitespace).not.toContain('<script>')
  })

  it('[XSS-09] loại bỏ thẻ <style> có CSS injection', () => {
    const input = '<style>body { display: none !important; }</style><p>Hello</p>'
    const output = sanitizeHtml(input)

    expect(output).not.toContain('<style>')
    expect(output).not.toContain('display: none')
    expect(output).toContain('Hello')
  })

  it('[XSS-10] loại bỏ data URI nguy hiểm trong href', () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">click</a>'
    const output = sanitizeHtml(input)

    // href data: phải bị loại bỏ
    expect(output).not.toContain('data:text/html')
  })

  it('[XSS-11] payload phức tạp: nested và encoded', () => {
    const input = '<<SCRIPT>alert("XSS");//<</SCRIPT>'
    const output = sanitizeHtml(input)

    expect(output).not.toContain('alert')
  })

  it('[XSS-12] mô tả khóa học hợp lệ không bị thay đổi', () => {
    const safeDesc = 'Khóa học này giúp sinh viên hiểu <b>Cấu trúc dữ liệu</b> và <i>Giải thuật</i>.'
    const output = sanitizeHtml(safeDesc)

    expect(output).toContain('Cấu trúc dữ liệu')
    expect(output).toContain('<b>')
    expect(output).toContain('<i>')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeText
// ─────────────────────────────────────────────────────────────────────────────
describe('sanitizeText()', () => {

  it('[TXT-01] loại bỏ tất cả thẻ HTML, trả về plain-text', () => {
    const input = '<b>Hello</b> <script>alert("xss")</script> World'
    const output = sanitizeText(input)

    expect(output).not.toContain('<')
    expect(output).not.toContain('>')
    expect(output).toContain('Hello')
    expect(output).toContain('World')
    expect(output).not.toContain('script')
    expect(output).not.toContain('alert')
  })

  it('[TXT-02] văn bản bình thường không bị thay đổi', () => {
    const input = 'Mô tả khóa học bình thường, không có HTML.'
    const output = sanitizeText(input)

    expect(output).toBe(input)
  })

  it('[TXT-03] chuỗi rỗng trả về chuỗi rỗng', () => {
    expect(sanitizeText('')).toBe('')
  })

  it('[TXT-04] payload XSS đầy đủ chỉ còn plain-text', () => {
    const input = '<script>alert("hack")</script><img onerror="steal()"><b>Content</b>'
    const output = sanitizeText(input)

    expect(output).not.toContain('script')
    expect(output).not.toContain('onerror')
    expect(output).not.toContain('steal')
    expect(output).not.toContain('<')
    expect(output).toContain('Content')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// useSanitizedHtml
// ─────────────────────────────────────────────────────────────────────────────
describe('useSanitizedHtml()', () => {

  it('[HOOK-01] trả về object { __html: string } đúng format cho dangerouslySetInnerHTML', () => {
    const input = '<b>Safe content</b>'
    const result = useSanitizedHtml(input)

    expect(result).toHaveProperty('__html')
    expect(typeof result.__html).toBe('string')
    expect(result.__html).toContain('Safe content')
  })

  it('[HOOK-02] __html không chứa script tags', () => {
    const input = '<script>alert("xss")</script><p>OK</p>'
    const result = useSanitizedHtml(input)

    expect(result.__html).not.toContain('<script>')
    expect(result.__html).not.toContain('alert')
    expect(result.__html).toContain('OK')
  })

  it('[HOOK-03] chuỗi rỗng trả về { __html: "" }', () => {
    const result = useSanitizedHtml('')
    expect(result).toEqual({ __html: '' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Integration: Mô phỏng scenario thực tế
// ─────────────────────────────────────────────────────────────────────────────
describe('Scenario thực tế – Giảng viên nhập mô tả khóa học', () => {

  it('[REAL-01] Giảng viên nhập <script>alert("hack")</script> → bị loại bỏ', () => {
    const instructorInput = `<script>alert('hack')</script>
Đây là khóa học DevOps căn bản cho sinh viên năm 3.
Bao gồm Docker, Kubernetes và CI/CD pipeline.`

    const safOutput = sanitizeHtml(instructorInput)

    expect(safOutput).not.toContain('<script>')
    expect(safOutput).not.toContain('alert')
    expect(safOutput).not.toContain("hack")
    expect(safOutput).toContain('Docker')
    expect(safOutput).toContain('Kubernetes')
  })

  it('[REAL-02] Giảng viên nhập mô tả HTML hợp lệ → giữ nguyên', () => {
    const validInput = `<h3>Giới thiệu</h3>
<p>Khóa học <b>Cấu trúc dữ liệu</b> dành cho sinh viên CNTT.</p>
<ul>
  <li>Mảng và danh sách liên kết</li>
  <li>Cây và đồ thị</li>
  <li>Thuật toán tìm kiếm và sắp xếp</li>
</ul>`

    const output = sanitizeHtml(validInput)

    expect(output).toContain('Giới thiệu')
    expect(output).toContain('<b>Cấu trúc dữ liệu</b>')
    expect(output).toContain('<ul>')
    expect(output).toContain('<li>')
    expect(output).toContain('Mảng và danh sách liên kết')
  })

  it('[REAL-03] Sinh viên thấy mô tả sau sanitize không chứa XSS', () => {
    // Giả sử dữ liệu từ API có thể chứa XSS
    const dataFromApi = {
      id: 'course-001',
      title: 'DevOps Fundamentals',
      description: '<script>document.cookie="stolen"</script>Học DevOps từ cơ bản đến nâng cao',
    }

    // Render qua sanitizeText (chỉ text)
    const safeText = sanitizeText(dataFromApi.description)

    expect(safeText).not.toContain('<script>')
    expect(safeText).not.toContain('document.cookie')
    expect(safeText).not.toContain('stolen')
    expect(safeText).toContain('Học DevOps từ cơ bản đến nâng cao')
  })
})
