import { api } from '../../shared/api/client'

export const employeesApi = {
  search: ({ q, page = 0, size = 15 } = {}) => api('/admin/employees', { query: { q, page, size } }),
  create: (body) => api('/admin/employees', { method: 'POST', body }),
  update: (id, body) => api(`/admin/employees/${id}`, { method: 'PUT', body }),
  grades: () => api('/admin/grades'),
}
