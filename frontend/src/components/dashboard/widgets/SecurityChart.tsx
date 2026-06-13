// ============================================================
// SECURITY CHART – Monthly Incident Bar Chart
// Pure SVG + CSS (không cần thư viện ngoài)
// Hai nhóm cột: Brute Force (Navy) & Auth Errors (Rose)
// ============================================================

import { TrendingDown, AlertTriangle } from 'lucide-react'
import { SECURITY_INCIDENTS } from '../../../pages/admin/mockData'

const CHART_H = 180   // chiều cao vùng vẽ cột (px)
const BAR_W = 10      // width mỗi cột đơn (px)
const BAR_GAP = 3     // gap giữa 2 cột cùng tháng (px)
const GROUP_GAP = 8   // gap giữa các nhóm tháng (px)

export default function SecurityChart() {
  const maxVal = Math.max(
    ...SECURITY_INCIDENTS.flatMap((d) => [d.bruteForce, d.authErrors])
  )

  // Trục Y: chia 4 mốc
  const yTicks = [0, 25, 50, 75, 100].filter((v) => v <= Math.ceil(maxVal / 10) * 10 + 5)

  const groupW = BAR_W * 2 + BAR_GAP
  const totalW = SECURITY_INCIDENTS.length * (groupW + GROUP_GAP) - GROUP_GAP

  const toY = (val: number) => CHART_H - (val / (maxVal * 1.1)) * CHART_H

  // Tổng năm
  const totalBrute = SECURITY_INCIDENTS.reduce((a, b) => a + b.bruteForce, 0)
  const totalAuth = SECURITY_INCIDENTS.reduce((a, b) => a + b.authErrors, 0)

  return (
    <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#1F3864]">Sự cố bảo mật theo tháng</h3>
          <p className="text-xs text-slate-500 mt-0.5">Năm 2026 · Brute Force & Lỗi xác thực</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <TrendingDown size={14} className="text-emerald-500" />
          <span>Xu hướng giảm T12</span>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 mb-5">
        <div className="flex items-center gap-2 bg-[#1F3864]/5 rounded-xl px-3 py-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#1F3864]" />
          <span className="text-xs text-slate-500">Brute Force</span>
          <span className="text-xs font-bold text-[#1F3864]">{totalBrute}</span>
        </div>
        <div className="flex items-center gap-2 bg-rose-50 rounded-xl px-3 py-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" />
          <span className="text-xs text-slate-500">Lỗi xác thực</span>
          <span className="text-xs font-bold text-rose-600">{totalAuth}</span>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
          <AlertTriangle size={12} />
          <span>Đỉnh T8 – {Math.max(...SECURITY_INCIDENTS.map(d => d.authErrors))} sự cố</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalW + 40} ${CHART_H + 36}`}
          className="w-full min-w-[540px]"
          preserveAspectRatio="none"
        >
          {/* Y grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const y = CHART_H * pct
            return (
              <line
                key={pct}
                x1={0}
                y1={y}
                x2={totalW + 40}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
            )
          })}

          {/* Bars */}
          {SECURITY_INCIDENTS.map((d, i) => {
            const gx = 20 + i * (groupW + GROUP_GAP)

            const bfH = Math.max(2, ((d.bruteForce) / (maxVal * 1.1)) * CHART_H)
            const aeH = Math.max(2, ((d.authErrors) / (maxVal * 1.1)) * CHART_H)

            const bfY = CHART_H - bfH
            const aeY = CHART_H - aeH

            return (
              <g key={d.month}>
                {/* Brute Force bar */}
                <rect
                  x={gx}
                  y={bfY}
                  width={BAR_W}
                  height={bfH}
                  rx={3}
                  fill="#1F3864"
                  opacity={0.85}
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <title>{`Brute Force T${d.month}: ${d.bruteForce}`}</title>
                </rect>
                {/* Auth Errors bar */}
                <rect
                  x={gx + BAR_W + BAR_GAP}
                  y={aeY}
                  width={BAR_W}
                  height={aeH}
                  rx={3}
                  fill="#fb7185"
                  opacity={0.85}
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <title>{`Auth Errors T${d.month}: ${d.authErrors}`}</title>
                </rect>
                {/* X label */}
                <text
                  x={gx + BAR_W + BAR_GAP / 2}
                  y={CHART_H + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={9}
                >
                  {d.month}
                </text>
              </g>
            )
          })}

          {/* Baseline */}
          <line
            x1={0}
            y1={CHART_H}
            x2={totalW + 40}
            y2={CHART_H}
            stroke="#e2e8f0"
            strokeWidth={1}
          />
        </svg>
      </div>
    </div>
  )
}
