
export type ServiceStatus = 'Operational' | 'Degraded' | 'Down'

export type Service = {
  id: number
  name: string
  category: string
  status: ServiceStatus
  uptimePercentage: number
  responseTimeMs: number
}

export type Incident = {
  id: number
  serviceId: number
  serviceName: string
  title: string
  description: string | null
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'Open' | 'Investigating' | 'Monitoring' | 'Resolved'
  createdAt: string
  resolvedAt: string | null
}

export type Permission = 'Administrator' | 'Viewer'

export type User = {
  id: number
  name: string
  surname: string
  email: string
  permission: Permission
  createdAt: string
}

export type Assignment = {
  id: number
  userId: number
  userName: string
  incidentId: number
  incidentTitle: string
  serviceName: string
  incidentStatus: Incident['status']
  assignedBy: string
  assignedAt: string
  unassignedAt: string | null
  isActive: boolean
}
