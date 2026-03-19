'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  image?: string | null
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, isLoading: false }),
    }),
    {
      name: 'overcms-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
)
