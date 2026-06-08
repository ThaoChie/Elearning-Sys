import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect gốc → login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        {/* Placeholder dashboard (sẽ implement sau) */}
        <Route
          path="/dashboard"
          element={
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-[#1F3864] mb-2">Dashboard</h1>
                <p className="text-gray-500">Đăng nhập thành công 🎉</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
