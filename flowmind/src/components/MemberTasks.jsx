import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import styles from './MemberTasks.module.css'

export default function MemberTasks() {
  const { tasks, currentUser, updateTaskStatus, addTaskUpdate } = useApp()
  const myTasks = tasks.filter(t => t.assignedTo?.toLowerCase() === currentUser?.name?.toLowerCase())
  const [updateInputs, setUpdateInputs] = useState({})

  const setUpdateText = (taskId, val) => setUpdateInputs(p => ({ ...p, [taskId]: val }))

  const submitUpdate = (taskId) => {
    const text = updateInputs[taskId]?.trim()
    if (!text) return
    addTaskUpdate(taskId, text, currentUser.name)
    setUpdateInputs(p => ({ ...p, [taskId]: '' }))
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>My Tasks</div>
        <div className={styles.sub}>
          {myTasks.length === 0
            ? 'No tasks assigned to you yet'
            : `${myTasks.filter(t => t.status === 'done').length} of ${myTasks.length} tasks complete`}
        </div>
      </div>

      {myTasks.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <div className={styles.emptyTitle}>No tasks yet</div>
          <div className={styles.emptySub}>Your leader hasn't assigned you any tasks. Check back soon!</div>
        </div>
      )}

      <div className={styles.taskList}>
        {myTasks.map(task => (
          <TaskItem key={task.id} task={task} updateText={updateInputs[task.id] || ''} setUpdateText={(v) => setUpdateText(task.id, v)} onSubmitUpdate={() => submitUpdate(task.id)} onStatusChange={updateTaskStatus} />
        ))}
      </div>
    </div>
  )
}

function TaskItem({ task, updateText, setUpdateText, onSubmitUpdate, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const statusColor = task.status === 'done' ? 'var(--green)' : task.status === 'in-progress' ? 'var(--yellow)' : 'var(--text3)'

  return (
    <div className={`${styles.taskCard} ${task.status === 'done' ? styles.taskDone : ''}`}>
      <div className={styles.taskHeader} onClick={() => setExpanded(!expanded)}>
        <div className={styles.taskLeft}>
          <button
            className={styles.checkBtn}
            style={{ borderColor: statusColor, background: task.status === 'done' ? 'var(--green)' : 'transparent' }}
            onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done') }}
          >
            {task.status === 'done' && <span>✓</span>}
          </button>
          <div>
            <div className={styles.taskTitle} style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--text3)' : 'var(--text)' }}>
              {task.title}
            </div>
            {task.deadline && <div className={styles.taskDeadline}>📅 Due {new Date(task.deadline).toLocaleDateString()}</div>}
          </div>
        </div>
        <div className={styles.taskRight}>
          <span className={`tag ${task.status === 'done' ? 'tag-green' : task.status === 'in-progress' ? 'tag-yellow' : 'tag-purple'}`}>
            {task.status === 'in-progress' ? 'In Progress' : task.status === 'done' ? 'Done' : 'To Do'}
          </span>
          <span className={styles.expandIcon}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.taskBody} onClick={e => e.stopPropagation()}>
          {task.description && <p className={styles.taskDesc}>{task.description}</p>}

          {task.status !== 'done' && (
            <div className={styles.statusRow}>
              {['todo', 'in-progress', 'done'].map(s => (
                <button key={s} className={`${styles.statusBtn} ${task.status === s ? styles.statusActive : ''}`} onClick={() => onStatusChange(task.id, s)}>
                  {s === 'todo' ? '📋 Todo' : s === 'in-progress' ? '⚡ Working' : '✅ Done'}
                </button>
              ))}
            </div>
          )}

          {task.updates.length > 0 && (
            <div className={styles.updates}>
              <div className={styles.updatesTitle}>Your Updates</div>
              {task.updates.map((u, i) => (
                <div key={i} className={styles.update}>
                  <div className={styles.updateText}>{u.text}</div>
                  <div className={styles.updateTime}>{new Date(u.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.logUpdate}>
            <textarea
              className="textarea"
              placeholder="Log your progress... (saves to team memory)"
              value={updateText}
              onChange={e => setUpdateText(e.target.value)}
              style={{ minHeight: '60px' }}
            />
            <button className="btn-primary" onClick={onSubmitUpdate} disabled={!updateText.trim()}>
              📝 Save Update
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
