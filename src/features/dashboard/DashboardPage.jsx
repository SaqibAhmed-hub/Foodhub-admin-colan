import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { menusApi } from '../menus/menusApi'
import OrdersTable from '../orders/OrdersTable'
import { ordersApi } from '../orders/ordersApi'
import { money } from '../../shared/lib/format'
import { dateLabel, greeting, orgNow } from '../../shared/lib/time'
import { useAsync } from '../../shared/lib/useAsync'
import PageHeader from '../../shared/ui/PageHeader'
import { ErrorState, Loading } from '../../shared/ui/States'
import PortalControl from './PortalControl'
import './dashboard.css'

const REFRESH_MS = 30_000

function Tile({ label, value, tone }) {
  return (
    <div className={`tile ${tone || ''}`}>
      <span className="tile-label">{label}</span>
      <span className="tile-value num">{value}</span>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [now, setNow] = useState(orgNow)
  const today = now.date

  const menus = useAsync(() => menusApi.list({ from: today, to: today }), [today])
  const menu = menus.data?.[0] ?? null

  const summary = useAsync(() => (menu ? ordersApi.summary(today) : Promise.resolve(null)), [today, menu?.id])
  const orders = useAsync(() => (menu ? ordersApi.list({ date: today }) : Promise.resolve([])), [today, menu?.id])

  const { reload: reloadMenus } = menus
  const { reload: reloadSummary } = summary
  const { reload: reloadOrders } = orders
  const refreshAll = () => { setNow(orgNow()); reloadMenus(); reloadSummary(); reloadOrders() }

  // Keep the page live: the portal status and counts move on their own as time passes and orders arrive.
  useEffect(() => {
    const id = setInterval(() => { setNow(orgNow()); reloadMenus(); reloadSummary(); reloadOrders() }, REFRESH_MS)
    return () => clearInterval(id)
  }, [reloadMenus, reloadSummary, reloadOrders])

  const s = summary.data
  const firstLoad = menus.loading && !menus.data

  return (
    <div className="stack-lg">
      <PageHeader
        title={`${greeting(now.time)}, ${user.name.split(' ')[0]}`}
        subtitle={`${dateLabel(today)} · India time`}
      />

      {menus.error && <ErrorState error={menus.error} onRetry={menus.reload} />}
      {firstLoad ? <Loading /> : <PortalControl menu={menu} now={now} onChanged={refreshAll} />}

      {menu && (
        <>
          <section aria-label="Today at a glance" className="tiles">
            <Tile label="Orders today" value={s?.totalOrders ?? '–'} />
            <Tile label="Collected" value={s?.pickedUp ?? '–'} tone="good" />
            <Tile label="Waiting for pickup" value={s?.pending ?? '–'} tone="warm" />
            <Tile label="Cash collected" value={s ? money(s.cashCollected) : '–'} />
            <Tile label="Cash to collect" value={s ? money(s.cashPending) : '–'} tone="warm" />
          </section>

          <section className="card">
            <div className="card-title"><h2>Kitchen sheet</h2><span className="muted small">What to prepare</span></div>
            {s ? (
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Dish</th><th className="right">Ordered</th><th className="right">Available</th><th className="right">Collected</th><th style={{ width: '28%' }}>Progress</th></tr></thead>
                  <tbody>
                    {s.items.map((i) => (
                      <tr key={i.menuItemId}>
                        <td><strong>{i.name}</strong></td>
                        <td className="right num">{i.orderedQty} <span className="muted">/ {i.totalQty}</span></td>
                        <td className="right num">{i.remainingQty}</td>
                        <td className="right num">{i.pickedUp}</td>
                        <td>
                          <div className="meter" title={`${i.orderedQty} of ${i.totalQty} portions taken`}>
                            <span style={{ width: `${i.totalQty ? Math.round((i.orderedQty / i.totalQty) * 100) : 0}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : summary.error ? <ErrorState error={summary.error} onRetry={summary.reload} /> : <Loading />}
          </section>

          <section className="card">
            <div className="card-title"><h2>Today's orders</h2><span className="muted small">{orders.data?.length ?? 0} total</span></div>
            {orders.data ? <OrdersTable orders={orders.data} onChanged={refreshAll} />
              : orders.error ? <ErrorState error={orders.error} onRetry={orders.reload} /> : <Loading />}
          </section>
        </>
      )}
    </div>
  )
}
