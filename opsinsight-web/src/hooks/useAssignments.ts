
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

export function useAssignments(enabled: boolean, isAdmin = false) {
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

    // Load assignments, users and incidents independently of
    // the administrator's abandonment review requests.
    setLoading(true)
    setError(null)

    try {
      const [assignmentResponse, userResponse, incidentResponse] =
        await Promise.all([
          fetch(API, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/users`, { credentials: 'include' }),
          fetch(`${API_BASE_URL}/incidents`, { credentials: 'include' }),
        ])

      if (!assignmentResponse.ok) {
        throw new Error('Could not load assignments.')
      }

      if (!userResponse.ok) {
        throw new Error('Could not load users.')
      }

      if (!incidentResponse.ok) {
        throw new Error('Could not load incidents.')
      }

      const [assignmentData, userData, incidentData] = await Promise.all([
        assignmentResponse.json(),
        userResponse.json(),
        incidentResponse.json(),
      ])

      setAssignments(assignmentData as Assignment[])
      setUsers(userData as User[])
      setIncidents(incidentData as Incident[])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load assignments.',
      )
    } finally {
      setLoading(false)
    }

    // Only administrators need the separate review request list.
    // A failure here must not block the assignment tables.
    if (isAdmin) {
      setAbandonmentLoading(true)
      setAbandonmentError(null)

      try {
        const response = await fetch(`${API}/abandonment-requests`, {
          credentials: 'include',
        })

        if (!response.ok) {
          const result = await readResponse(response)

          throw new Error(
            result.message ??
              `Could not load abandonment requests (${response.status}).`,
          )
        }

        const data = await response.json()
        setAbandonmentRequests(data as AbandonmentRequest[])
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
    } else {
      setAbandonmentRequests([])
      setAbandonmentError(null)
      setAbandonmentLoading(false)
    }
  }, [enabled, isAdmin])

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

    if (!response.ok) {
      throw new Error('Could not close assignment.')
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
        body: JSON.stringify({
          adminNote: adminNote.trim() || null,
        }),
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
