import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import MemoryFeed from '../components/MemoryFeed'
import LeaderOverview from '../components/LeaderOverview'
import TasksTab from '../components/TasksTab'
import MeetingsTab from '../components/MeetingsTab'
import DecisionsTab from '../components/DecisionsTab'
import InsightsTab from '../components/InsightsTab'
import ChatTab from '../components/ChatTab'
import TeamMembers from '../components/TeamMembers'
import GroupChat from '../components/GroupChat'
import styles from './Dashboard.module.css'

const TAB_TITLES = {
  overview: 'Overview',
  tasks: 'Task Manager',
  meetings: 'AI Meetings',
  decisions: 'Decision Log',
  insights: 'AI Insights',
  chat: 'AI Chat',
  members: 'Team Members',
  groupchat: 'Group Chat',
}

export default function LeaderDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className={styles.layout}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.pageTitle}>{TAB_TITLES[activeTab]}</div>
        </div>
        <div className={styles.content}>
          {activeTab === 'overview' && <LeaderOverview setActiveTab={setActiveTab} />}
          {activeTab === 'tasks' && <TasksTab />}
          {activeTab === 'meetings' && <MeetingsTab />}
          {activeTab === 'decisions' && <DecisionsTab />}
          {activeTab === 'insights' && <InsightsTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'members' && <TeamMembers />}
          {activeTab === 'groupchat' && <GroupChat />}
        </div>
      </main>

      <MemoryFeed />
    </div>
  )
}
