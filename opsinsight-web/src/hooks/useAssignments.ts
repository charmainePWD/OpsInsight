
import { useCallback, useEffect, useState } from 'react'
import type { Assignment, Incident, User } from '../types'

const API = 'http://localhost:5092/api'

export function useAssignments(enabled: boolean) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const [assignmentResponse, userResponse, incidentResponse] =
        await Promise.all([
          fetch(`${API}/assignments`, { credentials: 'include' }),
          fetch(`${API}/users`, { credentials: 'include' }),
          fetch(`${API}/incidents`, { credentials: 'include' }),
        ])

      if (!assignmentResponse.ok) throw new Error('Could not load assignments.')
      if (!userResponse.ok) throw new Error('Could not load users.')
      if (!incidentResponse.ok) throw new Error('Could not load incidents.')

      const [assignmentData, userData, incidentData] = await Promise.all([
        assignmentResponse.json(),
        userResponse.json(),
        incidentResponse.json(),
      ])

      setAssignments(assignmentData as Assignment[])
      setUsers(userData as User[])
      setIncidents(incidentData as Incident[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load assignments.')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void load()
  }, [load])

  async function assignIncident(userId: number, incidentId: number) {
    const response = await fetch(`${API}/assignments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, incidentId }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.message ?? 'Could not assign incident.')
    }

    await load()
  }

  async function unassign(id: number) {
    const response = await fetch(`${API}/assignments/${id}/unassign`, {
      method: 'PATCH',
      credentials: 'include',
    })

    if (!response.ok) throw new Error('Could not close assignment.')
    await load()
  }

  return {
    assignments,
    users,
    incidents,
    loading,
    error,
    assignIncident,
    unassign,
    reload: load,
  }
}
