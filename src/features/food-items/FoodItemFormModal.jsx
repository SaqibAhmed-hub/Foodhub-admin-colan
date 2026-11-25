import { useState } from 'react'
import Button from '../../shared/ui/Button'
import Field from '../../shared/ui/Field'
import Modal from '../../shared/ui/Modal'
import { useToast } from '../../shared/ui/Toast'
import { foodItemsApi } from './foodItemsApi'

export default function FoodItemFormModal({ item, onClose, onSaved }) {
  const toast = useToast()
  const editing = Boolean(item)
  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    imageUrl: item?.imageUrl ?? '',
    basePrice: item?.basePrice != null ? String(item.basePrice) : '',
    active: item?.active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const found = {}
    if (!form.name.trim()) found.name = 'Name is required.'
    if (form.basePrice === '' || Number(form.basePrice) < 0 || Number.isNaN(Number(form.basePrice))) found.basePrice = 'Enter a price of 0 or more.'
    setErrors(found)
    if (Object.keys(found).length) return

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      basePrice: Number(form.basePrice),
      active: form.active,
    }
    setBusy(true)
    try {
      if (editing) await foodItemsApi.update(item.id, body)
      else await foodItemsApi.create(body)
      toast.success(editing ? `${body.name} updated.` : `${body.name} added to the catalogue.`)
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit dish' : 'Add a dish'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="food-form" loading={busy}>{editing ? 'Save changes' : 'Add dish'}</Button>
        </>
      }
    >
      <form id="food-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Dish name" error={errors.name} className="span-2">
            {(p) => <input {...p} className="input" value={form.name} onChange={set('name')} placeholder="Enter a dish name" />}
          </Field>
          <Field label="Description" className="span-2">
            {(p) => <textarea {...p} className="textarea" value={form.description} onChange={set('description')} placeholder="Enter a description" maxLength={500} />}
          </Field>
          <Field label="Base price (₹)" error={errors.basePrice} hint="You can set a different price for a particular day on the menu.">
            {(p) => <input {...p} className="input" inputMode="decimal" value={form.basePrice} onChange={set('basePrice')} placeholder="" />}
          </Field>
          <Field label="Image link" hint="Optional.">
            {(p) => <input {...p} className="input" type="url" value={form.imageUrl} onChange={set('imageUrl')} placeholder="" />}
          </Field>
          {editing && (
            <label className="switch span-2">
              <input type="checkbox" checked={form.active} onChange={set('active')} />
              <span>Available for menus <span className="muted small">(turn off to retire a dish; past menus are kept)</span></span>
            </label>
          )}
        </div>
      </form>
    </Modal>
  )
}
