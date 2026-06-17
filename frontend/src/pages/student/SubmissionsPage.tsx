import { useState, useEffect } from 'react'
import { FileUp, CheckCircle, Clock, FileText, UploadCloud, AlertCircle, Edit, Trash2 } from 'lucide-react'
import { addAuditLog } from '../admin/mockData'

import apiClient from '../../api/apiClient'

export default function SubmissionsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/assignments/submissions/me')
      .then(res => {
        setAssignments(res.data || [])
        setSelectedAssignment((res.data && res.data[0]) || null)
      })
      .catch(err => console.error("Failed to load submissions", err))
      .finally(() => setLoading(false))
  }, [])

  // Sync state when selected assignment changes
  useEffect(() => {
    setFile(null)
    setIsEditing(false)
  }, [selectedAssignment?.id])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!file || !selectedAssignment) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      await apiClient.post(`/assignments/${selectedAssignment.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const updated = assignments.map(a => 
        a.id === selectedAssignment.id ? { ...a, status: 'submitted', file: file.name } : a
      )
      setAssignments(updated)
      setSelectedAssignment({ ...selectedAssignment, status: 'submitted', file: file.name })
      setFile(null)
      setIsEditing(false)
      alert('Nộp bài thành công!')
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi nộp bài')
    }
  }

  const handleCancelSubmission = async () => {
    if (confirm('Bạn có chắc muốn hủy nộp bài tập này? Thao tác này sẽ xóa file đã nộp.')) {
      try {
        await apiClient.delete(`/assignments/${selectedAssignment.id}/submit`)
        const updated = assignments.map(a => 
          a.id === selectedAssignment.id ? { ...a, status: 'pending', file: null } : a
        )
        setAssignments(updated)
        setSelectedAssignment({ ...selectedAssignment, status: 'pending', file: null })
      } catch (err: any) {
        alert(err.response?.data?.message || 'Lỗi hủy nộp bài')
      }
    }
  }

  return (
    <div className="min-h-full space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <FileUp size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bài nộp & Bài tập</h1>
          <p className="text-sm text-slate-500">Quản lý bài tập về nhà và upload file báo cáo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sách bài tập */}
        <div className="lg:col-span-1 space-y-3">
          {assignments.map(asg => (
            <button 
              key={asg.id}
              onClick={() => setSelectedAssignment(asg)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${selectedAssignment.id === asg.id ? 'bg-indigo-50 border-indigo-500 text-slate-900 shadow-sm' : 'bg-white/80 border-slate-200/50 text-slate-600 hover:border-indigo-300 hover:bg-white'}`}
            >
              <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{asg.course}</div>
              <div className="font-bold mb-3">{asg.task}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-slate-500"><Clock size={14}/> Hạn: {asg.due}</span>
                {asg.status === 'pending' && <span className="px-2 py-0.5 rounded text-amber-700 bg-amber-50 font-semibold border border-amber-200">Chưa nộp</span>}
                {asg.status === 'submitted' && <span className="px-2 py-0.5 rounded text-blue-700 bg-blue-50 font-semibold border border-blue-200">Đã nộp</span>}
                {asg.status === 'graded' && <span className="px-2 py-0.5 rounded text-green-700 bg-green-50 font-semibold border border-green-200">{asg.grade}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* Khung nộp bài */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 h-full flex flex-col min-h-[500px] shadow-sm items-center justify-center">
              <p className="text-slate-500">Đang tải...</p>
            </div>
          ) : !selectedAssignment ? (
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 h-full flex flex-col min-h-[500px] shadow-sm items-center justify-center">
              <p className="text-slate-500">Chưa có bài tập nào.</p>
            </div>
          ) : (
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-6 h-full flex flex-col min-h-[500px] shadow-sm">
            <div className="mb-6 border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedAssignment.task}</h2>
              <p className="text-slate-500 text-sm">Thuộc khóa học: <span className="font-semibold text-indigo-600">{selectedAssignment.course}</span></p>
            </div>

            {selectedAssignment.status === 'pending' || isEditing ? (
              <div className="flex-1 flex flex-col animate-[fadeIn_0.3s_ease]">
                <div className="mb-4 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="text-amber-500 shrink-0" size={20} />
                  <p className="text-sm text-amber-700">Bài tập yêu cầu nộp file báo cáo (PDF, DOCX) hoặc nén file source code (ZIP, RAR). Dung lượng tối đa 50MB.</p>
                </div>

                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-600 bg-white/60'}`}
                >
                  <UploadCloud size={48} className={`mb-4 ${dragActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <p className="text-slate-600 font-semibold mb-2">Kéo thả file vào đây để nộp</p>
                  <p className="text-slate-500 text-sm mb-6">hoặc</p>
                  <label className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-900 rounded-lg cursor-pointer font-semibold transition-colors">
                    Chọn File từ máy tính
                    <input type="file" className="hidden" onChange={(e) => {
                      if (e.target.files) setFile(e.target.files[0])
                    }}/>
                  </label>

                  {file && (
                    <div className="mt-8 p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3 w-full max-w-sm">
                      <FileText className="text-indigo-400" />
                      <div className="flex-1 truncate text-sm text-slate-700">{file.name}</div>
                      <button className="text-xs text-red-400 font-semibold hover:underline" onClick={() => setFile(null)}>Xóa</button>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  {isEditing && (
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl shadow-sm transition-colors"
                    >
                      Hủy cập nhật
                    </button>
                  )}
                  <button 
                    onClick={handleSubmit}
                    disabled={!file}
                    className="px-6 py-2.5 bg-[#1F3864] hover:bg-[#162A4A] disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl shadow-lg transition-colors"
                  >
                    {isEditing ? 'Lưu bài nộp mới' : 'Nộp bài tập'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center animate-[fadeIn_0.3s_ease]">
                <CheckCircle size={64} className="text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bạn đã nộp bài tập này</h3>
                
                {selectedAssignment.file && (
                  <div className="flex items-center gap-3 p-3 bg-white shadow-sm rounded-xl border border-slate-200 w-max">
                    <FileText size={20} className="text-[#1F3864]" />
                    <span className="text-sm font-medium text-slate-800">{selectedAssignment.file}</span>
                  </div>
                )}

                {selectedAssignment.status === 'graded' ? (
                  <p className="text-slate-500 text-center">Giảng viên đã chấm điểm. Kết quả: <span className="font-bold text-green-400 text-lg">{selectedAssignment.grade}</span></p>
                ) : (
                  <>
                    <p className="text-slate-500 text-center mb-8">Bài nộp của bạn đang chờ giảng viên chấm điểm.</p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-700 border border-slate-200 hover:border-slate-600 text-slate-600 font-semibold rounded-xl transition-colors"
                      >
                        <Edit size={16}/> Sửa bài nộp
                      </button>
                      <button 
                        onClick={handleCancelSubmission}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl transition-colors"
                      >
                        <Trash2 size={16}/> Hủy nộp bài
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}
