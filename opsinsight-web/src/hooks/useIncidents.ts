import { useCallback, useEffect, useState } from 'react'
import type { Incident, IncidentStatus } from '../types'
import { API_BASE_URL } from '../config/api'

const API_URL = `${API_BASE_URL}/incidents`
const ASSIGNMENTS_URL = `${API_BASE_URL}/assignments`

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadIncidents = useCallback(async () => {
    try {
      const response = await fetch(API_URL, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to load incidents: ${response.status}`)
      }

      const data: Incident[] = await response.json()

      setIncidents(data)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load incidents.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadIncidents()
  }, [loadIncidents])

  const updateIncidentStatus = useCallback(
    async (id: number, status: IncidentStatus) => {
      const response = await fetch(`${API_URL}/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ?? `Failed to update incident: ${response.status}`,
        )
      }

      await loadIncidents()
    },
    [loadIncidents],
  )

  const submitAbandonmentRequest = useCallback(
    async (assignmentId: number, reason: string) => {
      const response = await fetch(
        `${ASSIGNMENTS_URL}/${assignmentId}/abandonment-requests`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        },
      )

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ?? 'Could not submit the abandonment request.',
        )
      }

      await loadIncidents()
    },
    [loadIncidents],
  )

  return {
    incidents,
    loading,
    error,
    updateIncidentStatus,
    submitAbandonmentRequest,
    reloadIncidents: loadIncidents,
  }
}