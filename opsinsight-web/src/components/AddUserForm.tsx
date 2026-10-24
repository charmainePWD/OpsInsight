
import { useState, type FormEvent } from 'react'
import type { Permission } from '../types'

type AddUserFormProps = {
  onAdd: (user: {
    name: string
    surname: string
    email: string
    password: string
    permission: Permission
  }) => Promise<void>
}

function AddUserForm({ onAdd }: AddUserFormProps) {
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [permission, setPermission] = useState<Permission>('Viewer')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    setBusy(true)

    try {
      await onAdd({ name, surname, email, password, permission })
      setName('')
      setSurname('')
      setEmail('')
      setPassword('')
      setPermission('Viewer')
      setMessage('User created successfully.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create user.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="panel admin-form" onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <h2>Add user</h2>
          <p>Create an account and assign its permission level.</p>
        </div>
      </div>

      <div className="form-grid">
        <label>
          First name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Surname
          <input value={surname} onChange={(e) => setSurname(e.target.value)} required />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Temporary password
          <input
            type="password"
            minLength={12}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <label>
          Permission
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as Permission)}
          >
            <option value="Viewer">Viewer</option>
            <option value="Administrator">Administrator</option>
          </select>
        </label>
      </div>

      {message && <p role="status">{message}</p>}

      <button type="submit" disabled={busy}>
        {busy ? 'Creating...' : 'Create user'}
      </button>
    </form>
  )
}

export default AddUserForm
