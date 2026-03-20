import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import MemberTasks from '../components/MemberTasks'
import ChatTab from '../components/ChatTab'
import TeamFeed from '../components/TeamFeed'
import styles from './Dashboard.module.css'

const TAB_TITLES = {
  mytasks: 'My Tasks',
  chat: 'AI Assistant',
  feed: 'Team Feed',
}

export default function MemberDashboard() {
  const [activeTab, setActiveTab] = useState('mytasks')

  return (
    <div className={styles.layout}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.pageTitle}>{TAB_TITLES[activeTab]}</div>
        </div>
        <div className={styles.content}>
          {activeTab === 'mytasks' && <MemberTasks />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'feed' && <TeamFeed />}
        </div>
      </main>
    </div>
  )
}
