import type { User } from '../types'
import ServiceHealthTable from '../components/ServiceHealthTable'
import { useServices } from '../hooks/useServices'

type Props = { currentUser: User }

function ServicesPage({ currentUser }: Props) {
  const { services, loading, error } = useServices()
  const downCount = services.filter(
    service => service.status === 'Down',
  ).length

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">INFRASTRUCTURE</div>
          <h1>Monitored services</h1>
          <p>Review service status, uptime and response performance.</p>
        </div>
        <div className="page-count">
          <strong>{loading ? '—' : downCount}</strong>
          <span>services down</span>
        </div>
      </section>

      <ServiceHealthTable
        services={services}
        loading={loading}
        error={error}
        currentUser={currentUser}
      />

      <footer>
        OpsInsight <span>·</span> Service monitoring
      </footer>
    </>
  )
}

export default ServicesPage
