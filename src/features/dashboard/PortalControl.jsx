import { useState } from 'react'
import Badge from '../../shared/ui/Badge'
import Button from '../../shared/ui/Button'
import ConfirmDialog from '../../shared/ui/ConfirmDialog'
import Icon from '../../shared/ui/Icon'
import { useToast } from '../../shared/ui/Toast'
import { hm, orgNow, time12 } from '../../shared/lib/time'
import { menusApi } from '../menus/menusApi'
import OpenPortalDialog from './OpenPortalDialog'
import { buildUpdateBody, phaseOf, planClose } from './portal'
import './dashboard.css'

const STATUS = {
  NOT_OPEN: { tone: 'warn', title: 'Ordering not open yet', text: (m) => `Opens automatically at ${time12(m.orderOpenTime)}` },
  ORDERING_OPEN: { tone: 'success', title: 'Ordering is open', text: (m) => `Employees can order until ${time12(m.orderCloseTime)}` },
  ORDERING_CLOSED: { tone: 'danger', title: 'Ordering is closed', text: (m) => `Pickup starts at ${time12(m.pickupStartTime)}` },
  PICKUP_OPEN: { tone: 'info', title: 'Pickup in progress', text: (m) => `Employees collect their food until ${time12(m.pickupEndTime)}` },
  ENDED: { tone: 'neutral', title: "Today's service has ended", text: () => 'See you tomorrow.' },
}

function Timeline({ menu, nowTime }) {
  const steps = [
    ['Orders open', hm(menu.orderOpenTime)],
    ['Orders close', hm(menu.orderCloseTime)],
    ['Pickup starts', hm(menu.pickupStartTime)],
    ['Pickup ends', hm(menu.pickupEndTime)],
  ]
  return (
    <ol className="timeline" aria-label="Today's schedule">
      {steps.map(([label, t]) => (
        <li key={label} className={nowTime >= t ? 'done' : ''}>
          <span className="dot" />
          <span className="t-time num">{time12(t)}</span>
          <span className="t-label">{label}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * The heart of the dashboard: shows whether the ordering portal is open and lets the admin open or close it.
 * `onChanged` refetches the dashboard data after a successful change.
 */
export default function PortalControl({ menu, now, onChanged }) {
  const toast = useToast()
  const [dialog, setDialog] = useState(null) // 'open' | 'extend' | 'close'
  const [publishOnOpen, setPublishOnOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!menu) {
    return (
      <section className="card portal portal-empty">
        <div>
          <Badge tone="neutral">No menu</Badge>
          <h2>There is no menu for today</h2>
          <p className="muted">Create today's menu with the dishes and quantities, then open ordering.</p>
        </div>
        <Button to="/menus/new" size="lg" icon={<Icon name="plus" />}>Create today's menu</Button>
      </section>
    )
  }

  const phase = phaseOf(menu, now.time)
  const status = STATUS[phase]
  const draft = !menu.published
  const closedForGood = phase === 'PICKUP_OPEN' || phase === 'ENDED'

  async function run(patch, { publish = false, message }) {
    setBusy(true)
    try {
      if (patch) await menusApi.update(menu.id, buildUpdateBody(menu, patch))
      if (publish && draft) await menusApi.publish(menu.id)
      toast.success(message)
      setDialog(null)
      onChanged()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  function closeNow() {
    const plan = planClose(menu, orgNow().time) // fresh clock: the page's `now` can be ~30s old
    if (plan.error) { setDialog(null); return toast.error(plan.error) }
    run(plan.patch, { message: 'Ordering is now closed.' })
  }

  const openFor = (mode, publish = false) => { setPublishOnOpen(publish); setDialog(mode) }

  return (
    <section className={`card portal portal-${draft ? 'draft' : status.tone}`}>
      <div className="portal-main">
        <div className="portal-status">
          <span className={`pulse pulse-${draft ? 'warn' : status.tone}`} aria-hidden="true" />
          <div>
            <div className="row" style={{ gap: 8 }}>
              <h2>{draft ? 'Menu is a draft' : status.title}</h2>
              {draft && <Badge tone="warn">Hidden from employees</Badge>}
            </div>
            <p className="muted">
              {draft ? 'Publish the menu so employees can see it when ordering opens.' : status.text(menu)}
            </p>
          </div>
        </div>

        <div className="portal-actions">
          {draft && !closedForGood && (
            <>
              <Button size="lg" icon={<Icon name="check" />} onClick={() => openFor('open', true)}>Publish &amp; open now</Button>
              <Button variant="secondary" loading={busy} onClick={() => run(null, { publish: true, message: 'Menu published.' })}>Publish on schedule</Button>
            </>
          )}
          {!draft && phase === 'NOT_OPEN' && (
            <Button size="lg" icon={<Icon name="clock" />} onClick={() => openFor('open')}>Open ordering now</Button>
          )}
          {!draft && phase === 'ORDERING_OPEN' && (
            <>
              <Button size="lg" variant="danger" icon={<Icon name="x" />} onClick={() => setDialog('close')}>Close ordering now</Button>
              <Button variant="secondary" onClick={() => openFor('extend')}>Change closing time</Button>
            </>
          )}
          {!draft && phase === 'ORDERING_CLOSED' && (
            <Button size="lg" variant="sage" icon={<Icon name="refresh" />} onClick={() => openFor('open')}>Reopen ordering</Button>
          )}
          <Button variant="ghost" to={`/menus/${menu.id}`}>Edit menu &amp; timings</Button>
        </div>
      </div>

      <Timeline menu={menu} nowTime={now.time} />

      {dialog === 'close' && (
        <ConfirmDialog
          danger busy={busy} title="Close ordering now?" confirmLabel="Close ordering"
          message="Employees will no longer be able to place or cancel orders. Orders already placed are kept."
          onConfirm={closeNow} onClose={() => setDialog(null)}
        />
      )}
      {(dialog === 'open' || dialog === 'extend') && (
        <OpenPortalDialog
          menu={menu} nowTime={now.time} mode={dialog} busy={busy} onClose={() => setDialog(null)}
          onConfirm={(plan) => run(plan.patch, {
            publish: publishOnOpen,
            message: dialog === 'extend' ? 'Closing time updated.' : 'Ordering is now open.',
          })}
        />
      )}
    </section>
  )
}
