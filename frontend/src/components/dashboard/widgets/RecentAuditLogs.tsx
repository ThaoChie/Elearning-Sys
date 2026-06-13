// ============================================================
// RECENT AUDIT LOGS – Right column list view
// Hiển thị HMAC Verification badge theo BR-22
// ============================================================

import { ShieldCheck, ShieldX, LogIn, LogOut, GraduationCap, Star, UserCog, AlertOctagon, ClipboardCheck } from 'lucide-react'
import { RECENT_AUDIT_LOGS, type AuditLogEntry } from '../../../pages/admin/mockData'

// ── Action type → icon & color ─────────────────────────────
const ACTION_META: Record<
  AuditLogEntry['actionType'],
  { icon: React.ReactNode; bg: string; text: string }
> = {
  LOGIN_OK: {
    icon: <LogIn size={13} />,
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
  },
  LOGIN_SUCCESS: {
    icon: <LogIn size={13} />,
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
  },
  LOGIN_FAIL: {
    icon: <LogIn size={13} />,
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  LOCKOUT: {
    icon: <ShieldX size={13} />,
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  LOGOUT: {
    icon: <LogOut size={13} />,
    bg: 'bg-slate-100',
    text: 'text-slate-500',
  },
  EXAM_SUBMIT: {
    icon: <ClipboardCheck size={13} />,
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
  },
  GRADE_UPDATE: {
    icon: <Star size={13} />,
    bg: 'bg-amber-100',
    text: 'text-amber-600',
  },
  ROLE_CHANGE: {
    icon: <UserCog size={13} />,
    bg: 'bg-purple-100',
    text: 'text-purple-600',
  },
  ANTICHEAT: {
    icon: <AlertOctagon size={13} />,
    bg: 'bg-orange-100',
    text: 'text-orange-600',
  },
}

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

function LogItem({ entry }: { entry: AuditLogEntry }) {
  const meta = ACTION_META[entry.actionType] || {
    icon: <AlertOctagon size={13} />,
    bg: 'bg-slate-100',
    text: 'text-slate-600',
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 group hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors">
      {/* Action icon */}
      <div
        className={`flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center ${meta.bg} ${meta.text}`}
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-slate-700 truncate">{entry.actorName}</p>
          <HmacBadge valid={entry.hmacValid} />
        </div>
        <p className="text-[11px] text-slate-500 truncate mt-0.5 leading-relaxed">{entry.action}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-slate-500 font-mono">{entry.timestamp}</span>
          <span className="text-[10px] text-slate-600">·</span>
          <span className="text-[10px] text-slate-500 font-mono">{entry.ip}</span>
          <span className="text-[10px] text-slate-600">·</span>
          <span className="text-[10px] text-slate-500 font-mono">{entry.logId}</span>
        </div>
      </div>
    </div>
  )
}

export default function RecentAuditLogs() {
  const invalidCount = RECENT_AUDIT_LOGS.filter((l) => !l.hmacValid).length

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-[#1F3864]">Hoạt động gần đây</h3>
          <p className="text-xs text-slate-500 mt-0.5">Audit log · Bất biến HMAC-SHA256</p>
        </div>
        {/* Integrity warning */}
        {invalidCount > 0 && (
          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-xl">
            <ShieldX size={13} />
            {invalidCount} bản ghi nghi vấn
          </div>
        )}
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto mt-3 space-y-0 pr-1">
        {RECENT_AUDIT_LOGS.map((entry) => (
          <LogItem key={entry.logId} entry={entry} />
        ))}
      </div>

      {/* Footer link */}
      <div className="mt-3 pt-3 border-t border-slate-50">
        <a
          href="/dashboard/system/audit"
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1 transition-colors"
        >
          Xem toàn bộ audit logs →
        </a>
      </div>
    </div>
  )
}
