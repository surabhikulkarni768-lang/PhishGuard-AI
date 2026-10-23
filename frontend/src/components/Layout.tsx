import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  Shield, LayoutDashboard, Mail, Search, Clock,
  BookOpen, Settings, ChevronRight
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analyze', icon: Mail, label: 'Analyze Email' },
  { to: '/forensics', icon: Search, label: 'Forensics' },
  { to: '/history', icon: Clock, label: 'History' },
  { to: '/awareness', icon: BookOpen, label: 'Awareness' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1e]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-[#0d1530] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight">PhishGuard AI</div>
              <div className="text-gray-500 text-xs">Threat Detection</div>
            </div>
          </NavLink>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive || (to === '/forensics' && location.pathname.startsWith('/forensics'))
                  ? 'nav-item-active'
                  : 'nav-item'
              }
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {(location.pathname === to || (to === '/forensics' && location.pathname.startsWith('/forensics'))) && (
                <ChevronRight size={14} className="text-blue-400" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="text-xs text-gray-600 text-center">
            PhishGuard AI v1.0 — Demo Mode
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0a0f1e]">
        <Outlet />
      </main>
    </div>
  )
}
