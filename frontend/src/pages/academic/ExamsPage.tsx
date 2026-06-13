import { useState } from 'react'
import { ClipboardList, Shield, Clock, Search, Plus, Play, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { dbGetExams, dbCreateExam, dbUpdateExam, dbDeleteExam } from '../../data/mockDatabase'

export default function ExamsPage() {
  const navigate = useNavigate()
  const [examsList, setExamsList] = useState(dbGetExams())
  
  const [showCreate, setShowCreate] = useState(false)
  const [editingExamId, setEditingExamId] = useState<string | null>(null)
  const [examFormData, setExamFormData] = useState({ title: '', course: 'An ninh mạng cơ bản', duration: 60, totalScore: 10 })

  const openCreateModal = () => {
    setEditingExamId(null)
    setExamFormData({ title: '', course: 'An ninh mạng cơ bản', duration: 60, totalScore: 10 })
    setShowCreate(true)
  }

  const openEditModal = (exam: any) => {
    setEditingExamId(exam.id)
    setExamFormData({
      title: exam.title,
      course: exam.course,
      duration: parseInt(exam.duration.replace(' phút', '')),
      totalScore: 10
    })
    setShowCreate(true)
  }

  const handleSaveExam = () => {
    if (editingExamId) {
      dbUpdateExam(editingExamId, {
        title: examFormData.title, 
        course: examFormData.course, 
        duration: `${examFormData.duration} phút`
      })
      setExamsList(dbGetExams())
    } else {
      const newExam = {
        id: `ex-${Date.now()}`,
        title: examFormData.title || 'Bài thi mới',
        course: examFormData.course,
        duration: `${examFormData.duration} phút`,
        questions: 0,
        status: 'Draft',
        antiCheat: true
      }
      dbCreateExam(newExam)
      setExamsList(dbGetExams())
    }
    setShowCreate(false)
  }

  const handleDeleteExam = (id: string) => {
    if(confirm('Bạn có chắc chắn muốn xóa đề thi này?')) {
      dbDeleteExam(id)
      setExamsList(dbGetExams().slice())
    }
  }

  return (
    <div className="min-h-full space-y-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#1F3864] flex items-center justify-center shadow-sm">
              <ClipboardList size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1F3864] tracking-tight">Quản lý Kỳ thi</h1>
          </div>
          <p className="text-xs text-slate-500 ml-10.5">Soạn đề thi trắc nghiệm và cấu hình chế độ chống gian lận (Anti-Cheat)</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#C00000] hover:bg-[#a80000] text-slate-900 text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          {showCreate ? 'Hủy' : <><Plus size={16} /> Tạo bài thi mới</>}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 animate-[fadeIn_0.3s_ease]">
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">
            {editingExamId ? 'Chỉnh sửa Cấu hình Đề thi' : 'Tạo bài thi mới'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên bài thi <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864] outline-none" 
                  placeholder="VD: Kiểm tra cuối kỳ" 
                  value={examFormData.title}
                  onChange={e => setExamFormData({...examFormData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Thuộc khóa học</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-[#1F3864] outline-none"
                  value={examFormData.course}
                  onChange={e => setExamFormData({...examFormData, course: e.target.value})}
                >
                  <option value="An ninh mạng cơ bản">An ninh mạng cơ bản</option>
                  <option value="Lập trình Web">Lập trình Web</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Thời gian (Phút)</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                    value={examFormData.duration}
                    onChange={e => setExamFormData({...examFormData, duration: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tổng số điểm</label>
                  <input 
                    type="number" 
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                    value={examFormData.totalScore}
                    onChange={e => setExamFormData({...examFormData, totalScore: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="text-emerald-600" size={20} />
                <h3 className="font-bold text-slate-800">Cấu hình Anti-Cheat</h3>
              </div>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-700">Bắt buộc Toàn màn hình (Fullscreen)</span>
                  <input type="checkbox" className="w-4 h-4 accent-emerald-600" defaultChecked />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-700">Ngăn Copy/Paste</span>
                  <input type="checkbox" className="w-4 h-4 accent-emerald-600" defaultChecked />
                </label>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giới hạn số lần thoát Tab</label>
                  <select className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none">
                    <option value="3">3 lần (Cảnh báo và tự động nộp)</option>
                    <option value="1">1 lần (Nghiêm ngặt)</option>
                    <option value="0">Không giới hạn</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-6 pt-4 border-t border-slate-100 gap-3">
            <button 
              onClick={() => setShowCreate(false)}
              className="px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleSaveExam}
              className="px-6 py-2 bg-[#1F3864] hover:bg-[#162a4a] text-slate-900 text-sm font-semibold rounded-lg transition-colors"
            >
              {editingExamId ? 'Lưu cập nhật' : 'Lưu cấu hình & Tiếp tục soạn câu hỏi'}
            </button>
          </div>
        </div>
      )}

      {/* Grid danh sách bài thi */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input type="text" placeholder="Tìm kiếm bài thi..." className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F3864]" />
          </div>
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-3 border-b border-slate-100">Tên bài thi</th>
              <th className="px-6 py-3 border-b border-slate-100">Khóa học</th>
              <th className="px-6 py-3 border-b border-slate-100">Cấu hình</th>
              <th className="px-6 py-3 border-b border-slate-100 text-center">Trạng thái</th>
              <th className="px-6 py-3 border-b border-slate-100 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {examsList.map(exam => (
              <tr key={exam.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{exam.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{exam.questions} câu hỏi</p>
                </td>
                <td className="px-6 py-4 text-slate-600">{exam.course}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={14}/> {exam.duration}</span>
                    {exam.antiCheat && <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded"><Shield size={12}/> Anti-Cheat</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${exam.status === 'Active' ? 'bg-[#375623]/10 text-[#375623]' : 'bg-slate-100 text-slate-500'}`}>
                    {exam.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => navigate(`/dashboard/academic/exams/${exam.id}`)}
                      className="p-1.5 text-[#2E75B6] hover:bg-blue-50 rounded-lg transition-colors" 
                      title="Soạn thảo câu hỏi"
                    >
                      <ClipboardList size={16} />
                    </button>
                    <button 
                      onClick={() => openEditModal(exam)}
                      className="p-1.5 text-slate-500 hover:text-[#2E75B6] hover:bg-slate-100 rounded-lg transition-colors"
                      title="Chỉnh sửa cấu hình"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa bài thi"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
