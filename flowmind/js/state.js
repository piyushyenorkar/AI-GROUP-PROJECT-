// ============================================================
//  FlowMind — State Management
//  Single source of truth for the entire app
// ============================================================

export const state = {
  role: null,           // 'leader' | 'member'
  leaderName: "",
  memberName: "",
  projectName: "",
  teamCode: "",
  deadline: "",
  members: [],          // [{name, color, tasksCount}]
  tasks: [],            // [{id, title, assignee, status, deadline, hours, updates[]}]
  decisions: [],        // [{id, text, why, who, date, outcome}]
  memories: [],         // [{text, type, color, time, id}] — local mirror of Hindsight
  chatHistory: {
    leader: [],         // [{role, content}]
    member: [],
  },
  currentUpdateTaskId: null,
  hindsightSessionId: null,
};

// Member avatar color palette
export const MEMBER_COLORS = [
  "#7c6aff", "#ff6a6a", "#6affd4", "#ffb86a",
  "#ff6ab5", "#6ab5ff", "#b5ff6a", "#ff9f6a",
];

export function getMemberColor(index) {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

export function getMemberInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getTasksByStatus(status) {
  return state.tasks.filter((t) => t.status === status);
}

export function getTasksByMember(memberName) {
  return state.tasks.filter((t) => t.assignee === memberName);
}

export function getTaskById(id) {
  return state.tasks.find((t) => t.id === id);
}

export function updateTaskStatus(id, status) {
  const task = getTaskById(id);
  if (task) task.status = status;
}

export function addTaskUpdate(id, updateText) {
  const task = getTaskById(id);
  if (task) {
    if (!task.updates) task.updates = [];
    task.updates.push({ text: updateText, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  }
}

export function computeHealthScore() {
  if (!state.tasks.length) return 80;
  const done = state.tasks.filter((t) => t.status === "done").length;
  const overdue = state.tasks.filter((t) => {
    if (t.status === "done") return false;
    if (!t.deadline) return false;
    return new Date(t.deadline) < new Date();
  }).length;
  const base = Math.round((done / state.tasks.length) * 100);
  return Math.max(10, Math.min(99, base + 30 - overdue * 10));
}

export function buildMemoryContext() {
  const lines = [];
  lines.push(`Project: ${state.projectName}`);
  lines.push(`Team: ${state.members.join(", ")}`);
  lines.push(`Deadline: ${state.deadline || "Not set"}`);
  lines.push("");
  lines.push("=== TASKS ===");
  state.tasks.forEach((t) => {
    lines.push(`• [${t.status.toUpperCase()}] "${t.title}" → assigned to ${t.assignee}, due ${t.deadline || "N/A"}, est ${t.hours}h`);
    if (t.updates?.length) {
      t.updates.forEach((u) => lines.push(`    └ Update: ${u.text || u}`));
    }
  });
  lines.push("");
  lines.push("=== DECISIONS ===");
  if (state.decisions.length) {
    state.decisions.forEach((d) => {
      lines.push(`• [${d.date}] "${d.text}" — Why: ${d.why} — By: ${d.who}`);
    });
  } else {
    lines.push("No decisions logged yet.");
  }
  lines.push("");
  lines.push("=== RECENT MEMORY EVENTS ===");
  state.memories.slice(0, 8).forEach((m) => {
    lines.push(`• [${m.time}] ${m.text.replace(/<[^>]+>/g, "")}`);
  });
  return lines.join("\n");
}
