// ============================================================
//  FlowMind — UI Utilities
//  Shared rendering helpers, toast, modals, animations
// ============================================================

// ── Screen Management ────────────────────────────────────────
export function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

export function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
}

export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("open");
}

// ── Toast Notification ───────────────────────────────────────
let toastTimer = null;
export function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  const text = document.getElementById("toast-text");
  const icon = document.getElementById("toast-icon");
  if (!toast || !text) return;

  const colors = {
    success: "var(--accent3)",
    error: "var(--danger)",
    info: "var(--accent)",
    warning: "var(--warning)",
  };
  const icons = { success: "💾", error: "⚠️", info: "ℹ️", warning: "⚡" };

  text.textContent = msg;
  if (icon) icon.textContent = icons[type] || "💾";
  toast.style.borderColor = colors[type] || colors.success;
  toast.style.display = "flex";
  toast.classList.add("show");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => (toast.style.display = "none"), 300);
  }, 3500);
}

// ── Leader Tab Switching ─────────────────────────────────────
export function leaderTab(btn, tabId) {
  document.querySelectorAll(".leader-tab").forEach((t) => (t.style.display = "none"));
  document.querySelectorAll(".topnav-tabs .nav-tab").forEach((b) => b.classList.remove("active"));
  const tab = document.getElementById(tabId);
  if (tab) tab.style.display = "flex";
  if (btn) btn.classList.add("active");
}

// ── Member Tab Switching ─────────────────────────────────────
export function memberTab(btn, tabId) {
  document.querySelectorAll(".member-tab").forEach((t) => (t.style.display = "none"));
  document.querySelectorAll(".member-topnav .nav-tab").forEach((b) => b.classList.remove("active"));
  const tab = document.getElementById(tabId);
  if (tab) tab.style.display = "flex";
  if (btn) btn.classList.add("active");
}

// ── Render Kanban Board ──────────────────────────────────────
export function renderKanban(tasks) {
  const cols = { todo: [], progress: [], done: [] };
  tasks.forEach((t) => {
    if (cols[t.status]) cols[t.status].push(t);
  });

  const render = (status, containerId, countId) => {
    const el = document.getElementById(containerId);
    const count = document.getElementById(countId);
    if (!el) return;
    if (count) count.textContent = cols[status].length;
    if (!cols[status].length) {
      el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text3);font-size:0.75rem;">No tasks</div>`;
      return;
    }
    el.innerHTML = cols[status]
      .map(
        (t) => `
      <div class="task-mini ${status === "done" ? "done" : ""}" data-id="${t.id}">
        <div class="task-mini-title">${t.title}</div>
        <div class="task-mini-meta">
          <span class="badge-mini" style="background:${getMemberBadgeColor(t.assignee)}20;color:${getMemberBadgeColor(t.assignee)}">${t.assignee}</span>
          ${t.deadline ? `<span style="font-size:0.68rem;color:var(--text3)">${formatDate(t.deadline)}</span>` : ""}
        </div>
      </div>`
      )
      .join("");
  };

  render("todo", "k-todo", "k-todo-count");
  render("progress", "k-progress", "k-prog-count");
  render("done", "k-done", "k-done-count");
}

// ── Render Memory Feed ───────────────────────────────────────
export function renderMemoryFeed(memories, containerId = "memory-feed") {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!memories.length) {
    el.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text3);font-size:0.78rem;">Memory is empty. Start assigning tasks.</div>`;
    return;
  }
  el.innerHTML = memories
    .slice(0, 15)
    .map(
      (m) => `
    <div class="memory-item">
      <div class="memory-dot" style="background:${m.color || "var(--accent)"}"></div>
      <div>
        <div class="memory-text">${m.text}</div>
        <div class="memory-time">${m.time}</div>
      </div>
    </div>`
    )
    .join("");
}

// ── Render Decision Timeline ─────────────────────────────────
export function renderDecisionTimeline(decisions) {
  const el = document.getElementById("decision-timeline");
  if (!el) return;
  if (!decisions.length) {
    el.innerHTML = `<div class="empty-state"><div>📭</div><p>No decisions logged yet.</p></div>`;
    return;
  }
  el.innerHTML = `<div class="timeline">${decisions
    .slice()
    .reverse()
    .map(
      (d) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-decision">${d.text}</div>
        <div class="timeline-why">Why: ${d.why}</div>
        <div class="timeline-meta">
          <span class="badge badge-purple">${d.who}</span>
          <span class="badge badge-ghost">${d.date}</span>
          ${d.outcome ? `<span class="badge badge-teal">Outcome: ${d.outcome}</span>` : ""}
        </div>
      </div>
    </div>`
    )
    .join("")}</div>`;
}

// ── Render Full Task List (Leader) ───────────────────────────
export function renderTasksList(tasks) {
  const el = document.getElementById("tasks-full-list");
  if (!el) return;
  if (!tasks.length) {
    el.innerHTML = `<div class="empty-state"><div>📋</div><p>No tasks assigned yet. Click "+ Assign Task".</p></div>`;
    return;
  }

  const statusColor = { todo: "var(--text2)", progress: "var(--warning)", done: "var(--success)" };
  const statusLabel = { todo: "📋 Todo", progress: "⚡ In Progress", done: "✅ Done" };

  el.innerHTML = tasks
    .map(
      (t) => `
    <div class="task-row ${t.status === "done" ? "done" : ""}">
      <div class="task-row-left">
        <div class="task-row-title">${t.title}</div>
        <div class="task-row-meta">
          <span class="assignee-chip" style="color:${getMemberBadgeColor(t.assignee)}">${t.assignee}</span>
          ${t.deadline ? `<span class="meta-item">📅 ${formatDate(t.deadline)}</span>` : ""}
          <span class="meta-item">⏱ ${t.hours}h est.</span>
          ${t.updates?.length ? `<span class="meta-item">💬 ${t.updates.length} update${t.updates.length > 1 ? "s" : ""}</span>` : ""}
        </div>
        ${
          t.updates?.length
            ? `<div class="task-latest-update">Latest: "${t.updates[t.updates.length - 1].text || t.updates[t.updates.length - 1]}"</div>`
            : ""
        }
      </div>
      <div class="task-row-right">
        <span class="status-chip" style="color:${statusColor[t.status]};background:${statusColor[t.status]}18">${statusLabel[t.status]}</span>
      </div>
    </div>`
    )
    .join("");
}

// ── Render Member Tasks ──────────────────────────────────────
export function renderMemberTasks(tasks, memberName, onUpdate) {
  const el = document.getElementById("member-tasks-list");
  if (!el) return;
  const myTasks = tasks.filter((t) => t.assignee === memberName);

  if (!myTasks.length) {
    el.innerHTML = `<div class="empty-state"><div>🎉</div><p>No tasks assigned to you yet!</p></div>`;
    return;
  }

  const statusColor = { todo: "var(--text2)", progress: "var(--warning)", done: "var(--success)" };
  const statusLabel = { todo: "📋 Todo", progress: "⚡ In Progress", done: "✅ Done" };

  el.innerHTML = myTasks
    .map(
      (t) => `
    <div class="member-task-card ${t.status === "done" ? "done" : ""}">
      <div class="member-task-header">
        <div class="member-task-title">${t.title}</div>
        <span class="status-chip" style="color:${statusColor[t.status]};background:${statusColor[t.status]}18">${statusLabel[t.status]}</span>
      </div>
      <div class="member-task-meta">
        ${t.deadline ? `<span class="meta-item">📅 Due ${formatDate(t.deadline)}</span>` : ""}
        <span class="meta-item">⏱ ${t.hours}h est.</span>
      </div>
      ${
        t.updates?.length
          ? `<div class="task-updates-list">${t.updates
              .slice(-2)
              .map((u) => `<div class="update-bubble">${u.text || u}</div>`)
              .join("")}</div>`
          : ""
      }
      ${
        t.status !== "done"
          ? `<button class="btn btn-update" data-id="${t.id}">✏️ Update Progress</button>`
          : `<div class="done-label">✅ Completed</div>`
      }
    </div>`
    )
    .join("");

  // attach update button events
  el.querySelectorAll(".btn-update").forEach((btn) => {
    btn.addEventListener("click", () => onUpdate(parseInt(btn.dataset.id)));
  });
}

// ── Render Members List ──────────────────────────────────────
export function renderMembersList(members, tasks) {
  const el = document.getElementById("members-list");
  if (!el) return;
  el.innerHTML = members
    .map((m, i) => {
      const memberTasks = tasks.filter((t) => t.assignee === m);
      const done = memberTasks.filter((t) => t.status === "done").length;
      const color = getMemberBadgeColor(m, i);
      return `
      <div class="member-row">
        <div class="member-avatar" style="background:${color}22;color:${color}">${getInitials(m)}</div>
        <div>
          <div class="member-name">${m}</div>
          <div class="member-role">${done}/${memberTasks.length} tasks done</div>
        </div>
        <div class="member-progress-wrap">
          <div class="progress-bar" style="width:120px">
            <div class="progress-fill" style="background:${color};width:${memberTasks.length ? Math.round((done / memberTasks.length) * 100) : 0}%"></div>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

// ── Render Insights Grid ─────────────────────────────────────
export function renderInsights(insights) {
  const el = document.getElementById("insights-grid");
  if (!el) return;
  el.innerHTML = insights
    .map(
      (ins) => `
    <div class="insight-card ${ins.type}">
      <div class="insight-icon">${ins.icon}</div>
      <div class="insight-title">${ins.title}</div>
      <div class="insight-desc">${ins.description}</div>
      ${ins.action ? `<button class="btn btn-ghost btn-sm" style="margin-top:14px">${ins.action}</button>` : ""}
    </div>`
    )
    .join("");
}

// ── Render Health Score Ring ─────────────────────────────────
export function updateHealthRing(score) {
  const circle = document.getElementById("health-circle");
  const scoreEl = document.getElementById("health-score");
  if (!circle || !scoreEl) return;
  const circumference = 188.5;
  const offset = circumference - (score / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  const color = score > 70 ? "var(--success)" : score > 40 ? "var(--warning)" : "var(--danger)";
  circle.style.stroke = color;
  scoreEl.style.color = color;
  scoreEl.textContent = score;
}

// ── Render Stats ─────────────────────────────────────────────
export function updateStats(tasks) {
  const total = tasks.length;
  const inProg = tasks.filter((t) => t.status === "progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl("stat-total", total);
  setEl("stat-progress", inProg);
  setEl("stat-done", done);
}

// ── Append Chat Message ──────────────────────────────────────
export function appendChatMsg(containerId, role, content, name = "") {
  const el = document.getElementById(containerId);
  if (!el) return;
  const isUser = role === "user";
  const div = document.createElement("div");
  div.className = `chat-msg ${isUser ? "user" : ""}`;
  div.innerHTML = `
    <div class="chat-avatar ${isUser ? "user" : "ai"}">${isUser ? (name ? name[0].toUpperCase() : "U") : "AI"}</div>
    <div class="chat-bubble ${isUser ? "user" : "ai"}">${content.replace(/\n/g, "<br>")}</div>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

export function appendTypingIndicator(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const div = document.createElement("div");
  div.className = "chat-msg";
  div.id = "typing-indicator";
  div.innerHTML = `
    <div class="chat-avatar ai">AI</div>
    <div class="chat-bubble ai"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

export function removeTypingIndicator() {
  const el = document.getElementById("typing-indicator");
  if (el) el.remove();
}

// ── Helpers ──────────────────────────────────────────────────
const COLORS = ["#7c6aff", "#ff6a6a", "#6affd4", "#ffb86a", "#ff6ab5", "#6ab5ff", "#b5ff6a", "#ff9f6a"];
const memberColorMap = {};
let colorIdx = 0;

export function getMemberBadgeColor(name, idx) {
  if (!memberColorMap[name]) {
    memberColorMap[name] = COLORS[(idx !== undefined ? idx : colorIdx++) % COLORS.length];
  }
  return memberColorMap[name];
}

export function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function generateTeamCode() {
  return "FLOW-" + Math.floor(1000 + Math.random() * 9000);
}

export function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {
    const el = document.createElement("textarea");
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  });
}
