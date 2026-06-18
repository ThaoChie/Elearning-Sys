import { useState, useEffect, useCallback } from 'react'
import { quizApi, type QuestionDto, type UpsertQuestionPayload } from '../api/quizApi'

interface AnswerDraft {
  id: string        // temp ID cho UI (client-side only)
  content: string
  isCorrect: boolean
}

interface QuestionModal {
  isOpen: boolean
  editingQuestion: QuestionDto | null
  content: string
  answers: AnswerDraft[]
}

const DEFAULT_ANSWERS: AnswerDraft[] = [
  { id: '1', content: '', isCorrect: true },
  { id: '2', content: '', isCorrect: false },
  { id: '3', content: '', isCorrect: false },
  { id: '4', content: '', isCorrect: false },
]

/**
 * useQuizBuilder — Custom hook quản lý toàn bộ state của trang ExamBuilder.
 *
 * Tách logic hoàn toàn khỏi UI component:
 *   - Fetch danh sách câu hỏi từ GET /api/quiz/{quizId}/questions
 *   - CRUD câu hỏi & đáp án qua quizApi
 *   - Quản lý modal state (open/close, editing/creating)
 *   - Optimistic UI: cập nhật local state ngay, rollback nếu API lỗi
 */
export function useQuizBuilder(quizId: string | undefined) {
  const [questions, setQuestions] = useState<QuestionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [modal, setModal] = useState<QuestionModal>({
    isOpen: false,
    editingQuestion: null,
    content: '',
    answers: DEFAULT_ANSWERS,
  })

  // ── Load questions on mount ────────────────────────────────────────────────
  const loadQuestions = useCallback(async () => {
    if (!quizId) return
    setLoading(true)
    setError(null)
    try {
      const data = await quizApi.getQuestions(quizId)
      setQuestions(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách câu hỏi.')
    } finally {
      setLoading(false)
    }
  }, [quizId])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setModal({
      isOpen: true,
      editingQuestion: null,
      content: '',
      answers: DEFAULT_ANSWERS.map(a => ({ ...a })),
    })
  }

  const openEditModal = (q: QuestionDto) => {
    setModal({
      isOpen: true,
      editingQuestion: q,
      content: q.content,
      answers: q.answers.map(a => ({
        id: a.id,
        content: a.content,
        isCorrect: a.isCorrect,
      })),
    })
  }

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }))
  }

  const setModalContent = (content: string) => {
    setModal(prev => ({ ...prev, content }))
  }

  const setCorrectAnswer = (answerId: string) => {
    setModal(prev => ({
      ...prev,
      answers: prev.answers.map(a => ({ ...a, isCorrect: a.id === answerId })),
    }))
  }

  const updateAnswerContent = (answerId: string, content: string) => {
    setModal(prev => ({
      ...prev,
      answers: prev.answers.map(a => a.id === answerId ? { ...a, content } : a),
    }))
  }

  // ── Save (Create or Update) ────────────────────────────────────────────────
  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quizId || saving) return

    // Client-side validation
    if (!modal.content.trim()) return
    if (!modal.answers.some(a => a.isCorrect)) {
      alert('Phải có ít nhất 1 đáp án đúng.')
      return
    }
    if (modal.answers.some(a => !a.content.trim())) {
      alert('Tất cả phương án không được để trống.')
      return
    }

    setSaving(true)
    const payload: UpsertQuestionPayload = {
      content: modal.content.trim(),
      answers: modal.answers.map(a => ({
        content: a.content.trim(),
        isCorrect: a.isCorrect,
      })),
    }

    try {
      if (modal.editingQuestion) {
        // UPDATE
        await quizApi.updateQuestion(quizId, modal.editingQuestion.id, payload)
      } else {
        // CREATE
        await quizApi.addQuestion(quizId, payload)
      }
      closeModal()
      await loadQuestions() // reload để lấy dữ liệu mới nhất từ server
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi lưu câu hỏi. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteQuestion = async (questionId: string) => {
    if (!quizId) return
    if (!confirm('Bạn có chắc muốn xóa câu hỏi này?')) return

    // Optimistic: xóa khỏi UI ngay
    const backup = questions
    setQuestions(prev => prev.filter(q => q.id !== questionId))

    try {
      await quizApi.deleteQuestion(quizId, questionId)
    } catch (err: any) {
      // Rollback nếu API lỗi
      setQuestions(backup)
      alert(err.response?.data?.message || 'Lỗi khi xóa câu hỏi.')
    }
  }

  return {
    // Data
    questions,
    loading,
    saving,
    error,
    // Modal state
    modal,
    // Actions
    openCreateModal,
    openEditModal,
    closeModal,
    setModalContent,
    setCorrectAnswer,
    updateAnswerContent,
    saveQuestion,
    deleteQuestion,
    reload: loadQuestions,
  }
}
