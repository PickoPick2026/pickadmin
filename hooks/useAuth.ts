'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'

type Session = {
  id: string
  userID: string
  username: string

  name:string
  companyID:string
  companyName:string

  role: string
  loggedIn: boolean
}

export function useAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const sessionData = getSession()

    if (!sessionData?.loggedIn) {
      router.replace('/')
      return
    }

    setSession(sessionData)
    setLoading(false)
  }, [router])

  const logout = () => {
    localStorage.removeItem('session')
    setSession(null)
    router.push('/')
  }

  return {
    loading,
    session,
    role: session?.role ?? null,
    isLoggedIn: !!session?.loggedIn,
    logout
  }
}
