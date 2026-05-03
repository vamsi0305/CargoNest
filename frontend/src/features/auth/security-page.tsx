import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { FormPageHeader, FormSheet, NoticeBanner, type Notice } from '../forms/common'
import { useAuthStore } from './auth-store'

export function SecurityPage() {
  const navigate = useNavigate()
  const changePassword = useAuthStore((state) => state.changePassword)
  const logoutAll = useAuthStore((state) => state.logoutAll)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [endingSessions, setEndingSessions] = useState(false)

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setNotice({ type: 'error', title: 'Validation', text: 'Please fill all password fields.' })
      return
    }

    if (newPassword.length < 8) {
      setNotice({ type: 'error', title: 'Validation', text: 'New password must be at least 8 characters long.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', title: 'Validation', text: 'New password and confirmation do not match.' })
      return
    }

    setSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      navigate('/login', { replace: true })
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Password Change Failed',
        text: error instanceof Error ? error.message : 'Unable to change password.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogoutAll = async () => {
    setEndingSessions(true)
    try {
      await logoutAll()
      navigate('/login', { replace: true })
    } catch (error) {
      setNotice({
        type: 'error',
        title: 'Session Revoke Failed',
        text: error instanceof Error ? error.message : 'Unable to end all sessions.',
      })
    } finally {
      setEndingSessions(false)
    }
  }

  return (
    <main className="page-canvas">
      <FormPageHeader title="Security" />

      <FormSheet>
        <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />

        <section className="section-block">
          <h2>Change Password</h2>
          <form className="module-form" onSubmit={(event) => void handlePasswordSubmit(event)}>
            <div className="form-grid form-grid--2">
              <div className="field-group">
                <label>CURRENT PASSWORD</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div />
              <div className="field-group">
                <label>NEW PASSWORD</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="field-group">
                <label>CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn--blue" disabled={submitting}>
                {submitting ? 'UPDATING PASSWORD...' : 'CHANGE PASSWORD'}
              </button>
            </div>
          </form>
        </section>

        <section className="section-block">
          <h2>Session Control</h2>
          <p>End all active sessions and require a fresh sign-in everywhere.</p>
          <div className="form-actions">
            <button type="button" className="btn btn--red" onClick={() => void handleLogoutAll()} disabled={endingSessions}>
              {endingSessions ? 'ENDING SESSIONS...' : 'LOGOUT ALL SESSIONS'}
            </button>
          </div>
        </section>
      </FormSheet>
    </main>
  )
}
