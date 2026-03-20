import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { analyzeMeeting } from '../utils/meetingAnalyzer'
import { storeMeeting, storeTask } from '../utils/hindsightClient'
import styles from './MeetingsTab.module.css'

const AVATAR_COLORS = ['#7c6aff','#22d3a0','#ff6b6b','#fbbf24','#a78bfa','#34bfff']

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepBar({ step }) {
  const labels = ['Setup', 'Voice Meeting', 'Review & Confirm']
  return (
    <div className={styles.steps}>
      {labels.map((l, i) => (
        <div key={i} className={`${styles.step} ${i + 1 === step ? styles.stepActive : ''} ${i + 1 < step ? styles.stepDone : ''}`}>
          <div className={styles.stepCircle}>{i + 1 < step ? '✓' : i + 1}</div>
          <div className={styles.stepLabel}>{l}</div>
          {i < labels.length - 1 && <div className={styles.stepLine} />}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export default function MeetingsTab() {
  const { meetings, members, tasks, decisions, memberProfiles, addTask, addDecision, addMeeting, addMemory, team, role } = useApp()
  const [view, setView] = useState('list')
  const [selectedMeeting, setSelectedMeeting] = useState(null)

  if (view === 'list') return <ListView meetings={meetings} members={members} setView={setView} setSelected={setSelectedMeeting} isLeader={role === 'leader'} />
  if (view === 'create' && role === 'leader') return <CreateFlow members={members} tasks={tasks} decisions={decisions} memberProfiles={memberProfiles} addTask={addTask} addDecision={addDecision} addMeeting={addMeeting} addMemory={addMemory} team={team} setView={setView} setSelected={setSelectedMeeting} />
  if (view === 'detail') return <DetailView meeting={selectedMeeting} tasks={tasks} setView={setView} />
  return null
}

// ═══════════ LIST VIEW ═══════════════════════════════════════════════════════
function ListView({ meetings, members, setView, setSelected, isLeader }) {
  const totalTasks = meetings.reduce((s, m) => s + (m.tasksCreated?.length || 0), 0)
  const totalDecisions = meetings.reduce((s, m) => s + (m.decisionsLogged?.length || 0), 0)
  const lastDate = meetings.length > 0 ? new Date(meetings[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'None yet'

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.headerTitle}>🎙️ {isLeader ? 'AI Meetings' : 'Team Meetings'}</div>
          <div className={styles.headerSub}>{isLeader ? 'Voice meetings analyzed and converted to tasks' : 'View meeting summaries, tasks, and decisions'}</div>
        </div>
        {isLeader && <button className="btn-primary" onClick={() => setView('create')}>🎙️ New Meeting</button>}
      </div>

      <div className={styles.statsRow}>
        {[
          { v: meetings.length, l: 'Total Meetings' },
          { v: totalTasks, l: 'Tasks Created' },
          { v: totalDecisions, l: 'Decisions Logged' },
          { v: lastDate, l: 'Last Meeting' },
        ].map((s, i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statValue}>{s.v}</div>
            <div className={styles.statLabel}>{s.l}</div>
          </div>
        ))}
      </div>

      {meetings.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>🎙️</div>
          <div className={styles.emptyTitle}>No meetings yet</div>
          <div className={styles.emptySub}>{isLeader ? 'Start a voice meeting and let AI auto-assign tasks' : 'Your team leader can start a meeting from their dashboard'}</div>
          {isLeader && <button className="btn-primary" onClick={() => setView('create')}>Start New Meeting</button>}
        </div>
      ) : (
        <div className={styles.grid}>
          {meetings.map(m => (
            <div key={m.id} className={styles.meetingCard} onClick={() => { setSelected(m); setView('detail') }}>
              <div className={styles.cardTitle}>{m.title}</div>
              <div className={styles.cardDate}>{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div className={styles.cardAvatars}>
                {m.attendees?.slice(0, 4).map((a, i) => (
                  <div key={i} className={styles.cardAvatar} style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{a[0]}</div>
                ))}
                {(m.attendees?.length || 0) > 4 && <div className={styles.cardAvatar} style={{ background: 'var(--surface2)' }}>+{m.attendees.length - 4}</div>}
              </div>
              <div className={styles.cardStats}>
                <span>📌 {m.tasksCreated?.length || 0} tasks</span>
                <span>⚖️ {m.decisionsLogged?.length || 0} decisions</span>
              </div>
              <div className={styles.cardSummary}>{m.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════ CREATE FLOW ═══════════════════════════════════════════════════
function CreateFlow({ members, tasks, decisions, memberProfiles, addTask, addDecision, addMeeting, addMemory, team, setView, setSelected }) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [attendees, setAttendees] = useState([])
  const [agenda, setAgenda] = useState('')
  const [transcript, setTranscript] = useState('')
  const [duration, setDuration] = useState(0)
  const [analysis, setAnalysis] = useState(null)
  const [checkedTasks, setCheckedTasks] = useState({})
  const [checkedDecisions, setCheckedDecisions] = useState({})
  const [taskAssignees, setTaskAssignees] = useState({})
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState('')
  const [success, setSuccess] = useState(false)

  const toggleAttendee = (name) => {
    setAttendees(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
  }

  // ── STEP 2: End meeting & analyze ────────────────────────────────────
  const handleEndMeeting = async () => {
    setStep(3)
    setAnalyzing(true)

    const steps = ['Reading transcript...', 'Analyzing team skill profiles...', 'Matching tasks to members...', 'Generating meeting summary...']
    for (const s of steps) {
      setAnalyzeStep(s)
      await new Promise(r => setTimeout(r, 600))
    }

    const result = await analyzeMeeting({
      transcript,
      attendees,
      memberProfiles,
      pastTasks: tasks,
      pastDecisions: decisions,
    })

    setAnalysis(result)

    // Default all checked
    const tc = {}; result.tasks?.forEach((_, i) => tc[i] = true)
    const dc = {}; result.decisions?.forEach((_, i) => dc[i] = true)
    const ta = {}; result.tasks?.forEach((t, i) => ta[i] = t.assignedTo)
    setCheckedTasks(tc)
    setCheckedDecisions(dc)
    setTaskAssignees(ta)
    setAnalyzing(false)
  }

  // ── STEP 3: Confirm & create ─────────────────────────────────────────
  const handleConfirm = () => {
    const meetingId = 'meeting_' + Date.now()
    const createdTasks = []
    const loggedDecisions = []

    // Create tasks
    analysis.tasks?.forEach((t, i) => {
      if (!checkedTasks[i]) return
      const taskData = {
        id: `mt_${Date.now()}_${i}`,
        title: t.title,
        description: t.description,
        assignedTo: taskAssignees[i] || t.assignedTo,
        status: 'todo',
        deadline: t.deadline || '',
        estimatedHours: t.estimatedHours,
        priority: t.priority,
        taskType: t.taskType,
        assignmentReason: t.assignmentReason,
        meetingSource: meetingId,
        createdAt: new Date().toISOString(),
        updates: [],
      }
      addTask(taskData)
      createdTasks.push(taskData)
      storeTask(taskData, meetingId)
    })

    // Create decisions
    analysis.decisions?.forEach((d, i) => {
      if (!checkedDecisions[i]) return
      const decData = {
        id: `md_${Date.now()}_${i}`,
        decision: d.decision,
        reason: d.reason,
        impact: d.impact,
        involvedPeople: d.involvedPeople,
        meetingSource: meetingId,
      }
      addDecision(decData)
      loggedDecisions.push(decData)
    })

    // Save meeting
    const meetingObj = {
      id: meetingId,
      title,
      date,
      attendees,
      transcript,
      duration,
      summary: analysis.summary,
      keyTopics: analysis.keyTopics,
      tasksCreated: createdTasks,
      decisionsLogged: loggedDecisions,
      followUpItems: analysis.followUpItems || [],
      analyzedAt: new Date().toISOString(),
      memoryStored: true,
    }
    addMeeting(meetingObj)
    storeMeeting({ ...meetingObj, teamCode: team?.code })
    setSuccess(true)
    setSelected(meetingObj)
  }

  // ── Render Steps ─────────────────────────────────────────────────────
  return (
    <div className={styles.wrap}>
      <StepBar step={step} />

      {/* STEP 1: Setup */}
      {step === 1 && (
        <div className={styles.setupForm}>
          <div className="section-title">Meeting Setup</div>
          <div className={styles.field || ''}>
            <label className="label">Meeting Title</label>
            <input className="input" placeholder="e.g. Sprint Planning" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Select Attendees</label>
            <div className={styles.attendeeGrid}>
              {members.map((m, i) => (
                <div
                  key={m.id || i}
                  className={`${styles.attendeeCard} ${attendees.includes(m.name) ? styles.attendeeSelected : ''}`}
                  onClick={() => toggleAttendee(m.name)}
                >
                  <div className={styles.attendeeAvatar} style={attendees.includes(m.name) ? { background: AVATAR_COLORS[i % AVATAR_COLORS.length], color: '#fff' } : {}}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div className={styles.attendeeName}>{m.name}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Agenda (optional)</label>
            <textarea className="textarea" placeholder="What will be discussed..." value={agenda} onChange={e => setAgenda(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={!title.trim() || attendees.length === 0} onClick={() => setStep(2)} style={{ alignSelf: 'flex-start' }}>
            Next: Start Voice Meeting →
          </button>
        </div>
      )}

      {/* STEP 2: Voice Room */}
      {step === 2 && (
        <VoiceRoom
          title={title}
          attendees={attendees}
          transcript={transcript}
          setTranscript={setTranscript}
          duration={duration}
          setDuration={setDuration}
          onEnd={handleEndMeeting}
        />
      )}

      {/* STEP 3: Review */}
      {step === 3 && analyzing && (
        <div className={styles.analyzing}>
          <div className={styles.analyzingIcon}><span className="spinner" /></div>
          <div className={styles.analyzingTitle}>🤖 AI is analyzing your meeting...</div>
          <div className={styles.analyzingStep}>{analyzeStep}</div>
        </div>
      )}

      {step === 3 && !analyzing && !success && analysis && (
        <ReviewSection
          analysis={analysis}
          attendees={attendees}
          checkedTasks={checkedTasks}
          setCheckedTasks={setCheckedTasks}
          checkedDecisions={checkedDecisions}
          setCheckedDecisions={setCheckedDecisions}
          taskAssignees={taskAssignees}
          setTaskAssignees={setTaskAssignees}
          onBack={() => setStep(2)}
          onConfirm={handleConfirm}
        />
      )}

      {step === 3 && success && (
        <div className={styles.successScreen}>
          <div className={styles.successIcon}>✅</div>
          <div className={styles.successTitle}>Meeting saved to Hindsight memory</div>
          <div className={styles.successStat}>📌 {Object.values(checkedTasks).filter(Boolean).length} tasks created and assigned</div>
          <div className={styles.successStat}>⚖️ {Object.values(checkedDecisions).filter(Boolean).length} decisions logged</div>
          <div className={styles.successActions}>
            <button className="btn-primary" onClick={() => setView('detail')}>View Meeting</button>
            <button className="btn-secondary" onClick={() => setView('list')}>Back to Meetings</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════ VOICE ROOM ══════════════════════════════════════════════════
function VoiceRoom({ title, attendees, transcript, setTranscript, duration, setDuration, onEnd }) {
  const [micStatus, setMicStatus] = useState('idle') // idle | requesting | listening | paused | denied | unsupported
  const [showTranscript, setShowTranscript] = useState(true)
  const [activeSpeaker, setActiveSpeaker] = useState(0)
  const [interimText, setInterimText] = useState('')
  const timerRef = useRef(null)
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef(transcript || '')
  const stoppedByUserRef = useRef(false)
  const mediaStreamRef = useRef(null)

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [setDuration])

  // Cycle active speaker for visual effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSpeaker(i => (i + 1) % (attendees.length || 1))
    }, 4000)
    return () => clearInterval(interval)
  }, [attendees.length])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // ── Start microphone + speech recognition ──────────────────────────
  const startListening = async () => {
    // Step 1: Check browser support
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setMicStatus('unsupported')
      return
    }

    // Step 2: Request microphone permission
    setMicStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
    } catch (err) {
      console.warn('[VoiceRoom] Mic permission denied:', err.message)
      setMicStatus('denied')
      return
    }

    // Step 3: Start speech recognition
    try {
      const recognition = new SR()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      recognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            const text = result[0].transcript.trim()
            if (text) {
              const speaker = attendees[activeSpeaker] || 'Speaker'
              const line = `${speaker}: ${text}\n`
              finalTranscriptRef.current += line
              setTranscript(finalTranscriptRef.current)
            }
          } else {
            interim += result[0].transcript
          }
        }
        setInterimText(interim)
      }

      recognition.onerror = (event) => {
        console.warn('[VoiceRoom] Speech error:', event.error)
        if (event.error === 'not-allowed') {
          setMicStatus('denied')
        }
        // Don't stop on 'no-speech' or 'network' — just let auto-restart handle it
      }

      // Auto-restart when browser stops recognition (Chrome stops after ~60s)
      recognition.onend = () => {
        if (!stoppedByUserRef.current && micStatus !== 'denied') {
          try {
            recognition.start()
          } catch {
            // If restart fails, user can try again
          }
        }
      }

      recognition.start()
      recognitionRef.current = recognition
      stoppedByUserRef.current = false
      setMicStatus('listening')
    } catch (err) {
      console.warn('[VoiceRoom] Recognition start error:', err)
      setMicStatus('unsupported')
    }
  }

  const pauseListening = () => {
    stoppedByUserRef.current = true
    recognitionRef.current?.stop()
    setMicStatus('paused')
  }

  const resumeListening = () => {
    stoppedByUserRef.current = false
    try {
      recognitionRef.current?.start()
      setMicStatus('listening')
    } catch {
      // Re-create if needed
      startListening()
    }
  }

  const handleEnd = () => {
    stoppedByUserRef.current = true
    clearInterval(timerRef.current)
    recognitionRef.current?.stop()
    mediaStreamRef.current?.getTracks().forEach(t => t.stop())
    // Ensure final transcript is set
    setTranscript(finalTranscriptRef.current)
    onEnd()
  }

  const mins = String(Math.floor(duration / 60)).padStart(2, '0')
  const secs = String(duration % 60).padStart(2, '0')

  const micStatusLabel = {
    idle: '🎤 Click to start recording',
    requesting: '⏳ Requesting microphone access...',
    listening: '🔴 Recording — speak clearly',
    paused: '⏸️ Paused — click mic to resume',
    denied: '❌ Microphone access denied — type your notes below',
    unsupported: '⚠️ Voice not supported in this browser — type your notes below',
  }[micStatus]

  return (
    <div className={styles.voiceRoom}>
      <div className={styles.roomHeader}>
        <div className={styles.roomTitle}>{title}</div>
        <div className={styles.liveBadge}><div className={styles.liveDot} /> LIVE · {mins}:{secs}</div>
      </div>

      <div className={styles.participantGrid}>
        {attendees.map((name, i) => (
          <div key={i} className={`${styles.participantCard} ${i === activeSpeaker && micStatus === 'listening' ? styles.pCardSpeaking : ''}`}>
            <div className={styles.pAvatar} style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
              {name[0]?.toUpperCase()}
            </div>
            <div className={styles.pName}>{name}</div>
            {i === activeSpeaker && micStatus === 'listening' ? (
              <div className={styles.speakingBars}>
                <div className={styles.bar} /><div className={styles.bar} /><div className={styles.bar} /><div className={styles.bar} />
              </div>
            ) : (
              <div className={styles.pSub}>—</div>
            )}
          </div>
        ))}
        <div className={`${styles.participantCard} ${styles.pCardAI}`}>
          <div className={styles.pAvatar} style={{ background: 'linear-gradient(135deg, #7c6aff, #a78bfa)' }}>🤖</div>
          <div className={styles.pName}>FlowMind AI</div>
          <div className={styles.pSub}>{micStatus === 'listening' ? 'Listening...' : 'Ready'}</div>
        </div>
      </div>

      {/* Mic status indicator */}
      <div style={{ textAlign: 'center', fontSize: '13px', color: micStatus === 'listening' ? 'var(--green)' : micStatus === 'denied' ? 'var(--red)' : 'var(--text2)', padding: '8px 0', fontWeight: 500 }}>
        {micStatusLabel}
      </div>

      {/* Transcript — always visible */}
      <div className={styles.transcriptSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>📝 Live Transcript</span>
          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{transcript.split('\n').filter(l => l.trim()).length} lines</span>
        </div>
        <textarea
          className={styles.transcriptArea}
          value={transcript + (interimText ? `\n(listening: ${interimText})` : '')}
          onChange={e => {
            const val = e.target.value.replace(/\n\(listening:.*\)$/, '')
            setTranscript(val)
            finalTranscriptRef.current = val
          }}
          placeholder="Transcript appears here as you speak. You can also type or paste meeting notes here for AI to analyze..."
          style={{ minHeight: '140px' }}
        />
      </div>

      {/* Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.timer}>{mins}:{secs}</div>
        <div className={styles.controlsCenter}>
          {micStatus === 'idle' && (
            <button className={styles.muteBtn} onClick={startListening} style={{ background: 'var(--green)', color: '#fff' }} title="Start Recording">
              🎤 Start
            </button>
          )}
          {micStatus === 'requesting' && (
            <button className={styles.muteBtn} disabled style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
              ⏳
            </button>
          )}
          {micStatus === 'listening' && (
            <button className={styles.muteBtn} onClick={pauseListening} style={{ background: 'var(--red)', color: '#fff' }} title="Pause">
              ⏸️ Pause
            </button>
          )}
          {micStatus === 'paused' && (
            <button className={styles.muteBtn} onClick={resumeListening} style={{ background: 'var(--green)', color: '#fff' }} title="Resume">
              🎤 Resume
            </button>
          )}
          {(micStatus === 'denied' || micStatus === 'unsupported') && (
            <button className={styles.muteBtn} disabled style={{ background: 'var(--surface2)', color: 'var(--text3)' }} title="Mic unavailable">
              🎤
            </button>
          )}
          <button className={styles.endBtn} onClick={handleEnd} disabled={!transcript.trim()}>
            End Meeting & Analyze →
          </button>
        </div>
        <div className={styles.aiListeningBadge}>
          <div className={styles.aiDot} style={{ background: micStatus === 'listening' ? 'var(--green)' : 'var(--text3)' }} />
          {micStatus === 'listening' ? 'AI is listening...' : 'Waiting for input'}
        </div>
      </div>
    </div>
  )
}

// ═══════════ REVIEW SECTION ═══════════════════════════════════════════════
function ReviewSection({ analysis, attendees, checkedTasks, setCheckedTasks, checkedDecisions, setCheckedDecisions, taskAssignees, setTaskAssignees, onBack, onConfirm }) {
  const checkedCount = Object.values(checkedTasks).filter(Boolean).length

  return (
    <div className={styles.wrap}>
      {/* Summary */}
      <div className={styles.reviewSection}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div className={styles.summaryIcon}>🤖</div>
            <div className={styles.summaryLabel}>AI Summary</div>
            <span className="tag tag-green">Memory-backed</span>
          </div>
          <div className={styles.summaryText}>{analysis.summary}</div>
          <div className={styles.topicTags}>
            {analysis.keyTopics?.map((t, i) => <span key={i} className="tag tag-purple">{t}</span>)}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div className={styles.reviewTitle}>📌 Tasks Extracted ({analysis.tasks?.length || 0})</div>
          <div className={styles.reviewSub}>Review and edit before creating</div>
        </div>
        {analysis.tasks?.map((t, i) => (
          <div key={i} className={styles.taskCard}>
            <div className={styles.taskCheck}>
              <input type="checkbox" checked={!!checkedTasks[i]} onChange={() => setCheckedTasks(p => ({ ...p, [i]: !p[i] }))} />
            </div>
            <div className={styles.taskContent}>
              <div className={styles.taskTitle}>{t.title}</div>
              <div className={styles.taskDesc}>{t.description}</div>
              <div className={styles.taskMeta}>
                <span className={`tag ${t.priority === 'high' ? 'tag-red' : t.priority === 'medium' ? 'tag-yellow' : 'tag-green'}`}>
                  {t.priority}
                </span>
                <span className="tag tag-purple">{t.taskType}</span>
              </div>
              <div className={styles.taskAssignRow}>
                👤 Assigned to:
                <select value={taskAssignees[i] || t.assignedTo} onChange={e => setTaskAssignees(p => ({ ...p, [i]: e.target.value }))}>
                  {attendees.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className={styles.taskReason}>🧠 {t.assignmentReason}</div>
              <div className={styles.taskEstimate}>⏱ {t.estimatedHours}h estimated · 📅 {t.deadline || 'No deadline'}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Decisions */}
      <div className={styles.reviewSection}>
        <div className={styles.reviewHeader}>
          <div className={styles.reviewTitle}>⚖️ Decisions ({analysis.decisions?.length || 0})</div>
        </div>
        {analysis.decisions?.map((d, i) => (
          <div key={i} className={styles.decisionCard}>
            <div className={styles.taskCheck}>
              <input type="checkbox" checked={!!checkedDecisions[i]} onChange={() => setCheckedDecisions(p => ({ ...p, [i]: !p[i] }))} />
            </div>
            <div className={styles.decisionContent}>
              <div className={styles.decisionText}>{d.decision}</div>
              <div className={styles.decisionReason}>{d.reason}</div>
              <span className={`tag ${d.impact === 'high' ? 'tag-red' : d.impact === 'medium' ? 'tag-yellow' : 'tag-green'}`}>{d.impact}</span>
              <div className={styles.decisionPeople}>👥 {d.involvedPeople}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Follow-ups */}
      {analysis.followUpItems?.length > 0 && (
        <div className={styles.reviewSection}>
          <div className={styles.reviewTitle}>🔖 Follow-up Items</div>
          <div className={styles.followUpList}>
            {analysis.followUpItems.map((f, i) => (
              <div key={i} className={styles.followUpItem}>🔖 {f}</div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actionsBar}>
        <button className="btn-ghost" onClick={onBack}>← Edit Transcript</button>
        <button className="btn-primary" onClick={onConfirm}>✅ Create {checkedCount} Tasks & Save Meeting</button>
      </div>
    </div>
  )
}

// ═══════════ DETAIL VIEW ════════════════════════════════════════════════════
function DetailView({ meeting, tasks: allTasks, setView }) {
  const [showTranscript, setShowTranscript] = useState(false)
  if (!meeting) return null

  return (
    <div className={styles.wrap}>
      <button className="btn-ghost" onClick={() => setView('list')} style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>← Meetings</button>

      <div className={styles.headerRow}>
        <div>
          <div className={styles.headerTitle}>{meeting.title}</div>
          <div className={styles.headerSub}>{new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <span className={styles.meetingBadge}>🤖 Analyzed by AI</span>
      </div>

      <div className={styles.cardAvatars} style={{ margin: '10px 0' }}>
        {meeting.attendees?.map((a, i) => (
          <div key={i} className={styles.cardAvatar} style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{a[0]}</div>
        ))}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}><div className={styles.statValue}>{Math.floor((meeting.duration || 0) / 60) > 0 ? `${Math.floor(meeting.duration / 60)}m ${meeting.duration % 60}s` : `${meeting.duration || 0}s`}</div><div className={styles.statLabel}>Duration</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{meeting.tasksCreated?.length || 0}</div><div className={styles.statLabel}>Tasks</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{meeting.decisionsLogged?.length || 0}</div><div className={styles.statLabel}>Decisions</div></div>
        <div className={styles.statCard}><div className={styles.statValue}>{meeting.attendees?.length || 0}</div><div className={styles.statLabel}>Attendees</div></div>
      </div>

      {/* Summary */}
      <div className={styles.detailSection}>
        <div className={styles.detailTitle}>🤖 AI Summary</div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryText}>{meeting.summary}</div>
          <div className={styles.topicTags}>
            {meeting.keyTopics?.map((t, i) => <span key={i} className="tag tag-purple">{t}</span>)}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className={styles.detailSection}>
        <div className={styles.detailTitle}>📌 Tasks ({meeting.tasksCreated?.length || 0})</div>
        {meeting.tasksCreated?.map((t, i) => {
          const liveTask = allTasks.find(lt => lt.id === t.id) || t
          return (
            <div key={i} className={styles.taskCard} style={{ cursor: 'default' }}>
              <div className={styles.taskContent}>
                <div className={styles.taskTitle}>{t.title}</div>
                <div className={styles.taskAssignRow}>👤 {t.assignedTo}
                  <span className={`tag ${liveTask.status === 'done' ? 'tag-green' : liveTask.status === 'in-progress' ? 'tag-yellow' : 'tag-purple'}`}>
                    {liveTask.status === 'done' ? '✅ Done' : liveTask.status === 'in-progress' ? '🔄 In Progress' : '📋 Todo'}
                  </span>
                </div>
                <div className={styles.taskReason}>🧠 {t.assignmentReason}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Decisions */}
      {meeting.decisionsLogged?.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailTitle}>⚖️ Decisions</div>
          {meeting.decisionsLogged.map((d, i) => (
            <div key={i} className={styles.decisionCard} style={{ cursor: 'default' }}>
              <div className={styles.decisionContent}>
                <div className={styles.decisionText}>{d.decision}</div>
                <div className={styles.decisionReason}>{d.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Follow-ups */}
      {meeting.followUpItems?.length > 0 && (
        <div className={styles.detailSection}>
          <div className={styles.detailTitle}>🔖 Follow-up Items</div>
          <div className={styles.followUpList}>
            {meeting.followUpItems.map((f, i) => (
              <div key={i} className={styles.followUpItem}>🔖 {f}</div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className={styles.detailSection}>
        <button className={styles.transcriptToggle} onClick={() => setShowTranscript(!showTranscript)}>
          📝 Full Transcript {showTranscript ? '▲' : '▼'}
        </button>
        {showTranscript && (
          <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {meeting.transcript || 'No transcript recorded.'}
          </div>
        )}
      </div>

      <div className={styles.memoryBadge}>
        🧠 Stored in Hindsight Memory — AI will use this meeting context in future analysis
      </div>
    </div>
  )
}
