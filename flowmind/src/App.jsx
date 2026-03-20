import React from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import LeaderSetup from './pages/LeaderSetup'
import MemberJoin from './pages/MemberJoin'
import FindTeams from './pages/FindTeams'
import LeaderDashboard from './pages/LeaderDashboard'
import MemberDashboard from './pages/MemberDashboard'
import AuthPage from './pages/AuthPage'

function Router() {
  const { page } = useApp()
  const { user, loading } = useAuth()

  // Show loading while restoring session
  if (loading) return null

  // If not authenticated, show auth page (unless on landing)
  if (!user && page !== 'landing') {
    return <AuthPage />
  }

  switch (page) {
    case 'landing': return <Landing />
    case 'auth': return <AuthPage />
    case 'leader-setup': return <LeaderSetup />
    case 'member-join': return <MemberJoin />
    case 'find-teams': return <FindTeams />
    case 'leader-dashboard': return <LeaderDashboard />
    case 'member-dashboard': return <MemberDashboard />
    default: return <Landing />
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router />
      </AppProvider>
    </AuthProvider>
  )
}
