import React from 'react'
import { useApp } from '../context/AppContext'
import styles from './MemoryFeed.module.css'

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function MemoryFeed() {
  const { memoryFeed } = useApp()

  return (
    <div className={styles.feed}>
      <div className={styles.header}>
        <span className={styles.dot} />
        <span className={styles.title}>Hindsight Memory</span>
        <span className={styles.count}>{memoryFeed.length}</span>
      </div>
      <div className={styles.list}>
        {memoryFeed.length === 0 && (
          <div className={styles.empty}>Memory events will appear here as your team works</div>
        )}
        {memoryFeed.map((entry, i) => (
          <div key={entry.id} className={styles.entry} style={{ animationDelay: `${i * 0.04}s` }}>
            <span className={styles.icon}>{entry.icon}</span>
            <div className={styles.content}>
              <div className={styles.text}>{entry.text}</div>
              <div className={styles.time}>{timeAgo(entry.timestamp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
