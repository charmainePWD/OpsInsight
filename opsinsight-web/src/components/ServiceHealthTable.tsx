
import { useState } from 'react'
import type { Service } from '../types'

type ServiceHealthTableProps = {
  services: Service[]
  loading: boolean
  error: string | null
}

function ServiceHealthTable({
  services,
  loading,
  error,
}: ServiceHealthTableProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const totalPages = Math.max(1, Math.ceil(services.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const visibleServices = services.slice(startIndex, startIndex + pageSize)

  function changePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  return (
    <section className="panel" id="services">
      <div className="panel-heading">
        <div>
          <h2>Service health</h2>
          <p>Current status of monitored services</p>
        </div>
        {/* <span className="subtle-label">{services.length} services</span> */}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SERVICE</th>
              <th>STATUS</th>
              <th>UPTIME</th>
              <th>RESPONSE TIME</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="empty-state">
                  Loading services...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={4} className="empty-state">
                  Could not load services: {error}
                </td>
              </tr>
            )}

            {!loading && !error && visibleServices.map((service) => (
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
                  <span className={`status status-${service.status.toLowerCase()}`}>
                    <span />
                    {service.status}
                  </span>
                </td>

                <td><strong>{service.uptimePercentage}%</strong></td>

                <td>
                  <span className={service.responseTimeMs > 500 ? 'text-orange' : ''}>
                    {service.responseTimeMs} ms
                  </span>
                </td>
              </tr>
            ))}

            {!loading && !error && services.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-state">
                  No services found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && services.length > 0 && (
        <div className="pagination">
          <label className="page-size">
            Rows per page
            <select
              value={pageSize}
              onChange={(event) => changePageSize(Number(event.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </label>

          <span className="page-info">
            {startIndex + 1}–{Math.min(startIndex + pageSize, services.length)} of {services.length}
          </span>

          <div className="page-buttons">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default ServiceHealthTable
