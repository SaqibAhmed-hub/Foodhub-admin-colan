import { useState } from 'react'
import Badge from '../../shared/ui/Badge'
import Button from '../../shared/ui/Button'
import Icon from '../../shared/ui/Icon'
import PageHeader from '../../shared/ui/PageHeader'
import { EmptyState, ErrorState, Loading } from '../../shared/ui/States'
import { useToast } from '../../shared/ui/Toast'
import { dateLabel, orgNow, relativeDay, time12 } from '../../shared/lib/time'
import { useAsync } from '../../shared/lib/useAsync'
import { phaseOf } from '../dashboard/portal'
import { menusApi } from './menusApi'
import './menus.css'

function statusOf(menu, now) {
  if (menu.menuDate < now.date) return { tone: 'neutral', label: 'Ended' }
  if (menu.menuDate > now.date) return menu.published ? { tone: 'info', label: 'Scheduled' } : { tone: 'warn', label: 'Draft' }
  if (!menu.published) return { tone: 'warn', label: 'Draft' }
  return {
    NOT_OPEN: { tone: 'warn', label: 'Opens later today' },
    ORDERING_OPEN: { tone: 'success', label: 'Ordering open' },
    ORDERING_CLOSED: { tone: 'danger', label: 'Ordering closed' },
    PICKUP_OPEN: { tone: 'info', label: 'Pickup in progress' },
    ENDED: { tone: 'neutral', label: 'Ended' },
  }[phaseOf(menu, now.time)]
}

export default function MenusPage() {
  const toast = useToast()
  const now = orgNow()
  const list = useAsync(() => menusApi.list(), [])
  const [publishing, setPublishing] = useState(null)

  async function publish(menu) {
    setPublishing(menu.id)
    try {
      await menusApi.publish(menu.id)
      toast.success(`Menu for ${dateLabel(menu.menuDate)} published.`)
      list.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPublishing(null)
    }
  }

  const menus = list.data

  return (
    <div className="stack-lg">
      <PageHeader
        title="Daily menus"
        subtitle="Last 7 days and the next 2 weeks."
        actions={<Button to="/menus/new" icon={<Icon name="plus" />}>New menu</Button>}
      />

      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
      {!menus && !list.error && <Loading />}
      {menus && menus.length === 0 && (
        <section className="card">
          <EmptyState title="No menus in this period" action={<Button to="/menus/new" icon={<Icon name="plus" />}>Create a menu</Button>}>
            Create a menu to let employees order lunch.
          </EmptyState>
        </section>
      )}

      <div className="menu-list">
        {menus?.map((m) => {
          const st = statusOf(m, now)
          const rel = relativeDay(m.menuDate, now.date)
          const editable = st.label !== 'Ended'
          return (
            <article className="card menu-card" key={m.id}>
              <div className="menu-card-head">
                <div>
                  <h2>{rel ? <>{rel} <span className="muted menu-date">· {dateLabel(m.menuDate)}</span></> : dateLabel(m.menuDate)}</h2>
                  <p className="muted small">
                    Orders {time12(m.orderOpenTime)} – {time12(m.orderCloseTime)} · Pickup {time12(m.pickupStartTime)} – {time12(m.pickupEndTime)}
                  </p>
                </div>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>

              <ul className="dish-chips">
                {m.items.map((i) => (
                  <li key={i.menuItemId}>
                    <strong>{i.name}</strong>
                    <span style={{ color: 'var(--muted)' , fontSize: '12px' , marginTop: '4px' }}>{i.totalQty} qty</span>
                  </li>
                ))}
              </ul>

              <div className="row menu-card-foot">
                {!m.published && editable && (
                  <Button size="sm" loading={publishing === m.id} onClick={() => publish(m)}>Publish</Button>
                )}
                {editable
                  ? <Button size="sm" variant="secondary" to={`/menus/${m.id}`} icon={<Icon name="edit" size={15} />}>Edit</Button>
                  : <Button size="sm" variant="ghost" to={`/menus/${m.id}`}>View</Button>}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
