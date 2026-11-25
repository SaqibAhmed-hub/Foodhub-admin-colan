import { money } from '../../shared/lib/format'
import { dateLabel } from '../../shared/lib/time'

const int = (n) => Number(n ?? 0).toLocaleString('en-IN')
const awaiting = (r) => r.ordered - r.collected - r.notCollected

/**
 * Describes how each backend report is shown on screen. `cell` formats a row, `total` formats the totals object.
 * Columns match the Excel / PDF files so the preview is what gets downloaded.
 */
const COUNT = (key, label) => ({ label, right: true, cell: (r) => int(r[key]), total: (t) => int(t[key]) })
const MONEY = (key, label) => ({ label, right: true, cell: (r) => money(r[key]), total: (t) => money(t[key]) })

export const TABLES = {
  'item-sales': {
    title: (d) => `${d.monthLabel}`,
    note: (d) => `${d.menuDays} published menu ${d.menuDays === 1 ? 'day' : 'days'}`,
    empty: 'No published menus in this month.',
    columns: [
      { label: 'Dish', cell: (r) => <strong>{r.name}</strong>, total: () => 'Total' },
      { ...COUNT('daysOnMenu', 'Days on menu'), total: () => '' },
      COUNT('portionsOffered', 'Offered'),
      COUNT('ordered', 'Ordered'),
      COUNT('collected', 'Collected'),
      COUNT('notCollected', 'Not collected'),
      COUNT('cancelled', 'Cancelled'),
      MONEY('grossSales', 'Gross'),
      MONEY('discount', 'Discount'),
      MONEY('netSales', 'Net sales'),
    ],
  },
  daily: {
    title: (d) => dateLabel(d.date),
    note: () => '',
    empty: 'No dishes on this menu.',
    columns: [
      { label: 'Dish', cell: (r) => <strong>{r.name}</strong>, total: () => 'Total' },
      COUNT('portionsOffered', 'Offered'),
      COUNT('ordered', 'Ordered'),
      COUNT('collected', 'Collected'),
      { label: 'Awaiting pickup', right: true, cell: (r) => int(awaiting(r)), total: (t) => int(awaiting(t)) },
      COUNT('notCollected', 'Not collected'),
      COUNT('cancelled', 'Cancelled'),
      { label: 'Left unordered', right: true, cell: (r) => int(r.portionsOffered - r.ordered), total: (t) => int(t.portionsOffered - t.ordered) },
      MONEY('grossSales', 'Gross'),
      MONEY('discount', 'Discount'),
      MONEY('netSales', 'Net sales'),
    ],
  },
  'day-sales': {
    title: (d) => `${d.monthLabel}`,
    note: (d) => `${d.totals.days} ${d.totals.days === 1 ? 'day' : 'days'} with a published menu`,
    empty: 'No published menus in this month.',
    columns: [
      { label: 'Date', cell: (r) => <strong>{dateLabel(r.date)}</strong>, total: (t) => `Total (${t.days} ${t.days === 1 ? 'day' : 'days'})` },
      { ...COUNT('dishes', 'Dishes'), total: () => '' },
      COUNT('portionsOffered', 'Offered'),
      COUNT('ordered', 'Ordered'),
      COUNT('collected', 'Collected'),
      COUNT('notCollected', 'Not collected'),
      COUNT('cancelled', 'Cancelled'),
      MONEY('grossSales', 'Gross'),
      MONEY('discount', 'Discount'),
      MONEY('netSales', 'Net sales'),
    ],
  },
}
