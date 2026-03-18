'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from './useAuth'

export type UserRole = 'admin' | 'staff'

export function useRole() {
  const { user, loading: authLoading } = useAuth()
  const [role, setRole] = useState<UserRole>('staff')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }
    const fetchRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      if (data) setRole(data.role as UserRole)
      setLoading(false)
    }
    fetchRole()
  }, [user, authLoading])

  return { role, isAdmin: role === 'admin', loading: loading || authLoading, user }
}
