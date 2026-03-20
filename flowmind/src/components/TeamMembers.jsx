import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import DirectChat from './DirectChat'
import MemberProfile from './MemberProfile'
import styles from './TeamMembers.module.css'

// Read persisted members from localStorage as fallback
function getPersistedMembers(teamCode) {
  try {
    const all = JSON.parse(localStorage.getItem('flowmind_team_members') || '{}')
    return all[teamCode] || []
  } catch { return [] }
}

// Read-only profile viewer
function ViewProfile({ member, memberProfiles, onClose, onChat }) {
  const profile = memberProfiles?.[member.name] || {}
  const hasProfile = profile.title || profile.skills?.length || profile.pastWork

  return (
    <div className={styles.profileOverlay} onClick={onClose}>
      <div className={styles.profilePanel} onClick={e => e.stopPropagation()}>
        <div className={styles.profileHeader}>
          <div className={styles.profileTitle}>
            {member.name}'s Profile
          </div>
          <button className={styles.profileClose} onClick={onClose}>✕</button>
        </div>
        <div className={styles.profileBody}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: member.isLeader ? 'var(--accent)' : 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '20px', flexShrink: 0 }}>
              {member.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                {member.name}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                {member.isLeader ? '👑 Team Leader' : '🧑‍💻 Member'}
                {profile.title && ` · ${profile.title}`}
              </div>
            </div>
          </div>

          {!hasProfile ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>👤</div>
              <div style={{ fontSize: '14px', fontWeight: 500 }}>{member.name} hasn't set up their profile yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>They can add skills, experience, and availability from Team Members</div>
            </div>
          ) : (
            <>
              {/* Skills */}
              {profile.skills?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Skills</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {profile.skills.map((s, i) => (
                      <span key={i} className="tag tag-purple">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Past work */}
              {profile.pastWork && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Experience</label>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.6', marginTop: '6px', background: 'var(--surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {profile.pastWork}
                  </div>
                </div>
              )}

              {/* Availability */}
              {profile.availability && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Availability</label>
                  <div style={{ marginTop: '6px' }}>
                    <span className={`tag ${profile.availability === 'Full-time' ? 'tag-green' : profile.availability === 'Part-time' ? 'tag-yellow' : 'tag-red'}`}>
                      {profile.availability}
                    </span>
                  </div>
                </div>
              )}

              {/* Preferred types */}
              {profile.preferredTypes?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="label">Preferred Task Types</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {profile.preferredTypes.map((t, i) => (
                      <span key={i} className="tag tag-green">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Chat button */}
          <button
            className="btn-primary"
            onClick={() => { onClose(); onChat(member) }}
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
          >
            💬 Message {member.name}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeamMembers() {
  const { members, team, role, currentUser, memberProfiles } = useApp()
  const [dmTarget, setDmTarget] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)

  const teamCode = team?.code
  const effectiveMembers = (members && members.length > 0) ? members : getPersistedMembers(teamCode)

  const leader = effectiveMembers.find(m => m.isLeader)
  const membersList = effectiveMembers.filter(m => !m.isLeader)
  const myName = currentUser?.name?.toLowerCase()

  const handleMemberClick = (member) => {
    if (member.name?.toLowerCase() === myName) {
      setShowProfile(true)
    } else {
      setViewTarget(member)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className="section-title">👥 Team Members</div>
      <div className={styles.count}>
        {effectiveMembers.length} member{effectiveMembers.length !== 1 ? 's' : ''}
        <span style={{ color: 'var(--text3)', fontSize: '12px', marginLeft: '8px' }}>
          Click to view profile or chat
        </span>
      </div>

      <div className={styles.list}>
        {leader && (
          <div className={`${styles.member} ${styles.leaderCard}`} onClick={() => handleMemberClick(leader)} style={{ cursor: 'pointer' }}>
            <div className={styles.avatar} style={{ background: 'var(--accent)' }}>
              {leader.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className={styles.info}>
              <div className={styles.name}>{leader.name}</div>
              <div className={styles.role}><span className={styles.crown}>👑</span> Team Leader</div>
            </div>
            {myName && leader.name?.toLowerCase() === myName ? (
              <span className={styles.editBadge}>✏️ Edit Profile</span>
            ) : (
              <span className={styles.viewBadge}>👤 View Profile</span>
            )}
          </div>
        )}

        {membersList.map((m, i) => {
          const isMe = myName && m.name?.toLowerCase() === myName
          return (
            <div key={m.id || i} className={styles.member} onClick={() => handleMemberClick(m)} style={{ cursor: 'pointer' }}>
              <div className={styles.avatar}>{m.name?.[0]?.toUpperCase() || '?'}</div>
              <div className={styles.info}>
                <div className={styles.name}>{m.name}</div>
                <div className={styles.role}>🧑‍💻 Member</div>
              </div>
              {isMe ? (
                <span className={styles.editBadge}>✏️ Edit Profile</span>
              ) : (
                <span className={styles.viewBadge}>👤 View Profile</span>
              )}
            </div>
          )
        })}

        {!leader && membersList.length === 0 && (
          <div className={styles.empty}>No members have joined yet. Share the team code!</div>
        )}
      </div>

      {dmTarget && <DirectChat targetMember={dmTarget} onClose={() => setDmTarget(null)} />}

      {showProfile && (
        <div className={styles.profileOverlay} onClick={() => setShowProfile(false)}>
          <div className={styles.profilePanel} onClick={e => e.stopPropagation()}>
            <div className={styles.profileHeader}>
              <div className={styles.profileTitle}>Edit Your Profile</div>
              <button className={styles.profileClose} onClick={() => setShowProfile(false)}>✕</button>
            </div>
            <div className={styles.profileBody}><MemberProfile /></div>
          </div>
        </div>
      )}

      {viewTarget && (
        <ViewProfile
          member={viewTarget}
          memberProfiles={memberProfiles}
          onClose={() => setViewTarget(null)}
          onChat={(m) => { setViewTarget(null); setDmTarget(m) }}
        />
      )}
    </div>
  )
}
