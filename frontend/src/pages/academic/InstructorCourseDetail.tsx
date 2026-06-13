import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MoreVertical, PlayCircle, FileText, UploadCloud, Edit, Trash2 } from 'lucide-react'
import UploadZone from '../../components/UploadZone'
import { dbGetCourseById, dbUpdateCourseSyllabus } from '../../data/mockDatabase'

interface Module {
  id: string
  title: string
  order?: number
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  type: 'video' | 'pdf' | 'doc' | string
  duration?: string
  url?: string
}

export default function InstructorCourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  
  const course = dbGetCourseById(courseId || '')
  const [modules, setModules] = useState<Module[]>(course ? course.syllabus as any : [])
  
  // Modals
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [moduleTitle, setModuleTitle] = useState('')
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  
  const [showLessonModal, setShowLessonModal] = useState<{ moduleId: string } | null>(null)
  const [lessonData, setLessonData] = useState({ title: '', type: 'video' as 'video'|'pdf' })

  // Sync to global state whenever modules change
  useEffect(() => {
    if (courseId) {
      dbUpdateCourseSyllabus(courseId, modules)
    }
  }, [modules, courseId])

  // Mở modal tạo/sửa module
  const openModuleModal = (mod?: Module) => {
    if (mod) {
      setEditingModule(mod)
      setModuleTitle(mod.title)
    } else {
      setEditingModule(null)
      setModuleTitle('')
    }
    setShowModuleModal(true)
  }

  const saveModule = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingModule) {
      setModules(modules.map(m => m.id === editingModule.id ? { ...m, title: moduleTitle } : m))
    } else {
      setModules([...modules, { id: `mod-${Date.now()}`, title: moduleTitle, order: modules.length + 1, lessons: [] }])
    }
    setShowModuleModal(false)
  }

  const deleteModule = (modId: string) => {
    if(confirm('Bạn có chắc muốn xóa chương này cùng toàn bộ bài giảng bên trong?')) {
      setModules(modules.filter(m => m.id !== modId))
    }
  }

  // Thêm bài giảng
  const saveLesson = (e: React.FormEvent) => {
    e.preventDefault()
    if (!showLessonModal) return
    const newLesson: Lesson = {
      id: `les-${Date.now()}`,
      title: lessonData.title,
      type: lessonData.type,
      duration: lessonData.type === 'video' ? '00:00' : undefined
    }
    setModules(modules.map(m => m.id === showLessonModal.moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m))
    setShowLessonModal(null)
  }

  return (
    <div className="min-h-full space-y-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
        <button 
          onClick={() => navigate('/dashboard/academic/courses')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1F3864]">Chỉnh sửa Đề cương Khóa học</h1>
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-slate-100 text-slate-500">Draft</span>
          </div>
          <p className="text-sm text-slate-400 mt-1">Sắp xếp chương học, tải lên video và tài liệu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Đề cương */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800">Cấu trúc Chương trình</h2>
            <button 
              onClick={() => openModuleModal()}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus size={16} /> Thêm Chương
            </button>
          </div>

          {modules.map((mod, index) => (
            <div key={mod.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4 animate-[fadeIn_0.3s_ease]">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between group">
                <h3 className="font-bold text-slate-800">Chương {index + 1}: {mod.title}</h3>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModuleModal(mod)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"><Edit size={16}/></button>
                  <button onClick={() => deleteModule(mod.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
              
              <div className="p-4 space-y-2">
                {mod.lessons.map((les) => (
                  <div key={les.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all group/item cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${les.type === 'video' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        {les.type === 'video' ? <PlayCircle size={16}/> : <FileText size={16}/>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700 group-hover/item:text-[#2E75B6] transition-colors">{les.title}</p>
                        <p className="text-xs text-slate-400">{les.type} {les.duration && `• ${les.duration}`}</p>
                      </div>
                    </div>
                    <button className="text-slate-300 hover:text-slate-600"><MoreVertical size={16}/></button>
                  </div>
                ))}

                <button 
                  onClick={() => setShowLessonModal({ moduleId: mod.id })}
                  className="w-full mt-2 py-3 border-2 border-dashed border-slate-200 hover:border-[#2E75B6] hover:bg-blue-50 text-slate-500 hover:text-[#2E75B6] rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={16} /> Thêm bài giảng / Tài liệu
                </button>
              </div>
            </div>
          ))}
          
          {modules.length === 0 && (
            <div className="text-center p-12 bg-white border border-slate-200 border-dashed rounded-2xl">
              <p className="text-slate-500 mb-4">Chưa có chương học nào</p>
              <button onClick={() => openModuleModal()} className="px-4 py-2 bg-[#1F3864] text-white rounded-lg text-sm font-semibold inline-flex items-center gap-2"><Plus size={16}/> Tạo chương đầu tiên</button>
            </div>
          )}
        </div>

        {/* Cột phải: Upload file */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UploadCloud size={18} className="text-[#2E75B6]" />
              Khu vực tải lên nhanh (Video/PDF)
            </h2>
            <UploadZone />
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              * Tải file lên kho lưu trữ riêng của khóa học trước, sau đó bạn có thể chọn đính kèm vào các Bài giảng (Lessons) ở cột bên trái.
            </p>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      {/* Modal Module */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[400px] shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">{editingModule ? 'Sửa tên Chương' : 'Thêm Chương mới'}</h3>
            <form onSubmit={saveModule}>
              <input 
                type="text" 
                required
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm mb-6 outline-none focus:border-[#2E75B6]"
                placeholder="VD: Chương 1: Lập trình cơ bản"
                value={moduleTitle}
                onChange={e => setModuleTitle(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-[#1F3864] rounded-lg">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lesson */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[450px] shadow-2xl p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Thêm Bài giảng mới</h3>
            <form onSubmit={saveLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tên bài giảng</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#2E75B6]"
                  placeholder="VD: 1.1 Cài đặt môi trường"
                  value={lessonData.title}
                  onChange={e => setLessonData({...lessonData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Loại tài liệu</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-[#2E75B6]"
                  value={lessonData.type}
                  onChange={e => setLessonData({...lessonData, type: e.target.value as 'Video'|'PDF'})}
                >
                  <option value="video">Video bài giảng</option>
                  <option value="pdf">Tài liệu PDF / Slide</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Tệp đính kèm <span className="text-red-500">*</span>
                </label>
                <div className="border border-slate-300 rounded-lg p-2 flex items-center justify-between bg-slate-50">
                  <input 
                    type="file" 
                    required
                    accept={lessonData.type === 'video' ? "video/*" : ".pdf,.ppt,.pptx,.doc,.docx"}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2E75B6] hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {lessonData.type === 'video' ? 'Hỗ trợ định dạng: MP4, WebM (Tối đa 500MB)' : 'Hỗ trợ định dạng: PDF, PPTX (Tối đa 50MB)'}
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowLessonModal(null)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-[#1F3864] rounded-lg">Thêm bài giảng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
