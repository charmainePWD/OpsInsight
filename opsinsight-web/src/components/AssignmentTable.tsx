
import { useState } from 'react'
import type { Assignment } from '../types'

type AssignmentTableProps = {
  assignments: Assignment[]
  loading: boolean
  error: string | null
  isAdmin: boolean
  onUnassign: (id: number) => Promise<void>
}

function AssignmentTable({
  assignments,
  loading,
  error,
  isAdmin,
  onUnassign,
}: AssignmentTableProps) {
  const activeAssignments = assignments.filter((assignment) => assignment.isActive)
  const historicalAssignments = assignments.filter((assignment) => !assignment.isActive)

  return (
    <>
      <AssignmentSection
        title="Active assignments"
        description="Current incident ownership and available actions."
        assignments={activeAssignments}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        onUnassign={onUnassign}
        emptyMessage="No active assignments."
      />
      <AssignmentSection
        title="Assignment history"
        description="Previously completed assignments and when ownership ended."
        assignments={historicalAssignments}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        onUnassign={onUnassign}
        emptyMessage="No historical assignments."
        historical
      />
    </>
  )
}

type AssignmentSectionProps = {
  title: string
  description: string
  assignments: Assignment[]
  loading: boolean
  error: string | null
  isAdmin: boolean
  onUnassign: (id: number) => Promise<void>
  emptyMessage: string
  historical?: boolean
}

function AssignmentSection({
  title,
  description,
  assignments,
  loading,
  error,
  isAdmin,
  onUnassign,
  emptyMessage,
  historical = false,
}: AssignmentSectionProps) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const columnCount = historical ? 5 : (isAdmin ? 5 : 4)

  const normalizedSearch = search.trim().toLowerCase()
  const filteredAssignments = normalizedSearch
    ? assignments.filter((assignment) => [
      assignment.incidentTitle,
      assignment.serviceName,
      `INC-${String(assignment.incidentId).padStart(4, '0')}`,
      assignment.userName,
      assignment.incidentStatus,
      ...(!isAdmin ? [assignment.assignedBy] : []),
      assignment.assignedAt,
      assignment.unassignedAt ?? '',
    ].some((value) => value.toLowerCase().includes(normalizedSearch)))
    : assignments
  const pageCount = Math.max(1, Math.ceil(filteredAssignments.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const startIndex = (currentPage - 1) * pageSize
  const visibleAssignments = filteredAssignments.slice(startIndex, startIndex + pageSize)

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function updatePageSize(value: number) {
    setPageSize(value)
    setPage(1)
  }

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
          aria-label={`Search ${title.toLowerCase()}`}
          placeholder="Search title, service, user or ID..."
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>INCIDENT</th>
              {isAdmin && <th>ASSIGNED TO</th>}
              <th>STATUS</th>
              {!isAdmin && <th>ASSIGNED BY</th>}
              <th>ASSIGNED AT</th>
              {historical ? <th>UNASSIGNED AT</th> : isAdmin && <th>ACTION</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={columnCount} className="empty-state">Loading assignments...</td></tr>}
            {!loading && error && <tr><td colSpan={columnCount} className="empty-state">{error}</td></tr>}
            {!loading && !error && visibleAssignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>
                  <div className="incident-name">
                    <strong>{assignment.incidentTitle}</strong>
                    <span>INC-{String(assignment.incidentId).padStart(4, '0')} · {assignment.serviceName}</span>
                  </div>
                </td>
                {isAdmin && <td>{assignment.userName}</td>}
                <td>
                  <span className={`incident-status incident-${assignment.incidentStatus.toLowerCase()}`}>
                    {assignment.incidentStatus}
                  </span>
                </td>
                {!isAdmin && <td>{assignment.assignedBy}</td>}
                <td className="muted-cell">{new Date(assignment.assignedAt).toLocaleString()}</td>
                {historical ? (
                  <td className="muted-cell">
                    {assignment.unassignedAt ? new Date(assignment.unassignedAt).toLocaleString() : '—'}
                  </td>
                ) : isAdmin && (
                  <td>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => { void onUnassign(assignment.id).catch(() => undefined) }}
                    >
                      Unassign
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!loading && !error && visibleAssignments.length === 0 && (
              <tr><td colSpan={columnCount} className="empty-state">{search ? 'No matching assignments.' : emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && filteredAssignments.length > 0 && (
        <div className="pagination">
          <label className="page-size">
            Rows per page
            <select
              value={pageSize}
              onChange={(event) => updatePageSize(Number(event.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>

          <span className="page-info">
            {startIndex + 1}–{Math.min(startIndex + pageSize, filteredAssignments.length)} of {filteredAssignments.length}
          </span>

          <div className="page-buttons">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </button>
            <span>{currentPage} / {pageCount}</span>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
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
