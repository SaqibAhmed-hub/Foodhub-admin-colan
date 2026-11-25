import { api, apiDownload } from '../../shared/api/client'

// One entry per backend report. `period` says which picker the page shows: a month or a single day.
export const REPORTS = {
  'item-sales': { path: '/admin/reports/item-sales', period: 'month', label: 'Item-wise (month)' },
  'day-sales': { path: '/admin/reports/day-sales', period: 'month', label: 'Day-wise (month)' },
  daily: { path: '/admin/reports/daily', period: 'day', label: 'Daily menu' },
}

const query = (kind, period, format) => ({ [REPORTS[kind].period === 'month' ? 'month' : 'date']: period, format })

export const reportsApi = {
  /** JSON version, used for the on-screen preview. */
  preview: (kind, period) => api(REPORTS[kind].path, { query: query(kind, period, 'json') }),
  /** Saves the PDF or Excel file the backend builds. Resolves to the saved file name. */
  download: (kind, period, format) =>
    apiDownload(REPORTS[kind].path, {
      query: query(kind, period, format),
      fallbackName: `foodhub-${kind}-${period}.${format}`,
    }),
}
