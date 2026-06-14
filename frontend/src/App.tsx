import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import Login from './pages/Login'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardShell from './components/dashboard/DashboardShell'
import ExamRoom from './pages/ExamRoom'
import ExamResult from './pages/ExamResult'
import type { DashboardUser } from './types/dashboard'

function App() {
  // Read current user from JWT token
  const [user, setUser] = useState<DashboardUser | null>(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return {
        id: payload.sub || 'unknown',
        email: payload.email || '',
        name: payload.email?.split('@')[0] || 'Người dùng',
        role: payload.role || 'Student'
      }
    } catch {
      return null
    }
  })

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect gốc → login */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={<Login onLoginSuccess={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        
        {/* Top-level Protected Routes (Full screen, no sidebar) */}
        <Route 
          path="/exam/result" 
          element={user ? <ExamResult /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/exam/:sessionId" 
          element={user ? <ExamRoom /> : <Navigate to="/login" replace />} 
        />
        
        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard/*"
          element={
            user ? (
              <DashboardShell user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>


    </BrowserRouter>
  )
}

export default App
