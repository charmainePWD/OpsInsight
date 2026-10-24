
import IncidentTable from '../components/IncidentTable'
import { useIncidents } from '../hooks/useIncidents'

function IncidentsPage() {
  const {
    incidents,
    loading,
    error,
    updateIncidentStatus,
  } = useIncidents()

  const activeCount = incidents.filter(
    (incident) => incident.status !== 'Resolved',
  ).length

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">RELIABILITY &amp; RESPONSE</div>
          <h1>Incident management</h1>
          <p>Track incidents and update their status as work progresses.</p>
        </div>

        <div className="page-count">
          <strong>{loading ? '—' : activeCount}</strong>
          <span>active incidents!</span>
        </div>
      </section>

      <IncidentTable
        incidents={incidents}
        loading={loading}
        error={error}
        updateIncidentStatus={updateIncidentStatus}
      />

      <footer>
        OpsInsight <span>·</span> Incident management
      </footer>
    </>
  )
}

export default IncidentsPage
