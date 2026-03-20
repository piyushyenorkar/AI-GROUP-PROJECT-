import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import styles from './Setup.module.css'

export default function MemberJoin() {
  const { joinTeam, navigate } = useApp()
  const { saveTeam, isTeamMember, user } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', code: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const handleJoin = () => {
    if (!form.name || !form.code) return
    const code = form.code.toUpperCase()

    // Check if user is already in this team
    if (isTeamMember(code)) {
      setError('You are already a member of this team. You cannot join the same team twice.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      joinTeam(code, form.name)
      // Get actual project name from persisted team data
      let projectName = 'Team Project'
      try {
        const teamData = JSON.parse(localStorage.getItem('flowmind_team_data') || '{}')
        if (teamData[code]?.projectName) projectName = teamData[code].projectName
      } catch {}
      saveTeam(code, projectName, 'member', 'code')
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

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: 'var(--red)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              textAlign: 'center',
            }}>{error}</div>
          )}

          <button
            className={`btn-primary ${styles.submit}`}
            onClick={handleJoin}
            disabled={loading || !form.name || form.code.length < 4}
          >
            {loading ? <><span className="spinner" /> Joining...</> : <>⚡ Join Team</>}
          </button>

          <div style={{ textAlign: 'center', margin: '12px 0 0' }}>
            <span style={{ fontSize: '13px', color: 'var(--text3)' }}>or</span>
          </div>

          <button
            className={`btn-secondary ${styles.submit}`}
            onClick={() => navigate('find-teams')}
            style={{ background: 'var(--surface)' }}
          >
            🔍 Find Universal Teams
          </button>
        </div>
      </div>
    </div>
  )
}
