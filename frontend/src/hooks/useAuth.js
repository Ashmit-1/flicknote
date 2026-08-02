import { useCallback, useEffect, useState } from 'react'

import { authApi } from '../api'
import { clearAuth, getAuth, setAuth } from '../db'

export function useAuth() {
  const [auth, setAuthState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getAuth().then((saved) => {
      if (active) {
        setAuthState(saved)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const persist = useCallback(async (next) => {
    await setAuth(next)
    setAuthState(next)
  }, [])

  const login = useCallback(
    async (username, password) => {
      setError(null)
      try {
        const res = await authApi.login(username, password)
        await persist({ token: res.token, username: res.username })
      } catch (e) {
        setError(e.message)
        throw e
      }
    },
    [persist],
  )

  const register = useCallback(
    async (username, password) => {
      setError(null)
      try {
        const res = await authApi.register(username, password)
        await persist({ token: res.token, username: res.username })
      } catch (e) {
        setError(e.message)
        throw e
      }
    },
    [persist],
  )

  const logout = useCallback(async () => {
    await clearAuth()
    setAuthState(null)
  }, [])

  return { auth, loading, error, login, register, logout }
}
