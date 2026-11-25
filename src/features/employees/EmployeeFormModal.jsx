import { useState } from 'react'
import Button from '../../shared/ui/Button'
import Field from '../../shared/ui/Field'
import Modal from '../../shared/ui/Modal'
import { useToast } from '../../shared/ui/Toast'
import { employeesApi } from './employeesApi'
import { GRADE_LABEL, ROLES, ROLE_LABEL } from './roles'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Backend error codes that belong to a specific field.
const FIELD_ERRORS = { EMP_CODE_EXISTS: 'empCode', EMAIL_EXISTS: 'email' }

/** Add a new employee, or (when `employee` is given) edit an existing one. Code and email are fixed after creation. */
export default function EmployeeFormModal({ employee, grades, onClose, onSaved }) {
  const toast = useToast()
  const editing = Boolean(employee)
  const [form, setForm] = useState({
    empCode: employee?.empCode ?? '',
    name: employee?.name ?? '',
    email: employee?.email ?? '',
    department: employee?.department ?? '',
    grade: employee?.grade ?? 'REGULAR',
    role: employee?.role ?? 'EMPLOYEE',
    active: employee?.active ?? true,
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function validate() {
    const next = {}
    if (!editing && !form.empCode.trim()) next.empCode = 'Employee code is required.'
    if (!form.name.trim()) next.name = 'Name is required.'
    if (!editing && !EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.'
    return next
  }

  async function submit(e) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length) return

    setBusy(true)
    try {
      const department = form.department.trim() || null
      if (editing) {
        await employeesApi.update(employee.id, {
          name: form.name.trim(), department, grade: form.grade, role: form.role, active: form.active,
        })
        toast.success(`${form.name.trim()} updated.`)
      } else {
        await employeesApi.create({
          empCode: form.empCode.trim(), name: form.name.trim(), email: form.email.trim(),
          department, grade: form.grade, role: form.role,
        })
        toast.success(`${form.name.trim()} added. They can now sign in with their email.`)
      }
      onSaved()
    } catch (err) {
      const field = FIELD_ERRORS[err.code]
      if (field) setErrors({ [field]: err.message })
      else toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit employee' : 'Add employee'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="employee-form" loading={busy}>{editing ? 'Save changes' : 'Add employee'}</Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Employee code" error={errors.empCode}>
            {(p) => <input {...p} className="input" value={form.empCode} onChange={set('empCode')} readOnly={editing} placeholder="Employee code" />}
          </Field>
          <Field label="Full name" error={errors.name}>
            {(p) => <input {...p} className="input" value={form.name} onChange={set('name')} placeholder="Full name" />}
          </Field>
          <Field label="Work email" error={errors.email} className="span-2"
            hint={editing ? 'Email cannot be changed.' : 'They sign in with a one-time code sent here.'}>
            {(p) => <input {...p} className="input" type="email" value={form.email} onChange={set('email')} readOnly={editing} placeholder="Work email" />}
          </Field>
          <Field label="Department">
            {(p) => <input {...p} className="input" value={form.department} onChange={set('department')} placeholder="Department" />}
          </Field>
          <Field label="Grade" hint="Sets the food discount.">
            {(p) => (
              <select {...p} className="select" value={form.grade} onChange={set('grade')}>
                {(grades.length ? grades : Object.keys(GRADE_LABEL).map((g) => ({ grade: g, discountPercent: null }))).map((g) => (
                  <option key={g.grade} value={g.grade}>
                    {GRADE_LABEL[g.grade]}{g.discountPercent != null ? ` (${Number(g.discountPercent)}% off)` : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Role" className="span-2" hint="Admins manage this dashboard. Cafeteria staff hand over food at the counter.">
            {(p) => (
              <select {...p} className="select" value={form.role} onChange={set('role')}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            )}
          </Field>
          {editing && (
            <label className="switch span-2">
              <input type="checkbox" checked={form.active} onChange={set('active')} />
              <span>Active <span className="muted small">(inactive people cannot sign in or order)</span></span>
            </label>
          )}
        </div>
      </form>
    </Modal>
  )
}
