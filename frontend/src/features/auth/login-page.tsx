import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { NoticeBanner, type Notice } from '../forms/common'
import { clearInvalidState, focusInvalidField } from '../forms/validation'
import { useAuthStore } from './auth-store'
import { getDefaultRoute } from '../forms/page-links'

export function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const formRef = useRef<HTMLFormElement | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(getDefaultRoute(user), { replace: true })
    }
  }, [navigate, status, user])

  const validateLogin = () => {
    const form = formRef.current
    if (!form) {
      return false
    }

    clearInvalidState(form)

    const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]')
    const passwordInput = form.querySelector<HTMLInputElement>('input[name="password"]')

    if (emailInput && emailInput.value.trim().length === 0) {
      focusInvalidField(emailInput)
      setNotice({ type: 'error', title: 'Required Field', text: 'Please enter your email.' })
      return false
    }

    if (passwordInput && passwordInput.value.trim().length === 0) {
      focusInvalidField(passwordInput)
      setNotice({ type: 'error', title: 'Required Field', text: 'Please enter your password.' })
      return false
    }

    return true
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <h1>CargoNest Login</h1>
        <p>Sign in with your database user account.</p>
        <form
          ref={formRef}
          className="login-form"
          onSubmit={async (event) => {
            event.preventDefault()
            if (!validateLogin()) {
              return
            }

            setSubmitting(true)
            try {
              await login(email, password)
            } catch (error) {
              setNotice({
                type: 'error',
                title: 'Login Failed',
                text: error instanceof Error ? error.message : 'Invalid email or password.',
              })
            } finally {
              setSubmitting(false)
            }
          }}
        >
          <div className="field-group">
            <label>EMAIL</label>
            <input
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter email"
            />
          </div>
          <div className="field-group">
            <label>PASSWORD</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
            />
          </div>
          <button type="submit" className="btn btn--blue login-submit" disabled={submitting}>
            {submitting ? 'SIGNING IN...' : 'LOGIN'}
          </button>
        </form>
      </section>
      <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />
    </main>
  )
}
