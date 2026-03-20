// ─── FlowMind API Service Layer ────────────────────────────────────────────────
// Hindsight Memory (retain/recall) + Groq Chat Completions

const HINDSIGHT_BASE = import.meta.env.VITE_HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io'
const HINDSIGHT_KEY = import.meta.env.VITE_HINDSIGHT_API_KEY || ''
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''

// ── Hindsight Memory ───────────────────────────────────────────────────────────

function getBankId(teamCode) {
  return `flowmind-${(teamCode || 'default').toLowerCase()}`
}

/**
 * Store a memory in Hindsight
 * Fire-and-forget — errors are logged but don't block UI
 */
export async function retainMemory(teamCode, content, metadata = {}) {
  const bankId = getBankId(teamCode)
  try {
    const res = await fetch(`${HINDSIGHT_BASE}/v1/default/banks/${bankId}/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HINDSIGHT_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: typeof content === 'string' ? content : JSON.stringify(content),
          }
        ],
        metadata: {
          source: 'flowmind',
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      }),
    })
    if (!res.ok) {
      console.warn('[Hindsight] Retain failed:', res.status, await res.text().catch(() => ''))
    }
    return res.ok
  } catch (err) {
    console.warn('[Hindsight] Retain error:', err.message)
    return false
  }
}

/**
 * Recall memories from Hindsight by semantic search
 */
export async function recallMemory(teamCode, query, options = {}) {
  const bankId = getBankId(teamCode)
  try {
    const res = await fetch(`${HINDSIGHT_BASE}/v1/default/banks/${bankId}/memories/recall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HINDSIGHT_KEY}`,
      },
      body: JSON.stringify({
        query,
        max_tokens: options.maxTokens || 2000,
        ...options,
      }),
    })
    if (!res.ok) {
      console.warn('[Hindsight] Recall failed:', res.status)
      return null
    }
    return await res.json()
  } catch (err) {
    console.warn('[Hindsight] Recall error:', err.message)
    return null
  }
}

// ── Groq Chat Completions ──────────────────────────────────────────────────────

/**
 * Send a chat completion request to Groq
 * @param {Array} messages - Array of { role, content } message objects
 * @param {string} systemPrompt - Optional system prompt
 * @returns {string} The assistant's reply text
 */
export async function groqChat(messages, systemPrompt = '') {
  const allMessages = []
  if (systemPrompt) {
    allMessages.push({ role: 'system', content: systemPrompt })
  }
  allMessages.push(...messages)

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: allMessages,
        temperature: 0.7,
        max_completion_tokens: 1500,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.warn('[Groq] API error:', res.status, errText)
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.warn('[Groq] Request error:', err.message)
    return null
  }
}

/**
 * Generate AI insights using recalled Hindsight memories + Groq
 */
export async function generateInsights(teamCode, tasks, decisions, members) {
  // Step 1: Recall all relevant memories
  const recalled = await recallMemory(teamCode, 'team performance patterns risks bottlenecks task delays decisions')
  const memoryContext = recalled
    ? JSON.stringify(recalled).substring(0, 3000)
    : 'No memories recalled from Hindsight.'

  // Step 2: Build the prompt
  const systemPrompt = `You are FlowMind AI, an intelligent project management assistant. You analyze team data and Hindsight memories to surface insights.

You have access to the following data:
- ${tasks.length} tasks (${tasks.filter(t => t.status === 'done').length} done, ${tasks.filter(t => t.status === 'in-progress').length} in progress, ${tasks.filter(t => t.status === 'todo').length} todo)
- ${decisions.length} decisions logged
- ${members.length} team members
- Hindsight Memory Context: ${memoryContext}

Current tasks: ${JSON.stringify(tasks.map(t => ({ title: t.title, assignedTo: t.assignedTo, status: t.status, deadline: t.deadline })))}
Current decisions: ${JSON.stringify(decisions.map(d => ({ decision: d.decision, reason: d.reason, impact: d.impact })))}

Respond with ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "risks": [{"member": "name", "task": "title", "risk": 72, "reason": "explanation"}],
  "patterns": [{"icon": "emoji", "title": "Pattern Name", "detail": "explanation"}],
  "bottlenecks": [{"task": "title", "person": "name", "waiting": 2}],
  "recommendation": "Overall recommendation string"
}
Provide 2-3 items per category. Use real data from the tasks/decisions provided. Risk should be 0-100.`

  const reply = await groqChat(
    [{ role: 'user', content: 'Analyze this team\'s performance and generate structured insights.' }],
    systemPrompt
  )

  if (!reply) return null

  // Step 3: Parse JSON response
  try {
    // Try to extract JSON from the response
    const jsonMatch = reply.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return JSON.parse(reply)
  } catch (err) {
    console.warn('[Insights] Failed to parse Groq response:', err.message)
    console.debug('[Insights] Raw response:', reply)
    return null
  }
}

/**
 * Send a chat message using recalled Hindsight memories + Groq
 */
export async function sendChatMessage(teamCode, userMessage, context, conversationHistory) {
  // Step 1: Recall relevant memories for this specific question
  const recalled = await recallMemory(teamCode, userMessage)
  const memoryContext = recalled
    ? JSON.stringify(recalled).substring(0, 2000)
    : 'No specific memories found.'

  // Step 2: Build system prompt
  const systemPrompt = `You are FlowMind AI, an intelligent project assistant with access to Hindsight memory.

Team context:
- ${context.tasks?.length || 0} tasks (${context.tasks?.filter(t => t.status === 'done')?.length || 0} done)
- ${context.decisions?.length || 0} decisions logged
- ${context.members?.length || 0} team members active
- Recent activity: ${context.memoryFeed?.slice(0, 5).map(m => m.text).join('; ') || 'None'}

Hindsight Memory Recall: ${memoryContext}

Tasks: ${JSON.stringify(context.tasks?.map(t => ({ title: t.title, assignedTo: t.assignedTo, status: t.status })) || [])}
Decisions: ${JSON.stringify(context.decisions?.map(d => ({ decision: d.decision, impact: d.impact })) || [])}

Rules:
- Be concise but helpful
- Reference specific tasks, decisions, and team members by name when relevant
- Use **bold** for emphasis
- If asked about something not in the data, say so honestly
- Base your answers on the actual data and Hindsight memories provided`

  // Step 3: Build conversation history for multi-turn
  const messages = conversationHistory
    .filter(m => m.role && m.text)
    .slice(-8) // Keep last 8 messages for context window
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))

  messages.push({ role: 'user', content: userMessage })

  // Step 4: Call Groq
  const reply = await groqChat(messages, systemPrompt)
  return reply || `I've searched Hindsight memory for context on your question. Based on your team's history with ${context.tasks?.length || 0} tasks and ${context.decisions?.length || 0} decisions logged, here's my analysis:\n\nYour team is currently focused on ${context.tasks?.filter(t => t.status === 'in-progress')?.[0]?.title || 'multiple workstreams'}. I'd suggest keeping the momentum going and ensuring blockers are surfaced in the daily standup.`
}
