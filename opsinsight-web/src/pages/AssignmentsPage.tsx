
import { useState } from 'react'
import type { User } from '../types'
import { useAssignments } from '../hooks/useAssignments'
import AssignmentTable from '../components/AssignmentTable'
import AssignIncidentForm from '../components/AssignIncidentForm'

type AssignmentsPageProps = {
  currentUser: User
}

function AssignmentsPage({ currentUser }: AssignmentsPageProps) {
  const isAdmin = currentUser.permission === 'Administrator'
  const {
    assignments,
    users,
    incidents,
    loading,
    error,
    assignIncident,
    unassign,
  } = useAssignments(true)

  const [actionError, setActionError] = useState('')

  async function safeUnassign(id: number) {
    setActionError('')
    try {
      await unassign(id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not unassign.'
      setActionError(message)
      throw err
    }
  }

  const activeCount = assignments.filter((item) => item.isActive).length

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">WORKLOAD &amp; OWNERSHIP</div>
          <h1>Assignments</h1>
          <p>Track incident ownership and assignment history.</p>
        </div>
        <div className="page-count">
          <strong>{loading ? '—' : activeCount}</strong>
          <span>active assignments</span>
        </div>
      </section>

      {actionError && <p className="notice-error" role="alert">{actionError}</p>}

      {isAdmin && (
        <AssignIncidentForm
          users={users}
          incidents={incidents}
          onAssign={assignIncident}
        />
      )}

      <AssignmentTable
        assignments={assignments}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        onUnassign={safeUnassign}
      />

      <footer>OpsInsight <span>·</span> Incident assignments</footer>
    </>
  )
}

export default AssignmentsPage
