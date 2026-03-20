import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'flowmind_session'
const USERS_KEY = 'flowmind_users'
const UNIVERSAL_KEY = 'flowmind_universal_teams'
const APPLICATIONS_KEY = 'flowmind_applications'

function getStore(key, fallback = {}) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) }
  catch { return fallback }
}
function setStore(key, data) { localStorage.setItem(key, JSON.stringify(data)) }

function getUsers() { return getStore(USERS_KEY) }
function saveUsers(users) { setStore(USERS_KEY, users) }

function hashPassword(password) {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return 'h_' + Math.abs(hash).toString(36)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const session = JSON.parse(saved)
        const users = getUsers()
        if (users[session.email]) { setUser(session) }
        else { localStorage.removeItem(STORAGE_KEY) }
      }
    } catch { localStorage.removeItem(STORAGE_KEY) }
    setLoading(false)
  }, [])

  // ── Auth ──────────────────────────────────────────────────────────────
  const signup = useCallback((name, email, password) => {
    const users = getUsers()
    const key = email.toLowerCase().trim()
    if (users[key]) return { error: 'An account with this email already exists. Please sign in.' }
    const newUser = {
      name: name.trim(), email: key,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      teams: [],
    }
    users[key] = newUser
    saveUsers(users)
    const session = { name: newUser.name, email: key, createdAt: newUser.createdAt }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return { success: true }
  }, [])

  const signin = useCallback((email, password) => {
    const users = getUsers()
    const key = email.toLowerCase().trim()
    const rec = users[key]
    if (!rec) return { error: 'No account found with this email. Please sign up.' }
    if (rec.passwordHash !== hashPassword(password)) return { error: 'Incorrect password.' }
    const session = { name: rec.name, email: key, createdAt: rec.createdAt }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return { success: true }
  }, [])

  const signout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  // ── Team Persistence ──────────────────────────────────────────────────
  const isTeamMember = useCallback((teamCode) => {
    const users = getUsers()
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session?.email || !users[session.email]) return false
    return (users[session.email].teams || []).some(t => t.code === teamCode)
  }, [])

  const saveTeam = useCallback((teamCode, projectName, role) => {
    const users = getUsers()
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session?.email || !users[session.email]) return { error: 'Not logged in' }
    const rec = users[session.email]
    if (rec.teams.some(t => t.code === teamCode)) return { error: 'Already in this team.' }
    rec.teams.push({ code: teamCode, projectName, role, joinedAt: new Date().toISOString() })
    users[session.email] = rec
    saveUsers(users)
    return { success: true }
  }, [])

  const getMyTeams = useCallback(() => {
    const users = getUsers()
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session?.email || !users[session.email]) return []
    return users[session.email].teams || []
  }, [])

  // ── Universal Teams ───────────────────────────────────────────────────
  const saveUniversalTeam = useCallback((teamData) => {
    const teams = getStore(UNIVERSAL_KEY)
    teams[teamData.code] = {
      ...teamData,
      createdAt: new Date().toISOString(),
    }
    setStore(UNIVERSAL_KEY, teams)
  }, [])

  const getUniversalTeams = useCallback(() => {
    return Object.values(getStore(UNIVERSAL_KEY))
  }, [])

  const getMyUniversalTeams = useCallback(() => {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session?.email) return []
    return Object.values(getStore(UNIVERSAL_KEY)).filter(t => t.createdBy === session.email)
  }, [])

  // ── Applications ──────────────────────────────────────────────────────
  const applyToTeam = useCallback((teamCode, teamName) => {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session?.email) return { error: 'Not logged in' }

    const apps = getStore(APPLICATIONS_KEY)
    // Check if already applied
    const existing = Object.values(apps).find(
      a => a.teamCode === teamCode && a.applicantEmail === session.email
    )
    if (existing) return { error: 'You have already applied to this team.' }

    const id = 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    apps[id] = {
      id,
      teamCode,
      teamName,
      applicantEmail: session.email,
      applicantName: session.name,
      status: 'pending',
      chat: [],
      createdAt: new Date().toISOString(),
    }
    setStore(APPLICATIONS_KEY, apps)
    return { success: true, id }
  }, [])

  const getMyApplications = useCallback(() => {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session?.email) return []
    return Object.values(getStore(APPLICATIONS_KEY))
      .filter(a => a.applicantEmail === session.email)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [])

  const getReceivedApplications = useCallback(() => {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session?.email) return []
    const myTeams = Object.values(getStore(UNIVERSAL_KEY)).filter(t => t.createdBy === session.email)
    const myCodes = myTeams.map(t => t.code)
    return Object.values(getStore(APPLICATIONS_KEY))
      .filter(a => myCodes.includes(a.teamCode))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [])

  const updateApplication = useCallback((appId, status) => {
    const apps = getStore(APPLICATIONS_KEY)
    if (!apps[appId]) return { error: 'Application not found' }
    apps[appId].status = status
    setStore(APPLICATIONS_KEY, apps)

    // On accept — auto-add team to applicant's profile and persist member
    if (status === 'accepted') {
      const app = apps[appId]
      const users = getUsers()
      const applicantRec = users[app.applicantEmail]
      if (applicantRec) {
        // Add team to applicant's teams list if not already there
        const hasTeam = applicantRec.teams.some(t => t.code === app.teamCode)
        if (!hasTeam) {
          applicantRec.teams.push({
            code: app.teamCode,
            projectName: app.teamName,
            role: 'member',
            joinedAt: new Date().toISOString(),
          })
          users[app.applicantEmail] = applicantRec
          saveUsers(users)
        }
      }

      // Add applicant to persistent team members
      try {
        const membersKey = 'flowmind_team_members'
        const allMembers = JSON.parse(localStorage.getItem(membersKey) || '{}')
        const teamMembers = allMembers[app.teamCode] || []
        const alreadyMember = teamMembers.some(m => m.name === app.applicantName)
        if (!alreadyMember) {
          teamMembers.push({
            id: `m_${Date.now()}`,
            name: app.applicantName,
            role: 'Member',
            isLeader: false,
          })
          allMembers[app.teamCode] = teamMembers
          localStorage.setItem(membersKey, JSON.stringify(allMembers))
        }
      } catch {}
    }

    return { success: true }
  }, [])

  const addChatMessage = useCallback((appId, text, fromEmail) => {
    const apps = getStore(APPLICATIONS_KEY)
    if (!apps[appId]) return { error: 'Application not found' }
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    apps[appId].chat.push({
      from: fromEmail || session?.email || 'unknown',
      fromName: session?.name || 'Unknown',
      text,
      timestamp: new Date().toISOString(),
    })
    setStore(APPLICATIONS_KEY, apps)
    return { success: true }
  }, [])

  const getApplication = useCallback((appId) => {
    return getStore(APPLICATIONS_KEY)[appId] || null
  }, [])

  return (
    <AuthContext.Provider value={{
      user, loading,
      signup, signin, signout,
      saveTeam, getMyTeams, isTeamMember,
      saveUniversalTeam, getUniversalTeams, getMyUniversalTeams,
      applyToTeam, getMyApplications, getReceivedApplications,
      updateApplication, addChatMessage, getApplication,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
