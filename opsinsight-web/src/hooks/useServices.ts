import { useCallback, useEffect, useState } from 'react'
import type { Service } from '../types'

const API_URL = 'http://localhost:5092/api/services'

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadServices = useCallback(async () => {
    try {
      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error(`Failed to load services: ${response.status}`)
      }

      const data: Service[] = await response.json()
      setServices(data)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load services.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  return {
    services,
    loading,
    error,
    reloadServices: loadServices,
  }
}
