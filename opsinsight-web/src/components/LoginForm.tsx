
import { useState, type FormEvent } from 'react'

type LoginFormProps = {
  checkEmail: (email: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<void>
}

function LoginForm({ checkEmail, login }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailChecked, setEmailChecked] = useState(false)
  const [knownUser, setKnownUser] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submitEmail(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      const exists = await checkEmail(email.trim())
      setKnownUser(exists)
      setEmailChecked(true)

      if (!exists) {
        setError('Unknown user. Please request access from administration.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email check failed.')
    } finally {
      setBusy(false)
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)

    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand-icon">O</div>
        <p className="eyebrow">OPERATIONS CENTER</p>
        <h1>Welcome to OpsInsight</h1>
        <p className="login-subtitle">
          Sign in to monitor services and manage incidents.
        </p>

        {!emailChecked || !knownUser ? (
          <form onSubmit={submitEmail} className="login-form">
            <label htmlFor="login-email">Work email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailChecked(false)
                setKnownUser(false)
                setError('')
              }}
              required
            />

            {error && <p className="notice-error" role="alert">{error}</p>}

            <button type="submit" disabled={busy}>
              {busy ? 'Checking...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitPassword} className="login-form">
            <label htmlFor="login-email-confirm">Work email</label>
            <input
              id="login-email-confirm"
              type="email"
              value={email}
              readOnly
            />

            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error && <p className="notice-error" role="alert">{error}</p>}

            <button type="submit" disabled={busy}>
              {busy ? 'Signing in...' : 'Sign in'}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setEmailChecked(false)
                setKnownUser(false)
                setPassword('')
                setError('')
              }}
            >
              Use another email
            </button>
          </form>
        )}

        <p className="login-footnote">
          Access is managed by your OpsInsight administrator.
        </p>
      </section>
    </main>
  )
}

export default LoginForm
