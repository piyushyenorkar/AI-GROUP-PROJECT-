import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import styles from './AuthPage.module.css'

export default function AuthPage() {
  const { signup, signin, signout, user } = useAuth()
  const { navigate } = useApp()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleSubmit = () => {
    if (mode === 'signup') {
      if (!form.name.trim() || !form.email.trim() || !form.password) {
        setError('Please fill in all fields.')
        return
      }
      if (form.password.length < 4) {
        setError('Password must be at least 4 characters.')
        return
      }
      setLoading(true)
      const result = signup(form.name, form.email, form.password)
      setLoading(false)
      if (result.error) { setError(result.error) }
      // On success, component re-renders showing welcome screen
    } else {
      if (!form.email.trim() || !form.password) {
        setError('Please fill in all fields.')
        return
      }
      setLoading(true)
      const result = signin(form.email, form.password)
      setLoading(false)
      if (result.error) { setError(result.error) }
    }
  }

  // ── Signed in: redirect to landing ─────────────────────────────────────
  if (user) {
    navigate('landing')
    return null
  }

  // ── Not signed in: Sign in / Sign up form ─────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>FM</span>
          <span className={styles.logoText}>FlowMind</span>
        </div>

        <div className={styles.title}>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</div>
        <div className={styles.sub}>
          {mode === 'signup'
            ? 'Sign up to save your teams and access them from anywhere.'
            : 'Sign in to access your teams and projects.'
          }
        </div>

        <div className={styles.form}>
          {mode === 'signup' && (
            <div className={styles.field}>
              <label className="label">Your Name</label>
              <input className="input" placeholder="e.g. Piyush" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
          )}

          <div className={styles.field}>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="e.g. piyush@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            className={`btn-primary ${styles.submit}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner" /> {mode === 'signup' ? 'Creating...' : 'Signing in...'}</>
              : mode === 'signup' ? '🚀 Create Account' : '⚡ Sign In'
            }
          </button>
        </div>

        <div className={styles.toggle}>
          {mode === 'signup' ? (
            <>Already have an account? <button className={styles.toggleLink} onClick={() => { setMode('signin'); setError('') }}>Sign In</button></>
          ) : (
            <>Don't have an account? <button className={styles.toggleLink} onClick={() => { setMode('signup'); setError('') }}>Sign Up</button></>
          )}
        </div>
      </div>
    </div>
  )
}
