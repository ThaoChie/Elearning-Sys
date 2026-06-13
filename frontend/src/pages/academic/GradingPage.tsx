import { useState, useEffect } from 'react'
import { FileCheck, Search, FileText, Download, CheckCircle, MessageSquare } from 'lucide-react'
import { addAuditLog } from '../admin/mockData'

import { dbGetSubmissions, dbGradeSubmission } from '../../data/mockDatabase'

export default function GradingPage() {
  const [subs, setSubs] = useState(dbGetSubmissions())
  const [selectedSub, setSelectedSub] = useState(subs[0] || null)
  const [score, setScore] = useState<string>('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!selectedSub) return
    // Sync local form state when selected sub changes
    setScore(selectedSub.grade ? selectedSub.grade : '')
    setFeedback(selectedSub.feedback || '')
  }, [selectedSub])

  const handleGrade = () => {
    if (!selectedSub) return
    dbGradeSubmission(selectedSub.id, score, feedback)
    const updatedSubs = subs.map(sub => {
      if (sub.id === selectedSub.id) {
        const updated = { ...sub, status: 'graded' as 'graded', grade: score, feedback }
        setSelectedSub(updated)
        return updated
      }
      return sub
    })
    setSubs(updatedSubs)
  }

  const isGraded = selectedSub?.status === 'graded'

  return (
    <div className="min-h-full space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-start justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#1F3864] flex items-center justify-center shadow-sm">
              <FileCheck size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1F3864] tracking-tight">Chấm điểm Bài tập</h1>
          </div>
          <p className="text-xs text-slate-400 ml-10.5">Quản lý và chấm điểm các bài tập tự luận, đồ án của sinh viên</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Danh sách bài nộp */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Tìm sinh viên hoặc môn học..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1F3864]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {subs.map(sub => (
              <button 
                key={sub.id}
                onClick={() => setSelectedSub(sub)}
                className={`w-full text-left p-4 rounded-xl border mb-2 transition-colors ${selectedSub.id === sub.id ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:border-slate-200'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-800">{sub.student}</span>
                  {sub.status === 'pending' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">Chưa chấm</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">{sub.grade} Điểm</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mb-1">{sub.task}</div>
                <div className="text-[10px] text-slate-400">Nộp lúc: {sub.time}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right side - Detail & Grading Form */}
        {selectedSub && (
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col overflow-hidden animate-[fadeIn_0.3s_ease]">
          {/* Header info */}
          <div className="p-6 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F3864] mb-1">{selectedSub.task}</h2>
                <p className="text-sm text-slate-500">Học viên: <span className="font-semibold text-slate-700">{selectedSub.student}</span></p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedSub.status === 'graded' ? 'bg-[#E2EFDA] text-[#375623]' : 'bg-[#FFF2CC] text-[#BF8F00]'}`}>
                {selectedSub.status === 'graded' ? 'Đã chấm' : 'Chờ chấm'}
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText size={16} />
                <span>Khóa học: <span className="font-semibold text-slate-700">{selectedSub.course}</span></span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Clock size={16} />
                <span>Nộp lúc: <span className="font-semibold text-slate-700">{selectedSub.time}</span></span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-6">
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
              <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><FileText size={18}/> File đính kèm</h3>
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FileText size={20}/></div>
                  <span className="text-sm font-medium text-slate-700">{selectedSub.file}</span>
                </div>
                <button className="px-3 py-1.5 flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors">
                  <Download size={16}/> Tải xuống
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div className="md:col-span-2 flex flex-col">
                <label className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><MessageSquare size={18}/> Nhận xét / Phản hồi</label>
                <textarea 
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập phản hồi cho sinh viên..."
                  disabled={isGraded}
                  className="w-full flex-1 border border-slate-300 rounded-xl p-4 text-sm focus:border-[#1F3864] focus:ring-1 focus:ring-[#1F3864] outline-none resize-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
              <div className="flex flex-col">
                <label className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><CheckCircle size={18}/> Điểm số</label>
                <input 
                  type="text"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="Thang điểm 10"
                  disabled={isGraded}
                  className="w-full border border-slate-300 rounded-xl p-4 text-2xl font-bold text-center text-[#1F3864] focus:border-[#1F3864] outline-none mb-4 disabled:bg-slate-50 disabled:text-slate-500"
                />
                
                <button 
                  onClick={handleGrade}
                  disabled={isGraded || score === '' || score < 0 || score > 10}
                  className="w-full py-3 bg-[#1F3864] hover:bg-[#162a4a] text-white font-bold rounded-xl shadow-lg transition-colors mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGraded ? 'Đã chấm điểm' : 'Lưu kết quả'}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
