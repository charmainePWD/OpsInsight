import { useCallback, useEffect, useState } from 'react'
import type {
  AbandonmentRequest,
  Assignment,
  Incident,
  User,
} from '../types'
import { API_BASE_URL } from '../config/api'

const API = `${API_BASE_URL}/assignments`

async function readResponse(response: Response) {
  return response.json().catch(() => ({}))
}

export function useAssignments(enabled: boolean, _isAdmin = false) {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [abandonmentRequests, setAbandonmentRequests] = useState<
    AbandonmentRequest[]
  >([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [abandonmentLoading, setAbandonmentLoading] = useState(false)
  const [abandonmentError, setAbandonmentError] = useState<string | null>(
    null,
  )

  const load = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const [a, u, i] = await Promise.all([
        fetch(API, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/users`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/incidents`, { credentials: 'include' }),
      ])

      if (!a.ok || !u.ok || !i.ok) {
        throw new Error('Could not load assignment data.')
      }

      const [ad, ud, id] = await Promise.all([a.json(), u.json(), i.json()])

      setAssignments(ad as Assignment[])
      setUsers(ud as User[])
      setIncidents(id as Incident[])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load assignments.',
      )
    } finally {
      setLoading(false)
    }

    setAbandonmentLoading(true)
    setAbandonmentError(null)

    try {
      const response = await fetch(`${API}/abandonment-requests`, {
        credentials: 'include',
      })
      const result = await readResponse(response)

      if (!response.ok) {
        throw new Error(
          result.message ??
            `Could not load abandonment requests (${response.status}).`,
        )
      }
      setAbandonmentRequests(result as AbandonmentRequest[])
    } catch (err) {
      setAbandonmentError(
        err instanceof Error
          ? err.message
          : 'Could not load abandonment requests.',
      )
      setAbandonmentRequests([])
    } finally {
      setAbandonmentLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void load()
  }, [load])

  async function assignIncident(userId: number, incidentId: number) {
    const response = await fetch(API, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, incidentId }),
    })

    const result = await readResponse(response)

    if (!response.ok) {
      throw new Error(result.message ?? 'Could not assign incident.')
    }

    await load()
  }

  async function unassign(id: number) {
    const response = await fetch(`${API}/${id}/unassign`, {
      method: 'PATCH',
      credentials: 'include',
    })

    const result = await readResponse(response)

    if (!response.ok) {
      throw new Error(result.message ?? 'Could not close assignment.')
    }

    await load()
  }

  async function reviewAbandonmentRequest(
    requestId: number,
    action: 'approve' | 'reject',
    adminNote: string,
  ) {
    const response = await fetch(
      `${API}/abandonment-requests/${requestId}/${action}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNote: adminNote.trim() || null }),
      },
    )

    const result = await readResponse(response)

    if (!response.ok) {
      throw new Error(
        result.message ?? `Could not ${action} abandonment request.`,
      )
    }

    await load()
  }

  async function reassignAbandonmentRequest(
    requestId: number,
    newUserId: number,
    adminNote: string,
  ) {
    const response = await fetch(
      `${API}/abandonment-requests/${requestId}/reassign`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUserId,
          adminNote: adminNote.trim() || null,
        }),
      },
    )

    const result = await readResponse(response)

    if (!response.ok) {
      throw new Error(
        result.message ?? 'Could not reassign the incident.',
      )
    }

    await load()
  }

  return {
    assignments,
    users,
    incidents,
    abandonmentRequests,
    loading,
    error,
    abandonmentLoading,
    abandonmentError,
    assignIncident,
    unassign,
    reviewAbandonmentRequest,
    reassignAbandonmentRequest,
    reload: load,
  }
}
