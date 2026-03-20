import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './TasksTab.module.css'

const STATUS_OPTIONS = ['todo', 'in-progress', 'done']
const STATUS_LABELS = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' }

export default function TasksTab() {
  const { tasks, members, addTask, updateTaskStatus } = useApp()
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', deadline: '', estimatedHours: '' })
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAdd = () => {
    if (!form.title || !form.assignedTo) return
    addTask({ ...form, estimatedHours: Number(form.estimatedHours) || 0 })
    setForm({ title: '', description: '', assignedTo: '', deadline: '', estimatedHours: '' })
    setShowForm(false)
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div className={styles.filters}>
          {['all', ...STATUS_OPTIONS].map(f => (
            <button key={f} className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
              <span className={styles.filterCount}>
                {f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length}
              </span>
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ New Task'}
        </button>
      </div>

      {showForm && (
        <div className={`card ${styles.formCard} animate-in`}>
          <div className="section-title">Assign New Task</div>
          <div className={styles.formGrid}>
            <div>
              <label className="label">Task Title *</label>
              <input className="input" placeholder="e.g. Build login API" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label">Assign To *</label>
              <select className="input" value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} style={{ cursor: 'pointer' }}>
                <option value="">Select a team member</option>
                {members.map((m, i) => (
                  <option key={m.id || i} value={m.name}>{m.name} {m.isLeader ? '(Leader)' : '(Member)'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Deadline</label>
              <input className="input" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
            <div>
              <label className="label">Estimated Hours</label>
              <input className="input" type="number" placeholder="e.g. 4" value={form.estimatedHours} onChange={e => set('estimatedHours', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Description</label>
              <textarea className="textarea" placeholder="What needs to be done?" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button className="btn-primary" onClick={handleAdd} disabled={!form.title || !form.assignedTo}>
              📌 Assign Task
            </button>
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className={styles.kanban}>
        {STATUS_OPTIONS.map(status => (
          <div key={status} className={styles.column}>
            <div className={styles.colHeader}>
              <span className={styles.colDot} data-status={status} />
              <span className={styles.colTitle}>{STATUS_LABELS[status]}</span>
              <span className={styles.colCount}>{tasks.filter(t => t.status === status).length}</span>
            </div>
            <div className={styles.colCards}>
              {tasks.filter(t => t.status === status).map(task => (
                <TaskCard key={task.id} task={task} onStatusChange={updateTaskStatus} />
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className={styles.empty}>No tasks here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={styles.taskCard} onClick={() => setExpanded(!expanded)}>
      <div className={styles.taskTop}>
        <div className={styles.taskTitle}>{task.title}</div>
        <span className={styles.expandIcon}>{expanded ? '▲' : '▼'}</span>
      </div>
      <div className={styles.taskAssigned}>👤 {task.assignedTo}</div>
      {task.deadline && <div className={styles.taskDeadline}>📅 {new Date(task.deadline).toLocaleDateString()}</div>}
      {task.estimatedHours > 0 && <div className={styles.taskHours}>⏱ {task.estimatedHours}h estimated</div>}
      {expanded && (
        <div className={styles.taskExpanded} onClick={e => e.stopPropagation()}>
          {task.description && <p className={styles.taskDesc}>{task.description}</p>}
          {task.updates.length > 0 && (
            <div className={styles.updates}>
              <div className={styles.updatesTitle}>Updates ({task.updates.length})</div>
              {task.updates.map((u, i) => (
                <div key={i} className={styles.update}>
                  <span className={styles.updateAuthor}>{u.author}:</span> {u.text}
                </div>
              ))}
            </div>
          )}
          <div className={styles.statusBtns}>
            {['todo', 'in-progress', 'done'].map(s => (
              <button
                key={s}
                className={`${styles.statusBtn} ${task.status === s ? styles.statusActive : ''}`}
                onClick={() => onStatusChange(task.id, s)}
              >
                {s === 'todo' ? '📋 Todo' : s === 'in-progress' ? '⚡ In Progress' : '✅ Done'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
