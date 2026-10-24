
import type { Permission, User } from '../types'

type UserTableProps = {
  users: User[]
  loading: boolean
  error: string | null
  isAdmin: boolean
  currentUserId: number
  updatePermission: (id: number, permission: Permission) => Promise<void>
}

function UserTable({
  users,
  loading,
  error,
  isAdmin,
  currentUserId,
  updatePermission,
}: UserTableProps) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Team permissions</h2>
          <p>Review account access across OpsInsight.</p>
        </div>
        <span className="subtle-label">{users.length} users</span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>USER</th>
              <th>EMAIL</th>
              <th>PERMISSION</th>
              <th>CREATED</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4}>Loading users...</td></tr>}
            {!loading && error && (
              <tr><td colSpan={4} className="empty-state">{error}</td></tr>
            )}

            {!loading && !error && users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="incident-name">
                    <strong>{user.name} {user.surname}</strong>
                    <span>{user.id === currentUserId ? 'You' : `User #${user.id}`}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>
                  {isAdmin ? (
                    <select
                      aria-label={`Permission for ${user.name} ${user.surname}`}
                      value={user.permission}
                      onChange={(e) => {
                        void updatePermission(
                          user.id,
                          e.target.value as Permission,
                        )
                      }}
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  ) : (
                    <span className={`permission-badge permission-${user.permission.toLowerCase()}`}>
                      {user.permission}
                    </span>
                  )}
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}

            {!loading && !error && users.length === 0 && (
              <tr><td colSpan={4} className="empty-state">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default UserTable
