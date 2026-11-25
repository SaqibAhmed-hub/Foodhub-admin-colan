import { useId } from 'react'

/**
 * Label + control + hint/error, wired for accessibility.
 * Usage: <Field label="Email" error={err}>{(props) => <input className="input" {...props} />}</Field>
 */
export default function Field({ label, hint, error, className = '', children }) {
  const id = useId()
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  return (
    <div className={`field ${className}`}>
      {label && <label htmlFor={id}>{label}</label>}
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy })}
      {error ? <span className="error" id={`${id}-err`} role="alert">{error}</span> : hint ? <span className="hint" id={`${id}-hint`}>{hint}</span> : null}
    </div>
  )
}
