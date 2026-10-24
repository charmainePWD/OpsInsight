
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
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Assignment history</h2>
          <p>Current ownership and previously completed assignments.</p>
        </div>
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
              <th>ASSIGNMENT</th>
              {isAdmin && <th>ACTION</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={isAdmin ? 7 : 5}>Loading assignments...</td></tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={isAdmin ? 7 : 5} className="empty-state">{error}</td>
              </tr>
            )}

            {!loading && !error && assignments.map((assignment) => (
              <tr key={assignment.id}>
                <td>
                  <div className="incident-name">
                    <strong>{assignment.incidentTitle}</strong>
                    <span>
                      INC-{String(assignment.incidentId).padStart(4, '0')} · {assignment.serviceName}
                    </span>
                  </div>
                </td>
                {isAdmin && <td>{assignment.userName}</td>}
                <td>
                  <span className={`incident-status incident-${assignment.incidentStatus.toLowerCase()}`}>
                    {assignment.incidentStatus}
                  </span>
                </td>
                <td>{assignment.assignedBy}</td>
                <td className="muted-cell">
                  {new Date(assignment.assignedAt).toLocaleString()}
                </td>
                <td>
                  <span className={`permission-badge ${assignment.isActive ? 'permission-administrator' : 'permission-viewer'}`}>
                    {assignment.isActive ? 'Active' : 'Historical'}
                  </span>
                  {assignment.unassignedAt && (
                    <span className="assignment-end-date">
                      Ended {new Date(assignment.unassignedAt).toLocaleDateString()}
                    </span>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    {assignment.isActive ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          void onUnassign(assignment.id).catch(() => undefined)
                        }}
                      >
                        Unassign
                      </button>
                    ) : '—'}
                  </td>
                )}
              </tr>
            ))}

            {!loading && !error && assignments.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 5} className="empty-state">
                  No assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default AssignmentTable
