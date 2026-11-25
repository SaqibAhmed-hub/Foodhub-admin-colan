import { useState } from 'react'
import Badge from '../../shared/ui/Badge'
import Button from '../../shared/ui/Button'
import ConfirmDialog from '../../shared/ui/ConfirmDialog'
import { EmptyState } from '../../shared/ui/States'
import { useToast } from '../../shared/ui/Toast'
import { money, titleCase } from '../../shared/lib/format'
import { ordersApi } from './ordersApi'

const STATUS_TONE = {
  PLACED: 'warn', PENDING_PAYMENT: 'warn', PICKED_UP: 'success',
  NO_SHOW: 'danger', CANCELLED: 'neutral', EXPIRED: 'neutral',
}
const STATUS_LABEL = { PLACED: 'Waiting for pickup', PICKED_UP: 'Collected', NO_SHOW: 'No-show' }
const CANCELLABLE = ['PLACED', 'PENDING_PAYMENT']

export default function OrdersTable({ orders, onChanged }) {
  const toast = useToast()
  const [toCancel, setToCancel] = useState(null)
  const [busy, setBusy] = useState(false)

  async function cancel() {
    setBusy(true)
    try {
      await ordersApi.cancel(toCancel.id)
      toast.success(`Order for ${toCancel.employeeName} cancelled. The portion is back in stock.`)
      setToCancel(null)
      onChanged()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (orders.length === 0) {
    return <EmptyState title="No orders yet">Orders will appear here as employees place them.</EmptyState>
  }

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr><th>Employee</th><th>Dish</th><th>Payment</th><th className="right">Amount</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.employeeName}</strong><div className="muted small">{o.empCode}</div></td>
                <td>{o.itemName}</td>
                <td>{o.paymentMethod === 'CASH' ? 'Cash' : 'UPI'}<div className="muted small">{titleCase(o.paymentStatus)}</div></td>
                <td className="right num">{money(o.finalPrice)}</td>
                <td><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status] || titleCase(o.status)}</Badge></td>
                <td className="right">
                  {CANCELLABLE.includes(o.status) && <Button size="sm" variant="ghost" onClick={() => setToCancel(o)}>Cancel</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toCancel && (
        <ConfirmDialog
          danger busy={busy} title="Cancel this order?" confirmLabel="Cancel order"
          message={`${toCancel.employeeName}'s ${toCancel.itemName} will be cancelled and the portion returned to stock.`}
          onConfirm={cancel} onClose={() => setToCancel(null)}
        />
      )}
    </>
  )
}
