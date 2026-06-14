import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Shield, Search } from 'lucide-react'

interface Answer {
  id: string
  content: string
  isCorrect: boolean
}

interface Question {
  id: string
  content: string
  answers: Answer[]
}

const mockQuestions: Question[] = [
  {
    id: 'q1',
    content: 'Firewall (tường lửa) hoạt động chủ yếu ở tầng nào trong mô hình OSI?',
    answers: [
      { id: 'a1', content: 'Tầng 1 (Physical)', isCorrect: false },
      { id: 'a2', content: 'Tầng 3 (Network) và Tầng 4 (Transport)', isCorrect: true },
      { id: 'a3', content: 'Tầng 2 (Data Link)', isCorrect: false },
      { id: 'a4', content: 'Tầng 7 (Application)', isCorrect: false },
    ]
  }
]

export default function ExamBuilder() {
  const { examId } = useParams()
  const navigate = useNavigate()

  const [questions, setQuestions] = useState<Question[]>(mockQuestions)
  const [search, setSearch] = useState('')

  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [qContent, setQContent] = useState('')
  const [qAnswers, setQAnswers] = useState<Answer[]>([
    { id: '1', content: '', isCorrect: true },
    { id: '2', content: '', isCorrect: false },
    { id: '3', content: '', isCorrect: false },
    { id: '4', content: '', isCorrect: false },
  ])

  const openQuestionModal = (q?: Question) => {
    if (q) {
      setEditingQuestion(q)
      setQContent(q.content)
      setQAnswers(q.answers)
    } else {
      setEditingQuestion(null)
      setQContent('')
      setQAnswers([
        { id: '1', content: '', isCorrect: true },
        { id: '2', content: '', isCorrect: false },
        { id: '3', content: '', isCorrect: false },
        { id: '4', content: '', isCorrect: false },
      ])
    }
    setShowQuestionModal(true)
  }

  const setCorrectAnswer = (answerId: string) => {
    setQAnswers(qAnswers.map(a => ({ ...a, isCorrect: a.id === answerId })))
  }

  const updateAnswerContent = (answerId: string, content: string) => {
    setQAnswers(qAnswers.map(a => a.id === answerId ? { ...a, content } : a))
  }

  const saveQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? { ...q, content: qContent, answers: qAnswers } : q))
    } else {
      setQuestions([...questions, { id: `q${Date.now()}`, content: qContent, answers: qAnswers }])
    }
    setShowQuestionModal(false)
  }

  const deleteQuestion = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa câu hỏi này khỏi đề thi?')) {
      setQuestions(questions.filter(q => q.id !== id))
    }
  }

  const filteredQuestions = questions.filter(q => q.content.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-full space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/academic/exams')}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[#1F3864]">Soạn Đề Thi Trắc Nghiệm</h1>
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-emerald-50 text-emerald-600 flex items-center gap-1">
                <Shield size={12}/> Anti-Cheat Active
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">Ngân hàng câu hỏi sẽ được xáo trộn tự động khi sinh viên làm bài</p>
          </div>
        </div>{/* ← closes "flex items-center gap-4" */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowQuestionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#1F3864] hover:bg-slate-50 text-[#1F3864] text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} /> Thêm câu hỏi
          </button>
          <button
            onClick={() => {
              alert('Lưu đề thi thành công!');
              navigate('/dashboard/academic/exams');
            }}
            className="flex items-center gap-2 px-6 py-2 bg-[#1F3864] hover:bg-[#162a4a] text-slate-900 text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Lưu đề thi
          </button>
        </div>
      </div>

      {/* ── Danh sách câu hỏi ──────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#2E75B6]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredQuestions.map((q, index) => (
            <div key={q.id} className="p-6 hover:bg-slate-50 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-base mb-4 flex items-start gap-2">
                    <span className="text-[#2E75B6] mt-0.5">Câu {index + 1}:</span>
                    {q.content}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                    {q.answers.map((ans, aIndex) => (
                      <div key={ans.id} className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${ans.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold' : 'bg-white border-slate-200 text-slate-600'}`}>
                        <span className="font-bold min-w-[20px]">{String.fromCharCode(65 + aIndex)}.</span>
                        <p>{ans.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                  <button onClick={() => openQuestionModal(q)} className="px-3 py-1.5 text-sm font-semibold text-slate-500 hover:text-[#2E75B6] hover:bg-blue-50 rounded-lg">Sửa</button>
                  <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            </div>
          ))}
          {filteredQuestions.length === 0 && (
            <div className="p-12 text-center text-slate-500">Không có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.</div>
          )}
        </div>
      </div>

      {/* Modal Thêm/Sửa câu hỏi */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-2xl w-[600px] shadow-2xl p-6 relative">
            <h3 className="font-bold text-lg text-slate-800 mb-6">{editingQuestion ? 'Sửa câu hỏi' : 'Tạo câu hỏi mới'}</h3>
            <form onSubmit={saveQuestion} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nội dung câu hỏi <span className="text-red-500">*</span></label>
                <textarea
                  required
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-[#2E75B6] outline-none min-h-[100px]"
                  placeholder="Nhập nội dung câu hỏi..."
                  value={qContent}
                  onChange={e => setQContent(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Các phương án trả lời (Chọn 1 đáp án đúng)</label>
                <div className="space-y-3">
                  {qAnswers.map((ans, idx) => (
                    <div key={ans.id} className={`flex items-center gap-3 p-2 rounded-lg border ${ans.isCorrect ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200'}`}>
                      <input
                        type="radio"
                        name="correctAnswer"
                        className="w-4 h-4 accent-emerald-600 ml-2 cursor-pointer"
                        checked={ans.isCorrect}
                        onChange={() => setCorrectAnswer(ans.id)}
                      />
                      <span className="font-bold text-slate-500">{String.fromCharCode(65 + idx)}</span>
                      <input
                        type="text"
                        required
                        className="flex-1 bg-transparent border-none text-sm outline-none p-1"
                        placeholder={`Nội dung phương án ${String.fromCharCode(65 + idx)}`}
                        value={ans.content}
                        onChange={e => updateAnswerContent(ans.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowQuestionModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Hủy bỏ</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-slate-900 bg-[#2E75B6] hover:bg-[#1F3864] rounded-lg shadow-sm">Lưu câu hỏi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
