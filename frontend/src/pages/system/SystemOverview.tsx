// ============================================================
// ADMIN DASHBOARD – SystemOverview
// Route: /dashboard/system  (Admin only)
// Layout: Header Stats → Middle (Chart 60% + Logs 40%) → Table
// ============================================================

import AdminStats from '../../components/dashboard/widgets/AdminStats'
import SecurityChart from '../../components/dashboard/widgets/SecurityChart'
import RecentAuditLogs from '../../components/dashboard/widgets/RecentAuditLogs'
import UserAlertTable from '../../components/dashboard/widgets/UserAlertTable'
import type { DashboardUser } from '../../types/dashboard'
import { ShieldCheck, RefreshCcw } from 'lucide-react'
import { useAdminDashboard } from '../../hooks/useDashboardStats'

interface Props {
  user: DashboardUser
}

export default function SystemOverview({ user }: Props) {
  const now = new Date().toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const { data, loading } = useAdminDashboard()

  return (
    <div className="min-h-full space-y-6 pb-8">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#1F3864] flex items-center justify-center shadow-sm">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1F3864] tracking-tight">
              Tổng quan hệ thống
            </h1>
          </div>
          <p className="text-xs text-slate-500 ml-10.5">
            Xin chào, <span className="font-semibold text-slate-600">{user.name}</span>
            {' '}· Dashboard bảo mật · Chỉ đọc
          </p>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm">
          <RefreshCcw size={11} />
          <span>Cập nhật: {now}</span>
        </div>
      </div>

      {/* ── Section 1: Stats + Alert Cards ──────────────────── */}
      <AdminStats data={data} loading={loading} />

      {/* ── Section 2: Middle – Chart (60%) + Audit Logs (40%) ─ */}
      <div className="grid grid-cols-5 gap-5">
        {/* Security Chart – 60% */}
        <div className="col-span-3">
          <SecurityChart data={data} loading={loading} />
        </div>

        {/* Recent Audit Logs – 40% */}
        <div className="col-span-2">
          <RecentAuditLogs logs={data?.recentLogs} loading={loading} />
        </div>
      </div>

      {/* ── Section 3: Bottom – User Alert Table ────────────── */}
      <UserAlertTable />

    </div>
  )
}
