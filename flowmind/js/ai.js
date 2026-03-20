// ============================================================
//  FlowMind — Groq AI Service
//  All LLM calls — chat, insights, suggestions
// ============================================================

import CONFIG from "./config.js";
import { buildMemoryContext } from "./state.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function groqChat(messages, temperature = 0.7) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: CONFIG.GROQ_MODEL,
      messages,
      temperature,
      max_tokens: 800,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

// ── System prompt builder ─────────────────────────────────────
function buildSystemPrompt(role = "leader", hindsightContext = "") {
  const memCtx = buildMemoryContext();
  return `You are FlowMind AI, an intelligent project management assistant with persistent memory.
You have access to the full project context and Hindsight memory below.
Always give concrete, actionable advice based on the actual data — never generic answers.
Be concise, direct, and insightful. Format responses clearly.

=== PROJECT MEMORY (from Hindsight) ===
${memCtx}

${hindsightContext ? `=== RECALLED HINDSIGHT MEMORIES ===\n${hindsightContext}\n` : ""}

You are speaking to the project ${role}. Tailor your response accordingly.
If asked about team members, reference actual names and their specific tasks.
If asked about risks, reference actual deadlines and progress.`;
}

// ── Leader chat ───────────────────────────────────────────────
export async function leaderChatMessage(userMessage, chatHistory, hindsightContext = "") {
  const messages = [
    { role: "system", content: buildSystemPrompt("leader", hindsightContext) },
    ...chatHistory.slice(-10), // keep last 10 for context window
    { role: "user", content: userMessage },
  ];
  return groqChat(messages);
}

// ── Member chat ───────────────────────────────────────────────
export async function memberChatMessage(userMessage, memberName, chatHistory, hindsightContext = "") {
  const messages = [
    {
      role: "system",
      content:
        buildSystemPrompt("member", hindsightContext) +
        `\n\nYou are specifically talking to team member: ${memberName}. Focus on their tasks and responsibilities.`,
    },
    ...chatHistory.slice(-10),
    { role: "user", content: userMessage },
  ];
  return groqChat(messages);
}

// ── Generate AI Insights ──────────────────────────────────────
export async function generateInsights(hindsightContext = "") {
  const memCtx = buildMemoryContext();
  const prompt = `Based on this project data, generate exactly 6 insights as a JSON array.
Each insight must be one of these types: "risk", "tip", "pattern".

Project Data:
${memCtx}
${hindsightContext ? `\nHindsight Memories:\n${hindsightContext}` : ""}

Return ONLY valid JSON array, no markdown, no explanation. Format:
[
  {
    "type": "risk|tip|pattern",
    "icon": "emoji",
    "title": "short title",
    "description": "2-sentence actionable insight based on real data",
    "action": "short action label"
  }
]

Make insights specific to the actual team members, tasks, and deadlines above.`;

  const messages = [{ role: "user", content: prompt }];
  const raw = await groqChat(messages, 0.5);

  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    // fallback insights if parse fails
    return [
      { type: "risk", icon: "⚠️", title: "Parse Error", description: "Could not parse AI response. Check Groq API key.", action: "Retry" },
    ];
  }
}

// ── Suggest role assignments ──────────────────────────────────
export async function suggestRoles(members, projectName, projectDescription = "") {
  const prompt = `For project "${projectName}" ${projectDescription ? `(${projectDescription})` : ""}, 
suggest roles for these team members: ${members.join(", ")}.
Return a JSON object with member names as keys and role suggestions as values.
Keep roles short (3-5 words). Return ONLY valid JSON, no markdown.`;

  const messages = [{ role: "user", content: prompt }];
  const raw = await groqChat(messages, 0.6);
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    const fallback = {};
    members.forEach((m, i) => {
      fallback[m] = ["Frontend Lead", "Backend Dev", "QA Engineer", "DevOps Lead"][i % 4];
    });
    return fallback;
  }
}

// ── Extract decisions from meeting transcript ─────────────────
export async function extractFromTranscript(transcript) {
  const prompt = `Extract decisions and action items from this meeting transcript.
Return ONLY valid JSON, no markdown:
{
  "decisions": [{"text": "...", "why": "..."}],
  "tasks": [{"title": "...", "assignee": "..."}],
  "summary": "2-sentence summary"
}

Transcript:
${transcript}`;

  const messages = [{ role: "user", content: prompt }];
  const raw = await groqChat(messages, 0.3);
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return { decisions: [], tasks: [], summary: "Could not parse transcript." };
  }
}
