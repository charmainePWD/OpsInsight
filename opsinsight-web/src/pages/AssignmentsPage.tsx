import { useMemo, useState } from 'react'
import type { Incident, User } from '../types'
import { useAssignments } from '../hooks/useAssignments'
import AssignmentTable from '../components/AssignmentTable'
import AbandonmentReviewPanel from '../components/AbandonmentReviewPanel'
import '../styles/AssignmentsWorkflow.css'

type Tab = 'all-active' | 'my-active' | 'history' | 'abandonment' | 'assign'
type Props = {
  currentUser: User
  onOpenIncident: (incidentId: number) => void
}

function AssignmentsPage({ currentUser, onOpenIncident }: Props) {
  const isAdmin = currentUser.permission === 'Administrator'
  const {
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
  } = useAssignments(true, isAdmin)
  const [tab, setTab] = useState<Tab>(isAdmin ? 'all-active' : 'my-active')
  const [selectedIncidentId, setSelectedIncidentId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [actionError, setActionError] = useState('')
  const [assigning, setAssigning] = useState(false)

  const activeAssignments = assignments.filter(item => item.isActive)
  const myAssignments = activeAssignments.filter(
    item => item.userId === currentUser.id,
  )
  const historicalAssignments = assignments.filter(item => !item.isActive)
  const unassignedIncidents = useMemo(
    () =>
      incidents.filter(
        (incident: Incident) =>
          incident.status !== 'Resolved' &&
          !activeAssignments.some(item => item.incidentId === incident.id),
      ),
    [incidents, activeAssignments],
  )

  async function handleAssign() {
    if (!selectedIncidentId || !selectedUserId) return

    setAssigning(true)
    setActionError('')

    try {
      await assignIncident(Number(selectedUserId), Number(selectedIncidentId))
      setSelectedIncidentId('')
      setSelectedUserId('')
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not assign incident.',
      )
    } finally {
      setAssigning(false)
    }
  }

  async function handleUnassign(id: number) {
    setActionError('')

    try {
      await unassign(id)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not unassign.',
      )
    }
  }

  const tabs = [
    ...(isAdmin
      ? [{ id: 'all-active' as const, label: 'All Active Assignments' }]
      : []),
    ...(!isAdmin ? [{ id: 'my-active' as const, label: 'My Active' }] : []),
    { id: 'history' as const, label: 'History' },
    { id: 'abandonment' as const, label: 'Abandonment Requests' },
    { id: 'assign' as const, label: 'Assign Incident' },
  ]

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">WORKLOAD &amp; OWNERSHIP</div>
          <h1>Assignments</h1>
          <p>
            Track incident ownership, assignment history and abandonment
            requests.
          </p>
        </div>
        <div className="page-count">
          <strong>{loading ? '—' : activeAssignments.length}</strong>
          <span>active assignments</span>
        </div>
      </section>

      <div
        className="assignment-tabs"
        role="tablist"
        aria-label="Assignment views"
      >
        {tabs.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="notice-error" role="alert">
          {actionError}
        </p>
      )}

      {tab === 'all-active' && isAdmin && (
        <AssignmentTable
          title="All active assignments"
          description="Current ownership across the team."
          assignments={activeAssignments}
          loading={loading}
          error={error}
          isAdmin
          onUnassign={handleUnassign}
          onOpenIncident={onOpenIncident}
        />
      )}
      {tab === 'my-active' && !isAdmin && (
        <AssignmentTable
          title="My active assignments"
          description="Incidents currently assigned to you."
          assignments={myAssignments}
          loading={loading}
          error={error}
          isAdmin={false}
          onUnassign={handleUnassign}
          onOpenIncident={onOpenIncident}
        />
      )}
      {tab === 'history' && (
        <AssignmentTable
          title="Assignment history"
          description="Previously closed assignments and ownership changes."
          assignments={historicalAssignments}
          loading={loading}
          error={error}
          isAdmin={isAdmin}
          historical
          onUnassign={handleUnassign}
          onOpenIncident={onOpenIncident}
        />
      )}
      {tab === 'abandonment' && (
        <AbandonmentReviewPanel
          requests={abandonmentRequests}
          users={users}
          loading={abandonmentLoading}
          error={abandonmentError}
          isAdmin={isAdmin}
          onReview={reviewAbandonmentRequest}
          onReassign={reassignAbandonmentRequest}
          onOpenIncident={onOpenIncident}
        />
      )}
      {tab === 'assign' && (
        <section className="panel assign-incident-panel">
          <div className="panel-heading">
            <div>
              <h2>Assign an incident</h2>
              <p>
                Choose an unassigned active incident and assign it to a
                Contributor.
              </p>
            </div>
          </div>
          {!isAdmin ? (
            <div className="assignment-access-denied">
              <strong>You don't have access to this section.</strong>
              <span>Only Administrators can assign incidents.</span>
            </div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>INCIDENT</th>
                      <th>SERVICE</th>
                      <th>SEVERITY</th>
                      <th>STATUS</th>
                      <th>REPORTED</th>
                      <th>SELECT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          Loading incidents...
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      unassignedIncidents.map(incident => (
                        <tr key={incident.id}>
                          <td>
                            <div className="incident-name">
                              <strong>{incident.title}</strong>
                              <span>
                                INC-{String(incident.id).padStart(4, '0')}
                              </span>
                            </div>
                          </td>
                          <td>{incident.serviceName}</td>
                          <td>
                            <span
                              className={`severity severity-${incident.severity.toLowerCase()}`}
                            >
                              {incident.severity}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`incident-status incident-${incident.status.toLowerCase()}`}
                            >
                              {incident.status}
                            </span>
                          </td>
                          <td className="muted-cell">
                            {new Date(incident.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <input
                              type="radio"
                              name="incidentToAssign"
                              aria-label={`Select ${incident.title}`}
                              checked={
                                selectedIncidentId === String(incident.id)
                              }
                              onChange={() =>
                                setSelectedIncidentId(String(incident.id))
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    {!loading &&
                      !error &&
                      unassignedIncidents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            There are no unassigned active incidents.
                          </td>
                        </tr>
                      )}
                    {!loading && error && (
                      <tr>
                        <td colSpan={6} className="empty-state">
                          {error}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="assign-incident-controls">
                <label>
                  Assign to
                  <select
                    value={selectedUserId}
                    onChange={event => setSelectedUserId(event.target.value)}
                  >
                    <option value="">Select a Contributor</option>
                    {users
                      .filter(user => user.permission === 'Contributor')
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} {user.surname}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="page-action-button"
                  disabled={
                    !selectedIncidentId || !selectedUserId || assigning
                  }
                  onClick={() => void handleAssign()}
                >
                  {assigning ? 'Assigning...' : 'Assign User'}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <footer>
        OpsInsight <span>·</span> Incident assignments
      </footer>
    </>
  )
}

export default AssignmentsPage
