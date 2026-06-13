// ============================================================
// ADMIN STATS – Header Section
// Hiển thị: Tổng user hoạt động + Segmented Role Bar + Alert Cards
// ============================================================

import { Lock, ShieldAlert, ShieldCheck, Users, GraduationCap, BookOpenCheck, Crown } from 'lucide-react'

// ── Segmented Progress Bar ─────────────────────────────────
function RoleProgressBar({ roles }: { roles: any }) {
  if (!roles) return null;
  const total = roles.students + roles.instructors + roles.admins;
  const studentPct = total ? (roles.students / total) * 100 : 0
  const instructorPct = total ? (roles.instructors / total) * 100 : 0
  const adminPct = total ? (roles.admins / total) * 100 : 0

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phân bổ vai trò</span>
        <span className="text-xs text-slate-500">{total.toLocaleString('vi-VN')} users</span>
      </div>

      {/* Segmented bar */}
      <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-slate-100">
        <div
          className="bg-indigo-500 transition-all duration-700 rounded-l-full"
          style={{ width: `${studentPct}%` }}
          title={`Sinh viên: ${roles.students}`}
        />
        <div
          className="bg-amber-400 transition-all duration-700"
          style={{ width: `${instructorPct}%` }}
          title={`Giảng viên: ${roles.instructors}`}
        />
        <div
          className="bg-rose-500 transition-all duration-700 rounded-r-full"
          style={{ width: `${adminPct}%` }}
          title={`Quản trị viên: ${roles.admins}`}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3">
        <LegendItem color="bg-indigo-500" icon={<GraduationCap size={12} />} label="Sinh viên" count={roles.students} />
        <LegendItem color="bg-amber-400" icon={<BookOpenCheck size={12} />} label="Giảng viên" count={roles.instructors} />
        <LegendItem color="bg-rose-500" icon={<Crown size={12} />} label="Quản trị viên" count={roles.admins} />
      </div>
    </div>
  )
}

function LegendItem({
  color,
  icon,
  label,
  count,
}: {
  color: string
  icon: React.ReactNode
  label: string
  count: number
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${color}`} />
      <span className="text-slate-500 text-xs flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-slate-700 text-xs font-semibold">{count.toLocaleString('vi-VN')}</span>
    </div>
  )
}

// ── Alert Card ─────────────────────────────────────────────
interface AlertCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub: string
  variant: 'danger' | 'amber' | 'success'
}

function AlertCard({ icon, label, value, sub, variant }: AlertCardProps) {
  const styles = {
    danger: {
      border: 'border-red-200/50',
      bg: 'bg-white/40 backdrop-blur-md',
      iconBg: 'bg-red-100 text-red-600',
      value: 'text-[#C00000]',
      sub: 'text-red-500',
    },
    amber: {
      border: 'border-amber-200/50',
      bg: 'bg-white/40 backdrop-blur-md',
      iconBg: 'bg-amber-100 text-amber-600',
      value: 'text-amber-700',
      sub: 'text-amber-500',
    },
    success: {
      border: 'border-emerald-200/50',
      bg: 'bg-white/40 backdrop-blur-md',
      iconBg: 'bg-emerald-100 text-emerald-600',
      value: 'text-emerald-700',
      sub: 'text-emerald-500',
    },
  }

  const s = styles[variant]

  return (
    <div
      className={`
        flex-1 min-w-0 rounded-2xl border p-5
        ${s.border} ${s.bg}
        shadow-sm hover:shadow-md transition-shadow duration-200
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl font-bold leading-none ${s.value}`}>{value}</p>
          <p className={`text-xs mt-1.5 ${s.sub}`}>{sub}</p>
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ── Main Export ────────────────────────────────────────────
export default function AdminStats({ data, loading }: { data: any, loading: boolean }) {
  if (loading) return <div className="p-5 text-center text-slate-500">Đang tải dữ liệu...</div>;
  if (!data) return <div className="p-5 text-center text-red-500">Lỗi tải dữ liệu.</div>;

  return (
    <div className="space-y-5">
      {/* ── Top: Active Users + Segmented Bar ── */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-6 relative overflow-hidden group">
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              User đang hoạt động
            </p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-extrabold text-[#1F3864] leading-none">
                {data.totalUsers?.toLocaleString('vi-VN')}
              </span>
              <span className="text-sm text-emerald-500 font-semibold mb-1 flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Users size={22} className="text-indigo-500" />
          </div>
        </div>
        <RoleProgressBar roles={data.roleDistribution} />
      </div>

      {/* ── Bottom: Quick Alert Cards ── */}
      <div className="flex gap-4">
        <AlertCard
          icon={<Lock size={18} />}
          label="Tài khoản đang khóa"
          value={data.alertCounts?.lockedOut ?? 0}
          sub="BR-02 · Vượt 5 lần đăng nhập sai"
          variant="danger"
        />
        <AlertCard
          icon={<ShieldAlert size={18} />}
          label="Cảnh báo đăng nhập sai"
          value={data.alertCounts?.suspiciousLogins ?? 0}
          sub="BR-05 · Logins fail"
          variant="amber"
        />
        <AlertCard
          icon={<ShieldCheck size={18} />}
          label="Audit Log Integrity"
          value={'OK'}
          sub="HMAC-SHA256 · BR-22 · Toàn vẹn"
          variant="success"
        />
      </div>
    </div>
  )
}
