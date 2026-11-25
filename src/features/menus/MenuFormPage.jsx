import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { foodItemsApi } from '../food-items/foodItemsApi'
import Button from '../../shared/ui/Button'
import Field from '../../shared/ui/Field'
import Icon from '../../shared/ui/Icon'
import PageHeader from '../../shared/ui/PageHeader'
import { ErrorState, Loading } from '../../shared/ui/States'
import { useToast } from '../../shared/ui/Toast'
import { money } from '../../shared/lib/format'
import { dateLabel, orgNow } from '../../shared/lib/time'
import { useAsync } from '../../shared/lib/useAsync'
import { phaseOf } from '../dashboard/portal'
import { menusApi } from './menusApi'
import { DEFAULT_TIMES, formFromMenu, newRow, toItems, validateMenu } from './menuRules'
import './menus.css'

export default function MenuFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const now = orgNow()

  const foods = useAsync(() => foodItemsApi.list(), [])
  const existing = useAsync(() => (editing ? menusApi.get(id) : Promise.resolve(null)), [id])

  const [form, setForm] = useState({ menuDate: now.date, ...DEFAULT_TIMES, rows: [newRow()] })
  const [ready, setReady] = useState(!editing)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (existing.data && !ready) { setForm(formFromMenu(existing.data)); setReady(true) }
  }, [existing.data, ready])

  const menu = existing.data
  const ended = editing && menu && (menu.menuDate < now.date || (menu.menuDate === now.date && phaseOf(menu, now.time) === 'ENDED'))
  const isDraft = !editing || (menu && !menu.published)
  const catalogue = foods.data || []

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setRow = (key, patch) => setForm((f) => ({ ...f, rows: f.rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) }))
  const removeRow = (key) => setForm((f) => ({ ...f, rows: f.rows.filter((r) => r.key !== key) }))
  const addRow = () => setForm((f) => ({ ...f, rows: [...f.rows, newRow()] }))

  async function save(publish) {
    const found = validateMenu(form, { editing, today: now.date })
    setErrors(found)
    if (Object.keys(found).length) return

    const times = {
      orderOpenTime: form.orderOpenTime, orderCloseTime: form.orderCloseTime,
      pickupStartTime: form.pickupStartTime, pickupEndTime: form.pickupEndTime,
    }
    setBusy(true)
    try {
      let menuId = id
      if (editing) {
        await menusApi.update(id, { ...times, items: toItems(form.rows) })
      } else {
        const created = await menusApi.create({ menuDate: form.menuDate, ...times, items: toItems(form.rows) })
        menuId = created.id
      }
      if (publish) await menusApi.publish(menuId)
      toast.success(publish ? 'Menu saved and published.' : editing ? 'Menu updated.' : 'Menu saved as a draft.')
      navigate('/menus')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (editing && existing.error) return <ErrorState error={existing.error} onRetry={existing.reload} />
  if (!ready || foods.loading && !foods.data) return <Loading />

  const rowErrors = errors.rows || {}
  const takenIds = new Set(form.rows.map((r) => r.foodItemId))
  const totalPortions = form.rows.reduce((sum, r) => sum + (Number(r.qty) || 0), 0)

  return (
    <div className="stack-lg">
      <PageHeader
        title={editing ? `Menu for ${dateLabel(form.menuDate)}` : 'New daily menu'}
        subtitle={editing ? 'Change timings, dishes and quantities.' : 'Pick the day, set the ordering and pickup times, and add the dishes with their quantities.'}
        actions={<Button variant="ghost" to="/menus">Back to menus</Button>}
      />

      {ended && <div className="alert alert-info">This menu has ended and can no longer be edited.</div>}
      {errors.general && <div className="alert alert-error" role="alert">{errors.general}</div>}

      <fieldset className="card stack form-card" disabled={ended || busy}>
        <div className="card-title"><h2>Day &amp; timings</h2><span className="muted small">India time</span></div>
        <div className="time-grid">
          <Field label="Date" error={errors.date}>
            {(p) => <input {...p} className="input" type="date" min={now.date} value={form.menuDate} onChange={setField('menuDate')} readOnly={editing} />}
          </Field>
          <Field label="Ordering opens">
            {(p) => <input {...p} className="input" type="time" value={form.orderOpenTime} onChange={setField('orderOpenTime')} aria-invalid={errors.times ? 'true' : undefined} />}
          </Field>
          <Field label="Ordering closes">
            {(p) => <input {...p} className="input" type="time" value={form.orderCloseTime} onChange={setField('orderCloseTime')} aria-invalid={errors.times ? 'true' : undefined} />}
          </Field>
          <Field label="Pickup starts">
            {(p) => <input {...p} className="input" type="time" value={form.pickupStartTime} onChange={setField('pickupStartTime')} aria-invalid={errors.times ? 'true' : undefined} />}
          </Field>
          <Field label="Pickup ends">
            {(p) => <input {...p} className="input" type="time" value={form.pickupEndTime} onChange={setField('pickupEndTime')} aria-invalid={errors.times ? 'true' : undefined} />}
          </Field>
        </div>
        {errors.times && <p className="error-text" role="alert">{errors.times}</p>}
      </fieldset>

      <fieldset className="card stack form-card" disabled={ended || busy}>
        <div className="card-title">
          <h2>Dishes</h2>
          <span className="muted small">{totalPortions} portions in total</span>
        </div>

        {catalogue.length === 0 && (
          <div className="alert alert-info">Your catalogue is empty. <Link to="/food-items">Add dishes first</Link>, then come back.</div>
        )}

        <div className="dish-head" aria-hidden="true"><span>Dish</span><span>Portions</span><span>Price today (₹)</span><span /></div>
        {form.rows.map((r) => {
          const e = rowErrors[r.key] || {}
          const item = catalogue.find((c) => String(c.id) === r.foodItemId)
          return (
            <div className="dish-row" key={r.key}>
              <Field error={e.dish}>
                {(p) => (
                  <select {...p} className="select" aria-label="Dish" value={r.foodItemId} onChange={(ev) => setRow(r.key, { foodItemId: ev.target.value })}>
                    <option value="">Choose a dish…</option>
                    {catalogue.filter((c) => c.active || String(c.id) === r.foodItemId).map((c) => (
                      <option key={c.id} value={c.id} disabled={takenIds.has(String(c.id)) && String(c.id) !== r.foodItemId}>
                        {c.name} · {money(c.basePrice)}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <Field error={e.qty} hint={r.orderedQty > 0 ? `${r.orderedQty} ordered` : undefined}>
                {(p) => <input {...p} className="input num" aria-label="Portions" inputMode="numeric" value={r.qty} onChange={(ev) => setRow(r.key, { qty: ev.target.value })} />}
              </Field>
              <Field error={e.price}>
                {(p) => <input {...p} className="input num" aria-label="Price today" inputMode="decimal" value={r.price}
                  onChange={(ev) => setRow(r.key, { price: ev.target.value })} />}
              </Field>
              <Button variant="ghost" className="btn-icon" aria-label="Remove dish" title={r.orderedQty > 0 ? 'Already ordered, so it cannot be removed' : 'Remove'}
                disabled={r.orderedQty > 0} onClick={() => removeRow(r.key)} icon={<Icon name="x" />} />
            </div>
          )
        })}

        <div><Button variant="secondary" icon={<Icon name="plus" />} onClick={addRow}>Add dish</Button></div>
        <p className="muted small">Leave the price empty to use the dish's base price. Fresher and Junior discounts are applied automatically at ordering.</p>
      </fieldset>

      {!ended && (
        <div className="row form-actions">
          <Button variant="ghost" to="/menus">Cancel</Button>
          <span className="grow" />
          {editing ? (
            <>
              <Button variant={isDraft ? 'secondary' : 'primary'} loading={busy} onClick={() => save(false)}>Save changes</Button>
              {isDraft && <Button loading={busy} onClick={() => save(true)}>Save &amp; publish</Button>}
            </>
          ) : (
            <>
              <Button variant="secondary" loading={busy} onClick={() => save(false)}>Save as draft</Button>
              <Button loading={busy} onClick={() => save(true)}>Save &amp; publish</Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
