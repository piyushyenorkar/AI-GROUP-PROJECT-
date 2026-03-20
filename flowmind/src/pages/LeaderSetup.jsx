import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import styles from './Setup.module.css'

export default function LeaderSetup() {
  const { createTeam, navigate } = useApp()
  const { saveTeam, user } = useAuth()
  const [form, setForm] = useState({ projectName: '', description: '', deadline: '', leaderName: user?.name || '' })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.projectName || !form.leaderName) return
    setLoading(true)
    setTimeout(() => {
      const team = createTeam(form.projectName, form.description, form.deadline, form.leaderName)
      // Save team association to user's localStorage profile
      if (team?.code) {
        saveTeam(team.code, form.projectName, 'leader')
      }
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
          <div className={styles.iconWrap}>👑</div>
          <h2 className={styles.title}>Create Your Team</h2>
          <p className={styles.sub}>Set up your project and get a shareable team code for your members</p>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className="label">Your Name</label>
            <input className="input" placeholder="e.g. Piyush" value={form.leaderName} onChange={e => set('leaderName', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className="label">Project Name</label>
            <input className="input" placeholder="e.g. Campus Event App" value={form.projectName} onChange={e => set('projectName', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className="label">Project Description</label>
            <textarea className="textarea" placeholder="What are you building? (optional)" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className="label">Deadline</label>
            <input className="input" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>

          <button
            className={`btn-primary ${styles.submit}`}
            onClick={handleSubmit}
            disabled={loading || !form.projectName || !form.leaderName}
          >
            {loading ? <><span className="spinner" /> Setting up...</> : <>🚀 Create Team &amp; Get Code</>}
          </button>
        </div>
      </div>
    </div>
  )
}
