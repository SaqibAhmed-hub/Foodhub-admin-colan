import { Link } from 'react-router-dom'

/**
 * variant: primary | secondary | ghost | danger | sage      size: sm | md | lg
 * Pass `to` to render a router link that looks like a button.
 */
export default function Button({ variant = 'primary', size = 'md', loading = false, icon, to, children, className = '', disabled, ...rest }) {
  const cls = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''} ${className}`.trim()
  const content = (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon}
      {children}
    </>
  )
  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>
  return (
    <button className={cls} disabled={disabled || loading} type={rest.type || 'button'} {...rest}>
      {content}
    </button>
  )
}
