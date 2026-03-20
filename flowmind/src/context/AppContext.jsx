import React, { createContext, useContext, useState, useCallback } from 'react'
import { retainMemory } from '../services/api'

const AppContext = createContext(null)

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

const INITIAL_STATE = {
  role: null, // 'leader' | 'member'
  page: 'landing', // landing | auth | leader-setup | leader-dashboard | member-join | member-dashboard
  team: null,
  currentUser: null,
  tasks: [],
  decisions: [],
  memoryFeed: [],
  members: [],
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
      createdAt: new Date().toISOString(),
    }
    const leader = { id: 'leader', name: leaderName, role: 'Leader', isLeader: true }
    setState(prev => ({
      ...prev,
      role: 'leader',
      page: 'leader-dashboard',
      team,
      currentUser: leader,
      members: [leader],
      tasks: [],
      decisions: [],
      memoryFeed: [{
        id: Date.now(),
        type: 'project_created',
        timestamp: new Date().toISOString(),
        text: `Project "${projectName}" was created by ${leaderName}`,
        icon: '🚀',
      }],
    }))

    // ── Hindsight: Store project creation ──
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
    setState(prev => {
      const teamData = prev.team || {
        id: 1,
        code,
        projectName: 'Team Project',
        description: 'A collaborative project',
        deadline: '',
        createdAt: new Date().toISOString(),
      }
      return {
        ...prev,
        role: 'member',
        page: 'member-dashboard',
        team: teamData,
        currentUser: member,
        members: [...(prev.members || []), member],
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
      }
    })

    // ── Hindsight: Store member join ──
    retainMemory(code, `${name} joined the team.`, {
      type: 'member_joined',
      memberName: name,
    })
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
      // ── Hindsight: Store task creation ──
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

      // ── Hindsight: Store status change ──
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

      // ── Hindsight: Store progress update ──
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
      // ── Hindsight: Store decision ──
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

  const reset = useCallback(() => setState(INITIAL_STATE), [])

  return (
    <AppContext.Provider value={{
      ...state,
      update,
      addMemory,
      createTeam,
      joinTeam,
      addTask,
      updateTaskStatus,
      addTaskUpdate,
      addDecision,
      navigate,
      reset,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
