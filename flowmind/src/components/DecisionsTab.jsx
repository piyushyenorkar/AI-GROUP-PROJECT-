import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './DecisionsTab.module.css'

export default function DecisionsTab() {
  const { decisions, addDecision } = useApp()
  const [form, setForm] = useState({ decision: '', reason: '', involvedPeople: '', impact: 'medium' })
  const [showForm, setShowForm] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (!form.decision) return
    addDecision({ ...form })
    setForm({ decision: '', reason: '', involvedPeople: '', impact: 'medium' })
    setShowForm(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.pageTitle}>Decision Log</div>
          <div className={styles.pageSub}>Every decision stored in Hindsight memory with full context</div>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Log Decision'}
        </button>
      </div>

      {showForm && (
        <div className={`card ${styles.formCard} animate-in`}>
          <div className="section-title">Log a Decision</div>
          <div className={styles.formFields}>
            <div>
              <label className="label">What was decided? *</label>
              <textarea className="textarea" placeholder="e.g. We decided to use PostgreSQL instead of MongoDB for better relational data support" value={form.decision} onChange={e => set('decision', e.target.value)} />
            </div>
            <div>
              <label className="label">Why was this decided?</label>
              <textarea className="textarea" placeholder="The reasoning behind this decision..." value={form.reason} onChange={e => set('reason', e.target.value)} style={{ minHeight: '60px' }} />
            </div>
            <div className={styles.twoCol}>
              <div>
                <label className="label">People Involved</label>
                <input className="input" placeholder="e.g. Piyush, Raj, Priya" value={form.involvedPeople} onChange={e => set('involvedPeople', e.target.value)} />
              </div>
              <div>
                <label className="label">Impact Level</label>
                <select className="input" value={form.impact} onChange={e => set('impact', e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>
          <div className={styles.formActions}>
            <button className="btn-primary" onClick={handleAdd} disabled={!form.decision}>
              ⚖️ Save to Memory
            </button>
          </div>
        </div>
      )}

      {decisions.length === 0 && !showForm && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚖️</div>
          <div className={styles.emptyTitle}>No decisions logged yet</div>
          <div className={styles.emptySub}>Start logging decisions so your AI can learn from them</div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>Log First Decision</button>
        </div>
      )}

      <div className={styles.timeline}>
        {decisions.map((d, i) => (
          <div key={d.id} className={`${styles.decisionCard} animate-in`} style={{ animationDelay: `${i * 0.07}s` }}>
            <div className={styles.timelineLine} />
            <div className={styles.timelineDot} />
            <div className={styles.decisionContent}>
              <div className={styles.decisionHeader}>
                <span className={`tag ${d.impact === 'critical' ? 'tag-red' : d.impact === 'high' ? 'tag-yellow' : d.impact === 'medium' ? 'tag-purple' : 'tag-green'}`}>
                  {d.impact} impact
                </span>
                <span className={styles.decisionDate}>
                  {new Date(d.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={styles.decisionText}>{d.decision}</div>
              {d.reason && (
                <div className={styles.decisionReason}>
                  <span className={styles.reasonLabel}>Why:</span> {d.reason}
                </div>
              )}
              {d.involvedPeople && (
                <div className={styles.decisionPeople}>
                  👥 {d.involvedPeople}
                </div>
              )}
              <div className={styles.memoryTag}>
                <span className={styles.memoryDot} />
                Stored in Hindsight Memory
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
