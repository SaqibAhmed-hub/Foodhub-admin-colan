import { api } from '../../shared/api/client'

export const foodItemsApi = {
  list: ({ includeInactive = false } = {}) => api('/admin/food-items', { query: { includeInactive } }),
  create: (body) => api('/admin/food-items', { method: 'POST', body }),
  update: (id, body) => api(`/admin/food-items/${id}`, { method: 'PUT', body }),
}
