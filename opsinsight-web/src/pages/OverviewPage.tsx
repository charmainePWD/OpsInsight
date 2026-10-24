
import { useMemo } from 'react'
import SummaryCard from '../components/SummaryCard'
import { useServices } from '../hooks/useServices'
import { useIncidents } from '../hooks/useIncidents'
import type { Incident, Service } from '../types'
import '../styles/OverviewPage.css'


const INCIDENT_STATUSES = [
  { name: 'Open', color: '#5a8df5' },
  { name: 'Investigating', color: '#692ad4' },
  { name: 'Monitoring', color: '#1a3b5a' },
  { name: 'Resolved', color: '#0a846a' },
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
    [0, 32],
    [35, 28],
    [70, 31],
    [105, 24],
    [140, 27],
    [175, 35],
    [210, 29],
    [245, 31],
    [280, 25],
    [315, 29],
    [350, 22],
    [385, 27],
    [420, 21],
    [455, 25],
    [490, 18],
    [525, 23],
    [560, 20],
    [595, 25],
    [630, 19],
    [665, 22],
    [700, 17],
    [735, 21],
    [770, 18],
    [800, 20],
  ]

  const linePath = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`)
    .join(' ')

  const areaPath = `${linePath} L 800 120 L 0 120 Z`

  return (
    <section className="health-panel">
      <div className="panel-title">
        <span className="heading-icon" aria-hidden="true">
          <span>⌁</span>
        </span>

        <div>
          <h2>Service Health</h2>
          <p>System health over time</p>
        </div>

        <div style={{ flex: 1 }} />

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
              <stop offset="0%" stopColor="#35b58a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#35b58a" stopOpacity="0.01" />
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

          {[0, 160, 320, 480, 640, 800].map((x) => (
            <line
              key={x}
              x1={x}
              y1="0"
              x2={x}
              y2="120"
              stroke="#f0f3f8"
              strokeWidth="1"
            />
          ))}

          <path d={areaPath} fill="url(#healthAreaGradient)" />

          <path
            d={linePath}
            fill="none"
            stroke="#35b58a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {points
            .filter((_, index) => index % 4 === 0)
            .map(([x, y]) => (
              <circle
                key={x}
                cx={x}
                cy={y}
                r="3"
                fill="#ffffff"
                stroke="#35b58a"
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
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#35b58a',
              marginRight: 5,
            }}
          />
          Service health
        </span>
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
    <section className="incident-status-panel" >
      <div className="panel-title">
        <span className="heading-icon" aria-hidden="true">
          <span>◔</span>
        </span>

        <div>
          <h2>Incident Status</h2>
          <p>Breakdown by current status</p>
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
              <span>
                <span
                  className="legend-dot"
                  style={{ backgroundColor: item.color }}
                />
                {` ${item.name}: `}
              </span>

              <strong>{item.count}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function RecentIncidentsTable({
  incidents,
  services,
}: {
  incidents: Incident[]
  services: Service[]
}) {
  const latestIncidents = [...incidents]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    )
    .slice(0, 5)

  const serviceNames = new Map(
    services.map((service) => [service.id, service.name]),
  )

  return (
    <section className="recent-incidents-panel">
      <div className="panel-title">
        <h2>Recent Incidents</h2>
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
                  <span className= {`incident-status ${getStatusClass(incident.status)}`}>
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

function OverviewPage() {
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

  const loading = servicesLoading || incidentsLoading
  const error = servicesError || incidentsError

  return (
    <main className="overview-page">
      <header className="overview-header">
        <div>
          <h1>       Operations Overview</h1>
          <p>Here’s what’s happening with your services and operations.</p>
        </div>
      </header>

      {error && <div className="notice-error">{error}</div>}

      <section className="summary-grid">
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
            loading ? (
              'Loading services'
            ) : (
              <>
                <span>{operationalCount} operational</span>
                {' · '}
                <span>{degradedCount} degraded</span>
              </>
            )
          }
        />
      </section>

      <section className="overview-charts">
        <HealthGraph />
        <IncidentStatusChart incidents={incidents} />
      </section>

      <section className="overview-bottom">
        <RecentIncidentsTable
          incidents={incidents}
          services={services}
        />
      </section>
    </main>
  )
}

export default OverviewPage
