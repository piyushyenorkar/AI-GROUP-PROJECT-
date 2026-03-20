import React from 'react'
import { useApp } from '../context/AppContext'
import styles from './LeaderOverview.module.css'

export default function LeaderOverview({ setActiveTab }) {
  const { team, tasks, decisions, members, memoryFeed } = useApp()

  const done = tasks.filter(t => t.status === 'done').length
  const inProgress = tasks.filter(t => t.status === 'in-progress').length
  const todo = tasks.filter(t => t.status === 'todo').length
  const healthScore = tasks.length === 0 ? 100 : Math.round((done / tasks.length) * 60 + (inProgress / tasks.length) * 30 + 10)

  const healthColor = healthScore >= 70 ? 'var(--green)' : healthScore >= 40 ? 'var(--yellow)' : 'var(--red)'

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        {/* Health score */}
        <div className={`card ${styles.healthCard}`}>
          <div className={styles.healthLabel}>Team Health Score</div>
          <div className={styles.healthScore} style={{ color: healthColor }}>{healthScore}</div>
          <div className={styles.healthSub}>/ 100</div>
          <div className={styles.healthBar}>
            <div className={styles.healthFill} style={{ width: `${healthScore}%`, background: healthColor }} />
          </div>
          <div className={styles.healthHint}>
            {healthScore >= 70 ? '✅ Team is on track' : healthScore >= 40 ? '⚠️ Some tasks need attention' : '🔴 Team needs help'}
          </div>
        </div>

        {/* Team Code Card */}
        <div className={`card ${styles.codeCard}`}>
          <div className={styles.codeLabel}>Share with team</div>
          <div className={styles.codeDisplay}>{team?.code}</div>
          <div className={styles.codeSub}>Team Code</div>
          <div className={styles.codeMembers}>{members.length} member{members.length !== 1 ? 's' : ''} joined</div>
        </div>

        {/* Deadline */}
        <div className={`card ${styles.deadlineCard}`}>
          <div className={styles.deadlineLabel}>Deadline</div>
          <div className={styles.deadlineDate}>
            {team?.deadline ? new Date(team.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
          </div>
          {team?.deadline && (
            <div className={styles.deadlineDays}>
              {Math.max(0, Math.ceil((new Date(team.deadline) - new Date()) / (1000 * 60 * 60 * 24)))} days left
            </div>
          )}
        </div>
      </div>

      {/* Task Stats */}
      <div className={styles.statsRow}>
        {[
          { label: 'To Do', val: todo, color: 'var(--text2)', bg: 'var(--surface)' },
          { label: 'In Progress', val: inProgress, color: 'var(--yellow)', bg: 'var(--yellow-dim)' },
          { label: 'Done', val: done, color: 'var(--green)', bg: 'var(--green-dim)' },
          { label: 'Decisions', val: decisions.length, color: 'var(--accent2)', bg: 'var(--accent-glow)' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard} style={{ background: s.bg, borderColor: s.color + '30' }}>
            <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className={styles.section}>
        <div className="section-title">Quick Actions</div>
        <div className={styles.quickActions}>
          {[
            { icon: '📌', label: 'Assign a Task', tab: 'tasks' },
            { icon: '⚖️', label: 'Log a Decision', tab: 'decisions' },
            { icon: '🔮', label: 'View AI Insights', tab: 'insights' },
            { icon: '💬', label: 'Ask AI Chat', tab: 'chat' },
          ].map((a, i) => (
            <button key={i} className={styles.quickBtn} onClick={() => setActiveTab(a.tab)}>
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent tasks */}
      {tasks.length > 0 && (
        <div className={styles.section}>
          <div className="section-title">Recent Tasks</div>
          <div className={styles.taskList}>
            {tasks.slice(0, 4).map(task => (
              <div key={task.id} className={styles.taskRow}>
                <div className={styles.taskStatus} data-status={task.status} />
                <div className={styles.taskTitle}>{task.title}</div>
                <div className={styles.taskMeta}>{task.assignedTo}</div>
                <span className={`tag ${task.status === 'done' ? 'tag-green' : task.status === 'in-progress' ? 'tag-yellow' : 'tag-purple'}`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
