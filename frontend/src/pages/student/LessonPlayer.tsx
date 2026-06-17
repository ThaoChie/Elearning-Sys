import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PlayCircle, CheckCircle, FileText, MessageSquare, Download } from 'lucide-react'
import SecureVideoPlayer from '../../components/SecureVideoPlayer'
import apiClient from '../../api/apiClient'

export default function LessonPlayer() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'qa'>('overview')
  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (courseId) {
      apiClient.get(`/courses/${courseId}`)
        .then(res => {
          setCourse(res.data)
          setLoading(false)
        })
        .catch(err => {
          console.error("Error fetching course", err)
          setLoading(false)
        })
    }
  }, [courseId])
  
  if (loading) {
    return <div className="text-slate-900 p-8">Đang tải thông tin bài học...</div>
  }

  if (!course) {
    return <div className="text-slate-900 p-8">Khóa học không tồn tại.</div>
  }

  // Find the current lesson for demo purposes
  const currentChapter = course.syllabus && course.syllabus.length > 0 ? course.syllabus[0] : null
  const currentLesson = currentChapter?.lessons && currentChapter.lessons.length > 0 ? currentChapter.lessons[0] : null

  return (
    <div className="h-[calc(100vh-6rem)] -m-6 flex flex-col md:flex-row bg-[#0f172a]">
      {/* ── Main Content: Video & Tabs ──────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
        
        {/* Top bar */}
        <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 border-b border-slate-800 shrink-0">
          <button 
            onClick={() => navigate(`/dashboard/student/home`)}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-slate-900 font-bold">{course.title}</h1>
            <p className="text-xs text-slate-500">{currentChapter?.title} - {currentLesson?.title}</p>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="w-full bg-black aspect-video shrink-0 relative">
          <SecureVideoPlayer 
            videoPath={currentLesson?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
            userId="USR-2024-0042"
            className="w-full h-full"
            onEnded={() => alert('Đã hoàn thành bài học!')}
          />
        </div>

        {/* Tabs Area */}
        <div className="p-6 bg-[#0f172a] flex-1">
          <div className="flex border-b border-slate-800 mb-6 gap-6">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'overview' ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
              <div className="flex items-center gap-2"><FileText size={16} /> Tổng quan & Tài liệu</div>
            </button>
            <button 
              onClick={() => setActiveTab('qa')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'qa' ? 'text-indigo-400 border-indigo-500' : 'text-slate-500 border-transparent hover:text-slate-700'}`}
            >
              <div className="flex items-center gap-2"><MessageSquare size={16} /> Hỏi đáp (Q&A)</div>
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6 text-slate-600">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Giới thiệu Docker</h2>
                <p className="text-sm leading-relaxed text-slate-500">
                  Trong bài học này, chúng ta sẽ tìm hiểu khái niệm containerization và lý do tại sao Docker trở thành tiêu chuẩn công nghiệp trong việc triển khai ứng dụng. Các khái niệm Image, Container, Dockerfile sẽ được giải thích chi tiết.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Tài liệu đính kèm</h3>
                <div className="flex items-center gap-4 p-4 bg-white/80 border border-slate-200/50 rounded-xl max-w-md">
                  <div className="p-2 bg-red-500/10 text-red-400 rounded-lg"><FileText size={20} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700">Slide_Docker_CoBan.pdf</p>
                    <p className="text-xs text-slate-500">2.4 MB • PDF (Có Watermark ẩn)</p>
                  </div>
                  <button className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qa' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0" />
                <div className="flex-1">
                  <textarea 
                    placeholder="Bạn có câu hỏi gì về bài học này?" 
                    className="w-full bg-white/80 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
                      Gửi câu hỏi
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center text-indigo-300 font-bold shrink-0">T</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-700 text-sm">Trần Văn A</span>
                      <span className="text-xs text-slate-500">2 ngày trước</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">Thầy cho em hỏi sự khác biệt cốt lõi giữa Docker Container và Virtual Machine là gì ạ?</p>
                    <div className="mt-3 bg-white/80 p-4 rounded-xl border border-slate-200/50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-indigo-400 text-sm">Kỹ sư Ngô Bảo Châu (Giảng viên)</span>
                        <span className="text-xs text-slate-500">1 ngày trước</span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">Chào em, sự khác biệt lớn nhất nằm ở lớp Guest OS. VM yêu cầu một Guest OS hoàn chỉnh, trong khi Container chia sẻ OS kernel với Host machine, giúp nó nhẹ và khởi động nhanh hơn rất nhiều.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar: Syllabus ─────────────────────────────── */}
      <div className="w-full md:w-80 bg-slate-50 border-l border-slate-800 h-full flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-slate-900 font-bold mb-1">Nội dung khóa học</h2>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Hoàn thành: 1/4 bài</span>
            <span className="text-indigo-400 font-semibold">25%</span>
          </div>
          <div className="w-full bg-white h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-500 h-full w-1/4 rounded-full" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
          {course.syllabus.map(chapter => (
            <div key={chapter.id} className="mb-4">
              <h3 className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                {chapter.title}
              </h3>
              <div className="space-y-1 mt-1">
                {chapter.lessons.map(lesson => (
                  <button 
                    key={lesson.id} 
                    className={`w-full text-left px-3 py-3 rounded-xl flex items-start gap-3 transition-colors ${lesson.isCurrent ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/80 border border-transparent'}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {lesson.completed ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : lesson.type === 'video' ? (
                        <PlayCircle size={16} className={lesson.isCurrent ? 'text-indigo-400' : 'text-slate-500'} />
                      ) : (
                        <FileText size={16} className="text-slate-500" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm ${lesson.isCurrent ? 'text-indigo-300 font-semibold' : 'text-slate-600'}`}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{lesson.type === 'video' ? 'Video' : 'Tài liệu'} • {lesson.duration}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
