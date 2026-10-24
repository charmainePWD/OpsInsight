
import { useState } from 'react'
import './App.css'
import './styles/AdminPages.css'

import OverviewPage from './pages/OverviewPage'
import ServicesPage from './pages/ServicesPage'
import IncidentsPage from './pages/IncidentsPage'
import LoginPage from './pages/LoginPage'
import PermissionsPage from './pages/PermissionsPage'
import AssignmentsPage from './pages/AssignmentsPage'
import { useAuth } from './hooks/useAuth'

type Page =
  | 'overview'
  | 'services'
  | 'incidents'
  | 'assignments'
  | 'permissions'

const navigation: {
  id: Page
  label: string
  icon: string
}[] = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'services', label: 'Services', icon: '◈' },
  { id: 'incidents', label: 'Incidents', icon: '◉' },
  { id: 'permissions', label: 'Permissions', icon: '♙' },
  { id: 'assignments', label: 'Assignments', icon: '☷' },
]

function App() {
  const { user, loading, checkEmail, login, logout } = useAuth()
  const [activePage, setActivePage] = useState<Page>('overview')
  const [logoutError, setLogoutError] = useState('')

  if (loading) {
    return <div className="loading-state">Loading OpsInsight...</div>
  }

  if (!user) {
    return <LoginPage checkEmail={checkEmail} login={login} />
  }

  const initials = `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()

  async function handleLogout() {
    setLogoutError('')
    try {
      await logout()
    } catch (err) {
      setLogoutError(
        err instanceof Error ? err.message : 'Could not sign out.',
      )
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">O</div>
          <div>
            <strong>OpsInsight</strong>
            <span>OPERATIONS CENTER</span>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav>
          {navigation.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="environment">
            <span className="live-dot" />
            DEMO ENVIRONMENT
          </div>

          <div className="profile">
            <div className="avatar">{initials}</div>
            <div className="profile-details">
              <strong>{user.name} {user.surname}</strong>
              <span>{user.permission}</span>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={() => void handleLogout()}
          >
            Sign out
          </button>

          {logoutError && <p className="notice-error">{logoutError}</p>}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span>{' '}
            {navigation.find((item) => item.id === activePage)?.label}
          </div>

          <div className="topbar-right">
            <span className="live-dot" />
            Demo monitoring
            <div className="top-avatar" title={`${user.name} — ${user.permission}`}>
              {initials}
            </div>
          </div>
        </header>

        {activePage === 'overview' && <OverviewPage />}
        {activePage === 'services' && <ServicesPage />}
        {activePage === 'incidents' && <IncidentsPage />}
        {activePage === 'permissions' && <PermissionsPage currentUser={user} />}
        {activePage === 'assignments' && <AssignmentsPage currentUser={user} />}
      </main>
    </div>
  )
}

export default App
