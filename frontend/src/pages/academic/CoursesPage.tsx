import { useState } from 'react'
import { BookOpen, Plus, MoreVertical, PlayCircle, Users, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DashboardUser } from '../../types/dashboard'
import { dbGetCourses, dbCreateCourse } from '../../data/mockDatabase'

interface Props {
  user: DashboardUser
}

export default function CoursesPage({ user }: Props) {
  const navigate = useNavigate()
  const [courses, setCourses] = useState(dbGetCourses())
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({ title: '', description: '' })

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault()
    const newCourse = dbCreateCourse(formData.title, formData.description)
    setCourses([...courses, newCourse])
    setShowCreateModal(false)
    setFormData({ title: '', description: '' })
    navigate(`/dashboard/academic/courses/${newCourse.id}`)
  }

  return (
    <div className="min-h-full space-y-6">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#1F3864] flex items-center justify-center shadow-sm">
              <BookOpen size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1F3864] tracking-tight">
              Quản lý Khóa học
            </h1>
          </div>
          <p className="text-xs text-slate-400 ml-10.5">
            Quản lý các khóa học do bạn phụ trách
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#C00000] hover:bg-[#a80000] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus size={16} /> Tạo khóa học mới
        </button>
      </div>

      {/* ── Grid Khóa học ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.map(course => (
          <div key={course.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full shadow-sm ${course.status === 'Published' ? 'bg-[#375623] text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {course.status}
                </span>
              </div>
            </div>
            
            <div className="p-5">
              <h3 className="font-bold text-slate-800 text-base mb-3 line-clamp-2 leading-tight">
                {course.title}
              </h3>
              
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-5">
                <span className="flex items-center gap-1.5"><Users size={14} /> {course.students} HV</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> {course.duration}</span>
              </div>
              
              <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                <button 
                  onClick={() => navigate(`/dashboard/academic/courses/${course.id}`)}
                  className="text-sm font-semibold text-[#2E75B6] hover:text-[#1F3864] transition-colors flex items-center gap-1.5"
                >
                  <PlayCircle size={16} /> Soạn đề cương / Bài giảng
                </button>
                <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tạo Khóa học */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[500px] shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-[#C00000]" />
              Khởi tạo Khóa học mới
            </h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên khóa học <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-[#C00000] focus:ring-1 focus:ring-[#C00000] outline-none"
                  placeholder="VD: Cấu trúc dữ liệu và giải thuật"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả ngắn</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-[#C00000] focus:ring-1 focus:ring-[#C00000] outline-none min-h-[100px]"
                  placeholder="Mô tả tóm tắt nội dung khóa học..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-[#C00000] hover:bg-[#a80000] rounded-lg shadow-sm">Khởi tạo & Tiếp tục soạn đề cương</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
