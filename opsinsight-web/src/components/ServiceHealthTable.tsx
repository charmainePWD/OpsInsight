import { useMemo, useState } from 'react'
import type { Service, User } from '../types'
import ServiceDetailsModal from './ServiceDetailsModal'

type Props = {
  services: Service[]
  loading: boolean
  error: string | null
  currentUser: User
}

const statuses = ['All', 'Operational', 'Degraded', 'Down']

function ServiceHealthTable({
  services,
  loading,
  error,
  currentUser,
}: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const filtered = useMemo(
    () =>
      services.filter(service => {
        const query = search.trim().toLowerCase()
        const matchesSearch = [
          service.name,
          service.category,
          service.status,
        ].some(value => value.toLowerCase().includes(query))

        return matchesSearch && (filter === 'All' || service.status === filter)
      }),
    [services, search, filter],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const visible = filtered.slice(start, start + pageSize)

  function changeSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function changeFilter(value: string) {
    setFilter(value)
    setPage(1)
  }

  function changePageSize(value: number) {
    setPageSize(value)
    setPage(1)
  }

  return (
    <>
      <section className="panel" id="services">
        <div className="panel-heading">
          <div>
            <h2>Service health</h2>
            <p>Current service availability and performance.</p>
          </div>
        </div>

        <div className="incident-tools">
          <input
            type="search"
            aria-label="Search services"
            placeholder="Search service or category..."
            value={search}
            onChange={event => changeSearch(event.target.value)}
          />
          <select
            aria-label="Filter by service status"
            value={filter}
            onChange={event => changeFilter(event.target.value)}
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'All' ? 'All statuses' : status}
              </option>
            ))}
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SERVICE</th>
                <th>STATUS</th>
                <th>UPTIME</th>
                <th>RESPONSE TIME</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Loading services...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Could not load services: {error}
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                visible.map(service => (
                  <tr key={service.id}>
                    <td>
                      <div className="service-name">
                        <div className="service-symbol">
                          {service.name.charAt(0)}
                        </div>
                        <div>
                          <strong>{service.name}</strong>
                          <span>{service.category}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status status-${service.status.toLowerCase()}`}
                      >
                        <span />
                        {service.status}
                      </span>
                    </td>
                    <td>
                      <strong>{service.uptimePercentage}%</strong>
                    </td>
                    <td>
                      <span
                        className={
                          service.responseTimeMs > 500 ? 'text-orange' : ''
                        }
                      >
                        {service.responseTimeMs} ms
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="incident-view-button"
                        onClick={() => setSelectedService(service)}
                      >
                        More Details
                      </button>
                    </td>
                  </tr>
                ))}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No services match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && filtered.length > 0 && (
          <div className="pagination">
            <label className="page-size">
              Rows per page
              <select
                value={pageSize}
                onChange={event =>
                  changePageSize(Number(event.target.value))
                }
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </label>
            <span className="page-info">
              {start + 1}–{Math.min(start + pageSize, filtered.length)} of{' '}
              {filtered.length}
            </span>
            <div className="page-buttons">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(value => Math.max(1, value - 1))}
              >
                Previous
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(value => Math.min(totalPages, value + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedService && (
        <ServiceDetailsModal
          service={selectedService}
          currentUser={currentUser}
          onClose={() => setSelectedService(null)}
        />
      )}
    </>
  )
}

export default ServiceHealthTable
