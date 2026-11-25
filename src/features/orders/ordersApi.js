import { api } from '../../shared/api/client'

export const ordersApi = {
  list: ({ date, status } = {}) => api('/admin/orders', { query: { date, status } }),
  summary: (date) => api('/admin/orders/summary', { query: { date } }),
  cancel: (id) => api(`/admin/orders/${id}/cancel`, { method: 'POST' }),
}
