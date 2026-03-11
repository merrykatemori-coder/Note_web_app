'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import {
  StickyNote,
  Wallet,
  ClipboardList,
  BadgeDollarSign,
  Settings,
  LogOut,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard/memo', label: 'Memo', icon: StickyNote },
  { href: '/dashboard/finance', label: 'Finance', icon: Wallet },
  { href: '/dashboard/workorder', label: 'Work', icon: ClipboardList },
  { href: '/dashboard/salary', label: 'Salary', icon: BadgeDollarSign },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [showLogout, setShowLogout] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen pb-20 bg-[var(--bg-primary)]">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-surface-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-brand-600">Workspace</h1>
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="p-2 rounded-xl hover:bg-surface-100 text-surface-500 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
        {showLogout && (
          <div className="absolute right-4 top-12 bg-white rounded-xl shadow-lg border border-surface-200 p-2 z-50 animate-fade-in">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full text-left"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-t border-surface-200 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'text-brand-600'
                    : 'text-surface-400 hover:text-surface-600'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
