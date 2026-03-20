import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import TeamSwitcher from './TeamSwitcher'
import styles from './Sidebar.module.css'

const LEADER_ITEMS = [
  { id: 'overview', icon: '⬡', label: 'Overview' },
  { id: 'tasks', icon: '📌', label: 'Tasks' },
  { id: 'meetings', icon: '🎙️', label: 'Meetings' },
  { id: 'decisions', icon: '⚖️', label: 'Decisions' },
  { id: 'insights', icon: '🔮', label: 'AI Insights' },
  { id: 'chat', icon: '💬', label: 'AI Chat' },
  { id: 'members', icon: '👥', label: 'Team Members' },
  { id: 'groupchat', icon: '🗨️', label: 'Group Chat' },
]

const MEMBER_ITEMS = [
  { id: 'mytasks', icon: '📋', label: 'My Tasks' },
  { id: 'meetings', icon: '🎙️', label: 'Meetings' },
  { id: 'chat', icon: '💬', label: 'AI Assistant' },
  { id: 'feed', icon: '📡', label: 'Team Feed' },
  { id: 'members', icon: '👥', label: 'Team Members' },
  { id: 'groupchat', icon: '🗨️', label: 'Group Chat' },
]

export default function Sidebar({ activeTab, setActiveTab }) {
  const { team, currentUser, role, navigate } = useApp()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const items = role === 'leader' ? LEADER_ITEMS : MEMBER_ITEMS

  return (
    <>
      <aside className={styles.sidebar}>
        {/* Clickable logo → team switcher */}
        <div className={styles.logo} onClick={() => setShowSwitcher(true)} style={{ cursor: 'pointer' }} title="Switch team">
          <span className={styles.logoMark}>FM</span>
          <span className={styles.logoText}>FlowMind</span>
        </div>

        <div className={styles.project}>
          <div className={styles.projectName}>{team?.projectName || 'Project'}</div>
          <div className={styles.projectCode}>
            {role === 'leader' ? `Code: ${team?.code}` : `Team: ${team?.code}`}
          </div>
        </div>

        <nav className={styles.nav}>
          {items.map(item => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
              {activeTab === item.id && <span className={styles.activePill} />}
            </button>
          ))}
        </nav>

        <div className={styles.bottom}>
          <div className={styles.user}>
            <div className={styles.userAvatar}>
              {currentUser?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{currentUser?.name}</div>
              <div className={styles.userRole}>{role === 'leader' ? '👑 Leader' : '🧑‍💻 Member'}</div>
            </div>
          </div>
          <button className={styles.exitBtn} onClick={() => navigate('landing')} title="Back to Home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
        </div>
      </aside>

      {showSwitcher && <TeamSwitcher onClose={() => setShowSwitcher(false)} />}
    </>
  )
}
