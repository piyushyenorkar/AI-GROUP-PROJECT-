import React from 'react'
import { useApp } from '../context/AppContext'
import styles from './TeamMembers.module.css'

export default function TeamMembers() {
  const { members, role } = useApp()

  const leader = members.find(m => m.isLeader)
  const membersList = members.filter(m => !m.isLeader)

  return (
    <div className={styles.wrap}>
      <div className="section-title">👥 Team Members</div>
      <div className={styles.count}>{members.length} member{members.length !== 1 ? 's' : ''}</div>

      <div className={styles.list}>
        {/* Leader always first */}
        {leader && (
          <div className={`${styles.member} ${styles.leaderCard}`}>
            <div className={styles.avatar} style={{ background: 'var(--accent)' }}>
              {leader.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className={styles.info}>
              <div className={styles.name}>{leader.name}</div>
              <div className={styles.role}>
                <span className={styles.crown}>👑</span> Team Leader
              </div>
            </div>
            {role === 'leader' && <span className={styles.youBadge}>You</span>}
          </div>
        )}

        {/* Members */}
        {membersList.map((m, i) => (
          <div key={m.id || i} className={styles.member}>
            <div className={styles.avatar}>
              {m.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className={styles.info}>
              <div className={styles.name}>{m.name}</div>
              <div className={styles.role}>🧑‍💻 Member</div>
            </div>
            {role === 'member' && m.name === members.find(x => !x.isLeader)?.name && i === 0 && (
              <span className={styles.youBadge}>You</span>
            )}
          </div>
        ))}

        {membersList.length === 0 && (
          <div className={styles.empty}>No members have joined yet. Share the team code!</div>
        )}
      </div>
    </div>
  )
}
