// ============================================================
// SECURITY STATUS WIDGET
// Hiển thị: MFA status, Active Sessions, điều hướng UC-20
// Design: Glassmorphism card, Navy #1F3864, cảnh báo màu đỏ/vàng
// SRS §2.1 (IAM), UC-20 (Session Management)
// ============================================================

import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Monitor,
  Globe,
  AlertTriangle,
  ChevronRight,
  KeyRound,
  Wifi,
} from 'lucide-react'
import type { SecurityStatus, ActiveSession } from '../../../types/student'

interface SecurityStatusWidgetProps {
  status: SecurityStatus
}

// ─── Session Device Icon ──────────────────────────────────────
function DeviceIcon({ type }: { type: 'mobile' | 'desktop' | 'web' }) {
  const cls = 'flex-shrink-0 text-slate-500'
  if (type === 'mobile') return <Smartphone size={14} className={cls} />
  if (type === 'desktop') return <Monitor size={14} className={cls} />
  return <Globe size={14} className={cls} />
}

// ─── Individual Session Row ───────────────────────────────────
function SessionRow({ session, isCurrent }: { session: ActiveSession; isCurrent: boolean }) {
  return (
    <div
      className={`
        flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs
        ${isCurrent
          ? 'bg-indigo-500/10 border border-indigo-500/20'
          : 'bg-white/70 border border-slate-200/50'}
      `}
    >
      <DeviceIcon type={session.deviceType} />

      <div className="flex-1 min-w-0">
        <p className="text-slate-700 font-medium truncate leading-tight">
          {session.deviceName}
          {isCurrent && (
            <span className="ml-1.5 text-indigo-400 font-semibold">(Phiên này)</span>
          )}
        </p>
        <p className="text-slate-500 truncate flex items-center gap-1 mt-0.5">
          <Wifi size={9} />
          {session.ipAddress} • {session.location}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="text-slate-500 text-[10px] whitespace-nowrap">{session.lastActiveAt}</p>
        {!isCurrent && (
          <div className="mt-0.5 flex justify-end">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MFA Status Badge ─────────────────────────────────────────
function MfaBadge({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2.5 rounded-lg border
        ${enabled
          ? 'bg-green-500/10 border-green-500/25'
          : 'bg-amber-500/10 border-amber-500/25'}
      `}
    >
      <KeyRound
        size={16}
        className={enabled ? 'text-green-400' : 'text-amber-400'}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${enabled ? 'text-green-300' : 'text-amber-300'}`}>
          {enabled ? 'Xác thực 2 yếu tố' : 'MFA chưa bật'}
        </p>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {enabled ? 'Tài khoản được bảo vệ tốt' : 'Khuyến nghị bật ngay'}
        </p>
      </div>
      {!enabled && <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />}
    </div>
  )
}

// ─── Security Score Ring ──────────────────────────────────────
function SecurityScoreRing({ score }: { score: number }) {
  const size = 80
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - score / 100)

  const color =
    score >= 80 ? '#22c55e'
    : score >= 50 ? '#f59e0b'
    : '#ef4444'

  const label =
    score >= 80 ? 'Tốt'
    : score >= 50 ? 'Trung bình'
    : 'Rủi ro cao'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`Điểm bảo mật: ${score}/100`}>
        <circle cx={40} cy={40} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
        <circle
          cx={40} cy={40} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" fill={color} fontSize={18} fontWeight="800">
          {score}
        </text>
        <text x="50%" y="68%" textAnchor="middle" dominantBaseline="central" fill="#64748b" fontSize={9}>
          /100
        </text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// ─── Main Widget ──────────────────────────────────────────────
export default function SecurityStatusWidget({ status }: SecurityStatusWidgetProps) {
  const navigate = useNavigate()

  const overallGood = status.mfaEnabled && status.activeSessions.length <= 3

  return (
    <section
      className="
        relative rounded-xl border border-slate-200/60
        bg-white/80 backdrop-blur-md p-5 flex flex-col gap-4 shadow-sm overflow-hidden
      "
      aria-labelledby="security-widget-title"
    >
      {/* ── Widget Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {overallGood ? (
            <ShieldCheck size={20} className="text-green-400" />
          ) : (
            <ShieldAlert size={20} className="text-amber-400" />
          )}
          <h2
            id="security-widget-title"
            className="text-slate-800 font-semibold text-sm"
          >
            Trạng thái Bảo mật
          </h2>
        </div>

        {/* Navigate to UC-20: Session Management */}
        <button
          onClick={() => navigate('/dashboard/system/auth')}
          className="
            flex items-center gap-1 text-xs text-indigo-400
            hover:text-indigo-300 transition-colors
          "
          aria-label="Quản lý phiên đăng nhập (UC-20)"
        >
          Quản lý
          <ChevronRight size={13} />
        </button>
      </div>

      {/* ── Score + MFA row ── */}
      <div className="flex items-start gap-4">
        <SecurityScoreRing score={status.securityScore} />

        <div className="flex-1 space-y-2">
          <MfaBadge enabled={status.mfaEnabled} />

          {/* Active sessions count */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 border border-slate-200/50">
            <Monitor size={14} className="text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-slate-700">Phiên đang hoạt động</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {status.activeSessions.length} thiết bị
              </p>
            </div>
            {status.activeSessions.length > 3 && (
              <AlertTriangle size={13} className="text-amber-400" />
            )}
          </div>
        </div>
      </div>

      {/* ── Active Sessions List (tối đa 3 gần nhất) ── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Thiết bị đăng nhập
        </p>
        <div className="space-y-1.5">
          {status.activeSessions.slice(0, 3).map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              isCurrent={session.isCurrent}
            />
          ))}

          {status.activeSessions.length > 3 && (
            <p className="text-xs text-center text-slate-500 py-1">
              +{status.activeSessions.length - 3} thiết bị khác
            </p>
          )}
        </div>
      </div>

      {/* ── CTA: Revoke suspicious sessions (UC-20) ── */}
      <button
        onClick={() => navigate('/dashboard/system/auth')}
        className="
          w-full py-2.5 rounded-lg text-xs font-semibold
          bg-[#1F3864] border border-[#162a4a] text-slate-900
          hover:bg-[#162a4a] hover:border-indigo-900
          active:scale-[0.98] transition-all duration-150
          flex items-center justify-center gap-2
        "
        aria-label="Đi tới trang quản lý phiên đăng nhập UC-20"
      >
        <ShieldCheck size={13} />
        Quản lý phiên & thiết bị
      </button>
    </section>
  )
}
