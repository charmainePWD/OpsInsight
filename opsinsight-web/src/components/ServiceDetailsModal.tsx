import type { Service, User } from '../types'
import '../styles/ServiceDetails.css'

type Props = {
  service: Service
  currentUser: User
  onClose: () => void
}

function Detail({
  label,
  value,
}: {
  label: string
  value: string | number | null | undefined
}) {
  return (
    <div className="incident-email-row">
      <span>{label}</span>
      <strong>
        {value === null || value === undefined || value === ''
          ? 'Not configured'
          : value}
      </strong>
    </div>
  )
}

function ServiceDetailsModal({ service, currentUser, onClose }: Props) {
  const isAdmin = currentUser.permission === 'Administrator'

  return (
    <div
      className="incident-modal-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="incident-modal service-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
      >
        <header className="incident-modal-header">
          <div>
            <span className="incident-modal-reference">
              SERVICE DETAILS · SVC-{String(service.id).padStart(4, '0')}
            </span>
            <h2 id="service-modal-title">{service.name}</h2>
            <p>{service.category}</p>
          </div>
          <button
            type="button"
            className="incident-modal-close"
            aria-label="Close service details"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="incident-modal-content">
          <div className="incident-modal-badges">
            <span className={`status status-${service.status.toLowerCase()}`}>
              <span />
              {service.status}
            </span>
            <span className="service-detail-metric">
              {service.uptimePercentage}% uptime
            </span>
            <span className="service-detail-metric">
              {service.responseTimeMs} ms response
            </span>
          </div>

          <section className="incident-email-section">
            <h3>Service information</h3>
            <Detail label="Service name" value={service.name} />
            <Detail label="Category" value={service.category} />
            <Detail label="Description" value={service.description} />
            <Detail label="Current status" value={service.status} />
            <Detail
              label="Uptime"
              value={`${service.uptimePercentage}%`}
            />
            <Detail
              label="Response time"
              value={`${service.responseTimeMs} ms`}
            />
          </section>

          <section className="incident-email-section">
            <h3>Azure resource details</h3>
            <Detail label="Tenant" value={service.tenantName} />
            <Detail label="Tenant ID" value={service.tenantId} />
            <Detail label="Subscription" value={service.subscriptionName} />
            <Detail label="Subscription ID" value={service.subscriptionId} />
            <Detail label="Resource group" value={service.resourceGroup} />
            <Detail label="Resource type" value={service.resourceType} />
            <Detail label="Azure region" value={service.region} />
            <Detail label="Environment" value={service.environment} />
            <Detail label="Azure resource ID" value={service.azureResourceId} />
          </section>

          <section className="service-controls-section">
            <div>
              <h3>Service controls</h3>
              <p>
                These controls are placeholders. Azure service operations are
                not connected yet.
              </p>
            </div>
            <div className="service-control-buttons">
              <button
                type="button"
                className="service-control-button"
                disabled={!isAdmin}
                onClick={() => {}}
              >
                Restart service
              </button>
              <button
                type="button"
                className="service-control-button service-control-danger"
                disabled={!isAdmin}
                onClick={() => {}}
              >
                Stop service
              </button>
              <button
                type="button"
                className="service-control-button"
                disabled={!isAdmin}
                onClick={() => {}}
              >
                Start service
              </button>
            </div>
            {!isAdmin && (
              <small>
                Administrator access is required to view enabled service
                controls.
              </small>
            )}
          </section>
        </div>

        <footer className="incident-modal-footer">
          <span className="incident-modal-permission">
            {isAdmin
              ? 'Administrator view · Actions are not connected'
              : 'Contributor view · Controls disabled'}
          </span>
          <div className="incident-modal-actions">
            <button
              type="button"
              className="incident-secondary-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}

export default ServiceDetailsModal
