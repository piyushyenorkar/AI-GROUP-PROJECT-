import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { retainMemory } from '../services/api'
import styles from './TeamChat.module.css'

const DM_STORAGE = 'flowmind_dm_chats'

function getChatKey(teamCode, name1, name2) {
  const sorted = [name1, name2].sort()
  return `${teamCode}_${sorted[0]}_${sorted[1]}`
}

function getMessages(chatKey) {
  try {
    const all = JSON.parse(localStorage.getItem(DM_STORAGE) || '{}')
    return all[chatKey]?.messages || []
  } catch { return [] }
}

function saveMessage(chatKey, msg) {
  try {
    const all = JSON.parse(localStorage.getItem(DM_STORAGE) || '{}')
    if (!all[chatKey]) all[chatKey] = { messages: [] }
    all[chatKey].messages.push(msg)
    localStorage.setItem(DM_STORAGE, JSON.stringify(all))
  } catch {}
}

export default function DirectChat({ targetMember, onClose }) {
  const { team, currentUser } = useApp()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const bottomRef = useRef(null)

  const chatKey = getChatKey(team?.code || '', currentUser?.name || '', targetMember?.name || '')

  // Load messages
  useEffect(() => {
    setMessages(getMessages(chatKey))
  }, [chatKey])

  // Poll for new messages every 2s (simulates real-time for localStorage)
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(getMessages(chatKey))
    }, 2000)
    return () => clearInterval(interval)
  }, [chatKey])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    if (!text.trim()) return
    const msg = {
      from: currentUser?.name || 'You',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    }
    saveMessage(chatKey, msg)
    setMessages(prev => [...prev, msg])
    setText('')

    // Store in Hindsight memory
    retainMemory(
      team?.code,
      `Direct message from ${currentUser?.name} to ${targetMember?.name}: "${msg.text}"`,
      {
        type: 'dm_message',
        from: currentUser?.name,
        to: targetMember?.name,
        chatType: 'direct',
      }
    )
  }

  const myName = currentUser?.name || ''

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar} style={{ background: targetMember?.isLeader ? 'var(--accent)' : 'var(--green)' }}>
            {targetMember?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.headerName}>
              {targetMember?.name} {targetMember?.isLeader ? '👑' : ''}
            </div>
            <div className={styles.headerSub}>
              {targetMember?.isLeader ? 'Team Leader' : 'Member'} · Direct Message
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>💬</div>
            <div className={styles.emptyText}>Start a conversation</div>
            <div className={styles.emptySub}>Messages are stored in Hindsight memory for AI context</div>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((msg, i) => {
              const isMine = msg.from === myName
              return (
                <div key={i} className={`${styles.msgRow} ${isMine ? styles.msgRowMine : styles.msgRowOther}`}>
                  {!isMine && <div className={styles.msgSender}>{msg.from}</div>}
                  <div className={`${styles.msgBubble} ${isMine ? styles.msgMine : styles.msgOther}`}>
                    {msg.text}
                  </div>
                  <div className={styles.msgTime}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input */}
        <div className={styles.inputBar}>
          <input
            className="input"
            placeholder={`Message ${targetMember?.name}...`}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            autoFocus
          />
          <button className={styles.sendBtn} onClick={handleSend} disabled={!text.trim()}>
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
