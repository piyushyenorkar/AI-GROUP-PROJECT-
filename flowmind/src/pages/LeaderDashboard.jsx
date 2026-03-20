import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import MemoryFeed from '../components/MemoryFeed'
import LeaderOverview from '../components/LeaderOverview'
import TasksTab from '../components/TasksTab'
import DecisionsTab from '../components/DecisionsTab'
import InsightsTab from '../components/InsightsTab'
import ChatTab from '../components/ChatTab'
import styles from './Dashboard.module.css'

const TAB_TITLES = {
  overview: 'Overview',
  tasks: 'Task Manager',
  decisions: 'Decision Log',
  insights: 'AI Insights',
  chat: 'AI Chat',
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
          {activeTab === 'decisions' && <DecisionsTab />}
          {activeTab === 'insights' && <InsightsTab />}
          {activeTab === 'chat' && <ChatTab />}
        </div>
      </main>

      <MemoryFeed />
    </div>
  )
}
