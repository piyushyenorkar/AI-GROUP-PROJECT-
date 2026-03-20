import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { retainMemory, recallMemory, groqChat } from '../services/api'
import styles from './TeamChat.module.css'

const GROUP_STORAGE = 'flowmind_group_chats'

function getMessages(teamCode) {
  try {
    const all = JSON.parse(localStorage.getItem(GROUP_STORAGE) || '{}')
    return all[teamCode]?.messages || []
  } catch { return [] }
}

function saveMessage(teamCode, msg) {
  try {
    const all = JSON.parse(localStorage.getItem(GROUP_STORAGE) || '{}')
    if (!all[teamCode]) all[teamCode] = { messages: [] }
    all[teamCode].messages.push(msg)
    localStorage.setItem(GROUP_STORAGE, JSON.stringify(all))
  } catch {}
}

export default function GroupChat() {
  const { team, currentUser, members } = useApp()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [summary, setSummary] = useState(null)
  const bottomRef = useRef(null)
  const teamCode = team?.code || ''

  // Load messages
  useEffect(() => {
    setMessages(getMessages(teamCode))
  }, [teamCode])

  // Poll for new messages every 2s
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(getMessages(teamCode))
    }, 2000)
    return () => clearInterval(interval)
  }, [teamCode])

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
    saveMessage(teamCode, msg)
    setMessages(prev => [...prev, msg])
    setText('')

    // Store in Hindsight memory
    retainMemory(
      teamCode,
      `Group chat message from ${currentUser?.name}: "${msg.text}"`,
      {
        type: 'group_chat',
        from: currentUser?.name,
        chatType: 'group',
      }
    )
  }

  const handleSummarize = async () => {
    setSummarizing(true)
    setSummary(null)

    try {
      // Step 1: Get recent messages for context
      const recentMsgs = messages.slice(-30)
      const chatLog = recentMsgs.map(m =>
        `[${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${m.from}: ${m.text}`
      ).join('\n')

      // Step 2: Recall from Hindsight for extra context
      const recalled = await recallMemory(teamCode, 'group chat discussions decisions actions')
      const memoryContext = recalled
        ? JSON.stringify(recalled).substring(0, 2000)
        : 'No additional memories available.'

      // Step 3: Summarize using Groq
      const systemPrompt = `You are FlowMind AI. Summarize the following team group chat conversation. Include:
1. **Key points** discussed
2. **Decisions** made (if any)
3. **Action items** (if any)
4. **Unresolved questions** (if any)

Hindsight memory context: ${memoryContext}

Be concise but comprehensive. Use bullet points.`

      const reply = await groqChat(
        [{ role: 'user', content: `Summarize this group chat:\n\n${chatLog}` }],
        systemPrompt
      )

      const summaryText = reply || 'Unable to generate summary. Please try again.'
      setSummary(summaryText)

      // Store summary in Hindsight
      retainMemory(
        teamCode,
        `Group chat summary generated: ${summaryText}`,
        { type: 'chat_summary', chatType: 'group', messageCount: recentMsgs.length }
      )
    } catch (err) {
      console.warn('[GroupChat] Summarize error:', err)
      setSummary('Failed to generate summary. Please try again.')
    }
    setSummarizing(false)
  }

  const myName = currentUser?.name || ''
  const memberCount = members?.length || 0

  return (
    <div className={styles.wrap}>
      {/* Messages */}
      {messages.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>💬</div>
          <div className={styles.emptyText}>Team Group Chat</div>
          <div className={styles.emptySub}>
            {memberCount} members · Messages are memorized by Hindsight AI
          </div>
        </div>
      ) : (
        <div className={styles.messages}>
          {messages.map((msg, i) => {
            const isMine = msg.from === myName
            const prevMsg = messages[i - 1]
            const showSender = !isMine && (!prevMsg || prevMsg.from !== msg.from)

            return (
              <div key={i} className={`${styles.msgRow} ${isMine ? styles.msgRowMine : styles.msgRowOther}`}>
                {showSender && <div className={styles.msgSender}>{msg.from}</div>}
                <div className={`${styles.msgBubble} ${isMine ? styles.msgMine : styles.msgOther}`}>
                  {msg.text}
                </div>
              </div>
            )
          })}

          {/* Summary card */}
          {summary && (
            <div className={styles.summaryCard}>
              <div className={styles.summaryTitle}>
                🧠 AI Summary
              </div>
              <div className={styles.summaryText}>{summary}</div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Summarize button bar */}
      {messages.length >= 3 && (
        <div className={styles.summarizeBar}>
          <button
            className={styles.summarizeBtn}
            onClick={handleSummarize}
            disabled={summarizing}
          >
            {summarizing ? (
              <><span className="spinner" /> Summarizing...</>
            ) : (
              <>🧠 Summarize Chat</>
            )}
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text3)', alignSelf: 'center' }}>
            {messages.length} messages · Powered by Hindsight + Groq
          </span>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputBar}>
        <input
          className="input"
          placeholder="Message the team..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className={styles.sendBtn} onClick={handleSend} disabled={!text.trim()}>
          ↑
        </button>
      </div>
    </div>
  )
}
