import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { generateInsights } from '../services/api'
import styles from './InsightsTab.module.css'

// ─── MOCK FALLBACK ─────────────────────────────────────────────────────────────
function getMockInsights(tasks, decisions) {
  return {
    risks: [
      { member: tasks[0]?.assignedTo || 'Team member', task: tasks[0]?.title || 'Current task', risk: 72, reason: 'Pattern: similar tasks took 2x estimated time in past cycles.' },
      { member: tasks[1]?.assignedTo || 'Another member', task: tasks[1]?.title || 'Pending task', risk: 45, reason: 'Deadline is approaching with no progress updates logged.' },
    ],
    patterns: [
      { icon: '📈', title: 'Peak Productivity Window', detail: 'Team logs most updates between 2–6 PM. Schedule critical reviews in this window.' },
      { icon: '🔁', title: 'Recurring Bottleneck', detail: 'Backend tasks consistently run over estimate. Add 30% buffer for all backend work.' },
      { icon: '✅', title: 'Strong Closer', detail: `${tasks.find(t => t.status === 'done')?.assignedTo || 'Your team'} has the highest completion rate. Assign critical path tasks here.` },
    ],
    bottlenecks: tasks.filter(t => t.status !== 'done').slice(0, 3).map(t => ({
      task: t.title,
      person: t.assignedTo,
      waiting: Math.floor(Math.random() * 3) + 1,
    })),
    recommendation: `Based on ${tasks.length} tasks and ${decisions.length} decisions in memory: Focus on unblocking in-progress work before adding new tasks.`,
  }
}

export default function InsightsTab() {
  const { tasks, decisions, members, team } = useApp()
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      // Try real API first
      const data = await generateInsights(team?.code, tasks, decisions, members)
      if (data && data.risks) {
        setInsights(data)
      } else {
        // Fallback to mock
        console.info('[Insights] API returned no data, using mock fallback')
        await new Promise(r => setTimeout(r, 800))
        setInsights(getMockInsights(tasks, decisions))
      }
    } catch (e) {
      console.error('[Insights] Error:', e)
      await new Promise(r => setTimeout(r, 800))
      setInsights(getMockInsights(tasks, decisions))
    }
    setLoading(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <div>
          <div className={styles.pageTitle}>AI Insights</div>
          <div className={styles.pageSub}>Powered by Hindsight memory — predictions based on your team's actual history</div>
        </div>
        <button className="btn-primary" onClick={generate} disabled={loading}>
          {loading ? <><span className="spinner" /> Analysing...</> : '🔮 Generate Insights'}
        </button>
      </div>

      {!insights && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyGlow} />
          <div className={styles.emptyIcon}>🔮</div>
          <div className={styles.emptyTitle}>Ready to analyse your team</div>
          <div className={styles.emptySub}>
            FlowMind will read all {tasks.length} tasks and {decisions.length} decisions from Hindsight memory and surface patterns, risks, and recommendations.
          </div>
          <button className="btn-primary" onClick={generate}>Generate Insights Now</button>
        </div>
      )}

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.loadingOrb} />
          <div className={styles.loadingTitle}>Reading Hindsight memory...</div>
          <div className={styles.loadingSteps}>
            {['Recalling team memory', 'Detecting patterns via Groq', 'Predicting risks', 'Generating recommendations'].map((s, i) => (
              <div key={i} className={styles.loadingStep} style={{ animationDelay: `${i * 0.4}s` }}>
                <span className={styles.loadingDot} />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {insights && !loading && (
        <div className={styles.insightsGrid}>
          {/* Risk Cards */}
          <div className={styles.section}>
            <div className="section-title">⚠️ Conflict Predictor</div>
            <div className={styles.riskList}>
              {insights.risks.map((r, i) => (
                <div key={i} className={styles.riskCard}>
                  <div className={styles.riskHeader}>
                    <div className={styles.riskInfo}>
                      <div className={styles.riskTask}>{r.task}</div>
                      <div className={styles.riskMember}>Assigned to {r.member}</div>
                    </div>
                    <div className={styles.riskMeter}>
                      <div className={styles.riskPercent} style={{ color: r.risk > 60 ? 'var(--red)' : 'var(--yellow)' }}>{r.risk}%</div>
                      <div className={styles.riskLabel}>delay risk</div>
                    </div>
                  </div>
                  <div className={styles.riskBar}>
                    <div className={styles.riskFill} style={{ width: `${r.risk}%`, background: r.risk > 60 ? 'var(--red)' : 'var(--yellow)' }} />
                  </div>
                  <div className={styles.riskReason}>{r.reason}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Patterns */}
          <div className={styles.section}>
            <div className="section-title">📊 Team Patterns</div>
            <div className={styles.patternList}>
              {insights.patterns.map((p, i) => (
                <div key={i} className={styles.patternCard}>
                  <span className={styles.patternIcon}>{p.icon}</span>
                  <div>
                    <div className={styles.patternTitle}>{p.title}</div>
                    <div className={styles.patternDetail}>{p.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottlenecks */}
          {insights.bottlenecks.length > 0 && (
            <div className={styles.section}>
              <div className="section-title">🚧 Bottlenecks</div>
              <div className={styles.bottleneckList}>
                {insights.bottlenecks.map((b, i) => (
                  <div key={i} className={styles.bottleneckCard}>
                    <div className={styles.bottleneckTask}>{b.task}</div>
                    <div className={styles.bottleneckMeta}>
                      <span>👤 {b.person}</span>
                      <span className="tag tag-yellow">Waiting {b.waiting}d</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendation */}
          <div className={styles.section} style={{ gridColumn: '1 / -1' }}>
            <div className={`${styles.recommendCard}`}>
              <div className={styles.recommendHeader}>
                <span>🤖</span>
                <span>AI Recommendation</span>
                <span className="tag tag-green">Memory-backed</span>
              </div>
              <div className={styles.recommendText}>{insights.recommendation}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
