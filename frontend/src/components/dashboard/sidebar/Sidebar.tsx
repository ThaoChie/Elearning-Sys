// ============================================================
// SIDEBAR COMPONENT
// Dynamic navigation render theo Role với collapsible support
// ============================================================

import { NavLink, useLocation } from 'react-router-dom'
import { LogOut, ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import type { DashboardUser, NavItem } from '../../../types/dashboard'
import { SUBSYSTEM_ICONS } from './navConfig'

interface SidebarProps {
  user: DashboardUser
  navItems: NavItem[]
  onLogout: () => void
}

const ROLE_COLOR: Record<string, string> = {
  Admin: 'text-rose-600 bg-rose-50 border-rose-200',
  Instructor: 'text-amber-600 bg-amber-50 border-amber-200',
  Student: 'text-emerald-600 bg-emerald-50 border-emerald-200',
}

const ROLE_LABEL: Record<string, string> = {
  Admin: 'Quản trị viên',
  Instructor: 'Giảng viên',
  Student: 'Học viên',
}

export default function Sidebar({ user, navItems, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <aside
      className={`
        relative flex flex-col h-full
        bg-white/70 backdrop-blur-xl
        border-r border-slate-200/50
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-200/50">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
          <LayoutDashboard size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-slate-800 font-bold text-sm truncate leading-tight">LMS System</p>
            <p className="text-slate-500 text-xs truncate">Unified Dashboard</p>
          </div>
        )}
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors"
        aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu nhỏ sidebar'}
      >
        {collapsed ? (
          <ChevronRight size={12} className="text-slate-600" />
        ) : (
          <ChevronLeft size={12} className="text-slate-600" />
        )}
      </button>

      {/* ── User Info ── */}
      <div className={`px-3 py-4 border-b border-slate-200/50 ${collapsed ? 'items-center' : ''} flex flex-col gap-2`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-slate-800 text-sm font-bold truncate">{user.name}</p>
              <p className="text-slate-500 text-xs truncate">{user.email}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_COLOR[user.role]}`}>
            {ROLE_LABEL[user.role]}
          </span>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300">
        {navItems.map((item) => {
          const Icon = SUBSYSTEM_ICONS[item.icon]
          const isActive = location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.key}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`
                group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 relative
                ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
              )}

              <Icon
                size={18}
                className={`flex-shrink-0 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-600'}`}
              />

              {!collapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}

              {!collapsed && item.badge && item.badge > 0 && (
                <span className="flex-shrink-0 min-w-[20px] h-5 px-1 rounded-full bg-blue-500 text-slate-900 text-xs flex items-center justify-center font-medium">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Logout ── */}
      <div className="px-2 py-3 border-t border-slate-200/50">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all duration-150"
          title={collapsed ? 'Đăng xuất' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}
