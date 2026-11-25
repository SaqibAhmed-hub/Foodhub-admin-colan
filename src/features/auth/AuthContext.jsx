import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError, setToken, setUnauthorizedHandler } from '../../shared/api/client'
import { authApi } from './authApi'

const KEY = 'foodhub.admin.session'

// Browser storage can be missing or blocked (private windows), so every access is guarded.
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!s?.token || s.expiresAt < Date.now() || s.user?.role !== 'ADMIN') return null
    return s
  } catch {
    return null
  }
}

function save(session) {
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session))
    else localStorage.removeItem(KEY)
  } catch { /* ignore */ }
}

// Restore the session before the first render so the first API calls already carry the token.
const initialSession = load()
setToken(initialSession?.token ?? null)

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(initialSession)

  const logout = useCallback(() => {
    setToken(null)
    save(null)
    setSession(null)
  }, [])

  // Any 401 from the backend (expired token) signs the admin out.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const requestOtp = useCallback((email) => authApi.requestOtp(email), [])

  /** Only ADMIN accounts may use this dashboard. Anyone else is rejected and nothing is stored. */
  const login = useCallback(async (email, otp) => {
    const res = await authApi.verifyOtp(email, otp)
    if (res.role !== 'ADMIN') {
      throw new ApiError(403, 'NOT_ADMIN', 'This dashboard is for administrators only.')
    }
    const next = {
      token: res.accessToken,
      expiresAt: Date.now() + res.expiresInSeconds * 1000,
      user: { id: res.employeeId, name: res.name, role: res.role },
    }
    setToken(next.token)
    save(next)
    setSession(next)
  }, [])

  const value = useMemo(
    () => ({ user: session?.user ?? null, requestOtp, login, logout }),
    [session, requestOtp, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
