import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import styles from './FindTeams.module.css'

const TABS = [
  { id: 'explore', label: '🔍 Explore' },
  { id: 'myteams', label: '🌍 My Teams' },
  { id: 'applied', label: '📤 Applied' },
  { id: 'received', label: '📥 Received' },
]

export default function FindTeams() {
  const { navigate, joinTeam } = useApp()
  const {
    user, getUniversalTeams, getMyUniversalTeams,
    applyToTeam, getMyApplications, getReceivedApplications,
    updateApplication, addChatMessage, getApplication,
    saveTeam, isTeamMember,
  } = useAuth()
  const [activeTab, setActiveTab] = useState('explore')
  const [search, setSearch] = useState('')
  const [chatOpen, setChatOpen] = useState(null) // appId
  const [chatText, setChatText] = useState('')
  const [, forceUpdate] = useState(0)

  const refresh = () => forceUpdate(n => n + 1)

  // Data
  const allTeams = getUniversalTeams()
  const myCreated = getMyUniversalTeams()
  const myApps = getMyApplications()
  const received = getReceivedApplications()

  // Filter explore teams
  const filteredTeams = allTeams.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.name?.toLowerCase().includes(q) ||
      t.purpose?.toLowerCase().includes(q) ||
      t.city?.toLowerCase().includes(q) ||
      t.state?.toLowerCase().includes(q) ||
      t.rolesNeeded?.toLowerCase().includes(q)
    )
  })

  const handleApply = (team) => {
    const result = applyToTeam(team.code, team.name)
    if (result.error) {
      alert(result.error)
    } else {
      setActiveTab('applied')
      refresh()
    }
  }

  const handleAccept = (app) => {
    updateApplication(app.id, 'accepted')
    // Auto-join the applicant to the team
    refresh()
  }

  const handleReject = (app) => {
    updateApplication(app.id, 'rejected')
    refresh()
  }

  const handleSendChat = (appId) => {
    if (!chatText.trim()) return
    addChatMessage(appId, chatText.trim())
    setChatText('')
    refresh()
  }

  const joinAcceptedTeam = (app) => {
    joinTeam(app.teamCode, user.name)
    saveTeam(app.teamCode, app.teamName, 'member')
  }

  return (
    <div className={styles.page}>
      <div className={styles.topNav}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>FM</span>
          <span className={styles.logoText}>FlowMind</span>
        </div>
        <button className="btn-ghost" onClick={() => navigate('landing')}>← Back to Home</button>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.title}>Find Teams</div>
          <div className={styles.sub}>Discover universal teams, apply, and collaborate with people across cities</div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === 'applied' && myApps.length > 0 && (
                <span className={styles.tabBadge}>{myApps.length}</span>
              )}
              {tab.id === 'received' && received.filter(a => a.status === 'pending').length > 0 && (
                <span className={styles.tabBadge}>{received.filter(a => a.status === 'pending').length}</span>
              )}
            </button>
          ))}
        </div>

        {/* EXPLORE TAB */}
        {activeTab === 'explore' && (
          <>
            <div className={styles.searchRow}>
              <input
                className="input"
                placeholder="Search by name, role, city, or purpose..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {filteredTeams.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🌍</div>
                <div className={styles.emptyTitle}>No universal teams found</div>
                <div className={styles.emptySub}>
                  {search ? 'Try a different search term' : 'Be the first — create a Universal team!'}
                </div>
              </div>
            ) : (
              <div className={styles.grid}>
                {filteredTeams.map(team => {
                  const alreadyApplied = myApps.some(a => a.teamCode === team.code)
                  const alreadyMember = isTeamMember(team.code)
                  const isOwner = team.createdBy === user?.email

                  return (
                    <div key={team.code} className={styles.teamCard}>
                      <div className={styles.teamHeader}>
                        <div>
                          <div className={styles.teamName}>{team.name}</div>
                          <div className={styles.teamLeader}>by {team.leaderName}</div>
                        </div>
                        <div className={styles.teamLocation}>📍 {team.city}, {team.state}</div>
                      </div>

                      <div className={styles.teamPurpose}>{team.purpose}</div>

                      <div className={styles.teamMeta}>
                        {team.rolesNeeded?.split(',').map((role, i) => (
                          <span key={i} className="tag tag-purple">{role.trim()}</span>
                        ))}
                        <span className="tag tag-green">👥 {team.maxMembers} members</span>
                      </div>

                      <div className={styles.teamActions}>
                        {isOwner ? (
                          <span style={{ fontSize: '13px', color: 'var(--text3)' }}>Your team</span>
                        ) : alreadyMember ? (
                          <span style={{ fontSize: '13px', color: 'var(--green)' }}>✅ Already a member</span>
                        ) : alreadyApplied ? (
                          <span style={{ fontSize: '13px', color: 'var(--yellow)' }}>⏳ Applied</span>
                        ) : (
                          <button className="btn-primary" onClick={() => handleApply(team)} style={{ fontSize: '13px', padding: '7px 18px' }}>
                            ✋ Apply to Join
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* MY TEAMS TAB */}
        {activeTab === 'myteams' && (
          <>
            {myCreated.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🌍</div>
                <div className={styles.emptyTitle}>No universal teams yet</div>
                <div className={styles.emptySub}>Create a team with "Make Universal" to list it here</div>
                <button className="btn-primary" onClick={() => navigate('leader-setup')} style={{ marginTop: '16px' }}>
                  👑 Create Universal Team
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {myCreated.map(team => (
                  <div key={team.code} className={styles.teamCard}>
                    <div className={styles.teamHeader}>
                      <div>
                        <div className={styles.teamName}>{team.name}</div>
                        <div className={styles.teamLeader}>Code: {team.code}</div>
                      </div>
                      <div className={styles.teamLocation}>📍 {team.city}, {team.state}</div>
                    </div>
                    <div className={styles.teamPurpose}>{team.purpose}</div>
                    <div className={styles.teamMeta}>
                      {team.rolesNeeded?.split(',').map((role, i) => (
                        <span key={i} className="tag tag-purple">{role.trim()}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* APPLIED TAB */}
        {activeTab === 'applied' && (
          <>
            {myApps.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📤</div>
                <div className={styles.emptyTitle}>No applications yet</div>
                <div className={styles.emptySub}>Browse Explore to find teams and apply</div>
              </div>
            ) : (
              myApps.map(app => {
                const freshApp = getApplication(app.id) || app
                return (
                  <div key={app.id} className={styles.appCard}>
                    <div className={styles.appHeader}>
                      <div>
                        <div className={styles.appTeam}>{freshApp.teamName}</div>
                        <div className={styles.appDate}>Applied {new Date(freshApp.createdAt).toLocaleDateString()}</div>
                      </div>
                      <span className={`tag ${freshApp.status === 'accepted' ? 'tag-green' : freshApp.status === 'rejected' ? 'tag-red' : 'tag-yellow'}`}>
                        {freshApp.status === 'accepted' ? '✅ Accepted' : freshApp.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                      </span>
                    </div>

                    {freshApp.status === 'accepted' && (
                      <button className="btn-primary" onClick={() => joinAcceptedTeam(freshApp)} style={{ fontSize: '13px', marginTop: '8px' }}>
                        ⚡ Enter Team Dashboard
                      </button>
                    )}

                    {/* Chat */}
                    {(freshApp.chat.length > 0 || chatOpen === app.id) && (
                      <ChatSection
                        app={freshApp}
                        userEmail={user?.email}
                        chatOpen={chatOpen === app.id}
                        onToggle={() => setChatOpen(chatOpen === app.id ? null : app.id)}
                        chatText={chatOpen === app.id ? chatText : ''}
                        setChatText={setChatText}
                        onSend={() => { handleSendChat(app.id); }}
                      />
                    )}
                    {freshApp.chat.length === 0 && chatOpen !== app.id && freshApp.status === 'pending' && (
                      <button className={styles.chatBtn} onClick={() => setChatOpen(app.id)} style={{ marginTop: '10px' }}>
                        💬 Open Chat
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </>
        )}

        {/* RECEIVED TAB */}
        {activeTab === 'received' && (
          <>
            {received.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📥</div>
                <div className={styles.emptyTitle}>No applications received</div>
                <div className={styles.emptySub}>Applications to your universal teams will appear here</div>
              </div>
            ) : (
              received.map(app => {
                const freshApp = getApplication(app.id) || app
                return (
                  <div key={app.id} className={styles.appCard}>
                    <div className={styles.appHeader}>
                      <div>
                        <div className={styles.appApplicant}>👤 {freshApp.applicantName}</div>
                        <div className={styles.appDate}>
                          Applied to <strong>{freshApp.teamName}</strong> · {new Date(freshApp.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className={`tag ${freshApp.status === 'accepted' ? 'tag-green' : freshApp.status === 'rejected' ? 'tag-red' : 'tag-yellow'}`}>
                        {freshApp.status === 'accepted' ? '✅ Accepted' : freshApp.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                      </span>
                    </div>

                    {freshApp.status === 'pending' && (
                      <div className={styles.appActions}>
                        <button className={styles.acceptBtn} onClick={() => handleAccept(freshApp)}>✅ Accept</button>
                        <button className={styles.rejectBtn} onClick={() => handleReject(freshApp)}>❌ Reject</button>
                        <button className={styles.chatBtn} onClick={() => setChatOpen(chatOpen === app.id ? null : app.id)}>
                          💬 Chat
                        </button>
                      </div>
                    )}

                    {/* Chat */}
                    <ChatSection
                      app={freshApp}
                      userEmail={user?.email}
                      chatOpen={chatOpen === app.id}
                      onToggle={() => setChatOpen(chatOpen === app.id ? null : app.id)}
                      chatText={chatOpen === app.id ? chatText : ''}
                      setChatText={setChatText}
                      onSend={() => { handleSendChat(app.id); }}
                    />
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Inline Chat Component ────────────────────────────────────────────────────
function ChatSection({ app, userEmail, chatOpen, onToggle, chatText, setChatText, onSend }) {
  const bottomRef = useRef(null)
  const hasMessages = app.chat.length > 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [app.chat.length, chatOpen])

  if (!hasMessages && !chatOpen) return null

  return (
    <div className={styles.chatSection}>
      {hasMessages && !chatOpen && (
        <button className={styles.chatBtn} onClick={onToggle} style={{ marginBottom: '8px' }}>
          💬 {app.chat.length} message{app.chat.length !== 1 ? 's' : ''} — View Chat
        </button>
      )}

      {(chatOpen || hasMessages) && (
        <>
          {chatOpen && hasMessages && (
            <div className={styles.chatMessages}>
              {app.chat.map((msg, i) => (
                <div key={i} className={`${styles.chatMsg} ${msg.from === userEmail ? styles.chatMsgMine : styles.chatMsgOther}`}>
                  <div className={styles.chatSender}>{msg.fromName}</div>
                  {msg.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {chatOpen && (
            <div className={styles.chatInput}>
              <input
                className="input"
                placeholder="Type a message..."
                value={chatText}
                onChange={e => setChatText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSend()}
              />
              <button className="btn-primary" onClick={onSend} disabled={!chatText.trim()} style={{ padding: '8px 16px' }}>
                ↑
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
