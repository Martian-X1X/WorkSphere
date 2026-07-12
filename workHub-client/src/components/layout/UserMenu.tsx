import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, ChevronDown, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth.service'
import { getRoleColor, cn } from '@/utils'

export function UserMenu() {
  const navigate = useNavigate()
  const { user, logout, isAdminOrOwner } = useAuthStore()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setOpen(false)
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await authService.revoke(refreshToken)
      } catch { /* ignore */ }
    }
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
          'text-surface-300 hover:text-surface-100 hover:bg-surface-800',
          'transition-colors border border-transparent',
          open && 'bg-surface-800 border-surface-700'
        )}
      >
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full bg-primary-700 flex items-center
                        justify-center flex-shrink-0">
          <span className="text-white text-xs font-semibold">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </span>
        </div>

        <span className="hidden sm:block max-w-[120px] truncate font-medium">
          {user.firstName}
        </span>

        <ChevronDown className={cn(
          'w-3.5 h-3.5 text-surface-500 transition-transform',
          open && 'rotate-180'
        )} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-surface-800
                        border border-surface-700 rounded-xl shadow-xl
                        shadow-black/30 z-50 overflow-hidden animate-fade-in">

          {/* User info header */}
          <div className="px-4 py-3 border-b border-surface-700">
            <p className="text-sm font-medium text-surface-100 truncate">
              {user.fullName}
            </p>
            <p className="text-xs text-surface-500 truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Shield className="w-3 h-3 text-surface-500" />
              <span className={cn('text-xs font-medium', getRoleColor(user.role))}>
                {user.role}
              </span>
              <span className="text-surface-600 text-xs">·</span>
              <span className="text-xs text-surface-500 truncate">
                {user.organizationName}
              </span>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1.5">
            <button
              onClick={() => { setOpen(false); navigate('/profile') }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                         text-surface-300 hover:text-surface-100 hover:bg-surface-700
                         rounded-lg transition-colors text-left"
            >
              <User className="w-4 h-4 text-surface-500" />
              Your profile
            </button>

            {isAdminOrOwner() && (
              <button
                onClick={() => { setOpen(false); navigate('/settings') }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                           text-surface-300 hover:text-surface-100 hover:bg-surface-700
                           rounded-lg transition-colors text-left"
              >
                <Shield className="w-4 h-4 text-surface-500" />
                Organization settings
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="p-1.5 border-t border-surface-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                         text-red-400 hover:text-red-300 hover:bg-red-900/20
                         rounded-lg transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}