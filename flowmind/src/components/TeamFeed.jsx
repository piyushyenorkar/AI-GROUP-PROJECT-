import React from 'react'
import { useApp } from '../context/AppContext'
import styles from './TeamFeed.module.css'

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TYPE_STYLES = {
  task_assigned: { bg: 'var(--accent-glow)', border: 'rgba(124,106,255,0.2)', color: 'var(--accent2)' },
  task_status: { bg: 'var(--green-dim)', border: 'rgba(34,211,160,0.2)', color: 'var(--green)' },
  task_update: { bg: 'var(--surface)', border: 'var(--border)', color: 'var(--text2)' },
  decision_made: { bg: 'var(--yellow-dim)', border: 'rgba(251,191,36,0.2)', color: 'var(--yellow)' },
  member_joined: { bg: 'var(--green-dim)', border: 'rgba(34,211,160,0.2)', color: 'var(--green)' },
  project_created: { bg: 'var(--accent-glow)', border: 'rgba(124,106,255,0.2)', color: 'var(--accent2)' },
}

export default function TeamFeed() {
  const { memoryFeed, team } = useApp()

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>Team Feed</div>
        <div className={styles.sub}>Live activity from your project — powered by Hindsight memory</div>
      </div>

      {memoryFeed.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>📡</div>
          <div className={styles.emptyTitle}>No activity yet</div>
          <div className={styles.emptySub}>Team events will appear here as your leader assigns tasks and logs decisions</div>
        </div>
      )}

      <div className={styles.feed}>
        {memoryFeed.map((entry, i) => {
          const style = TYPE_STYLES[entry.type] || TYPE_STYLES['task_update']
          return (
            <div
              key={entry.id}
              className={styles.entry}
              style={{ background: style.bg, borderColor: style.border, animationDelay: `${i * 0.05}s` }}
            >
              <span className={styles.icon}>{entry.icon}</span>
              <div className={styles.content}>
                <div className={styles.text} style={{ color: style.color }}>{entry.text}</div>
                <div className={styles.time}>{timeAgo(entry.timestamp)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
