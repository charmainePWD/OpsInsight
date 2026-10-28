
import { useState } from 'react'
import type { User } from '../types'
import { useUsers } from '../hooks/useUsers'
import UserTable from '../components/UserTable'
import AddUserForm from '../components/AddUserForm'

type PermissionsPageProps = {
  currentUser: User
}

function PermissionsPage({ currentUser }: PermissionsPageProps) {
  const isAdmin = currentUser.permission === 'Administrator'
  const { users, loading, error, addUser, updatePermission } = useUsers(true)
  const [actionError, setActionError] = useState('')
  const [showAddUserForm, setShowAddUserForm] = useState(false)

  async function safeUpdate(id: number, permission: User['permission']) {
    setActionError('')
    try {
      await updatePermission(id, permission)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Update failed.')
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">ACCESS CONTROL</div>
          <h1>Permissions</h1>
          <p>Manage team access and review permission levels.</p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <button
              type="button"
              className="page-action-button"
              aria-expanded={showAddUserForm}
              onClick={() => setShowAddUserForm((visible) => !visible)}
            >
              {showAddUserForm ? 'Close form' : 'Add user'}
            </button>
          )}
        </div>
      </section>

      {actionError && <p className="notice-error" role="alert">{actionError}</p>}

      {isAdmin && 
      showAddUserForm && 
      <AddUserForm onAdd={addUser}
       />
      }


      <UserTable
        users={users}
        loading={loading}
        error={error}
        isAdmin={isAdmin}
        currentUserId={currentUser.id}
        updatePermission={safeUpdate}
      />

      {/* {isAdmin && 
      showAddUserForm && 
      <AddUserForm onAdd={addUser}
       />} */}

      <footer>OpsInsight <span>·</span> Access management</footer>
    </>
  )
}

export default PermissionsPage
