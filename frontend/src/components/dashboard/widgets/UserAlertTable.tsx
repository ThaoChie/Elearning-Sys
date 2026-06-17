// ============================================================
// USER ALERT TABLE – Bottom data table
// Cột: Email, Role, Status, Failed Logins, Action
// BR-02: Highlight account bị khóa (failedLogins >= 5)
// ============================================================

import { Lock, Unlock, Eye, AlertTriangle, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import apiClient from '../../../api/apiClient'

// ── Sub-components ─────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const map = {
    Admin: 'bg-purple-100 text-purple-700 border-purple-200',
    Instructor: 'bg-amber-100 text-amber-700 border-amber-200',
    Student: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  }
  const labels = { Admin: 'Quản trị viên', Instructor: 'Giảng viên', Student: 'Sinh viên' }
  return (
    <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[role as keyof typeof map]}`}>
      {labels[role as keyof typeof labels]}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map = {
    Active: { cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={11} />, label: 'Hoạt động' },
    Locked: { cls: 'text-red-600 bg-red-50 border-red-200', icon: <XCircle size={11} />, label: 'Đang khóa' },
    Suspended: { cls: 'text-slate-500 bg-slate-50 border-slate-200', icon: <MinusCircle size={11} />, label: 'Tạm dừng' },
  }
  const { cls, icon, label } = map[status as keyof typeof map] || map.Active
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}
    >
      {icon}
      {label}
    </span>
  )
}

function FailedLoginBar({ count }: { count: number }) {
  const pct = (count / 5) * 100
  const color =
    count >= 5 ? 'bg-red-500' : count >= 3 ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span
        className={`text-xs font-bold tabular-nums min-w-[20px] text-right ${
          count >= 5 ? 'text-[#C00000]' : count >= 3 ? 'text-amber-600' : 'text-slate-500'
        }`}
      >
        {count}/5
      </span>
    </div>
  )
}

function ActionButtons({ user }: { user: any }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        title="Xem chi tiết"
        onClick={() => alert(`Xem chi tiết: ${user.email}`)}
      >
        <Eye size={14} />
      </button>
      {user.status === 'Locked' ? (
        <button
          className="p-1.5 rounded-lg text-red-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Mở khóa tài khoản"
          onClick={() => alert(`Mở khóa: ${user.email}`)}
        >
          <Unlock size={14} />
        </button>
      ) : (
        <button
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Khóa tài khoản"
          onClick={() => alert(`Khóa: ${user.email}`)}
        >
          <Lock size={14} />
        </button>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────
export default function UserAlertTable() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    apiClient.get('/admin/users')
      .then(res => setUsers(res.data || []))
      .catch(err => console.error("Failed to load users for alert table", err))
  }, [])

  const lockedCount = users.filter((u) => u.status === 'Locked').length
  const riskCount = users.filter((u) => (u.failedLogins || 0) >= 3 && u.status !== 'Locked').length

  return (
    <div className="bg-white/70 backdrop-blur-md border border-white/50 shadow-sm rounded-2xl overflow-hidden flex flex-col h-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white/50 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-[#1F3864]">Quản lý tài khoản</h3>
          <p className="text-xs text-slate-500 mt-0.5">{users.length} người dùng · Read-only overview</p>
        </div>
        <div className="flex items-center gap-3">
          {lockedCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C00000] bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
              <Lock size={11} />
              {lockedCount} tài khoản bị khóa
            </div>
          )}
          {riskCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <AlertTriangle size={11} />
              {riskCount} có nguy cơ cao
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 border-b border-slate-100 sticky top-0">
            <tr>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">Email / Người dùng</th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Vai trò</th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Trạng thái</th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-44">Đăng nhập sai (BR-02)</th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Lần cuối</th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Hành động</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100/50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-700 leading-tight flex items-center gap-1.5">
                        {user.fullName}
                        {(user.failedLogins || 0) >= 5 && <AlertTriangle size={12} className="text-red-500" />}
                      </div>
                      <div className="text-[10px] text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <RoleBadge role={user.role} />
                </td>
                <td className="p-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="p-3">
                  <FailedLoginBar count={user.failedLogins || 0} />
                </td>
                <td className="p-3">
                  <div className="text-xs text-slate-600 font-medium">{user.lastLoginAt?.split(' ')[0] || '--:--'}</div>
                  <div className="text-[10px] text-slate-400">{user.lastLoginAt?.split(' ')[1] || '--/--'}</div>
                </td>
                <td className="p-3 text-right">
                  <ActionButtons user={user} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/40 flex items-center justify-between shrink-0">
        <p className="text-xs text-slate-500">
          Hiển thị {users.length} người dùng · Dashboard read-only
        </p>
        <a
          href="/dashboard/system/users"
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
        >
          Quản lý đầy đủ →
        </a>
      </div>
    </div>
  )
}
