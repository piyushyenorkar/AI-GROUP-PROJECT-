import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import styles from './Landing.module.css'

export default function Landing() {
  const { navigate } = useApp()
  const { user, isAuthenticated } = useAuth()
  const [hovered, setHovered] = useState(null)

  // If authenticated, show welcome with options
  // If not, redirect to create/join still works but Sign In offers persistence
  return (
    <div className={styles.page}>
      {/* Background grid */}
      <div className={styles.grid} />
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>FM</span>
          <span className={styles.logoText}>FlowMind</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={styles.navTag}>AI Group Project Manager</span>
          {isAuthenticated ? (
            <button className="btn-ghost" onClick={() => navigate('auth')} style={{ fontSize: '13px' }}>
              👤 {user.name}
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate('auth')} style={{ padding: '7px 16px', fontSize: '13px' }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      <main className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Powered by Hindsight Memory
        </div>

        <h1 className={styles.headline}>
          The PM that<br />
          <span className={styles.accent}>never forgets.</span>
        </h1>

        <p className={styles.sub}>
          FlowMind builds a living memory of your team — every task, every decision, every pattern — and uses it to predict problems before they happen.
        </p>

        <div className={styles.actions}>
          <button
            className={`${styles.actionCard} ${hovered === 'leader' ? styles.activeCard : ''}`}
            onMouseEnter={() => setHovered('leader')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              if (!isAuthenticated) { navigate('auth'); return }
              navigate('leader-setup')
            }}
          >
            <div className={styles.actionIcon}>👑</div>
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>Create a Team</div>
              <div className={styles.actionDesc}>I'm the project leader</div>
            </div>
            <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          <button
            className={`${styles.actionCard} ${hovered === 'member' ? styles.activeCard : ''}`}
            onMouseEnter={() => setHovered('member')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              if (!isAuthenticated) { navigate('auth'); return }
              navigate('member-join')
            }}
          >
            <div className={styles.actionIcon}>🧑‍💻</div>
            <div className={styles.actionContent}>
              <div className={styles.actionTitle}>Join a Team</div>
              <div className={styles.actionDesc}>I have a team code</div>
            </div>
            <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </main>

      <div className={styles.features}>
        {[
          { icon: '🧠', title: 'Persistent Memory', desc: 'Every action, decision, and outcome is stored and recalled by AI' },
          { icon: '⚠️', title: 'Conflict Predictor', desc: 'AI warns you before delays happen, based on past patterns' },
          { icon: '💬', title: 'Memory-Backed Chat', desc: "Ask anything. Get answers grounded in your team's actual history" },
        ].map((f, i) => (
          <div key={i} className={styles.featureCard} style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={styles.featureIcon}>{f.icon}</div>
            <div className={styles.featureTitle}>{f.title}</div>
            <div className={styles.featureDesc}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
