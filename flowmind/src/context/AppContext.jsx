import React, { createContext, useContext, useState, useCallback } from 'react'
import { retainMemory } from '../services/api'

const AppContext = createContext(null)

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

const MEMBERS_KEY = 'flowmind_team_members'
const TEAM_DATA_KEY = 'flowmind_team_data'

// ── Persistent member storage (per team code) ────────────────────────────
function getPersistedMembers(teamCode) {
  try {
    const all = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '{}')
    return all[teamCode] || []
  } catch { return [] }
}

function persistMembers(teamCode, members) {
  try {
    const all = JSON.parse(localStorage.getItem(MEMBERS_KEY) || '{}')
    all[teamCode] = members
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(all))
  } catch {}
}

function getPersistedTeamData(teamCode) {
  try {
    const all = JSON.parse(localStorage.getItem(TEAM_DATA_KEY) || '{}')
    return all[teamCode] || null
  } catch { return null }
}

function persistTeamData(teamCode, data) {
  try {
    const all = JSON.parse(localStorage.getItem(TEAM_DATA_KEY) || '{}')
    all[teamCode] = data
    localStorage.setItem(TEAM_DATA_KEY, JSON.stringify(all))
  } catch {}
}

// ── Persistent meetings storage (per team code) ─────────────────────────
const MEETINGS_KEY = 'flowmind_meetings'
const PROFILES_KEY = 'flowmind_member_profiles'

function getPersistedMeetings(teamCode) {
  try {
    const all = JSON.parse(localStorage.getItem(MEETINGS_KEY) || '{}')
    return all[teamCode] || []
  } catch { return [] }
}

function persistMeetings(teamCode, meetings) {
  try {
    const all = JSON.parse(localStorage.getItem(MEETINGS_KEY) || '{}')
    all[teamCode] = meetings
    localStorage.setItem(MEETINGS_KEY, JSON.stringify(all))
  } catch {}
}

function getPersistedProfiles(teamCode) {
  try {
    const all = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}')
    return all[teamCode] || {}
  } catch { return {} }
}

function persistProfiles(teamCode, profiles) {
  try {
    const all = JSON.parse(localStorage.getItem(PROFILES_KEY) || '{}')
    all[teamCode] = profiles
    localStorage.setItem(PROFILES_KEY, JSON.stringify(all))
  } catch {}
}

const INITIAL_STATE = {
  role: null,
  page: 'landing',
  team: null,
  currentUser: null,
  tasks: [],
  decisions: [],
  memoryFeed: [],
  members: [],
  meetings: [],
  memberProfiles: {},
}

export function AppProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE)

  const update = useCallback((patch) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const addMemory = useCallback((event) => {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...event,
    }
    setState(prev => ({
      ...prev,
      memoryFeed: [entry, ...prev.memoryFeed].slice(0, 50),
    }))
    return entry
  }, [])

  // ── LEADER: Create team ──────────────────────────────────────────────
  const createTeam = useCallback((projectName, description, deadline, leaderName) => {
    const team = {
      id: Date.now(),
      code: generateCode(),
      projectName,
      description,
      deadline,
      leaderName,
      createdAt: new Date().toISOString(),
    }
    const leader = { id: 'leader', name: leaderName, role: 'Leader', isLeader: true }

    // Persist team data and leader as member
    persistTeamData(team.code, team)
    persistMembers(team.code, [leader])

    setState(prev => ({
      ...prev,
      role: 'leader',
      page: 'leader-dashboard',
      team,
      currentUser: leader,
      members: [leader],
      tasks: [],
      decisions: [],
      meetings: [],
      memberProfiles: {},
      memoryFeed: [{
        id: Date.now(),
        type: 'project_created',
        timestamp: new Date().toISOString(),
        text: `Project "${projectName}" was created by ${leaderName}`,
        icon: '🚀',
      }],
    }))

    retainMemory(team.code, `Project "${projectName}" was created by ${leaderName}. Description: ${description || 'N/A'}. Deadline: ${deadline || 'Not set'}.`, {
      type: 'project_created',
      projectName,
      leaderName,
    })

    return team
  }, [])

  // ── MEMBER: Join team ────────────────────────────────────────────────
  const joinTeam = useCallback((code, name) => {
    const member = { id: `m_${Date.now()}`, name, role: 'Member', isLeader: false }

    // Load persisted team data and members
    const persistedTeam = getPersistedTeamData(code)
    let persistedMembersList = getPersistedMembers(code)

    // If no persisted members but we have team data with a leaderName, reconstruct leader
    if (persistedMembersList.length === 0 && persistedTeam?.leaderName) {
      const leader = { id: 'leader', name: persistedTeam.leaderName, role: 'Leader', isLeader: true }
      persistedMembersList = [leader]
      persistMembers(code, persistedMembersList)
    }

    // Also check universal teams for leader info if still no leader found
    if (!persistedMembersList.some(m => m.isLeader)) {
      try {
        const universalTeams = JSON.parse(localStorage.getItem('flowmind_universal_teams') || '{}')
        const uTeam = universalTeams[code]
        if (uTeam?.leaderName) {
          const leader = { id: 'leader', name: uTeam.leaderName, role: 'Leader', isLeader: true }
          persistedMembersList = [leader, ...persistedMembersList]
          persistMembers(code, persistedMembersList)
        }
      } catch {}
    }

    // Check if this person is already in the persisted members
    const alreadyIn = persistedMembersList.some(m => m.name === name)

    const teamData = persistedTeam || {
      id: 1,
      code,
      projectName: 'Team Project',
      description: 'A collaborative project',
      deadline: '',
      createdAt: new Date().toISOString(),
    }

    // Build members list: persisted members + new member (if not already in)
    const allMembers = alreadyIn
      ? persistedMembersList
      : [...persistedMembersList, member]

    // Persist updated members
    if (!alreadyIn) {
      persistMembers(code, allMembers)
    }

    setState(prev => ({
      ...prev,
      role: 'member',
      page: 'member-dashboard',
      team: teamData,
      currentUser: member,
      members: allMembers,
      meetings: getPersistedMeetings(code),
      memberProfiles: getPersistedProfiles(code),
      memoryFeed: [
        {
          id: Date.now(),
          type: 'member_joined',
          timestamp: new Date().toISOString(),
          text: `${name} joined the team`,
          icon: '👋',
        },
        ...(prev.memoryFeed || []),
      ],
    }))

    retainMemory(code, `${name} joined the team.`, {
      type: 'member_joined',
      memberName: name,
    })
  }, [])

  // ── LEADER: Load existing team (team switcher) ─────────────────────
  const loadTeamAsLeader = useCallback((code, projectName, leaderName) => {
    const persistedTeam = getPersistedTeamData(code)
    let membersList = getPersistedMembers(code)

    const teamData = persistedTeam || {
      id: 1,
      code,
      projectName,
      leaderName,
      description: '',
      deadline: '',
      createdAt: new Date().toISOString(),
    }

    // Ensure leader is always in the members list
    const leader = membersList.find(m => m.isLeader) || { id: 'leader', name: leaderName, role: 'Leader', isLeader: true }
    if (!membersList.some(m => m.isLeader)) {
      membersList = [leader, ...membersList]
    }

    // Always persist so members joining later can see the leader
    persistTeamData(code, teamData)
    persistMembers(code, membersList)

    setState(prev => ({
      ...prev,
      role: 'leader',
      page: 'leader-dashboard',
      team: teamData,
      currentUser: leader,
      members: membersList,
      tasks: [],
      decisions: [],
      meetings: getPersistedMeetings(code),
      memberProfiles: getPersistedProfiles(code),
      memoryFeed: [],
    }))
  }, [])

  // ── TASKS ────────────────────────────────────────────────────────────
  const addTask = useCallback((taskData) => {
    const task = {
      id: `t_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'todo',
      updates: [],
      estimatedHours: taskData.estimatedHours || 0,
      actualHours: 0,
      ...taskData,
    }
    setState(prev => {
      if (prev.team?.code) {
        retainMemory(prev.team.code, `Task "${task.title}" was assigned to ${task.assignedTo}. Description: ${task.description || 'N/A'}. Deadline: ${task.deadline || 'Not set'}. Estimated hours: ${task.estimatedHours}.`, {
          type: 'task_assigned',
          taskTitle: task.title,
          assignedTo: task.assignedTo,
        })
      }
      return {
        ...prev,
        tasks: [...prev.tasks, task],
        memoryFeed: [{
          id: Date.now(),
          type: 'task_assigned',
          timestamp: new Date().toISOString(),
          text: `Task "${task.title}" assigned to ${task.assignedTo}`,
          icon: '📌',
          meta: { taskId: task.id },
        }, ...prev.memoryFeed],
      }
    })
    return task
  }, [])

  const updateTaskStatus = useCallback((taskId, status) => {
    setState(prev => {
      const tasks = prev.tasks.map(t =>
        t.id === taskId ? { ...t, status } : t
      )
      const task = tasks.find(t => t.id === taskId)
      const emoji = status === 'done' ? '✅' : status === 'in-progress' ? '⚡' : '📋'

      if (prev.team?.code && task) {
        retainMemory(prev.team.code, `Task "${task.title}" was moved to ${status} by ${prev.currentUser?.name || 'a team member'}.`, {
          type: 'task_status_change',
          taskTitle: task.title,
          newStatus: status,
        })
      }

      return {
        ...prev,
        tasks,
        memoryFeed: [{
          id: Date.now(),
          type: 'task_status',
          timestamp: new Date().toISOString(),
          text: `"${task?.title}" moved to ${status}`,
          icon: emoji,
        }, ...prev.memoryFeed],
      }
    })
  }, [])

  const addTaskUpdate = useCallback((taskId, updateText, authorName) => {
    setState(prev => {
      const tasks = prev.tasks.map(t =>
        t.id === taskId
          ? { ...t, updates: [...t.updates, { text: updateText, author: authorName, timestamp: new Date().toISOString() }] }
          : t
      )
      const task = tasks.find(t => t.id === taskId)

      if (prev.team?.code) {
        retainMemory(prev.team.code, `${authorName} logged a progress update on "${task?.title}": "${updateText}"`, {
          type: 'task_update',
          taskTitle: task?.title,
          author: authorName,
        })
      }

      return {
        ...prev,
        tasks,
        memoryFeed: [{
          id: Date.now(),
          type: 'task_update',
          timestamp: new Date().toISOString(),
          text: `${authorName} logged: "${updateText.substring(0, 60)}${updateText.length > 60 ? '…' : ''}"`,
          icon: '📝',
        }, ...prev.memoryFeed],
      }
    })
  }, [])

  // ── DECISIONS ────────────────────────────────────────────────────────
  const addDecision = useCallback((decisionData) => {
    const decision = {
      id: `d_${Date.now()}`,
      createdAt: new Date().toISOString(),
      outcome: '',
      ...decisionData,
    }
    setState(prev => {
      if (prev.team?.code) {
        retainMemory(prev.team.code, `Decision made: "${decision.decision}". Reason: ${decision.reason || 'N/A'}. Impact level: ${decision.impact || 'N/A'}. People involved: ${decision.people || 'N/A'}.`, {
          type: 'decision_made',
          decision: decision.decision,
          impact: decision.impact,
        })
      }

      return {
        ...prev,
        decisions: [decision, ...prev.decisions],
        memoryFeed: [{
          id: Date.now(),
          type: 'decision_made',
          timestamp: new Date().toISOString(),
          text: `Decision: "${decision.decision.substring(0, 70)}${decision.decision.length > 70 ? '…' : ''}"`,
          icon: '⚖️',
        }, ...prev.memoryFeed],
      }
    })
    return decision
  }, [])

  const navigate = useCallback((page) => {
    setState(prev => ({ ...prev, page }))
  }, [])

  const addMeeting = useCallback((meetingData) => {
    setState(prev => {
      const newMeetings = [meetingData, ...prev.meetings]
      // Persist meetings per team
      if (prev.team?.code) {
        persistMeetings(prev.team.code, newMeetings)
      }
      return {
        ...prev,
        meetings: newMeetings,
        memoryFeed: [{
          id: Date.now(),
          type: 'meeting_completed',
          timestamp: new Date().toISOString(),
          text: `Meeting "${meetingData.title}" ended — ${meetingData.tasksCreated?.length || 0} tasks auto-assigned`,
          icon: '🎙️',
        }, ...prev.memoryFeed],
      }
    })
  }, [])

  const updateMemberProfile = useCallback((memberName, profileData) => {
    setState(prev => {
      const newProfiles = { ...prev.memberProfiles, [memberName]: profileData }
      // Persist profiles per team
      if (prev.team?.code) {
        persistProfiles(prev.team.code, newProfiles)
      }
      return {
        ...prev,
        memberProfiles: newProfiles,
        memoryFeed: [{
          id: Date.now(),
          type: 'profile_updated',
          timestamp: new Date().toISOString(),
          text: `${memberName} updated their skill profile`,
          icon: '👤',
        }, ...prev.memoryFeed],
      }
    })
  }, [])

  const reset = useCallback(() => setState(INITIAL_STATE), [])

  return (
    <AppContext.Provider value={{
      ...state,
      update,
      addMemory,
      createTeam,
      joinTeam,
      loadTeamAsLeader,
      addTask,
      updateTaskStatus,
      addTaskUpdate,
      addDecision,
      addMeeting,
      updateMemberProfile,
      navigate,
      reset,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
