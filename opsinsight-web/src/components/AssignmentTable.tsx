import { useState } from 'react'
import type { Assignment } from '../types'

type Props = {
  title: string
  description: string
  assignments: Assignment[]
  loading: boolean
  error: string | null
  isAdmin: boolean
  onUnassign: (id: number) => Promise<void>
  onOpenIncident: (incidentId: number) => void
  historical?: boolean
}

function AssignmentTable({
  title,
  description,
  assignments,
  loading,
  error,
  isAdmin,
  onUnassign,
  onOpenIncident,
  historical = false,
}: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5
  const query = search.trim().toLowerCase()
  const filtered = assignments.filter(item =>
    [
      item.incidentTitle,
      item.serviceName,
      `INC-${String(item.incidentId).padStart(4, '0')}`,
      item.userName,
      item.assignedBy,
      item.incidentStatus,
    ].some(value => value.toLowerCase().includes(query)),
  )
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)
  const columns = historical
    ? isAdmin
      ? 6
      : 5
    : isAdmin
      ? 6
      : 4

  return (
    <section className="panel assignment-panel">
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="incident-tools">
        <input
          type="search"
          aria-label={`Search ${title}`}
          placeholder="Search incident, service, user or ID..."
          value={search}
          onChange={event => {
            setSearch(event.target.value)
            setPage(1)
          }}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>INCIDENT</th>
              {isAdmin && <th>ASSIGNED TO</th>}
              <th>STATUS</th>
              <th>ASSIGNED BY</th>
              <th>ASSIGNED AT</th>
              {historical ? <th>CLOSED AT</th> : isAdmin && <th>ACTION</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columns} className="empty-state">
                  Loading assignments...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={columns} className="empty-state">
                  {error}
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              visible.map(item => (
                <tr key={item.id}>
                  <td>
                    <button
                      type="button"
                      className="assignment-incident-link"
                      onClick={() => onOpenIncident(item.incidentId)}
                    >
                      <strong>{item.incidentTitle}</strong>
                      <span>
                        INC-{String(item.incidentId).padStart(4, '0')} ·{' '}
                        {item.serviceName}
                      </span>
                    </button>
                  </td>
                  {isAdmin && <td>{item.userName}</td>}
                  <td>
                    <span
                      className={`incident-status incident-${item.incidentStatus.toLowerCase()}`}
                    >
                      {item.incidentStatus}
                    </span>
                    {item.status === 'PendingAbandonment' && (
                      <span className="request-pending-badge">
                        Abandonment pending
                      </span>
                    )}
                  </td>
                  <td>{item.assignedBy}</td>
                  <td className="muted-cell">
                    {new Date(item.assignedAt).toLocaleString()}
                  </td>
                  {historical ? (
                    <td className="muted-cell">
                      {item.unassignedAt
                        ? new Date(item.unassignedAt).toLocaleString()
                        : '—'}
                    </td>
                  ) : (
                    isAdmin && (
                      <td>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => void onUnassign(item.id)}
                        >
                          Unassign
                        </button>
                      </td>
                    )
                  )}
                </tr>
              ))}
            {!loading && !error && visible.length === 0 && (
              <tr>
                <td colSpan={columns} className="empty-state">
                  {query
                    ? 'No matching assignments.'
                    : historical
                      ? 'No assignment history yet.'
                      : 'No active assignments.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && filtered.length > 0 && (
        <div className="pagination">
          <span className="page-info">
            {start + 1}–{Math.min(start + pageSize, filtered.length)} of{' '}
            {filtered.length}
          </span>
          <div className="page-buttons">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage(value => Math.max(1, value - 1))}
            >
              Previous
            </button>
            <span>
              {currentPage} / {pageCount}
            </span>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(value => Math.min(pageCount, value + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default AssignmentTable
