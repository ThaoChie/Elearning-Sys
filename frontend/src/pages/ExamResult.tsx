import { useNavigate } from 'react-router-dom'
import { CheckCircle, Award, Target, ArrowRight } from 'lucide-react'

export default function ExamResult() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">Nộp bài thành công!</h1>
          <p className="text-slate-400 text-sm mb-8">Bạn đã hoàn thành bài thi trắc nghiệm.</p>

          <div className="w-full bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 mb-8 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm flex items-center gap-2"><Target size={16}/> Số câu đã làm</span>
              <span className="text-white font-bold">5 / 5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm flex items-center gap-2"><Award size={16}/> Điểm số tạm tính</span>
              <span className="text-green-400 font-bold text-xl">Đang chấm...</span>
            </div>
          </div>

          <button 
            onClick={() => navigate('/dashboard/student/home')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
          >
            Về trang chủ <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
