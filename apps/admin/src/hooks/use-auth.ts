'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore, type AuthUser } from '@/store/auth'

interface MeResponse {
  user: AuthUser
}

export function useAuth({ required = false } = {}) {
  const { user, setUser } = useAuthStore()
  const router = useRouter()

  const { data, status } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get<MeResponse>('/api/auth/me'),
    retry: false,
    staleTime: 60_000,
    // nie fetchwuj jeśli użytkownik jest już w storze (persist)
    enabled: true,
  })

  useEffect(() => {
    // czekaj dopóki zapytanie nie jest rozstrzygnięte
    if (status === 'pending') return

    if (status === 'success' && data?.user) {
      setUser(data.user)
    } else {
      // error lub success bez usera — wyczyść stan
      setUser(null)
      if (required) {
        router.replace('/auth/login')
      }
    }
  }, [data, status, required, router, setUser])

  const isLoading = status === 'pending'
  return { user, isLoading }
}
