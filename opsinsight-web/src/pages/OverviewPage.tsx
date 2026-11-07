import { useMemo } from 'react'
import SummaryCard from '../components/SummaryCard'
import { useServices } from '../hooks/useServices'
import { useIncidents } from '../hooks/useIncidents'
import { useAssignments } from '../hooks/useAssignments'
import type { Incident, Service, User } from '../types'
import '../styles/OverviewPage.css'

type OverviewPageProps = {
  currentUser: User
}

const INCIDENT_STATUSES = [
  { name: 'Open', color: '#0aa6c2' },
  { name: 'Investigating', color: '#087b98' },
  { name: 'Monitoring', color: '#36c4dc' },
  { name: 'Resolved', color: '#063f55' },
] as const

function getStatusClass(status: string) {
  switch (status) {
    case 'Open':
      return 'incident-open'
    case 'Investigating':
      return 'incident-investigating'
    case 'Monitoring':
      return 'incident-monitoring'
    case 'Resolved':
      return 'incident-resolved'
    default:
      return 'incident-open'
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('en-ZA', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function HealthGraph() {
  const points = [
    [0, 92], [45, 84], [90, 78], [135, 83], [180, 68],
    [225, 72], [270, 59], [315, 63], [360, 52], [405, 56],
    [450, 43], [495, 49], [540, 35], [585, 40], [630, 29],
    [675, 34], [720, 22], [765, 27], [800, 18],
  ]

  const linePath = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ')
  const areaPath = `${linePath} L 800 120 L 0 120 Z`

  return (
    <section className="health-panel overview-panel">
      <div className="panel-title">
        <div>
          <h2>Service Health</h2>
          <p>Overall service performance over the last 24 hours</p>
        </div>

        <select
          className="time-range-select"
          aria-label="Health graph time range"
          defaultValue="24"
        >
          <option value="24">Last 24 hours</option>
          <option value="12">Last 12 hours</option>
          <option value="6">Last 6 hours</option>
        </select>
      </div>

      <div className="health-chart">
        <div className="chart-y-labels" aria-hidden="true">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        <svg
          viewBox="0 0 800 120"
          preserveAspectRatio="none"
          role="img"
          aria-label="Illustrative service health trend"
        >
          <defs>
            <linearGradient id="healthAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#08a8c5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#08a8c5" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0, 30, 60, 90, 120].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="800"
              y2={y}
              stroke="#e9eef5"
              strokeWidth="1"
              strokeDasharray="4 5"
            />
          ))}

          <path d={areaPath} fill="url(#healthAreaGradient)" />

          <path
            d={linePath}
            fill="none"
            stroke="#0789a7"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {points.filter((_, index) => index % 3 === 0).map(([x, y]) => (
            <circle
              key={x}
              cx={x}
              cy={y}
              r="3"
              fill="#ffffff"
              stroke="#0789a7"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>

      <div className="chart-x-labels" aria-hidden="true">
        <span>12 AM</span>
        <span>4 AM</span>
        <span>8 AM</span>
        <span>12 PM</span>
        <span>4 PM</span>
        <span>8 PM</span>
      </div>

      <div className="chart-legend">
        <span><i className="legend-dot teal" /> Service health</span>
      </div>
    </section>
  )
}

function IncidentStatusChart({ incidents }: { incidents: Incident[] }) {
  const counts = useMemo(
    () =>
      INCIDENT_STATUSES.map((status) => ({
        ...status,
        count: incidents.filter(
          (incident) => incident.status === status.name,
        ).length,
      })),
    [incidents],
  )

  const total = incidents.length
  let currentAngle = 0

  const gradient = total === 0
    ? '#edf1f6'
    : `conic-gradient(${counts
        .filter((item) => item.count > 0)
        .map((item) => {
          const start = currentAngle
          currentAngle += (item.count / total) * 360
          return `${item.color} ${start}deg ${currentAngle}deg`
        })
        .join(', ')})`

  return (
    <section className="incident-status-panel overview-panel">
      <div className="panel-title">
        <div>
          <h2>Incident Status</h2>
          <p>Current incident distribution</p>
        </div>
      </div>

      <div className="donut-layout">
        <div
          className="donut-chart"
          style={{ background: gradient }}
          role="img"
          aria-label={`Incident status breakdown: ${total} total incidents`}
        >
          <div className="donut-hole">
            <strong>{total}</strong>
            <span>Total incidents</span>
          </div>
        </div>

        <ul className="donut-legend">
          {counts.map((item) => (
            <li key={item.name}>
              <span className="legend-label">
                <i className="legend-dot" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <strong>{item.count}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function RecentIncidentsTable({ incidents, services }: {
  incidents: Incident[]
  services: Service[]
}) {
  const latestIncidents = [...incidents]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 4)

  const serviceNames = new Map(
    services.map((service) => [service.id, service.name]),
  )

  return (
    <section className="recent-incidents-panel overview-panel">
      <div className="panel-title">
        <div>
          <h2>Recent Incidents</h2>
          <p>Latest reported issues across monitored services</p>
        </div>
      </div>

      <div className="incident-table-wrap">
        <table className="incident-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Issue</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Reported</th>
            </tr>
          </thead>

          <tbody>
            {latestIncidents.map((incident) => (
              <tr key={incident.id}>
                <td>
                  {incident.serviceName ||
                    serviceNames.get(incident.serviceId) ||
                    `Service ${incident.serviceId}`}
                </td>
                <td>{incident.title}</td>
                <td>{incident.severity}</td>
                <td>
                  <span className={`incident-status ${getStatusClass(incident.status)}`}>
                    {incident.status}
                  </span>
                </td>
                <td>{formatDate(incident.createdAt)}</td>
              </tr>
            ))}

            {latestIncidents.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">
                  No incidents to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ToDoPanel({
  isAdmin,
  pendingAbandonments,
  unassignedIncidents,
  downServices,
  assignedIncidents,
}: {
  isAdmin: boolean
  pendingAbandonments: number
  unassignedIncidents: number
  downServices: number
  assignedIncidents: number
}) {
  const items = isAdmin
    ? [
        {
          label: 'Pending abandonment requests',
          count: pendingAbandonments,
          detail: 'Requests requiring your review',
          tone: 'todo-warning',
        },
        {
          label: 'Unassigned incidents',
          count: unassignedIncidents,
          detail: 'Active incidents without an owner',
          tone: 'todo-info',
        },
        {
          label: 'Services marked Down',
          count: downServices,
          detail: 'Services requiring attention',
          tone: 'todo-danger',
        },
      ]
    : [
        {
          label: 'Abandonment requests awaiting approval',
          count: pendingAbandonments,
          detail: 'Your submitted requests awaiting review',
          tone: 'todo-warning',
        },
        {
          label: 'Assigned incidents',
          count: assignedIncidents,
          detail: 'Incidents currently assigned to you',
          tone: 'todo-info',
        },
      ]

  return (
    <section className="todo-panel overview-panel">
      <div className="panel-title">
        <div>
          <h2>To-do</h2>
          <p>{isAdmin ? 'Items requiring administrator attention' : 'Your outstanding work'}</p>
        </div>
        <span className="todo-role">{isAdmin ? 'ADMINISTRATOR' : 'CONTRIBUTOR'}</span>
      </div>

      <div className="todo-grid">
        {items.map((item) => (
          <article className={`todo-item ${item.tone}`} key={item.label}>
            <div className="todo-count">{item.count}</div>
            <div className="todo-copy">
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
            <span className="todo-arrow" aria-hidden="true">›</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function OverviewPage({ currentUser }: OverviewPageProps) {
  const isAdmin = currentUser.permission === 'Administrator'

  const {
    services,
    loading: servicesLoading,
    error: servicesError,
  } = useServices()

  const {
    incidents,
    loading: incidentsLoading,
    error: incidentsError,
  } = useIncidents()

  const {
    assignments,
    abandonmentRequests,
    abandonmentLoading,
    abandonmentError,
  } = useAssignments(true, isAdmin)

  const today = new Date().toDateString()

  const openCount = incidents.filter(
    (incident) => incident.status === 'Open',
  ).length

  const investigatingCount = incidents.filter(
    (incident) => incident.status === 'Investigating',
  ).length

  const resolvedTodayCount = incidents.filter(
    (incident) =>
      incident.status === 'Resolved' &&
      incident.resolvedAt !== null &&
      new Date(incident.resolvedAt).toDateString() === today,
  ).length

  const operationalCount = services.filter(
    (service) => service.status === 'Operational',
  ).length

  const degradedCount = services.filter(
    (service) => service.status === 'Degraded',
  ).length

  const pendingAbandonments = isAdmin
    ? abandonmentRequests.filter((request) => request.status === 'Pending').length
    : assignments.filter(
        (assignment) =>
          assignment.isActive &&
          assignment.pendingAbandonmentRequest !== null &&
          assignment.pendingAbandonmentRequest !== undefined,
      ).length

  const unassignedIncidents = incidents.filter(
    (incident) =>
      incident.status !== 'Resolved' &&
      incident.assignmentId === null,
  ).length

  const downServices = services.filter(
    (service) => service.status === 'Down',
  ).length

  const assignedIncidents = isAdmin
    ? assignments.filter((assignment) => assignment.isActive).length
    : incidents.filter(
        (incident) =>
          incident.isAssignedToCurrentUser &&
          incident.status !== 'Resolved',
      ).length

  const loading = servicesLoading || incidentsLoading
  const error = servicesError || incidentsError || abandonmentError

  return (
    <main className="overview-page">
      <header className="overview-header">
        <div>
          <h1>Operations Overview</h1>
          <p>Here’s what’s happening across your services and operations.</p>
        </div>
        <span className="overview-live-status"><i /> Live operations</span>
      </header>

      {error && <div className="notice-error">{error}</div>}

      <section className="overview-main-grid">
        <div className="summary-grid">
          <SummaryCard
            label="Open Incidents"
            value={loading ? '—' : openCount}
            icon="!"
            iconClass="icon-alert"
            footnote="Currently open"
          />

          <SummaryCard
            label="Investigating"
            value={loading ? '—' : investigatingCount}
            icon="◷"
            iconClass="icon-warning"
            footnote="Being investigated"
          />

          <SummaryCard
            label="Resolved Today"
            value={loading ? '—' : resolvedTodayCount}
            icon="✓"
            iconClass="icon-success"
            footnote="Resolved since midnight"
          />

          <SummaryCard
            label="Monitored Services"
            value={loading ? '—' : services.length}
            icon="▤"
            iconClass="icon-info"
            footnote={
              loading
                ? 'Loading services'
                : `${operationalCount} operational · ${degradedCount} degraded`
            }
          />
        </div>

        <HealthGraph />
        <IncidentStatusChart incidents={incidents} />
      </section>

      <section className="overview-bottom-grid">
        <ToDoPanel
          isAdmin={isAdmin}
          pendingAbandonments={pendingAbandonments}
          unassignedIncidents={unassignedIncidents}
          downServices={downServices}
          assignedIncidents={assignedIncidents}
        />

        <RecentIncidentsTable incidents={incidents} services={services} />
      </section>

      {isAdmin && abandonmentLoading && (
        <p className="overview-loading-note">Refreshing abandonment requests…</p>
      )}
    </main>
  )
}

export default OverviewPage
