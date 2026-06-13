import React, { useState } from 'react';

// --- Định nghĩa kiểu dữ liệu ---
type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

type SidebarProps = {
  activeItem?: string;
  onNavigate?: (id: string) => void;
};

// --- Icon SVG components (inline để không cần thư viện icon) ---
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
    </svg>
  ),
  Courses: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Assignments: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  Exams: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Gradebook: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Chevron: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Shield: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

// --- Navigation items data ---
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',     icon: <Icons.Dashboard /> },
  { id: 'courses',      label: 'My Courses',    icon: <Icons.Courses />,    badge: 4 },
  { id: 'assignments',  label: 'Assignments',   icon: <Icons.Assignments />, badge: 12 },
  { id: 'exams',        label: 'Exams',          icon: <Icons.Exams /> },
  { id: 'gradebook',   label: 'Gradebook',     icon: <Icons.Gradebook /> },
  { id: 'settings',    label: 'Settings',      icon: <Icons.Settings /> },
];

// ============================================================
// SIDEBAR COMPONENT
// ============================================================
const Sidebar: React.FC<SidebarProps> = ({
  activeItem = 'dashboard',
  onNavigate,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        relative flex flex-col h-screen bg-white border-r border-slate-100
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
      `}
    >
      {/* --- Logo & Brand --- */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        {/* Shield icon thể hiện hệ thống bảo mật */}
        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-200">
          <Icons.Shield />
          {/* Security Control: Biểu tượng khiên thể hiện RBAC - chỉ Instructor mới thấy menu này */}
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-800 whitespace-nowrap tracking-tight">EduSecure</p>
            <p className="text-[10px] text-indigo-500 font-medium whitespace-nowrap uppercase tracking-wider">Instructor Portal</p>
          </div>
        )}
      </div>

      {/* --- Navigation --- */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Label nhóm */}
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Main Menu
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeItem;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150 group relative
                ${isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
              )}

              {/* Icon */}
              <span className={`flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {item.icon}
              </span>

              {/* Label */}
              {!collapsed && (
                <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
              )}

              {/* Badge */}
              {!collapsed && item.badge !== undefined && (
                <span className={`
                  text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}
                `}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* --- Instructor Info Card --- */}
      {!collapsed && (
        <div className="mx-3 mb-4 p-3 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              NT
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 truncate">Nguyễn Thành</p>
              {/* Security: Role được lấy từ JWT Claims, hiển thị để nhắc nhở phân quyền */}
              <p className="text-[10px] text-indigo-500 font-medium">Role: Instructor</p>
            </div>
          </div>
        </div>
      )}

      {/* --- Collapse Toggle Button --- */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="
          absolute -right-3 top-16 w-6 h-6 bg-white border border-slate-200
          rounded-full flex items-center justify-center
          text-slate-400 hover:text-indigo-600 hover:border-indigo-300
          transition-all shadow-sm z-10
        "
      >
        <span className={`transition-transform duration-300 ${collapsed ? 'rotate-0' : 'rotate-180'}`}>
          <Icons.Chevron />
        </span>
      </button>
    </aside>
  );
};

export default Sidebar;
