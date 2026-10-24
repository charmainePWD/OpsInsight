
import { useCallback, useEffect, useState } from 'react'
import type { User } from '../types'

const API = 'http://localhost:5092/api/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch(`${API}/me`, {
        credentials: 'include',
      })

      if (!response.ok) {
        setUser(null)
        return
      }

      setUser(await response.json() as User)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  async function checkEmail(email: string): Promise<boolean> {
    const response = await fetch(`${API}/check-email`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      throw new Error('Could not check that email. Please try again.')
    }

    const result = await response.json() as { exists: boolean }
    return result.exists
  }

  async function login(email: string, password: string) {
    const response = await fetch(`${API}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message ?? 'Login failed.')
    }

    setUser(result as User)
  }

  async function logout() {
    const response = await fetch(`${API}/logout`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Could not sign out.')
    }

    setUser(null)
  }

  return {
    user,
    loading,
    checkEmail,
    login,
    logout,
    refreshUser,
  }
}
