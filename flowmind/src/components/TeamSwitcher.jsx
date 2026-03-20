import React from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import styles from './TeamSwitcher.module.css'

export default function TeamSwitcher({ onClose }) {
  const { loadTeamAsLeader, joinTeam, navigate } = useApp()
  const { user, getMyTeams } = useAuth()

  const teams = getMyTeams()
  const ledTeams = teams.filter(t => t.role === 'leader')
  const joinedTeams = teams.filter(t => t.role === 'member')

  const handleSelect = (team) => {
    if (team.role === 'leader') {
      loadTeamAsLeader(team.code, team.projectName, user.name)
    } else {
      joinTeam(team.code, user.name)
    }
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <div className={styles.title}>My Teams</div>
        <div className={styles.sub}>Select a team to switch to its dashboard</div>

        {/* Leading teams */}
        <div className={styles.group}>
          <div className={styles.groupTitle}>👑 Teams You Lead</div>
          {ledTeams.length === 0 ? (
            <div className={styles.noTeams}>No teams created yet</div>
          ) : (
            ledTeams.map((t, i) => (
              <div key={i} className={styles.teamItem} onClick={() => handleSelect(t)}>
                <div className={styles.teamIcon} style={{ background: 'var(--accent-glow)' }}>👑</div>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>
                    {t.projectName}
                    {t.source === 'universal' && <span className={styles.universalBadge}>🌍 Universal</span>}
                  </div>
                  <div className={styles.teamMeta}>Code: {t.code} · Leader</div>
                </div>
                <svg className={styles.teamArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            ))
          )}
        </div>

        {/* Joined teams */}
        <div className={styles.group}>
          <div className={styles.groupTitle}>🧑‍💻 Teams You Joined</div>
          {joinedTeams.length === 0 ? (
            <div className={styles.noTeams}>No teams joined yet</div>
          ) : (
            joinedTeams.map((t, i) => (
              <div key={i} className={styles.teamItem} onClick={() => handleSelect(t)}>
                <div className={styles.teamIcon} style={{ background: t.source === 'universal' ? 'rgba(124,106,255,0.1)' : 'var(--green-dim)' }}>
                  {t.source === 'universal' ? '🌍' : '⚡'}
                </div>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>
                    {t.projectName}
                    {t.source === 'universal' && <span className={styles.universalBadge}>🌍 Universal</span>}
                  </div>
                  <div className={styles.teamMeta}>Code: {t.code} · Member</div>
                </div>
                <svg className={styles.teamArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            ))
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button className="btn-primary" onClick={() => { onClose(); navigate('leader-setup') }} style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}>
            + Create Team
          </button>
          <button className="btn-secondary" onClick={() => { onClose(); navigate('find-teams') }} style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}>
            🔍 Find Teams
          </button>
        </div>
      </div>
    </div>
  )
}
