import React, { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { sendChatMessage } from '../services/api'
import styles from './ChatTab.module.css'

const SUGGESTIONS = [
  'Who should I assign the next task to?',
  'Summarise what the team has done',
  'Are there any delay risks?',
  'What decisions were made about the project?',
]

export default function ChatTab() {
  const { tasks, decisions, members, memoryFeed, currentUser, team } = useApp()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hey ${currentUser?.name || 'there'}! 👋 I'm your AI project assistant. I have access to your team's full Hindsight memory — all tasks, decisions, and activity. Ask me anything about your project.`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const context = { tasks, decisions, members, memoryFeed }
      const reply = await sendChatMessage(team?.code, msg, context, messages)
      setMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.aiAvatar}>🤖</div>
        <div>
          <div className={styles.aiName}>FlowMind AI</div>
          <div className={styles.aiStatus}><span className={styles.statusDot} /> Memory-connected · {memoryFeed.length} events recalled</div>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.msg} ${m.role === 'user' ? styles.user : styles.assistant}`}>
            {m.role === 'assistant' && <div className={styles.msgAvatar}>🤖</div>}
            <div className={styles.msgBubble}>
              {m.text.split('\n').map((line, j) => (
                <p key={j} className={styles.msgLine}>
                  {line.split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={k}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className={`${styles.msg} ${styles.assistant}`}>
            <div className={styles.msgAvatar}>🤖</div>
            <div className={styles.msgBubble}>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.suggestions}>
        {SUGGESTIONS.map((s, i) => (
          <button key={i} className={styles.suggestion} onClick={() => send(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className={styles.inputRow}>
        <input
          className={`input ${styles.chatInput}`}
          placeholder="Ask anything about your team, tasks, or decisions..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
        />
        <button className="btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
          {loading ? <span className="spinner" /> : '↑'}
        </button>
      </div>
    </div>
  )
}
