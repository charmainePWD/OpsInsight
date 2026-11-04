import { useEffect, useState } from 'react'
import type { Incident, IncidentStatus, User } from '../types'
import '../styles/IncidentWorkflow.css'

type IncidentDetailsModalProps = {
  incident: Incident
  currentUser: User
  onClose: () => void
  onUpdateStatus: (
    id: number,
    status: IncidentStatus,
  ) => Promise<void>
  onRequestAbandonment: (
    assignmentId: number,
    reason: string,
  ) => Promise<void>
}

const statuses: IncidentStatus[] = [
  'Open',
  'Investigating',
  'Monitoring',
  'Resolved',
]

function formatDate(value: string | null | undefined) {
  if (!value) return '—'

  return new Date(value).toLocaleString()
}

function IncidentDetailsModal({
  incident,
  currentUser,
  onClose,
  onUpdateStatus,
  onRequestAbandonment,
}: IncidentDetailsModalProps) {
  const isAdmin = currentUser.permission === 'Administrator'

  const canEdit =
    isAdmin ||
    (
      incident.isAssignedToCurrentUser &&
      incident.assignmentStatus === 'Active'
    )

  const hasPendingRequest =
    incident.assignmentStatus === 'PendingAbandonment'

  const canRequestAbandonment =
    !isAdmin &&
    incident.isAssignedToCurrentUser &&
    incident.assignmentStatus === 'Active'

  const [selectedStatus, setSelectedStatus] =
    useState<IncidentStatus>(incident.status)

  const [showAbandonmentModal, setShowAbandonmentModal] =
    useState(false)

  const [reason, setReason] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSelectedStatus(incident.status)
    setError('')
  }, [incident.id, incident.status])

  function closeAbandonmentModal() {
    if (reason.trim()) {
      const confirmed = window.confirm(
        'Discard this abandonment request? Your entered reason will be lost.',
      )

      if (!confirmed) return
    }

    setReason('')
    setError('')
    setShowAbandonmentModal(false)
  }

  function closeDetailsModal() {
    if (showAbandonmentModal) {
      closeAbandonmentModal()
      return
    }

    onClose()
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return

      event.preventDefault()

      if (showAbandonmentModal) {
        closeAbandonmentModal()
      } else {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showAbandonmentModal, reason, onClose])

  async function saveStatus() {
    if (!canEdit || selectedStatus === incident.status) return

    setSavingStatus(true)
    setError('')

    try {
      await onUpdateStatus(incident.id, selectedStatus)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update the incident.',
      )
    } finally {
      setSavingStatus(false)
    }
  }

  async function submitAbandonment() {
    if (!incident.assignmentId || !reason.trim()) {
      setError('Please provide a reason for your request.')
      return
    }

    setSubmittingRequest(true)
    setError('')

    try {
      await onRequestAbandonment(
        incident.assignmentId,
        reason.trim(),
      )

      setReason('')
      setShowAbandonmentModal(false)
      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not submit your request.',
      )
    } finally {
      setSubmittingRequest(false)
    }
  }

  return (
    <>
      <div
        className="incident-modal-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeDetailsModal()
          }
        }}
      >
        <section
          className="incident-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="incident-modal-title"
        >
          <header className="incident-modal-header">
            <div>
              <span className="incident-modal-reference">
                INC-{String(incident.id).padStart(4, '0')}
              </span>

              <h2 id="incident-modal-title">
                {incident.title}
              </h2>

              <p>
                {incident.serviceName}
              </p>
            </div>

            <button
              type="button"
              className="incident-modal-close"
              aria-label="Close incident details"
              onClick={closeDetailsModal}
            >
              ×
            </button>
          </header>

          <div className="incident-modal-content">
            <div className="incident-modal-badges">
              <span
                className={`severity severity-${incident.severity.toLowerCase()}`}
              >
                {incident.severity} severity
              </span>

              <span
                className={`incident-status incident-${incident.status.toLowerCase()}`}
              >
                {incident.status}
              </span>

              {hasPendingRequest && (
                <span className="request-pending-badge">
                  Abandonment pending
                </span>
              )}
            </div>

            <section className="incident-email-section">
              <h3>Incident report</h3>

              <div className="incident-email-row">
                <span>Reported</span>
                <strong>{formatDate(incident.createdAt)}</strong>
              </div>

              <div className="incident-email-row">
                <span>Service</span>
                <strong>{incident.serviceName}</strong>
              </div>

              <div className="incident-email-row">
                <span>Severity</span>
                <strong>{incident.severity}</strong>
              </div>

              <div className="incident-email-row">
                <span>Current status</span>
                <strong>{incident.status}</strong>
              </div>

              {incident.resolvedAt && (
                <div className="incident-email-row">
                  <span>Resolved</span>
                  <strong>{formatDate(incident.resolvedAt)}</strong>
                </div>
              )}
            </section>

            <section className="incident-description-section">
              <h3>Description</h3>

              <p>
                {incident.description ||
                  'No additional description was provided for this incident.'}
              </p>
            </section>

            <section className="incident-assignment-section">
              <h3>Assignment details</h3>

              <div className="incident-email-row">
                <span>Assigned to</span>
                <strong>{incident.assignedTo ?? 'Unassigned'}</strong>
              </div>

              <div className="incident-email-row">
                <span>Assigned by</span>
                <strong>{incident.assignedBy ?? '—'}</strong>
              </div>

              <div className="incident-email-row">
                <span>Assigned at</span>
                <strong>{formatDate(incident.assignedAt)}</strong>
              </div>
            </section>
          </div>

          {error && (
            <p className="incident-modal-error" role="alert">
              {error}
            </p>
          )}

          <footer className="incident-modal-footer">
            <div className="incident-modal-permission">
              {canEdit
                ? isAdmin
                  ? 'Administrator controls'
                  : 'You are assigned to this incident'
                : hasPendingRequest
                  ? 'Awaiting administrator review'
                  : 'You do not own this incident'}
            </div>

            <div className="incident-modal-actions">
              {canRequestAbandonment && (
                <button
                  type="button"
                  className="incident-abandon-button"
                  onClick={() => {
                    setError('')
                    setShowAbandonmentModal(true)
                  }}
                >
                  Request abandonment
                </button>
              )}

              {canEdit && (
                <>
                  <select
                    aria-label="Update incident status"
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatus(
                        event.target.value as IncidentStatus,
                      )
                    }
                    disabled={savingStatus}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="incident-save-button"
                    disabled={
                      savingStatus ||
                      selectedStatus === incident.status
                    }
                    onClick={() => void saveStatus()}
                  >
                    {savingStatus ? 'Saving...' : 'Save status'}
                  </button>
                </>
              )}

              <button
                type="button"
                className="incident-secondary-button"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </footer>
        </section>
      </div>

      {showAbandonmentModal && (
        <div
          className="incident-modal-overlay incident-modal-overlay-front"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAbandonmentModal()
            }
          }}
        >
          <section
            className="abandonment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="abandonment-modal-title"
          >
            <header className="incident-modal-header">
              <div>
                <span className="incident-modal-reference">
                  INCIDENT REQUEST
                </span>

                <h2 id="abandonment-modal-title">
                  Request abandonment
                </h2>

                <p>{incident.title}</p>
              </div>

              <button
                type="button"
                className="incident-modal-close"
                aria-label="Close abandonment request"
                onClick={closeAbandonmentModal}
              >
                ×
              </button>
            </header>

            <div className="abandonment-modal-content">
              <p>
                Explain why you need to be removed from this
                assignment. An administrator will review your request.
              </p>

              <label htmlFor="abandonment-reason">
                Reason for abandonment
              </label>

              <textarea
                id="abandonment-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why you cannot continue working on this incident..."
                maxLength={1000}
                rows={6}
                autoFocus
              />

              <div className="abandonment-character-count">
                {reason.length}/1000 characters
              </div>

              {error && (
                <p className="incident-modal-error" role="alert">
                  {error}
                </p>
              )}
            </div>

            <footer className="abandonment-modal-footer">
              <button
                type="button"
                className="incident-secondary-button"
                disabled={submittingRequest}
                onClick={closeAbandonmentModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="incident-save-button"
                disabled={!reason.trim() || submittingRequest}
                onClick={() => void submitAbandonment()}
              >
                {submittingRequest ? 'Submitting...' : 'Submit request'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}

export default IncidentDetailsModal