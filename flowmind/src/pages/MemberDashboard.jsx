import React, { useState } from 'react'
import Sidebar from '../components/Sidebar'
import MemberTasks from '../components/MemberTasks'
import MeetingsTab from '../components/MeetingsTab'
import ChatTab from '../components/ChatTab'
import TeamFeed from '../components/TeamFeed'
import TeamMembers from '../components/TeamMembers'
import GroupChat from '../components/GroupChat'
import styles from './Dashboard.module.css'

const TAB_TITLES = {
  mytasks: 'My Tasks',
  meetings: 'Meetings',
  chat: 'AI Assistant',
  feed: 'Team Feed',
  members: 'Team Members',
  groupchat: 'Group Chat',
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
          {activeTab === 'meetings' && <MeetingsTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'feed' && <TeamFeed />}
          {activeTab === 'members' && <TeamMembers />}
          {activeTab === 'groupchat' && <GroupChat />}
        </div>
      </main>
    </div>
  )
}
