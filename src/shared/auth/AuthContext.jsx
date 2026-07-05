/**
 * AuthContext.jsx — Session hydration + auth state for Kolortec storefront.
 *
 * Strategy:
 *  - On mount, calls GET /public/me (via getSession) to hydrate from the httpOnly
 *    session cookie. This covers both OTP and Google OAuth flows because the cookie
 *    is set by the API before the storefront renders.
 *  - `loading` is true only during the initial hydration; it never blocks rendering.
 *  - After OTP verify, callers can call `setUser(data.user)` directly for instant UX
 *    without waiting for a /me round-trip.
 *  - `logout` calls POST /public/logout then clears local user state.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getSession, logout as apiLogout } from '../services/contentService'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * refreshSession — calls /public/me and updates user state.
   * Errors are swallowed; result is null on failure.
   */
  const refreshSession = useCallback(async () => {
    try {
      const data = await getSession()
      setUser(data ?? null)
    } catch {
      setUser(null)
    }
  }, [])

  /**
   * logout — invalidates the server session cookie and clears local state.
   */
  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  // Hydrate on mount — one call per page load.
  useEffect(() => {
    // Clean up the #auth_payload hash that Google OAuth may leave in the URL,
    // without parsing it (hydration comes from /me).
    if (window.location.hash.startsWith('#auth_payload')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }

    refreshSession().finally(() => setLoading(false))
  }, [refreshSession])

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAuth() — access auth state and methods anywhere inside <AuthProvider>.
 * Returns { user, loading, setUser, refreshSession, logout }.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
