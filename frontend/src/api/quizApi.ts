import apiClient from './apiClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnswerDto {
  id: string
  content: string
  key: string       // "A", "B", "C", "D"
  isCorrect: boolean
  order: number
}

export interface QuestionDto {
  id: string
  content: string
  order: number
  createdAt: string
  answers: AnswerDto[]
}

export interface QuizSummary {
  id: string
  title: string
  courseId: string
  courseName: string
  durationMinutes: number
  antiCheatEnabled: boolean
  questionCount: number
  status: 'Active' | 'Ended' | 'Scheduled'
  startAt?: string
  endAt?: string
  createdAt: string
}

export interface QuizDetail extends QuizSummary {
  questions: QuestionDto[]
}

export interface UpsertQuestionPayload {
  content: string
  answers: { content: string; isCorrect: boolean }[]
}

export interface CreateQuizPayload {
  courseId: string
  title: string
  durationMinutes: number
  antiCheatEnabled?: boolean
}

export interface UpdateQuizPayload {
  title?: string
  durationMinutes?: number
  antiCheatEnabled?: boolean
}

// ── Quiz CRUD ─────────────────────────────────────────────────────────────────

export const quizApi = {
  /** GET /api/quiz — danh sách quiz của Instructor */
  getAll: async (): Promise<QuizSummary[]> => {
    const { data } = await apiClient.get<QuizSummary[]>('/quiz')
    return data
  },

  /** GET /api/quiz/{id} — chi tiết quiz kèm câu hỏi */
  getById: async (id: string): Promise<QuizDetail> => {
    const { data } = await apiClient.get<QuizDetail>(`/quiz/${id}`)
    return data
  },

  /** POST /api/quiz — tạo quiz mới */
  create: async (payload: CreateQuizPayload): Promise<QuizSummary> => {
    const { data } = await apiClient.post<QuizSummary>('/quiz', payload)
    return data
  },

  /** PUT /api/quiz/{id} — cập nhật metadata quiz */
  update: async (id: string, payload: UpdateQuizPayload): Promise<void> => {
    await apiClient.put(`/quiz/${id}`, payload)
  },

  /** DELETE /api/quiz/{id} */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/quiz/${id}`)
  },

  // ── Question CRUD ───────────────────────────────────────────────────────────

  /** GET /api/quiz/{quizId}/questions */
  getQuestions: async (quizId: string): Promise<QuestionDto[]> => {
    const { data } = await apiClient.get<QuestionDto[]>(`/quiz/${quizId}/questions`)
    return data
  },

  /** POST /api/quiz/{quizId}/questions */
  addQuestion: async (quizId: string, payload: UpsertQuestionPayload) => {
    const { data } = await apiClient.post(`/quiz/${quizId}/questions`, payload)
    return data
  },

  /** PUT /api/quiz/{quizId}/questions/{questionId} */
  updateQuestion: async (quizId: string, questionId: string, payload: UpsertQuestionPayload) => {
    await apiClient.put(`/quiz/${quizId}/questions/${questionId}`, payload)
  },

  /** DELETE /api/quiz/{quizId}/questions/{questionId} */
  deleteQuestion: async (quizId: string, questionId: string): Promise<void> => {
    await apiClient.delete(`/quiz/${quizId}/questions/${questionId}`)
  },

  /** PUT /api/quiz/{quizId}/questions/reorder */
  reorderQuestions: async (quizId: string, orderedQuestionIds: string[]): Promise<void> => {
    await apiClient.put(`/quiz/${quizId}/questions/reorder`, { orderedQuestionIds })
  },
}
