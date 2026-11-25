import { useState } from 'react'
import Badge from '../../shared/ui/Badge'
import Button from '../../shared/ui/Button'
import Icon from '../../shared/ui/Icon'
import PageHeader from '../../shared/ui/PageHeader'
import { EmptyState, ErrorState, Loading } from '../../shared/ui/States'
import { useToast } from '../../shared/ui/Toast'
import { money } from '../../shared/lib/format'
import { useAsync } from '../../shared/lib/useAsync'
import FoodItemFormModal from './FoodItemFormModal'
import { foodItemsApi } from './foodItemsApi'

export default function FoodItemsPage() {
  const toast = useToast()
  const [showInactive, setShowInactive] = useState(false)
  const [modal, setModal] = useState(null)
  const list = useAsync(() => foodItemsApi.list({ includeInactive: showInactive }), [showInactive])

  async function toggleActive(item) {
    try {
      await foodItemsApi.update(item.id, {
        name: item.name, description: item.description, imageUrl: item.imageUrl, basePrice: item.basePrice, active: !item.active,
      })
      toast.success(item.active ? `${item.name} retired.` : `${item.name} is available again.`)
      list.reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const items = list.data

  return (
    <div className="stack-lg">
      <PageHeader
        title="Food items"
        subtitle="Your catalogue of dishes. Pick from it when you build a daily menu."
        actions={<Button icon={<Icon name="plus" />} onClick={() => setModal({})}>Add dish</Button>}
      />

      <section className="card">
        <label className="switch" style={{ marginBottom: 14 }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          <span>Show retired dishes</span>
        </label>

        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
        {!items && !list.error && <Loading />}
        {items && items.length === 0 && (
          <EmptyState title="No dishes yet" action={<Button icon={<Icon name="plus" />} onClick={() => setModal({})}>Add your first dish</Button>}>
            Add the dishes your cafeteria serves, then put them on a menu.
          </EmptyState>
        )}
        {items && items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Image</th><th>Dish</th><th className="right">Base price</th><th>Status</th><th /></tr></thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.id}>
                    <td><img src={i.imageUrl || '/images/placeholder.png'} alt={i.name} onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/placeholder.png';
                    }} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} /></td>
                    <td><strong>{i.name}</strong>{i.description && <div className="muted small">{i.description}</div>}</td>
                    <td className="right num">{money(i.basePrice)}</td>
                    <td><Badge tone={i.active ? 'success' : 'neutral'}>{i.active ? 'Available' : 'Retired'}</Badge></td>
                    <td>
                      <div className="actions">
                        <Button size="sm" variant="ghost" icon={<Icon name="edit" size={15} />} onClick={() => setModal({ item: i })}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => toggleActive(i)}>{i.active ? 'Retire' : 'Restore'}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal && (
        <FoodItemFormModal item={modal.item} onClose={() => setModal(null)} onSaved={() => { setModal(null); list.reload() }} />
      )}
    </div>
  )
}
