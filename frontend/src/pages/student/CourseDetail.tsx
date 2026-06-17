import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Users, PlayCircle, BookOpen, Star, CheckCircle, Play } from 'lucide-react'
import { enrollInMockCourse } from './mockData.student'

import { addAuditLog } from '../admin/mockData'

import { dbGetCourseById } from '../../data/mockDatabase'
import { sanitizeText } from '../../utils/sanitize'

export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  
  const [courseData, setCourseData] = useState(dbGetCourseById(courseId || ''))
  
  if (!courseData) {
    return <div className="text-slate-900 p-8">Khóa học không tồn tại.</div>
  }
  
  const handleEnrollOrContinue = () => {
    if (courseData.isEnrolled) {
      navigate(`/dashboard/student/courses/${courseId}/learn`)
    } else {
      // Gọi API Ghi danh
      alert(`Đã ghi danh khóa học ${courseId} thành công!`)
      setCourseData({ ...courseData, isEnrolled: true })
      if (courseId) {
        enrollInMockCourse(courseId)
        addAuditLog(`ENROLL_COURSE - Ghi danh khóa học ${courseId}`, 'ENROLL_COURSE')
      }
    }
  }

  return (
    <div className="min-h-full max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* ── Header / Hero ─────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-50 h-[320px]">
        <img src={courseData.thumbnail} alt={courseData.title} className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-10 w-full flex items-end justify-between">
          <div className="max-w-2xl">
            <span className="px-3 py-1 bg-indigo-500 text-slate-900 text-xs font-bold uppercase tracking-wider rounded-md mb-4 inline-block">
              DevOps
            </span>
            <h1 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">
              {courseData.title}
            </h1>
            <p className="text-slate-600 text-sm mb-6 line-clamp-2">
              {sanitizeText(courseData.description)}
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <span className="flex items-center gap-1.5"><Star size={16} className="text-amber-400" /> {courseData.rating}</span>
              <span className="flex items-center gap-1.5"><Users size={16} /> {courseData.students} học viên</span>
              <span className="flex items-center gap-1.5"><Clock size={16} /> {courseData.duration}</span>
              <span className="flex items-center gap-1.5"><BookOpen size={16} /> {courseData.lessonsCount} bài học</span>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/50 flex flex-col items-center justify-center shrink-0 w-48 shadow-xl">
            <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wide">Trạng thái của bạn</p>
            {courseData.isEnrolled ? (
              <div className="flex items-center gap-2 text-green-400 font-bold mb-3">
                <CheckCircle size={20} /> Đã ghi danh
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 font-bold mb-3">
                Chưa ghi danh
              </div>
            )}
            <button 
              onClick={handleEnrollOrContinue}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center justify-center gap-2"
            >
              {courseData.isEnrolled ? <><Play size={18} /> Tiếp tục học</> : 'Ghi danh ngay'}
            </button>
            <p className="text-[10px] text-center text-slate-500 italic">Khóa học nội bộ - Miễn phí</p>
          </div>
        </div>
      </div>

      {/* ── Body: Syllabus ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-800 pb-3">
            <BookOpen size={20} className="text-indigo-400" />
            Nội dung khóa học (Đề cương)
          </h2>
          
          <div className="space-y-4">
            {courseData.syllabus.map((chapter, idx) => (
              <div key={idx} className="bg-white/70 border border-slate-200/50 rounded-xl overflow-hidden">
                <div className="bg-white/80 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">{chapter.title}</h3>
                  <span className="text-xs text-slate-500">{chapter.lessons.length} bài học</span>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {chapter.lessons.map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => courseData.isEnrolled && navigate(`/dashboard/student/courses/${courseId}/learn`)}
                      className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-colors ${courseData.isEnrolled ? 'text-slate-600 hover:bg-white/60 cursor-pointer' : 'text-slate-500 cursor-not-allowed'}`}
                    >
                      <PlayCircle size={16} className={courseData.isEnrolled ? 'text-indigo-400' : 'text-slate-500'} />
                      <span className="text-sm flex-1">{item.title}</span>
                      {!courseData.isEnrolled && <LockIcon />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Thông tin thêm</h2>
          <ul className="space-y-4 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
              <span>Chứng chỉ hoàn thành sau khi pass bài kiểm tra cuối khóa.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
              <span>Áp dụng công nghệ Anti-Cheat trong kỳ thi.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
              <span>Bảo mật video chống download trái phép.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 ml-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}
