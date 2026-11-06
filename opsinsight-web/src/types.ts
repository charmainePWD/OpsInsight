export type ServiceStatus = 'Operational' | 'Degraded' | 'Down'

export type Service = {
  id: number
  name: string
  category: string
  status: ServiceStatus
  uptimePercentage: number
  responseTimeMs: number
  createdAt?: string

  description: string | null
  tenantName: string | null
  tenantId: string | null
  subscriptionName: string | null
  subscriptionId: string | null
  resourceGroup: string | null
  azureResourceId: string | null
  resourceType: string | null
  region: string | null
  environment: string | null
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
  serviceCategory: string | null
  serviceDescription: string | null

  title: string
  description: string | null
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  status: IncidentStatus
  createdAt: string
  resolvedAt: string | null

  // Azure information inherited from the related Service.
  tenantName: string | null
  tenantId: string | null
  subscriptionName: string | null
  subscriptionId: string | null
  resourceGroup: string | null
  azureResourceId: string | null
  resourceType: string | null
  region: string | null
  environment: string | null

  // Current assignment information.
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

  status?: string
  closureReason?: string | null
  closureNotes?: string | null
  previousAssignmentId?: number | null

  pendingAbandonmentRequest?: {
    id: number
    reason: string
    requestedAt: string
  } | null
}

export type AbandonmentRequest = {
  id: number
  assignmentId: number
  reason: string
  requestedAt: string
  status: string
  reviewedAt: string | null
  adminNote: string | null
  requestedBy: string
  reviewedBy: string | null
  assignedTo: string
  incidentId: number
  incidentTitle: string
  serviceName: string
}