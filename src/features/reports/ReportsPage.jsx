import { useState } from 'react'
import Button from '../../shared/ui/Button'
import Field from '../../shared/ui/Field'
import Icon from '../../shared/ui/Icon'
import PageHeader from '../../shared/ui/PageHeader'
import { EmptyState, ErrorState, Loading } from '../../shared/ui/States'
import { useToast } from '../../shared/ui/Toast'
import { money } from '../../shared/lib/format'
import { orgNow } from '../../shared/lib/time'
import { useAsync } from '../../shared/lib/useAsync'
import { REPORTS, reportsApi } from './reportsApi'
import { TABLES } from './reportTables'
import './reports.css'

export default function ReportsPage() {
  const toast = useToast()
  const today = orgNow().date
  const [kind, setKind] = useState('item-sales')
  const [month, setMonth] = useState(today.slice(0, 7))
  const [day, setDay] = useState(today)
  const [downloading, setDownloading] = useState(null) // 'xlsx' | 'pdf' | null

  const def = REPORTS[kind]
  const table = TABLES[kind]
  const period = def.period === 'month' ? month : day
  const periodValid = def.period === 'month' ? /^\d{4}-\d{2}$/.test(period) : /^\d{4}-\d{2}-\d{2}$/.test(period)

  // Cleared inputs give '' - skip the request until the person picks a value again.
  // The result is tagged with its report kind: useAsync keeps the previous data while reloading, and rendering
  // the old report with the new tab's columns would crash.
  const report = useAsync(
    () => (periodValid ? reportsApi.preview(kind, period).then((data) => ({ kind, data })) : Promise.resolve(null)),
    [kind, period],
  )
  const noMenu = report.error?.status === 404

  async function download(format) {
    setDownloading(format)
    try {
      const name = await reportsApi.download(kind, period, format)
      toast.success(`Saved ${name}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDownloading(null)
    }
  }

  const data = report.data?.kind === kind ? report.data.data : null
  const canDownload = periodValid && !report.loading && !report.error

  return (
    <div className="stack-lg">
      <PageHeader title="Reports" subtitle="Preview a report here, then download it as Excel or PDF." />

      <section className="card stack">
        <div className="report-tabs" role="tablist" aria-label="Report type">
          {Object.entries(REPORTS).map(([key, r]) => (
            <button key={key} role="tab" aria-selected={kind === key} type="button"
              className={`report-tab ${kind === key ? 'active' : ''}`} onClick={() => setKind(key)}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="report-controls">
          {def.period === 'month' ? (
            <Field label="Month">
              {(p) => <input {...p} className="input" type="month" value={month} max={today.slice(0, 7)}
                onChange={(e) => setMonth(e.target.value)} />}
            </Field>
          ) : (
            <Field label="Date">
              {(p) => <input {...p} className="input" type="date" value={day}
                onChange={(e) => setDay(e.target.value)} />}
            </Field>
          )}
          <div className="row report-actions">
            <Button variant="secondary" icon={<Icon name="download" />} disabled={!canDownload}
              loading={downloading === 'xlsx'} onClick={() => download('xlsx')}>Excel</Button>
            <Button icon={<Icon name="download" />} disabled={!canDownload}
              loading={downloading === 'pdf'} onClick={() => download('pdf')}>PDF</Button>
          </div>
        </div>
      </section>

      {report.error && !noMenu && <ErrorState error={report.error} onRetry={report.reload} />}
      {noMenu && (
        <section className="card">
          <EmptyState title="No published menu on this day">Pick another date. A report needs a published menu.</EmptyState>
        </section>
      )}
      {!data && !report.error && periodValid && <Loading />}

      {data && (
        <section className="card stack">
          <div className="report-head">
            <div>
              <h2>{table.title(data)}</h2>
              {table.note(data) && <p className="muted small">{table.note(data)}</p>}
            </div>
            <dl className="report-stats">
              <div><dt>Net sales</dt><dd className="num">{money(data.totals.netSales)}</dd></div>
              <div><dt>Collected</dt><dd className="num">{Number(data.totals.collected).toLocaleString('en-IN')}</dd></div>
              <div><dt>Ordered</dt><dd className="num">{Number(data.totals.ordered).toLocaleString('en-IN')}</dd></div>
            </dl>
          </div>

          {data.rows.length === 0 ? (
            <EmptyState title="Nothing to show">{table.empty}</EmptyState>
          ) : (
            <div className="table-wrap">
              <table className="table report-table">
                <thead>
                  <tr>{table.columns.map((c) => <th key={c.label} className={c.right ? 'right' : ''}>{c.label}</th>)}</tr>
                </thead>
                <tbody>
                  {data.rows.map((r, i) => (
                    <tr key={r.foodItemId ?? r.date ?? i}>
                      {table.columns.map((c) => <td key={c.label} className={c.right ? 'right num' : ''}>{c.cell(r)}</td>)}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>{table.columns.map((c) => <td key={c.label} className={c.right ? 'right num' : ''}>{c.total(data.totals)}</td>)}</tr>
                </tfoot>
              </table>
            </div>
          )}
          <p className="muted small">
            Money counts only collected orders. Net sales = gross minus discount. Ordered excludes cancelled and expired orders.
          </p>
        </section>
      )}
    </div>
  )
}
