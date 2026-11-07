import type { User } from '../types'
import IncidentTable from '../components/IncidentTable'
import { useIncidents } from '../hooks/useIncidents'

type Props = {
  currentUser: User
  selectedIncidentId: number | null
  onIncidentOpened: () => void
}

function IncidentsPage({
  currentUser,
  selectedIncidentId,
  onIncidentOpened,
}: Props) {
  const {
    incidents,
    loading,
    error,
    updateIncidentStatus,
    submitAbandonmentRequest,
  } = useIncidents()
  const activeCount = incidents.filter(
    incident => incident.status !== 'Resolved',
  ).length

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">RELIABILITY &amp; RESPONSE</div>
          <h1>Incident management</h1>
          <p>
            Track incidents, review their details and manage incident progress.
          </p>
        </div>
        <div className="page-count">
          <strong>{loading ? '—' : activeCount}</strong>
          <span>active incidents</span>
        </div>
      </section>

      <IncidentTable
        incidents={incidents}
        loading={loading}
        error={error}
        currentUser={currentUser}
        updateIncidentStatus={updateIncidentStatus}
        submitAbandonmentRequest={submitAbandonmentRequest}
        selectedIncidentId={selectedIncidentId}
        onIncidentOpened={onIncidentOpened}
      />

      <footer>
        OpsInsight <span>·</span> Incident management
      </footer>
    </>
  )
}

export default IncidentsPage
