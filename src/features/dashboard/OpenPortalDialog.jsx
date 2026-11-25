import { useState } from 'react'
import Button from '../../shared/ui/Button'
import Field from '../../shared/ui/Field'
import Modal from '../../shared/ui/Modal'
import { hm, orgNow, time12 } from '../../shared/lib/time'
import { planOpen } from './portal'

/** Asks "until when?" and validates against the menu's pickup start before anything is sent. */
export default function OpenPortalDialog({ menu, nowTime, mode, busy, onConfirm, onClose }) {
  const suggested = hm(menu.orderCloseTime) > nowTime ? hm(menu.orderCloseTime) : hm(menu.pickupStartTime)
  const [closeTime, setCloseTime] = useState(suggested)
  const [error, setError] = useState('')

  const extending = mode === 'extend'
  const title = extending ? 'Change closing time' : 'Open ordering now'

  function submit(e) {
    e.preventDefault()
    const plan = planOpen(menu, orgNow().time, closeTime) // fresh clock at click time
    if (plan.error) return setError(plan.error)
    setError('')
    onConfirm(plan)
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="open-portal-form" loading={busy}>{extending ? 'Save closing time' : 'Open ordering'}</Button>
        </>
      }
    >
      <form id="open-portal-form" className="stack" onSubmit={submit}>
        <p className="muted">
          {extending
            ? 'Employees can keep ordering until the new closing time.'
            : <>Employees will be able to order <strong>immediately</strong>, until the closing time you choose.</>}
        </p>
        <Field label="Close ordering at" error={error}
          hint={`Pickup starts at ${time12(menu.pickupStartTime)}, so ordering must close by then.`}>
          {(p) => <input {...p} className="input" type="time" required value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />}
        </Field>
      </form>
    </Modal>
  )
}
