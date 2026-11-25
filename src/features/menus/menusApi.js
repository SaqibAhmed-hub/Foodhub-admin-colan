import { api } from '../../shared/api/client'

export const menusApi = {
  list: ({ from, to } = {}) => api('/admin/menus', { query: { from, to } }),
  get: (id) => api(`/admin/menus/${id}`),
  create: (body) => api('/admin/menus', { method: 'POST', body }),
  update: (id, body) => api(`/admin/menus/${id}`, { method: 'PUT', body }),
  publish: (id) => api(`/admin/menus/${id}/publish`, { method: 'POST' }),
}
