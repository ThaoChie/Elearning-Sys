import React, { useState } from 'react';
import { NotificationDropdown } from '../components/notifications/NotificationDropdown';
import Sidebar from '../components/instructor/dashboard/Sidebar';
import DashboardStats from '../components/instructor/dashboard/DashboardStats';
import ScoreChart from '../components/instructor/dashboard/ScoreChart';
import RecentActivities from '../components/instructor/dashboard/RecentActivities';
import AssignmentTable from '../components/instructor/dashboard/AssignmentTable';

// ============================================================
// INSTRUCTOR DASHBOARD PAGE
// Trang chính của Instructor Portal.
// RBAC: Chỉ được truy cập bởi user có Role = "Instructor" (JWT Claim).
// Toàn bộ dữ liệu hiển thị được scope theo InstructorID từ JWT Claims (chống IDOR).
// ============================================================
const InstructorDashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      {/* ===== SIDEBAR ===== */}
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} />

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ===== HEADER ===== */}
        <header className="flex-shrink-0 bg-white/70 backdrop-blur-md border-b border-white/50 px-6 py-3.5">
          <div className="flex items-center justify-between gap-4">

            {/* Page title */}
            <div>
              <h1 className="text-base font-bold text-slate-800">
                {{ dashboard: 'Dashboard', courses: 'My Courses', assignments: 'Assignments',
                   exams: 'Exams', gradebook: 'Gradebook', settings: 'Settings' }[activeNav] ?? 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-500">
                Chào buổi sáng, GV. Nguyễn Thành · Thứ Hai, 09/06/2026
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Tìm kiếm sinh viên, bài tập..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300
                    w-64 transition-all placeholder:text-slate-500"
                />
              </div>

              {/* Notifications */}
              <NotificationDropdown />

              {/* Divider */}
              <div className="h-6 w-px bg-slate-100" />

              {/* Avatar & Instructor info */}
              <div className="flex items-center gap-2.5 cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-slate-900 text-xs font-bold">
                  NT
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-700 leading-tight">Nguyễn Thành</p>
                  {/* Security: Role từ JWT Claims - hiển thị để nhắc nhở phân quyền RBAC */}
                  <p className="text-[10px] text-indigo-500 font-medium">Instructor</p>
                </div>
                <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* ===== SCROLLABLE BODY ===== */}
        <main className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Row 1: Stats Cards (3 cards) */}
          <DashboardStats />

          {/* Row 2: Chart (Left 60%) + Recent Activities (Right 40%) */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Biểu đồ phân phối điểm (chiếm 3/5 width) */}
            <div className="lg:col-span-3" style={{ minHeight: '340px' }}>
              <ScoreChart />
            </div>
            {/* Recent Activities (chiếm 2/5 width) */}
            <div className="lg:col-span-2" style={{ minHeight: '340px' }}>
              <RecentActivities />
            </div>
          </div>

          {/* Row 3: Assignment Table */}
          <AssignmentTable />

          {/* Footer padding */}
          <div className="h-4" />
        </main>
      </div>


    </div>
  );
};

export default InstructorDashboard;
