import { create } from 'zustand'

import { changePasswordRequest, fetchMe, loginRequest, logoutAllRequest, logoutRequest } from './api'
import type { AuthUser } from './types'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AuthState = {
  user: AuthUser | null
  status: AuthStatus
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'loading',
  initialize: async () => {
    try {
      const payload = await fetchMe()
      set({ user: payload.user, status: 'authenticated' })
    } catch {
      set({ user: null, status: 'unauthenticated' })
    }
  },
  login: async (email: string, password: string) => {
    const session = await loginRequest(email, password)
    set({ user: session.user, status: 'authenticated' })
  },
  logout: async () => {
    if (get().status === 'authenticated') {
      try {
        await logoutRequest()
      } catch {
        // Ignore logout request failures and still clear local session state.
      }
    }
    set({ user: null, status: 'unauthenticated' })
  },
  logoutAll: async () => {
    if (get().status === 'authenticated') {
      await logoutAllRequest()
    }
    set({ user: null, status: 'unauthenticated' })
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    await changePasswordRequest(currentPassword, newPassword)
    set({ user: null, status: 'unauthenticated' })
  },
  clearSession: () => set({ user: null, status: 'unauthenticated' }),
}))
