import Button from './Button'

export function Loading({ label = 'Loading…' }) {
  return <div className="loading" role="status"><span className="spinner" aria-hidden="true" />{label}</div>
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty">
      <div className="plate" aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="alert alert-error row" role="alert">
      <span className="grow">{error?.message || 'Something went wrong.'}</span>
      {onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  )
}
