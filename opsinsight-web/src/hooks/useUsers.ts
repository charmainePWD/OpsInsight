
import { useCallback, useEffect, useState } from 'react'
import type { Permission, User } from '../types'

const API = 'http://localhost:5092/api/users'

export function useUsers(enabled: boolean) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(API, { credentials: 'include' })
      if (!response.ok) throw new Error('Could not load users.')
      setUsers(await response.json() as User[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  async function addUser(input: {
    name: string
    surname: string
    email: string
    password: string
    permission: Permission
  }) {
    const response = await fetch(API, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result.message ?? 'Could not add user.')

    await loadUsers()
  }

  async function updatePermission(id: number, permission: Permission) {
    const response = await fetch(`${API}/${id}/permission`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.message ?? 'Could not update permission.')
    }

    await loadUsers()
  }

  return { users, loading, error, loadUsers, addUser, updatePermission }
}
