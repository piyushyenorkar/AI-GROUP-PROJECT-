import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { storeMemberProfile } from '../utils/hindsightClient'
import styles from './MemberProfile.module.css'

const TASK_TYPES = ['Frontend', 'Backend', 'Design', 'Research', 'Testing', 'Documentation']

function calcStrength(p) {
  let s = 0
  if (p.title) s += 20
  if (p.skills?.length > 0) s += 25
  if (p.pastWork) s += 25
  if (p.availability) s += 15
  if (p.preferredTypes?.length > 0) s += 15
  return s
}

export default function MemberProfile() {
  const { currentUser, memberProfiles, updateMemberProfile } = useApp()
  const name = currentUser?.name || 'Member'
  const existing = memberProfiles?.[name] || {}

  const [form, setForm] = useState({
    title: existing.title || '',
    skills: existing.skills || [],
    pastWork: existing.pastWork || '',
    availability: existing.availability || '',
    preferredTypes: existing.preferredTypes || [],
  })
  const [skillInput, setSkillInput] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (existing.title !== undefined) {
      setForm({
        title: existing.title || '',
        skills: existing.skills || [],
        pastWork: existing.pastWork || '',
        availability: existing.availability || '',
        preferredTypes: existing.preferredTypes || [],
      })
    }
  }, [name])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && form.skills.length < 15 && !form.skills.includes(s)) {
      set('skills', [...form.skills, s])
      setSkillInput('')
    }
  }

  const removeSkill = (idx) => set('skills', form.skills.filter((_, i) => i !== idx))

  const toggleType = (t) => {
    set('preferredTypes',
      form.preferredTypes.includes(t)
        ? form.preferredTypes.filter(x => x !== t)
        : [...form.preferredTypes, t]
    )
  }

  const handleSave = () => {
    updateMemberProfile(name, form)
    storeMemberProfile(name, form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const strength = calcStrength(form)
  const barColor = strength < 40 ? 'var(--red)' : strength < 70 ? 'var(--yellow)' : 'var(--green)'

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.avatar}>{name[0]?.toUpperCase()}</div>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{name}</div>
          <div className={styles.headerRole}>{currentUser?.isLeader ? '👑 Leader' : '🧑‍💻 Member'}</div>
        </div>
      </div>

      <div className={styles.strengthWrap}>
        <div className={styles.strengthLabel}>
          <span>Profile Strength</span>
          <span style={{ color: barColor, fontWeight: 600 }}>{strength}%</span>
        </div>
        <div className={styles.strengthBar}>
          <div className={styles.strengthFill} style={{ width: `${strength}%`, background: barColor }} />
        </div>
      </div>

      <div className={styles.form}>
        <div className={styles.field}>
          <label>Role / Title</label>
          <input className="input" placeholder="e.g. Frontend Developer" value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        <div className={styles.field}>
          <label>Skills ({form.skills.length}/15)</label>
          <div className={styles.skillsInput}>
            {form.skills.map((s, i) => (
              <span key={i} className={styles.skillPill}>
                {s} <button onClick={() => removeSkill(i)}>×</button>
              </span>
            ))}
            <input
              placeholder="Type a skill and press Enter..."
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Past Work / Experience</label>
          <textarea className="textarea" placeholder="Describe projects you've worked on, technologies used, achievements..." value={form.pastWork} onChange={e => set('pastWork', e.target.value)} style={{ minHeight: '100px' }} />
        </div>

        <div className={styles.field}>
          <label>Availability</label>
          <div className={styles.availGroup}>
            {[
              { v: 'Full-time', c: 'var(--green)' },
              { v: 'Part-time', c: 'var(--yellow)' },
              { v: 'Busy', c: 'var(--red)' },
            ].map(a => (
              <button
                key={a.v}
                className={styles.availBtn}
                onClick={() => set('availability', a.v)}
                style={form.availability === a.v ? { background: a.c, color: '#fff', borderColor: a.c } : {}}
              >
                {a.v}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label>Preferred Task Types</label>
          <div className={styles.checkGrid}>
            {TASK_TYPES.map(t => {
              const active = form.preferredTypes.includes(t)
              return (
                <div key={t} className={`${styles.checkItem} ${active ? styles.checkActive : ''}`} onClick={() => toggleType(t)}>
                  <div className={`${styles.checkBox} ${active ? styles.checkBoxActive : ''}`}>
                    {active && '✓'}
                  </div>
                  {t}
                </div>
              )
            })}
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} style={{ width: '100%', justifyContent: 'center' }}>
          💾 Save Profile
        </button>

        {saved && (
          <div className={styles.success}>
            ✅ Profile saved! AI will use your skills for task assignment.
          </div>
        )}
      </div>
    </div>
  )
}
