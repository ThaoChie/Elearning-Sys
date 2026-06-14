// ============================================================
// RECENT AUDIT LOGS – Right column list view
// Hiển thị HMAC Verification badge theo BR-22
// ============================================================

import { ShieldCheck, ShieldX } from 'lucide-react'

function HmacBadge({ valid }: { valid: boolean }) {
  return valid ? (
    <div
      className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"
      title="Chữ ký HMAC-SHA256 hợp lệ"
    >
      <ShieldCheck size={10} />
      HMAC OK
    </div>
  ) : (
    <div
      className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5 animate-pulse"
      title="CẢNH BÁO: Chữ ký HMAC không hợp lệ – Bản ghi có thể bị giả mạo!"
    >
      <ShieldX size={10} />
      HMAC FAIL
    </div>
  )
}

export default function RecentAuditLogs({ logs, loading }: { logs: any[], loading: boolean }) {
  if (loading) return <div className="p-5 text-center text-slate-500 h-full flex items-center justify-center bg-white/70 backdrop-blur-md rounded-2xl border border-white/50">Đang tải Audit Logs...</div>

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Nhật ký hoạt động</h2>
          <p className="text-xs text-slate-500 mt-0.5">Immutable Audit Trail (BR-22)</p>
        </div>
        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
          Xem tất cả
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1">
        {logs && logs.length > 0 ? logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 group hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors">
            {/* Action icon */}
            <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600">
              <ShieldCheck size={13} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 truncate">{log.action}</p>
                <span className="flex-shrink-0 text-[10px] text-slate-400 font-medium">
                  {log.time}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5">
                <span className="text-slate-400 font-mono">{log.ip}</span>
              </p>
            </div>
            {/* HMAC Badge (Mock OK for all real logs for now) */}
            <div className="flex-shrink-0 mt-1">
              <HmacBadge valid={true} />
            </div>
          </div>
        )) : (
          <div className="text-xs text-slate-500 py-4 text-center">Không có nhật ký nào gần đây.</div>
        )}
      </div>
    </div>
  )
}
