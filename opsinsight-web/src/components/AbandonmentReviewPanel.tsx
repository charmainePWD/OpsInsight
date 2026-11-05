import { useState } from 'react'
import type { AbandonmentRequest,User, } from '../types'
import '../styles/AbandonmentReview.css'

type AbandonmentReviewPanelProps = {
  requests: AbandonmentRequest[]
  users: User[]
  loading: boolean
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
}

function AbandonmentReviewPanel({
  requests,
  users,
  loading,
  onReview,
  onReassign,
}: AbandonmentReviewPanelProps) {
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [selectedUsers, setSelectedUsers] = useState<
    Record<number, string>
  >({})
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const pendingRequests = requests.filter(
    (request) => request.status === 'Pending',
  )

  const contributors = users.filter(
    (user) => user.permission === 'Contributor',
  )

  function updateNote(requestId: number, value: string) {
    setNotes((current) => ({
      ...current,
      [requestId]: value,
    }))
  }

  function updateSelectedUser(requestId: number, value: string) {
    setSelectedUsers((current) => ({
      ...current,
      [requestId]: value,
    }))
  }

  async function handleReview(
    requestId: number,
    action: 'approve' | 'reject',
  ) {
    setError('')
    setSuccess('')
    setBusyRequestId(requestId)

    try {
      await onReview(
        requestId,
        action,
        notes[requestId] ?? '',
      )

      setSuccess(
        action === 'approve'
          ? 'Abandonment request approved.'
          : 'Abandonment request rejected. The assignment is active again.',
      )

      setNotes((current) => ({
        ...current,
        [requestId]: '',
      }))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not review the request.',
      )
    } finally {
      setBusyRequestId(null)
    }
  }

  async function handleReassign(requestId: number) {
    setError('')
    setSuccess('')

    const selectedUserId = Number(selectedUsers[requestId])

    if (!selectedUserId) {
      setError('Select a Contributor before reassigning.')
      return
    }

    setBusyRequestId(requestId)

    try {
      await onReassign(
        requestId,
        selectedUserId,
        notes[requestId] ?? '',
      )

      setSuccess(
        'Incident reassigned successfully. The previous assignment has been retained in history.',
      )

      setSelectedUsers((current) => ({
        ...current,
        [requestId]: '',
      }))

      setNotes((current) => ({
        ...current,
        [requestId]: '',
      }))
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not reassign the incident.',
      )
    } finally {
      setBusyRequestId(null)
    }
  }

  return (
    <section className="panel abandonment-panel">
      <div className="panel-heading abandonment-heading">
        <div>
          <div className="abandonment-eyebrow">
            ADMINISTRATOR REVIEW
          </div>
          <h2>Abandonment requests</h2>
          <p>
            Review requests submitted by Contributors and decide
            how ownership should proceed.
          </p>
        </div>

        <div className="abandonment-count">
          <strong>{loading ? '—' : pendingRequests.length}</strong>
          <span>awaiting review</span>
        </div>
      </div>

      {error && (
        <p className="abandonment-message abandonment-error" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="abandonment-message abandonment-success" role="status">
          {success}
        </p>
      )}

      {loading ? (
        <div className="abandonment-empty">
          Loading abandonment requests...
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="abandonment-empty">
          <div className="abandonment-empty-icon">✓</div>
          <strong>No pending requests</strong>
          <span>
            All submitted abandonment requests have been reviewed.
          </span>
        </div>
      ) : (
        <div className="abandonment-request-list">
          {pendingRequests.map((request) => {
            const isBusy = busyRequestId === request.id

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

                    <h3>{request.incidentTitle}</h3>

                    <p className="abandonment-service">
                      {request.serviceName}
                    </p>
                  </div>

                  <span className="abandonment-pending-badge">
                    Pending review
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
                </div>

                <div className="abandonment-reason">
                  <span>CONTRIBUTOR'S REASON</span>
                  <p>{request.reason}</p>
                </div>

                <div className="abandonment-review-controls">
                  <label className="abandonment-note-field">
                    Administrator note
                    <textarea
                      value={notes[request.id] ?? ''}
                      onChange={(event) =>
                        updateNote(request.id, event.target.value)
                      }
                      placeholder="Optional note explaining your decision..."
                      rows={2}
                      maxLength={1000}
                      disabled={isBusy}
                    />
                  </label>

                  <div className="abandonment-actions">
                    <button
                      type="button"
                      className="abandonment-approve"
                      disabled={isBusy}
                      onClick={() =>
                        void handleReview(request.id, 'approve')
                      }
                    >
                      {isBusy ? 'Processing...' : 'Approve'}
                    </button>

                    <button
                      type="button"
                      className="abandonment-reject"
                      disabled={isBusy}
                      onClick={() =>
                        void handleReview(request.id, 'reject')
                      }
                    >
                      Reject
                    </button>
                  </div>

                  <div className="abandonment-reassign">
                    <label>
                      Reassign incident to
                      <select
                        value={selectedUsers[request.id] ?? ''}
                        onChange={(event) =>
                          updateSelectedUser(
                            request.id,
                            event.target.value,
                          )
                        }
                        disabled={isBusy}
                      >
                        <option value="">Select a Contributor</option>

                        {contributors
                          .filter(
                            (user) => {
                              const currentOwner = request.assignedTo
                                .trim()
                                .toLowerCase()

                              return (
                                `${user.name} ${user.surname}`
                                  .trim()
                                  .toLowerCase() !== currentOwner
                              )
                            },
                          )
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} {user.surname}
                            </option>
                          ))}
                      </select>
                    </label>

                    <button
                      type="button"
                      className="abandonment-reassign-button"
                      disabled={
                        isBusy || !selectedUsers[request.id]
                      }
                      onClick={() =>
                        void handleReassign(request.id)
                      }
                    >
                      Reassign
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default AbandonmentReviewPanel