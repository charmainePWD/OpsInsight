
import { useState, type FormEvent } from 'react'
import type { Incident, User } from '../types'

type AssignIncidentFormProps = {
  users: User[]
  incidents: Incident[]
  onAssign: (userId: number, incidentId: number) => Promise<void>
}

function AssignIncidentForm({
  users,
  incidents,
  onAssign,
}: AssignIncidentFormProps) {
  const [userId, setUserId] = useState('')
  const [incidentId, setIncidentId] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')

  const openIncidents = incidents.filter(
    (incident) => incident.status !== 'Resolved',
  )

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setMessageType('')
    setBusy(true)

    try {
      await onAssign(Number(userId), Number(incidentId))
      setMessage('Incident assigned successfully.')
      setMessageType('success')
      setUserId('')
      setIncidentId('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Assignment failed.')
      setMessageType('error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel admin-form" onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <h2>Assign an incident</h2>
          <p>Choose an owner for an unresolved incident.</p>
        </div>
      </div>

      <div className="form-grid">
        <label>
          Team member
          <select value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} {user.surname} · {user.permission}
              </option>
            ))}
          </select>
        </label>

        <label>
          Incident
          <select
            value={incidentId}
            onChange={(e) => setIncidentId(e.target.value)}
            required
          >
            <option value="">Select an incident</option>
            {openIncidents.map((incident) => (
              <option key={incident.id} value={incident.id}>
                INC-{String(incident.id).padStart(4, '0')} · {incident.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {message && (
        <p
          className={`form-message form-message-${messageType}`}
          role={messageType === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {message}
        </p>
      )}

      <button type="submit" disabled={busy}>
        {busy ? 'Assigning...' : 'Assign incident'}
      </button>
    </form>
  )
}

export default AssignIncidentForm
