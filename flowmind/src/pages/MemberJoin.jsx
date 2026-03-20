import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import styles from './Setup.module.css'

export default function MemberJoin() {
  const { joinTeam, navigate } = useApp()
  const { saveTeam, user } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', code: '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleJoin = () => {
    if (!form.name || !form.code) return
    setLoading(true)
    setTimeout(() => {
      const code = form.code.toUpperCase()
      joinTeam(code, form.name)
      // Save team to user's localStorage profile
      saveTeam(code, 'Team Project', 'member')
      setLoading(false)
    }, 800)
  }

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <button className={`btn-ghost ${styles.back}`} onClick={() => navigate('landing')}>
          ← Back
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrap}>🧑‍💻</div>
          <h2 className={styles.title}>Join Your Team</h2>
          <p className={styles.sub}>Enter the 6-digit team code your leader shared with you</p>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className="label">Your Name</label>
            <input className="input" placeholder="e.g. Rahul" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className="label">Team Code</label>
            <input
              className="input"
              placeholder="e.g. XK92PL"
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase())}
              maxLength={6}
              style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '18px', fontFamily: 'var(--font-display)', fontWeight: '700', textAlign: 'center' }}
            />
          </div>

          <p className={styles.hint}>Don't have a code? Ask your team leader.</p>

          <button
            className={`btn-primary ${styles.submit}`}
            onClick={handleJoin}
            disabled={loading || !form.name || form.code.length < 4}
          >
            {loading ? <><span className="spinner" /> Joining...</> : <>⚡ Join Team</>}
          </button>
        </div>
      </div>
    </div>
  )
}
