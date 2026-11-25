import { useEffect, useState } from 'react'
import Badge from '../../shared/ui/Badge'
import Button from '../../shared/ui/Button'
import Icon from '../../shared/ui/Icon'
import PageHeader from '../../shared/ui/PageHeader'
import { EmptyState, ErrorState, Loading } from '../../shared/ui/States'
import { useAsync } from '../../shared/lib/useAsync'
import EmployeeFormModal from './EmployeeFormModal'
import { employeesApi } from './employeesApi'
import { GRADE_LABEL, ROLE_LABEL } from './roles'
import './employees.css'

const PAGE_SIZE = 15

export default function EmployeesPage() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null) // null | { employee? }

  // wait for a pause in typing before asking the server
  useEffect(() => {
    const id = setTimeout(() => { setDebounced(query.trim()); setPage(0) }, 300)
    return () => clearTimeout(id)
  }, [query])

  const list = useAsync(() => employeesApi.search({ q: debounced, page, size: PAGE_SIZE }), [debounced, page])
  const grades = useAsync(() => employeesApi.grades(), [])

  const data = list.data
  const saved = () => { setModal(null); list.reload() }

  return (
    <div className="stack-lg">
      <PageHeader
        title="Employees"
        subtitle="Only people added here can sign in and order lunch."
        actions={<Button icon={<Icon name="plus" />} onClick={() => setModal({})}>Add employee</Button>}
      />

      <section className="card">
        <div className="search">
          <Icon name="search" />
          <input className="input" type="search" placeholder="Search by name, email or code" aria-label="Search employees"
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
        {!data && !list.error && <Loading />}

        {data && data.items.length === 0 && (
          <EmptyState title={debounced ? 'No matches' : 'No employees yet'}
            action={!debounced && <Button icon={<Icon name="plus" />} onClick={() => setModal({})}>Add the first employee</Button>}>
            {debounced ? 'Try a different name, email or code.' : 'Add your team so they can order lunch.'}
          </EmptyState>
        )}

        {data && data.items.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Employee</th><th>Department</th><th>Grade</th><th>Role</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {data.items.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="person">
                          <span className="initial" aria-hidden="true">{e.name.slice(0, 1).toUpperCase()}</span>
                          <span><strong>{e.name}</strong><div className="muted small">{e.empCode} · {e.email}</div></span>
                        </div>
                      </td>
                      <td>{e.department || <span className="muted">–</span>}</td>
                      <td>
                        {GRADE_LABEL[e.grade]}
                        {Number(e.discountPercent) > 0 && <div className="small" style={{ color: 'var(--sage-dark)', fontWeight: 600 }}>{Number(e.discountPercent)}% off</div>}
                      </td>
                      <td>{e.role === 'ADMIN' ? <Badge tone="info">Admin</Badge> : e.role === 'CAFETERIA_STAFF' ? <Badge tone="warn">{ROLE_LABEL[e.role]}</Badge> : ROLE_LABEL[e.role]}</td>
                      <td><Badge tone={e.active ? 'success' : 'neutral'}>{e.active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="right"><Button size="sm" variant="ghost" icon={<Icon name="edit" size={15} />} onClick={() => setModal({ employee: e })}>Edit</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pager">
              <span className="muted small">
                {data.page * PAGE_SIZE + 1}–{data.page * PAGE_SIZE + data.items.length} of {data.totalElements}
              </span>
              <div className="row" style={{ gap: 8 }}>
                <Button size="sm" variant="secondary" disabled={data.page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button size="sm" variant="secondary" disabled={data.page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </section>

      {modal && (
        <EmployeeFormModal employee={modal.employee} grades={grades.data || []} onClose={() => setModal(null)} onSaved={saved} />
      )}
    </div>
  )
}
