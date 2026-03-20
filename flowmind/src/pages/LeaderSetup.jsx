import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import styles from './Setup.module.css'

export default function LeaderSetup() {
  const { createTeam, navigate } = useApp()
  const { saveTeam, saveUniversalTeam, user } = useAuth()
  const [isUniversal, setIsUniversal] = useState(false)
  const [form, setForm] = useState({
    projectName: '', description: '', deadline: '', leaderName: user?.name || '',
    purpose: '', rolesNeeded: '', maxMembers: '', city: '', state: '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async () => {
    if (!form.projectName || !form.leaderName) return
    if (isUniversal && (!form.purpose || !form.rolesNeeded || !form.city || !form.state)) return
    setLoading(true)
    setTimeout(() => {
      const team = createTeam(form.projectName, form.description, form.deadline, form.leaderName)
      if (team?.code) {
        saveTeam(team.code, form.projectName, 'leader', isUniversal ? 'universal' : 'code')
        if (isUniversal) {
          saveUniversalTeam({
            code: team.code,
            name: form.projectName,
            purpose: form.purpose,
            rolesNeeded: form.rolesNeeded,
            maxMembers: Number(form.maxMembers) || 5,
            city: form.city,
            state: form.state,
            createdBy: user?.email,
            leaderName: form.leaderName,
          })
        }
      }
      setLoading(false)
    }, 800)
  }

  return (
    <div className={styles.page}>
      <div className={styles.glow} />
      <div className={styles.card} style={isUniversal ? { maxWidth: '520px' } : {}}>
        <button className={`btn-ghost ${styles.back}`} onClick={() => navigate('landing')}>
          ← Back
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrap}>👑</div>
          <h2 className={styles.title}>Create Your Team</h2>
          <p className={styles.sub}>Set up your project and get a shareable team code for your members</p>
        </div>

        <div className={styles.form}>
          {/* Universal Toggle */}
          <div className={styles.universalToggle} onClick={() => setIsUniversal(!isUniversal)} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
            background: isUniversal ? 'rgba(124,106,255,0.1)' : 'var(--surface)',
            border: `1px solid ${isUniversal ? 'var(--accent)' : 'var(--border)'}`,
            transition: 'all 0.2s',
          }}>
            <div style={{
              width: '38px', height: '20px', borderRadius: '10px',
              background: isUniversal ? 'var(--accent)' : 'var(--border2)',
              position: 'relative', transition: 'all 0.2s',
            }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#fff', position: 'absolute', top: '2px',
                left: isUniversal ? '20px' : '2px', transition: 'left 0.2s',
              }} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>🌍 Make Universal</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>
                {isUniversal ? 'Team will be publicly discoverable' : 'Only joinable with team code'}
              </div>
            </div>
          </div>

          <div className={styles.field}>
            <label className="label">Your Name</label>
            <input className="input" placeholder="e.g. Piyush" value={form.leaderName} onChange={e => set('leaderName', e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className="label">Project / Team Name</label>
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

          {/* Universal-only fields */}
          {isUniversal && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
              <div style={{ fontSize: '13px', color: 'var(--accent2)', fontWeight: '600' }}>🌍 Universal Team Details</div>

              <div className={styles.field}>
                <label className="label">Team Purpose *</label>
                <textarea className="textarea" placeholder="e.g. Building a mobile app for campus events. Looking for developers and designers." value={form.purpose} onChange={e => set('purpose', e.target.value)} style={{ minHeight: '60px' }} />
              </div>

              <div className={styles.field}>
                <label className="label">Roles Needed *</label>
                <input className="input" placeholder="e.g. Frontend Dev, UI Designer, Backend Dev" value={form.rolesNeeded} onChange={e => set('rolesNeeded', e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className={styles.field}>
                  <label className="label">Max Members</label>
                  <input className="input" type="number" placeholder="5" value={form.maxMembers} onChange={e => set('maxMembers', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className="label">City *</label>
                  <input className="input" placeholder="e.g. Pune" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className="label">State *</label>
                  <input className="input" placeholder="e.g. Maharashtra" value={form.state} onChange={e => set('state', e.target.value)} />
                </div>
              </div>
            </>
          )}

          <button
            className={`btn-primary ${styles.submit}`}
            onClick={handleSubmit}
            disabled={loading || !form.projectName || !form.leaderName || (isUniversal && (!form.purpose || !form.rolesNeeded || !form.city || !form.state))}
          >
            {loading ? <><span className="spinner" /> Setting up...</> : isUniversal ? <>🌍 Create Universal Team</> : <>🚀 Create Team &amp; Get Code</>}
          </button>
        </div>
      </div>
    </div>
  )
}
