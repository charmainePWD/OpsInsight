
import ServiceHealthTable from '../components/ServiceHealthTable'
import { useServices } from '../hooks/useServices'

function ServicesPage() {
  const { services, loading, error } = useServices()


const downCount = services.filter(
    (service) => service.status == 'Down',
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
          <span>services down!</span>
        </div>
      </section>

      <ServiceHealthTable
        services={services}
        loading={loading}
        error={error}
      />

      <footer>
        OpsInsight <span>·</span> Service monitoring
      </footer>
    </>
  )
}

export default ServicesPage
