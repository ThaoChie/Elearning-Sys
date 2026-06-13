import { useState } from 'react'
import { Users, Search, MoreVertical, Lock, Unlock, Edit, ShieldAlert, X } from 'lucide-react'

interface UserItem {
  id: string
  fullName: string
  email: string
  role: 'Admin' | 'Instructor' | 'Student'
  status: 'Active' | 'Locked'
  createdAt: string
}

const mockUsers: UserItem[] = [
  { id: 'usr-001', fullName: 'Nguyen Van A', email: 'nva@truong.edu.vn', role: 'Student', status: 'Active', createdAt: '10/06/2026' },
  { id: 'usr-002', fullName: 'Le Thi B', email: 'ltb@truong.edu.vn', role: 'Instructor', status: 'Active', createdAt: '09/06/2026' },
  { id: 'usr-003', fullName: 'Tran Van C', email: 'tvc@truong.edu.vn', role: 'Student', status: 'Locked', createdAt: '08/06/2026' },
]

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>(mockUsers)
  const [search, setSearch] = useState('')
  const [showLockModal, setShowLockModal] = useState<UserItem | null>(null)
  
  // User Form Modal State
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [formData, setFormData] = useState({ fullName: '', email: '', role: 'Student' as const })

  const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  const handleToggleLock = (user: UserItem) => {
    const newStatus = user.status === 'Active' ? 'Locked' : 'Active'
    setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u))
    setShowLockModal(null)
  }

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData({ fullName: '', email: '', role: 'Student' })
    setShowUserForm(true)
  }

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user)
    setFormData({ fullName: user.fullName, email: user.email, role: user.role })
    setShowUserForm(true)
  }

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u))
    } else {
      const newUser: UserItem = {
        id: `usr-${Date.now()}`,
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
        status: 'Active',
        createdAt: new Date().toLocaleDateString('vi-VN')
      }
      setUsers([newUser, ...users])
    }
    setShowUserForm(false)
  }

  const roleColors = {
    Admin: 'bg-purple-100 text-purple-700',
    Instructor: 'bg-blue-100 text-blue-700',
    Student: 'bg-green-100 text-green-700'
  }

  return (
    <div className="min-h-full space-y-6">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#1F3864] flex items-center justify-center shadow-sm">
              <Users size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-[#1F3864] tracking-tight">
              Quản lý Người dùng
            </h1>
          </div>
          <p className="text-xs text-slate-500 ml-10.5">
            Danh sách tài khoản, phân quyền và trạng thái
          </p>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên, email..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-[#2E75B6] hover:bg-[#1F3864] text-slate-900 text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          + Thêm người dùng
        </button>
      </div>

      {/* ── Data Grid ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F8F9FA] text-slate-500 font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Họ và tên</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Vai trò</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Ngày tạo</th>
              <th className="px-6 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4 font-medium text-slate-800">{u.fullName}</td>
                <td className="px-6 py-4 text-slate-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-full ${roleColors[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {u.status === 'Active' ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#375623]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#375623]" />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#C00000]">
                      <Lock size={12} />
                      Bị khóa
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs">{u.createdAt}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 text-slate-500 hover:text-[#2E75B6] hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => setShowLockModal(u)}
                      className="p-1.5 text-slate-500 hover:text-[#C00000] hover:bg-red-50 rounded-lg transition-colors"
                      title={u.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa'}
                    >
                      {u.status === 'Active' ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">Không tìm thấy kết quả phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal Create/Edit User ──────────────────────────── */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[500px] shadow-2xl overflow-hidden animate-[fadeIn_0.2s_ease]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-[#2E75B6]" />
                {editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
              </h3>
              <button onClick={() => setShowUserForm(false)} className="text-slate-500 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] outline-none"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] outline-none disabled:bg-slate-50"
                  value={formData.email}
                  disabled={!!editingUser}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="email@truong.edu.vn"
                />
              </div>
              
              {!editingUser && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo <span className="text-red-500">*</span></label>
                  <input 
                    type="password" 
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-[#2E75B6] focus:ring-1 focus:ring-[#2E75B6] outline-none"
                    placeholder="Nhập mật khẩu cho tài khoản"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Hệ thống sẽ yêu cầu người dùng đổi mật khẩu ở lần đăng nhập đầu tiên.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò hệ thống <span className="text-red-500">*</span></label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-[#2E75B6] outline-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as any})}
                >
                  <option value="Student">Sinh viên</option>
                  <option value="Instructor">Giảng viên</option>
                  <option value="Admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-slate-900 bg-[#2E75B6] hover:bg-[#1F3864] rounded-lg transition-colors shadow-sm"
                >
                  {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Confirm Action ────────────────────────────── */}
      {showLockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[400px] shadow-2xl p-6 overflow-hidden relative">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${showLockModal.status === 'Active' ? 'bg-[#FCE4D6]' : 'bg-[#E2EFDA]'}`}>
                {showLockModal.status === 'Active' ? <Lock className="text-[#C00000]" size={24} /> : <Unlock className="text-[#375623]" size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {showLockModal.status === 'Active' ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
                </h3>
                <p className="text-sm text-slate-500">{showLockModal.email}</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              {showLockModal.status === 'Active' 
                ? 'Tài khoản này sẽ bị đưa vào trạng thái khóa. Tất cả các phiên đăng nhập hiện tại sẽ bị thu hồi và họ không thể đăng nhập lại.'
                : 'Tài khoản này sẽ được khôi phục quyền truy cập vào hệ thống LMS.'}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowLockModal(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => handleToggleLock(showLockModal)}
                className={`px-4 py-2 text-sm font-semibold text-slate-900 rounded-lg transition-colors shadow-sm ${showLockModal.status === 'Active' ? 'bg-[#C00000] hover:bg-[#a80000]' : 'bg-[#375623] hover:bg-[#2e471d]'}`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
