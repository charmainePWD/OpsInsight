import { useState } from 'react'
import type { AbandonmentRequest, User } from '../types'
import '../styles/AbandonmentReview.css'

type Props = {
  requests: AbandonmentRequest[]
  users: User[]
  loading: boolean
  error: string | null
  isAdmin: boolean
  onReview: (
    requestId: number,
    action: 'approve' | 'reject',
    adminNote: string,
  ) => Promise<void>
  onReassign: (
    requestId: number,
    newUserId: number,
    adminNote: string,
  ) => Promise<void>
  onOpenIncident: (incidentId: number) => void
}

function AbandonmentReviewPanel({
  requests,
  users,
  loading,
  error: loadError,
  isAdmin,
  onReview,
  onReassign,
  onOpenIncident,
}: Props) {
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [selectedUsers, setSelectedUsers] = useState<Record<number, string>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')
  const pendingCount = requests.filter(
    request => request.status === 'Pending',
  ).length
  const contributors = users.filter(
    user => user.permission === 'Contributor',
  )

  async function review(id: number, action: 'approve' | 'reject') {
    setBusyId(id)
    setActionError('')
    setMessage('')

    try {
      await onReview(id, action, notes[id] ?? '')
      setMessage(
        action === 'approve' ? 'Request approved.' : 'Request rejected.',
      )
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not review request.',
      )
    } finally {
      setBusyId(null)
    }
  }

  async function reassign(id: number) {
    const userId = Number(selectedUsers[id])
    if (!userId) return

    setBusyId(id)
    setActionError('')
    setMessage('')

    try {
      await onReassign(id, userId, notes[id] ?? '')
      setMessage('Incident reassigned successfully.')
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not reassign incident.',
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="panel abandonment-panel">
      <div className="panel-heading abandonment-heading">
        <div>
          <div className="abandonment-eyebrow">ASSIGNMENT REVIEW</div>
          <h2>Abandonment requests</h2>
          <p>
            Review submitted requests and their outcomes. Administrators can
            approve, reject or reassign pending requests.
          </p>
        </div>
        <div className="abandonment-count">
          <strong>{loading ? '—' : pendingCount}</strong>
          <span>awaiting review</span>
        </div>
      </div>

      {loadError && (
        <p className="abandonment-message abandonment-error" role="alert">
          {loadError}
        </p>
      )}
      {actionError && (
        <p className="abandonment-message abandonment-error" role="alert">
          {actionError}
        </p>
      )}
      {message && (
        <p className="abandonment-message abandonment-success" role="status">
          {message}
        </p>
      )}

      {loading ? (
        <div className="abandonment-empty">
          Loading abandonment requests...
        </div>
      ) : requests.length === 0 ? (
        <div className="abandonment-empty">
          <strong>No abandonment requests</strong>
          <span>Submitted requests will appear here.</span>
        </div>
      ) : (
        <div className="abandonment-request-list">
          {requests.map(request => {
            const pending = request.status === 'Pending'
            const busy = busyId === request.id

            return (
              <article
                className="abandonment-request"
                key={request.id}
              >
                <div className="abandonment-request-top">
                  <div>
                    <span className="abandonment-request-id">
                      INC-{String(request.incidentId).padStart(4, '0')}
                    </span>
                    <h3>
                      <button
                        type="button"
                        className="abandonment-incident-link"
                        onClick={() => onOpenIncident(request.incidentId)}
                      >
                        {request.incidentTitle}
                      </button>
                    </h3>
                    <p className="abandonment-service">
                      {request.serviceName}
                    </p>
                  </div>
                  <span
                    className={`abandonment-status-badge ${pending ? 'pending' : ''}`}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="abandonment-details">
                  <div>
                    <span>REQUESTED BY</span>
                    <strong>{request.requestedBy}</strong>
                  </div>
                  <div>
                    <span>CURRENTLY ASSIGNED TO</span>
                    <strong>{request.assignedTo}</strong>
                  </div>
                  <div>
                    <span>SUBMITTED</span>
                    <strong>
                      {new Date(request.requestedAt).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span>REVIEWED</span>
                    <strong>
                      {request.reviewedAt
                        ? new Date(request.reviewedAt).toLocaleString()
                        : 'Awaiting review'}
                    </strong>
                  </div>
                </div>

                <div className="abandonment-reason">
                  <span>CONTRIBUTOR'S REASON</span>
                  <p>{request.reason}</p>
                </div>
                {request.adminNote && (
                  <div className="abandonment-reason">
                    <span>ADMINISTRATOR NOTE</span>
                    <p>{request.adminNote}</p>
                  </div>
                )}

                {isAdmin && pending && (
                  <div className="abandonment-review-controls">
                    <label className="abandonment-note-field">
                      Administrator note
                      <textarea
                        rows={2}
                        maxLength={1000}
                        value={notes[request.id] ?? ''}
                        onChange={event =>
                          setNotes(current => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        disabled={busy}
                        placeholder="Optional note..."
                      />
                    </label>
                    <div className="abandonment-actions">
                      <button
                        type="button"
                        className="abandonment-approve"
                        disabled={busy}
                        onClick={() => void review(request.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="abandonment-reject"
                        disabled={busy}
                        onClick={() => void review(request.id, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                    <div className="abandonment-reassign">
                      <label>
                        Reassign incident to
                        <select
                          value={selectedUsers[request.id] ?? ''}
                          onChange={event =>
                            setSelectedUsers(current => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          disabled={busy}
                        >
                          <option value="">Select a Contributor</option>
                          {contributors
                            .filter(
                              user =>
                                `${user.name} ${user.surname}`.toLowerCase() !==
                                request.assignedTo.toLowerCase(),
                            )
                            .map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name} {user.surname}
                              </option>
                            ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="abandonment-reassign-button"
                        disabled={busy || !selectedUsers[request.id]}
                        onClick={() => void reassign(request.id)}
                      >
                        Reassign
                      </button>
                    </div>
                  </div>
                )}
                {!isAdmin && (
                  <p className="abandonment-readonly-note">
                    View only — administrator review actions are restricted.
                  </p>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default AbandonmentReviewPanel
