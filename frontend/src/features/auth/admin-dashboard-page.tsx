import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { EditableChoiceField, NoticeBanner, type Notice } from '../forms/common'
import { clearInvalidState, focusInvalidField } from '../forms/validation'
import { createRole, createUser, fetchAuditLogs, fetchFormAccessOptions, fetchRoles, fetchUsers, updateUser } from './api'
import type { AdminAuditLog, AuthUser, Role } from './types'

function createEmptyUserForm() {
  return {
    username: '',
    email: '',
    password: '',
    role_name: '',
    allowed_forms: [] as string[],
    status: 'Active',
  }
}

function findRoleByName(roles: Role[], value: string) {
  const normalized = value.trim().toLowerCase()
  return roles.find((role) => role.name.trim().toLowerCase() === normalized) ?? null
}

function formatAccessLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatAuditTimestamp(value: string) {
  return new Date(value).toLocaleString()
}

function formatAuditAction(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function AdminDashboardPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<AuthUser[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [formOptions, setFormOptions] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [userForm, setUserForm] = useState(createEmptyUserForm)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const userFormRef = useRef<HTMLFormElement | null>(null)
  const roleFormRef = useRef<HTMLFormElement | null>(null)

  const accessCount = userForm.allowed_forms.length
  const roleOptions = useMemo(() => roles.map((role) => role.name), [roles])
  const statusOptions = ['Active', 'Inactive']
  const isAdminRoleSelected = userForm.role_name.trim().toLowerCase() === 'admin'

  const loadAll = async () => {
    setLoading(true)
    try {
      const [nextRoles, nextUsers, nextFormOptions, nextAuditLogs] = await Promise.all([
        fetchRoles(),
        fetchUsers(),
        fetchFormAccessOptions(),
        fetchAuditLogs(),
      ])
      setRoles(nextRoles)
      setUsers(nextUsers)
      setFormOptions(nextFormOptions)
      setAuditLogs(nextAuditLogs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  useEffect(() => {
    if (!isAdminRoleSelected || formOptions.length === 0) {
      return
    }

    setUserForm((state) => {
      const nextAllowedForms = [...formOptions]
      const unchanged =
        state.allowed_forms.length === nextAllowedForms.length
        && state.allowed_forms.every((item) => nextAllowedForms.includes(item))

      if (unchanged) {
        return state
      }

      return {
        ...state,
        allowed_forms: nextAllowedForms,
      }
    })
  }, [formOptions, isAdminRoleSelected])

  const resetForm = () => {
    setSelectedUser(null)
    setUserForm(createEmptyUserForm())
  }

  const showInvalid = (form: HTMLFormElement | null, selector: string, text: string) => {
    if (!form) {
      setNotice({ type: 'error', title: 'Validation', text })
      return
    }

    clearInvalidState(form)
    const target = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)
    if (target) {
      focusInvalidField(target)
    }
    setNotice({ type: 'error', title: 'Validation', text })
  }

  const validateUserForm = () => {
    const form = userFormRef.current
    if (!userForm.username.trim()) {
      showInvalid(form, 'input[name="username"]', 'Please enter the user name.')
      return false
    }

    if (!userForm.email.trim()) {
      showInvalid(form, 'input[name="email"]', 'Please enter the email address.')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email.trim())) {
      showInvalid(form, 'input[name="email"]', 'Please enter a valid email address.')
      return false
    }

    if (!selectedUser && userForm.password.trim().length < 8) {
      showInvalid(form, 'input[name="password"]', 'Password must be at least 8 characters long.')
      return false
    }

    if (selectedUser && userForm.password.trim() && userForm.password.trim().length < 8) {
      showInvalid(form, 'input[name="password"]', 'New password must be at least 8 characters long.')
      return false
    }

    const resolvedRole = findRoleByName(roles, userForm.role_name)
    if (!resolvedRole) {
      showInvalid(form, 'input[name="role_name"]', 'Please type or choose a valid role.')
      return false
    }

    const normalizedStatus = userForm.status.trim().toLowerCase()
    if (!['active', 'inactive'].includes(normalizedStatus)) {
      showInvalid(form, 'input[name="status"]', 'Status must be Active or Inactive.')
      return false
    }

    if (!isAdminRoleSelected && userForm.allowed_forms.length === 0) {
      setNotice({
        type: 'error',
        title: 'Validation',
        text: 'Please select at least one form access for this user.',
      })
      return false
    }

    return true
  }

  const validateRoleForm = () => {
    const form = roleFormRef.current
    if (!roleName.trim()) {
      showInvalid(form, 'input[name="role_name_create"]', 'Please enter the role name.')
      return false
    }

    return true
  }

  const handleUserSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateUserForm()) {
      return
    }

    const resolvedRole = findRoleByName(roles, userForm.role_name)
    if (!resolvedRole) {
      return
    }

    const normalizedStatus = userForm.status.trim().toLowerCase()
    const payload = {
      username: userForm.username.trim(),
      email: userForm.email.trim(),
      role_id: resolvedRole.id,
      allowed_forms: isAdminRoleSelected ? formOptions : userForm.allowed_forms,
      is_active: normalizedStatus === 'active',
      ...(userForm.password.trim() ? { password: userForm.password.trim() } : {}),
    }

    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, payload)
        setNotice({ type: 'success', title: 'User Updated', text: 'User updated successfully.' })
      } else {
        await createUser({ ...payload, password: userForm.password.trim() })
        setNotice({ type: 'success', title: 'User Created', text: 'User created successfully.' })
      }
      await loadAll()
      resetForm()
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Save Failed',
        text: error instanceof Error ? error.message : 'Unable to save user details.',
      })
    }
  }

  const handleRoleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateRoleForm()) {
      return
    }

    try {
      await createRole(roleName.trim(), roleDescription.trim())
      setRoleName('')
      setRoleDescription('')
      setNotice({ type: 'success', title: 'Role Created', text: 'Role created successfully.' })
      await loadAll()
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Role Failed',
        text: error instanceof Error ? error.message : 'Unable to create role.',
      })
    }
  }

  const loadUserIntoForm = (user: AuthUser) => {
    setSelectedUser(user)
    setUserForm({
      username: user.username,
      email: user.email,
      password: '',
      role_name: user.role_name,
      allowed_forms: user.allowed_forms,
      status: user.is_active ? 'Active' : 'Inactive',
    })
  }

  const toggleFormAccess = (formName: string) => {
    if (isAdminRoleSelected) {
      return
    }

    setUserForm((state) => {
      const exists = state.allowed_forms.includes(formName)
      return {
        ...state,
        allowed_forms: exists
          ? state.allowed_forms.filter((item) => item !== formName)
          : [...state.allowed_forms, formName],
      }
    })
  }

  if (loading) {
    return <main className="page-canvas"><section className="form-sheet">Loading admin dashboard...</section></main>
  }

  return (
    <main className="page-canvas">
      <header className="form-page-header">
        <h1>Admin Dashboard</h1>
      </header>

      <section className="form-sheet admin-grid">
        <section className="section-block admin-panel">
          <h2>{selectedUser ? 'Edit User' : 'Create User'}</h2>
          <form ref={userFormRef} className="module-form" onSubmit={handleUserSubmit}>
            <div className="form-grid form-grid--2">
              <div className="field-group">
                <label>USER</label>
                <input
                  name="username"
                  value={userForm.username}
                  onChange={(event) => setUserForm((state) => ({ ...state, username: event.target.value }))}
                  placeholder="Enter username"
                />
              </div>
              <div className="field-group">
                <label>EMAIL</label>
                <input
                  name="email"
                  value={userForm.email}
                  onChange={(event) => setUserForm((state) => ({ ...state, email: event.target.value }))}
                  placeholder="Enter email"
                />
              </div>
              <div className="field-group">
                <label>{selectedUser ? 'NEW PASSWORD' : 'PASSWORD'}</label>
                <input
                  name="password"
                  type="password"
                  value={userForm.password}
                  onChange={(event) => setUserForm((state) => ({ ...state, password: event.target.value }))}
                  placeholder={selectedUser ? 'Leave blank to keep current password' : 'Enter password'}
                />
              </div>
              <EditableChoiceField
                label="ROLE"
                name="role_name"
                value={userForm.role_name}
                onChange={(value) => setUserForm((state) => ({ ...state, role_name: value }))}
                placeholder="Type or choose role"
                options={roleOptions}
                required={false}
              />
              <div className="field-group field-group--full">
                <label>FORMS ACCESS</label>
                <div className={`checkbox-grid ${isAdminRoleSelected ? 'checkbox-grid--locked' : ''}`}>
                  {formOptions.map((formName) => {
                    const checked = isAdminRoleSelected || userForm.allowed_forms.includes(formName)
                    return (
                      <label key={formName} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={isAdminRoleSelected}
                          onChange={() => toggleFormAccess(formName)}
                        />
                        <span>{formatAccessLabel(formName)}</span>
                      </label>
                    )
                  })}
                </div>
                {isAdminRoleSelected ? (
                  <span className="field-group__hint">Admin role receives full access automatically.</span>
                ) : null}
              </div>
              <div className="field-group">
                <label>HOW MANY FORMS ACCESS HE GOT</label>
                <input value={String(accessCount)} readOnly className="field-control--locked" />
              </div>
              <EditableChoiceField
                label="STATUS"
                name="status"
                value={userForm.status}
                onChange={(value) => setUserForm((state) => ({ ...state, status: value }))}
                placeholder="Type or choose status"
                options={statusOptions}
                required={false}
              />
            </div>
            <div className="form-actions admin-actions">
              {selectedUser ? (
                <button type="button" className="btn btn--attach" onClick={resetForm}>
                  CANCEL EDIT
                </button>
              ) : null}
              <button type="submit" className="btn btn--blue">
                {selectedUser ? 'UPDATE USER' : 'CREATE USER'}
              </button>
            </div>
          </form>
        </section>

        <section className="section-block admin-panel">
          <h2>Create Role</h2>
          <form ref={roleFormRef} className="module-form" onSubmit={handleRoleSubmit}>
            <div className="form-grid form-grid--2">
              <div className="field-group">
                <label>ROLE NAME</label>
                <input
                  name="role_name_create"
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value)}
                  placeholder="Enter role name"
                />
              </div>
              <div className="field-group">
                <label>DESCRIPTION</label>
                <input
                  value={roleDescription}
                  onChange={(event) => setRoleDescription(event.target.value)}
                  placeholder="Describe this role"
                />
              </div>
            </div>
            <div className="form-actions admin-actions">
              <button type="submit" className="btn btn--blue">CREATE ROLE</button>
            </div>
          </form>
        </section>

        <section className="section-block admin-panel">
          <h2>Users</h2>
          <div className="table-wrap">
            <table className="plain-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Form Count</th>
                  <th>Status</th>
                  <th>Access</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role_name}</td>
                    <td>{user.allowed_forms.length}</td>
                    <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                    <td>{user.allowed_forms.map(formatAccessLabel).join(', ') || 'No form access'}</td>
                    <td>
                      <button type="button" className="btn btn--blue btn--table" onClick={() => loadUserIntoForm(user)}>
                        EDIT
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-block admin-panel">
          <h2>Roles</h2>
          <div className="table-wrap">
            <table className="plain-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Description</th>
                  <th>System</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td>{role.name}</td>
                    <td>{role.description || 'No description'}</td>
                    <td>{role.is_system ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section-block admin-panel">
          <h2>Audit Log</h2>
          <div className="table-wrap">
            <table className="plain-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Summary</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatAuditTimestamp(log.created_at)}</td>
                      <td>{log.actor_username}</td>
                      <td>{formatAuditAction(log.action)}</td>
                      <td>{log.target_label}</td>
                      <td>{log.summary}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>No audit events recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
    </main>
  )
}
