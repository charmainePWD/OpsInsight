export type ServiceStatus = 'Operational' | 'Degraded' | 'Down'

export type Service = {
  id: number
  name: string
  category: string
  status: ServiceStatus
  uptimePercentage: number
  responseTimeMs: number
}

export type IncidentStatus =
  | 'Open'
  | 'Investigating'
  | 'Monitoring'
  | 'Resolved'

export type Incident = {
  id: number
  serviceId: number
  serviceName: string
  title: string
  description: string | null
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  status: IncidentStatus
  createdAt: string
  resolvedAt: string | null

  // Current assignment information
  assignmentId: number | null
  assignedUserId: number | null
  assignedTo: string | null
  assignedBy: string | null
  assignedAt: string | null
  assignmentStatus: string | null
  isAssignedToCurrentUser: boolean
}

export type Permission = 'Administrator' | 'Contributor'

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
  incidentStatus: IncidentStatus
  assignedBy: string
  assignedAt: string
  unassignedAt: string | null
  isActive: boolean
}