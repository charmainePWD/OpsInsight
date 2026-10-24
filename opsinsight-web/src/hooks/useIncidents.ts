
import { useCallback, useEffect, useState } from 'react'
import type { Incident } from '../types'

const API_URL = 'http://localhost:5092/api/incidents'

type IncidentStatus = Incident['status']

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadIncidents = useCallback(async () => {
    try {
      const response = await fetch(API_URL)

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update incident: ${response.status}`)
      }

      const updated: Pick<Incident, 'id' | 'status' | 'resolvedAt'> =
        await response.json()

      setIncidents((current) =>
        current.map((incident) =>
          incident.id === updated.id
            ? {
                ...incident,
                status: updated.status,
                resolvedAt: updated.resolvedAt,
              }
            : incident,
        ),
      )
    },
    [],
  )

  return {
    incidents,
    loading,
    error,
    updateIncidentStatus,
    reloadIncidents: loadIncidents,
  }
}
