
import { useState } from 'react'
import type { Incident } from '../types'

type IncidentStatus = Incident['status']

type IncidentTableProps = {
  incidents: Incident[]
  loading: boolean
  error: string | null
  updateIncidentStatus: (
    id: number,
    status: IncidentStatus,
  ) => Promise<void>
}

const statuses: IncidentStatus[] = [
  'Open',
  'Investigating',
  'Monitoring',
  'Resolved',
]

function IncidentTable({
  incidents,
  loading,
  error,
  updateIncidentStatus,
}: IncidentTableProps) {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [updatingIds, setUpdatingIds] = useState<number[]>([])
  const [actionError, setActionError] = useState<string | null>(null)

  const filteredIncidents = incidents.filter((incident) => {
    const matchesStatus = filter === 'All' || incident.status === filter
    const query = search.toLowerCase().trim()
    const incidentNumber = `INC-${String(incident.id).padStart(4, '0')}`

    const matchesSearch =
      incident.title.toLowerCase().includes(query) ||
      incident.serviceName.toLowerCase().includes(query) ||
      incidentNumber.toLowerCase().includes(query)

    return matchesStatus && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const visibleIncidents = filteredIncidents.slice(
    startIndex,
    startIndex + pageSize,
  )

  async function changeStatus(id: number, status: IncidentStatus) {
    setActionError(null)
    setUpdatingIds((current) => [...current, id])

    try {
      await updateIncidentStatus(id, status)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not update the incident.',
      )
    } finally {
      setUpdatingIds((current) => current.filter((item) => item !== id))
    }
  }

  function changeFilter(value: string) {
    setFilter(value)
    setPage(1)
  }

  function changeSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function changePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  return (
    <section className="panel" id="incidents">
      <div className="panel-heading incident-heading">
        <div>
          <h2>Incidents</h2>
          <p>Search, track and update incident status</p>
        </div>
        {/* <span className="subtle-label">
          {filteredIncidents.length} incidents
        </span> */}
      </div>

      <div className="incident-tools">
        <input
          aria-label="Search incidents"
          placeholder="Search title, service or ID..."
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
        />

        <select
          aria-label="Filter by incident status"
          value={filter}
          onChange={(event) => changeFilter(event.target.value)}
        >
          <option value="All">All statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {actionError && (
        <p role="alert" className="notice-error">{actionError}</p>
      )}

      <div className="table-wrap">
        <table>
          <thead color='#303d51'>
            <tr>
              <th>INCIDENT</th>
              <th>SEVERITY</th>
              <th>STATUS</th>
              <th>UPDATED</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="empty-state">Loading incidents...</td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={5} className="empty-state">
                  Could not load incidents: {error}
                </td>
              </tr>
            )}

            {!loading && !error && visibleIncidents.map((incident) => {
              const isUpdating = updatingIds.includes(incident.id)

              return (
                <tr key={incident.id}>
                  <td>
                    <div className="incident-name">
                      <strong>{incident.title}</strong>
                      <span>
                        INC-{String(incident.id).padStart(4, '0')} · {incident.serviceName}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className={`severity severity-${incident.severity.toLowerCase()}`}>
                      {incident.severity}
                    </span>
                  </td>

                  <td>
                    <span className={`incident-status incident-${incident.status.toLowerCase()}`}>
                      {incident.status}
                    </span>
                  </td>

                  <td className="muted-cell">
                    {new Date(
                      incident.resolvedAt ?? incident.createdAt,
                    ).toLocaleString()}
                  </td>

                  <td>
                    <details className="action-menu">
                      <summary
                        aria-label={`Change status for incident ${incident.id}`}
                        title="Change incident status"
                      >
                        ⋮
                      </summary>

                      <div className="action-menu-options">
                        <span>Change status</span>
                        {statuses.map((status) => (
                          <button
                            type="button"
                            key={status}
                            disabled={isUpdating || incident.status === status}
                            onClick={(event) => {
                              const details = event.currentTarget.closest('details')
                              if (details) details.open = false
                              void changeStatus(incident.id, status)
                            }}
                          >
                            {status === incident.status ? '✓ ' : ''}
                            {status}
                          </button>
                        ))}
                      </div>
                    </details>
                    {isUpdating && <span className="updating-label">Saving...</span>}
                  </td>
                </tr>
              )
            })}

            {!loading && !error && filteredIncidents.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  No incidents match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && filteredIncidents.length > 0 && (
        <div className="pagination">
          <label className="page-size">
            Rows per page
            <select
              value={pageSize}
              onChange={(event) => changePageSize(Number(event.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </label>

          <span className="page-info">
            {startIndex + 1}–{Math.min(startIndex + pageSize, filteredIncidents.length)} of {filteredIncidents.length}
          </span>

          <div className="page-buttons">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default IncidentTable
