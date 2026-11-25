import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Button from '../../shared/ui/Button'
import Field from '../../shared/ui/Field'
import Icon from '../../shared/ui/Icon'
import { useAuth } from './AuthContext'
import './auth.css'

export default function LoginPage() {
  const { user, requestOtp, login } = useAuth()
  const [step, setStep] = useState('email') // 'email' -> 'otp'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  async function sendCode(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await requestOtp(email.trim())
      setStep('otp')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function verify(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email.trim(), otp.trim())
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="login">
      <section className="login-hero" aria-hidden="true">
        <div className="login-plate"><span /></div>
        <div className="login-hero-text">
          <span className="login-brand">FoodHub</span>
          <h2>Lunch, planned with care.</h2>
          <p>Set the menu, open the ordering window, and let your team eat well.</p>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={step === 'email' ? sendCode : verify} noValidate>
          <div className="login-lock"><Icon name="lock" size={20} /></div>
          <h1>Admin sign in</h1>
          <p className="muted">
            {step === 'email'
              ? 'Enter your work email and we will send you a one-time code.'
              : <>We sent a 6-digit code to <strong>{email.trim()}</strong>.</>}
          </p>

          {error && <div className="alert alert-error" role="alert">{error}</div>}

          {step === 'email' ? (
            <Field label="Work email">
              {(p) => (
                <input {...p} className="input" type="email" autoComplete="email" autoFocus required
                  placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              )}
            </Field>
          ) : (
            <Field label="One-time code" hint="Codes expire after 5 minutes.">
              {(p) => (
                <input {...p} className="input otp-input" inputMode="numeric" autoComplete="one-time-code" autoFocus
                  maxLength={6} placeholder="••••••" value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
              )}
            </Field>
          )}

          <Button type="submit" size="lg" loading={busy}
            disabled={step === 'email' ? !email.trim() : otp.length !== 6}>
            {step === 'email' ? 'Send code' : 'Sign in'}
          </Button>

          {step === 'otp' && (
            <button type="button" className="link-btn" onClick={() => { setStep('email'); setOtp(''); setError('') }}>
              Use a different email
            </button>
          )}
        </form>
      </section>
    </main>
  )
}
