import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'flowmind_session'
const USERS_KEY = 'flowmind_users'

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '{}')
  } catch { return {} }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function hashPassword(password) {
  // Simple hash for localStorage auth (NOT secure for production)
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

  // Restore session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const session = JSON.parse(saved)
        // Validate session exists in users db
        const users = getUsers()
        if (users[session.email]) {
          setUser(session)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setLoading(false)
  }, [])

  const signup = useCallback((name, email, password) => {
    const users = getUsers()
    const key = email.toLowerCase().trim()
    if (users[key]) {
      return { error: 'An account with this email already exists. Please sign in.' }
    }
    const newUser = {
      name: name.trim(),
      email: key,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
      teams: [], // { code, projectName, role, joinedAt }
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
    const userRecord = users[key]
    if (!userRecord) {
      return { error: 'No account found with this email. Please sign up.' }
    }
    if (userRecord.passwordHash !== hashPassword(password)) {
      return { error: 'Incorrect password. Please try again.' }
    }
    const session = { name: userRecord.name, email: key, createdAt: userRecord.createdAt }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return { success: true }
  }, [])

  const signout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  // Save a team association to the user's profile
  const saveTeam = useCallback((teamCode, projectName, role) => {
    const users = getUsers()
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session?.email || !users[session.email]) return

    const userRecord = users[session.email]
    // Avoid duplicates
    const existing = userRecord.teams.findIndex(t => t.code === teamCode)
    if (existing >= 0) {
      userRecord.teams[existing] = { ...userRecord.teams[existing], projectName, role }
    } else {
      userRecord.teams.push({
        code: teamCode,
        projectName,
        role,
        joinedAt: new Date().toISOString(),
      })
    }
    users[session.email] = userRecord
    saveUsers(users)
  }, [])

  // Get all teams for current user
  const getMyTeams = useCallback(() => {
    const users = getUsers()
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!session?.email || !users[session.email]) return []
    return users[session.email].teams || []
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signup,
      signin,
      signout,
      saveTeam,
      getMyTeams,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
