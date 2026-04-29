import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Home, ClipboardList, History, LogOut, User } from 'lucide-react'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const username = localStorage.getItem('username') || '用户'

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/diagnosis', label: '开始自检', icon: ClipboardList },
    { path: '/history', label: '历史记录', icon: History },
  ]

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    navigate('/login')
  }

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">流感哨兵</h1>
              <p className="text-xs text-slate-500">甲流智能自检</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}

            {/* 用户信息 + 退出 */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-200">
              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{username}</span>
              </div>
              <button
                onClick={handleLogout}
                title="退出登录"
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">退出</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header


