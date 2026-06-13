import { Award, CheckCircle, TrendingUp } from 'lucide-react'

const reports = [
  { course: 'An ninh mạng cơ bản', score: 9.5, status: 'Passed', certId: 'CERT-2024-001' },
  { course: 'DevOps & CI/CD Pipeline', score: 8.0, status: 'Passed', certId: 'CERT-2024-002' },
  { course: 'Lập trình Web', score: null, status: 'In Progress', certId: null }
]

export default function ReportsPage() {
  return (
    <div className="min-h-full space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <TrendingUp size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kết quả & Chứng chỉ</h1>
          <p className="text-sm text-slate-500">Xem điểm số tổng hợp và tải chứng chỉ hoàn thành khóa học</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, idx) => (
          <div key={idx} className="bg-white/80 border border-slate-200/50 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
            
            <h3 className="font-bold text-slate-800 mb-4 line-clamp-2 min-h-[48px]">{report.course}</h3>
            
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-xs text-slate-500 mb-1">Điểm tổng kết</p>
                <p className="text-3xl font-black text-slate-900">{report.score ? report.score : '--'}<span className="text-lg text-slate-500">/10</span></p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-2.5 py-1 text-xs font-bold uppercase rounded-md mb-2 ${report.status === 'Passed' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {report.status}
                </span>
                {report.status === 'Passed' && <CheckCircle size={20} className="text-green-500" />}
              </div>
            </div>

            {report.certId ? (
              <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
                <Award size={18} />
                Tải Chứng chỉ PDF
              </button>
            ) : (
              <button disabled className="w-full py-2.5 bg-slate-700/50 text-slate-500 text-sm font-semibold rounded-xl cursor-not-allowed border border-slate-600 border-dashed">
                Chưa đủ điều kiện
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
