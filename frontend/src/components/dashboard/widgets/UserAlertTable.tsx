// ============================================================
// USER ALERT TABLE – Bottom data table
// Cột: Email, Role, Status, Failed Logins, Action
// BR-02: Highlight account bị khóa (failedLogins >= 5)
// ============================================================

import { Lock, Unlock, Eye, AlertTriangle, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { MOCK_USERS, type MockUser } from '../../../pages/admin/mockData'

// ── Sub-components ─────────────────────────────────────────

function RoleBadge({ role }: { role: MockUser['role'] }) {
  const map = {
    Admin: 'bg-purple-100 text-purple-700 border-purple-200',
    Instructor: 'bg-amber-100 text-amber-700 border-amber-200',
    Student: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  }
  const labels = { Admin: 'Quản trị viên', Instructor: 'Giảng viên', Student: 'Sinh viên' }
  return (
    <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[role]}`}>
      {labels[role]}
    </span>
  )
}

function StatusBadge({ status }: { status: MockUser['status'] }) {
  const map = {
    Active: { cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 size={11} />, label: 'Hoạt động' },
    Locked: { cls: 'text-red-600 bg-red-50 border-red-200', icon: <XCircle size={11} />, label: 'Đang khóa' },
    Suspended: { cls: 'text-slate-500 bg-slate-50 border-slate-200', icon: <MinusCircle size={11} />, label: 'Tạm dừng' },
  }
  const { cls, icon, label } = map[status]
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

function ActionButtons({ user }: { user: MockUser }) {
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
  const lockedCount = MOCK_USERS.filter((u) => u.status === 'Locked').length
  const riskyCount = MOCK_USERS.filter((u) => u.failedLogins >= 3).length

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
      {/* Table header bar */}
      <div className="px-6 py-5 border-b border-white/30 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1F3864]">Quản lý tài khoản</h3>
          <p className="text-xs text-slate-500 mt-0.5">{MOCK_USERS.length} người dùng · Read-only overview</p>
        </div>
        <div className="flex items-center gap-3">
          {lockedCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C00000] bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
              <Lock size={11} />
              {lockedCount} tài khoản bị khóa
            </div>
          )}
          {riskyCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <AlertTriangle size={11} />
              {riskyCount} có nguy cơ cao
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/60">
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-6 py-3">
                Email / Người dùng
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Vai trò
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Trạng thái
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-44">
                Đăng nhập sai (BR-02)
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Lần cuối
              </th>
              <th className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                Hành động
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {MOCK_USERS.map((user) => {
              const isRisky = user.failedLogins >= 3
              const isLocked = user.status === 'Locked'
              return (
                <tr
                  key={user.id}
                  className={`
                    group transition-colors
                    ${isLocked ? 'bg-red-50/30 hover:bg-red-50/60' : isRisky ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/70'}
                  `}
                >
                  {/* Email */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                          ${isLocked ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}
                        `}
                      >
                        {user.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{user.fullName}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={user.status} />
                  </td>

                  {/* Failed Logins bar */}
                  <td className="px-4 py-3.5 w-44">
                    <FailedLoginBar count={user.failedLogins} />
                  </td>

                  {/* Last seen */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] text-slate-500 font-mono">{user.lastSeen}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <ActionButtons user={user} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/40 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Hiển thị {MOCK_USERS.length} / {MOCK_USERS.length} người dùng · Dashboard read-only
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
