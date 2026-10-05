"use strict";
// ---------- state ----------
const KEY = "dsa-prep-v1";
const INTERVALS = [1, 3, 7, 14, 30, 60]; // days until next review by stage
const STATUSES = ["Researching", "Applied", "Screen", "Interview", "Offer", "Rejected"];

const iso = (d) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d); };
const dayDiff = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);

function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  return Object.assign({ start: today(), maxLevel: 2, solved: {}, companies: [], code: {}, activity: {}, ref: {}, bigo: {} }, s || {});
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { alert("Could not save to browser storage."); } }

// ---------- appearance ----------
const THEMES = [
  { id: "system", name: "System", desc: "Follows your device" },
  { id: "light", name: "Paper", desc: "Clean and bright" },
  { id: "dark", name: "Graphite", desc: "Calm, neutral dark" },
  { id: "midnight", name: "Midnight", desc: "Deep blue night" },
  { id: "nord", name: "Nord", desc: "Arctic, muted blues" },
  { id: "sand", name: "Sand", desc: "Warm paper tones" },
  { id: "forest", name: "Forest", desc: "Dark with green accent" },
  { id: "rose", name: "Rosé", desc: "Soft and light" },
  { id: "contrast", name: "High contrast", desc: "Maximum legibility" },
];
const LIGHT_THEMES = new Set(["light", "sand", "rose"]);
const ACCENTS = ["#5b5bd6", "#2f6fed", "#0f9d8f", "#16a34a", "#ea580c", "#e11d48", "#8b5cf6"];
const darkQuery = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
const resolvedTheme = () => { const t = S.theme || "system"; return t === "system" ? (darkQuery && darkQuery.matches ? "dark" : "light") : t; };
const ICON_SUN = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
const ICON_MOON = `<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>`;
function applyTheme() {
  const r = document.documentElement, t = resolvedTheme();
  r.dataset.theme = t;
  r.dataset.density = S.density || "comfortable";
  r.style.fontSize = { s: "14px", m: "15px", l: "16.5px" }[S.fontSize || "m"];
  if (S.accent) r.style.setProperty("--accent", S.accent); else r.style.removeProperty("--accent");
  const q = document.getElementById("theme-quick");
  if (q) q.innerHTML = LIGHT_THEMES.has(t) ? ICON_MOON : ICON_SUN;
}
if (darkQuery) darkQuery.addEventListener("change", () => { if ((S.theme || "system") === "system") { applyTheme(); if (tab === "settings") render(); } });

// ---------- helpers ----------
const DIFF = { E: "Easy", M: "Medium", H: "Hard" };
const diffBadge = (d) => `<span class="badge ${d}">${DIFF[d]}</span>`;
const ICON_SEARCH = `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;
const searchBox = (id, value, ph = "Search problems...") => `<label class="search">${ICON_SEARCH}<input id="${id}" placeholder="${ph}" value="${esc(value)}" autocomplete="off"></label>`;
const pageHead = (title, sub = "") => `<div class="page-head"><h2>${title}</h2>${sub ? `<p class="muted">${sub}</p>` : ""}</div>`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const included = () => PROBLEMS.filter((p) => p.l <= S.maxLevel);
const rec = (slug) => S.solved[slug];
const isDone = (slug) => !!rec(slug);
const link = (p) => `<a href="https://leetcode.com/problems/${p.s}/" target="_blank" rel="noopener">${esc(p.t)}</a>`;
const weekProblems = (w) => included().filter((p) => w.cats.includes(p.c));
const currentWeek = () => Math.min(12, Math.max(1, Math.floor(dayDiff(S.start, today()) / 7) + 1));
const lvlName = { 1: "Core", 2: "Mid", 3: "Stretch" };

function streak() {
  let n = 0, d = today();
  if (!S.activity[d]) d = addDays(d, -1); // today may not be done yet
  while (S.activity[d]) { n++; d = addDays(d, -1); }
  return n;
}
function dueReviews() {
  const t = today();
  return PROBLEMS.filter((p) => rec(p.s) && rec(p.s).next <= t).sort((a, b) => rec(a.s).next.localeCompare(rec(b.s).next));
}
function statusCell(p) {
  const r = rec(p.s);
  if (!r) return `<span class="badge">To do</span>`;
  const due = r.next <= today();
  return due ? `<span class="badge due">Review due</span>` : `<span class="badge done">Done</span>`;
}
const videoUrl = (p) => VIDEOS[p.s] ? `https://www.youtube.com/watch?v=${VIDEOS[p.s]}` : yt("neetcode " + p.t + " leetcode solution");
// Click-to-play video cards (the iframe only loads when clicked).
const vids = (list) => !list || !list.length ? "" : `<div class="vgrid">${list.map((v) =>
  `<div class="vcard" data-vid="${v.id}" role="button" tabindex="0" title="Play video"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg"><span class="play">&#9654;</span>
   <div class="vt">${esc(v.title)}<br><span class="muted">${esc(v.ch)}</span></div></div>`).join("")}</div>`;
const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const LESSON_YT = {
  basics: "python basics variables loops conditionals tutorial", strings: "python strings methods slicing tutorial",
  lists: "python lists tuples slicing tutorial", dicts: "python dictionaries sets tutorial",
  functions: "python functions args kwargs scope closures", comprehensions: "python list comprehensions generators yield",
  classes: "python classes OOP tutorial", errors: "python exceptions try except tutorial",
  stdlib: "python collections heapq bisect deque for coding interviews", recursion: "recursion and big o notation python",
  testing: "python pytest unittest tutorial",
};
function probRow(p, extra = "") {
  return `<tr><td>${link(p)}</td><td>${diffBadge(p.d)}</td>
    <td class="hide-sm muted">${esc(CATS[p.c])}</td><td class="hide-sm"><span class="pill">${lvlName[p.l]}</span></td>
    <td>${statusCell(p)}</td><td class="actions"><button class="btn small ${isDone(p.s) ? "" : "primary"}" data-log="${p.s}">${isDone(p.s) ? "Log again" : "Log"}</button>
    <button class="btn small ghost" data-practice="${p.s}">Code</button>
    <button class="btn small ghost" data-sol="${p.s}">Solution</button>${extra}</td></tr>`;
}
const probTable = (list) => `<div class="table-wrap"><table><tr><th>Problem</th><th>Difficulty</th><th class="hide-sm">Topic</th><th class="hide-sm">Level</th><th>Status</th><th></th></tr>${list.map((p) => probRow(p)).join("")}</table></div>`;

// ---------- logging dialog ----------
function logDialog(slug) {
  const p = PROBLEMS.find((x) => x.s === slug), r = rec(slug) || {};
  const dlg = document.createElement("dialog");
  dlg.innerHTML = `<form method="dialog" class="card" style="margin:0">
    <div class="label">Log attempt</div>
    <h3 style="margin:4px 0 14px">${esc(p.t)} ${diffBadge(p.d)}</h3>
    <p><label>Minutes taken <input id="l-min" type="number" min="1" value="25"></label></p>
    <p><label>How did it go? <select id="l-conf">
      <option value="0">Struggled / needed the solution</option>
      <option value="1" selected>Solved with some effort</option>
      <option value="2">Solved easily</option></select></label></p>
    <p><label>Notes: the trick, your mistakes <textarea id="l-notes" rows="3" placeholder="e.g. hash map of value -> index">${esc(r.notes || "")}</textarea></label></p>
    <div class="row" style="justify-content:flex-end;margin-top:14px"><button class="btn ghost" value="cancel">Cancel</button><button class="btn primary" value="ok">Save attempt</button></div></form>`;
  document.body.appendChild(dlg);
  dlg.addEventListener("close", () => {
    if (dlg.returnValue === "ok") {
      const conf = +$("#l-conf", dlg).value, mins = +$("#l-min", dlg).value || 0;
      const prev = rec(slug);
      let stage = prev ? prev.stage : 0;
      stage = conf === 0 ? 0 : stage + (conf === 2 ? 2 : 1);
      const t = today();
      S.solved[slug] = {
        stage, next: addDays(t, INTERVALS[Math.min(stage, INTERVALS.length - 1)]),
        notes: $("#l-notes", dlg).value, attempts: [...(prev?.attempts || []), { date: t, mins, conf }],
      };
      S.activity[t] = (S.activity[t] || 0) + 1;
      save(); render();
    }
    dlg.remove();
  });
  dlg.showModal();
}

// ---------- views ----------
const views = {
  today() {
    const inc = included(), done = inc.filter((p) => isDone(p.s)).length;
    const wk = currentWeek(), w = WEEKS[wk - 1];
    const wp = weekProblems(w), next = wp.filter((p) => !isDone(p.s)).slice(0, 3);
    const behind = WEEKS.slice(0, wk - 1).flatMap(weekProblems).filter((p) => !isDone(p.s));
    const due = dueReviews();
    const daysLeft = Math.max(0, 84 - dayDiff(S.start, today()));
    const pct = inc.length ? done / inc.length : 0, C = 2 * Math.PI * 52;
    const hr = new Date().getHours(), hello = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    const wkDone = wp.filter((p) => isDone(p.s)).length, st = streak();
    const pyPct = refTotal() ? refDone() / refTotal() : 0, boPct = Object.keys(S.bigo).length / BIGO_QUIZ.length;
    return `<section class="card hero">
      <div style="position:relative;z-index:1">
        <div class="eyebrow">${esc(dateStr)} · Week ${wk} of 12</div>
        <h1>${hello}.</h1>
        <p>This week is <b style="color:var(--text)">${esc(w.title)}</b>. ${next.length ? `You have ${next.length} problem${next.length === 1 ? "" : "s"} queued` : "This week's set is done"}${due.length ? ` and ${due.length} review${due.length === 1 ? "" : "s"} due.` : "."} Aim for about two problems a day.</p>
        <div class="row" style="margin-top:14px">
          ${next.length ? `<button class="btn primary" data-practice="${next[0].s}">Start: ${esc(next[0].t)} &rarr;</button>` : `<button class="btn primary" data-goto-tab="roadmap">Open roadmap &rarr;</button>`}
          ${due.length ? `<button class="btn" data-due="1">Review ${due.length} due</button>` : ""}
        </div>
      </div>
      <div class="ring" title="${done} of ${inc.length} problems solved">
        <svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="10"/>
          <circle class="prog" cx="60" cy="60" r="52" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
        <div class="ring-label"><b>${Math.round(pct * 100)}%</b><span>${done} / ${inc.length} solved</span></div>
      </div>
    </section>
    <div class="grid">
      <div class="card"><div class="label">This week</div><div class="stat">${wkDone}<small> / ${wp.length || "-"}</small></div>
        <div class="bar"><i style="width:${wp.length ? (100 * wkDone / wp.length) | 0 : 0}%"></i></div></div>
      <div class="card"><div class="label">Streak</div><div class="stat">${st}<small> day${st === 1 ? "" : "s"}</small></div><div class="muted">${st ? "Keep it going today" : "Log a problem to start one"}</div></div>
      <div class="card"><div class="label">Reviews due</div><div class="stat">${due.length}</div><div class="muted">Spaced repetition queue</div></div>
      <div class="card"><div class="label">Days left</div><div class="stat">${daysLeft}</div><div class="muted">of 84 in the plan</div></div>
    </div>
    <div class="card">
      <div class="section-head"><h3>Up next · ${esc(w.title)}</h3>${behind.length ? `<span class="badge due">${behind.length} behind from earlier weeks</span>` : ""}</div>
      ${wk === 12 ? mockBlock() : ""}
      ${next.length ? probTable(next) : wk === 12 ? "" : `<div class="empty"><span class="big">&#10003;</span>Week complete. Get ahead from the Roadmap.</div>`}
    </div>
    <div class="cols-2">
      <div class="card">
        <div class="section-head"><h3>Reviews due</h3>${due.length > 5 ? `<button class="btn small ghost" data-due="1">See all ${due.length}</button>` : ""}</div>
        ${due.length ? `<div class="list">${due.slice(0, 5).map((p) => `<div class="li"><div><a class="t" href="https://leetcode.com/problems/${p.s}/" target="_blank" rel="noopener">${esc(p.t)}</a>
          <div class="muted">${esc(CATS[p.c])}</div></div><div class="row">${diffBadge(p.d)}<button class="btn small primary" data-log="${p.s}">Log</button></div></div>`).join("")}</div>`
          : `<div class="empty"><span class="big">&#9788;</span>Nothing due. Problems you log come back here on a spaced schedule.</div>`}
      </div>
      <div class="card">
        <div class="section-head"><h3>Refreshers</h3><button class="btn small ghost" data-goto="refreshers" data-ref="${S.refSel || "py:basics"}">Continue &rarr;</button></div>
        <div class="list">
          <div class="li"><div><span class="t">Python</span><div class="muted">${refDone()} / ${refTotal()} exercises passed</div><div class="bar" style="width:180px"><i style="width:${(pyPct * 100) | 0}%"></i></div></div>
            <button class="btn small" data-goto="refreshers" data-ref="py:basics">Open</button></div>
          ${["java", "cs"].map((lg) => { const t = langTotals(lg), m = LANG_META[lg]; return `<div class="li"><div><span class="t">${m.name}</span><div class="muted">${t.done} / ${t.total} exercises done</div><div class="bar" style="width:180px"><i style="width:${t.total ? (100 * t.done / t.total) | 0 : 0}%"></i></div></div>
            <button class="btn small" data-goto="refreshers" data-ref="${m.prefix}basics">Open</button></div>`; }).join("")}
          ${(() => { const n = SD.filter((d) => S.sdRead?.[d.id]).length; return `<div class="li"><div><span class="t">System design</span><div class="muted">${n} / ${SD.length} topics reviewed</div><div class="bar" style="width:180px"><i style="width:${(100 * n / SD.length) | 0}%"></i></div></div>
            <button class="btn small" data-goto="refreshers" data-ref="sd:framework">Open</button></div>`; })()}
          <div class="li"><div><span class="t">Big-O</span><div class="muted">${Object.keys(S.bigo).length} / ${BIGO_QUIZ.length} quiz questions</div><div class="bar" style="width:180px"><i style="width:${(boPct * 100) | 0}%"></i></div></div>
            <button class="btn small" data-goto="refreshers" data-ref="bigo">Open</button></div>
        </div>
      </div>
    </div>
    <p class="muted" style="text-align:center;margin-top:18px">Give each problem 20-30 minutes before opening the solution. If you needed it, log the attempt as "Struggled" so it comes back tomorrow.</p>`;
  },

  roadmap() {
    const wk = currentWeek();
    return pageHead("Roadmap", "Twelve weeks, one pattern family at a time. The current week is highlighted.") + WEEKS.map((w) => {
      const list = weekProblems(w), done = list.filter((p) => isDone(p.s)).length;
      return `<details class="card week ${w.n === wk ? "current" : ""}" ${w.n === wk ? "open" : ""}>
        <summary><span style="flex:1">Week ${w.n} · ${esc(w.title)}</span>${w.n === wk ? '<span class="badge accent">This week</span>' : ""}<span class="muted" style="font-variant-numeric:tabular-nums">${done}/${list.length}</span></summary>
        <div class="bar" style="margin:8px 0"><i style="width:${list.length ? (100 * done / list.length) | 0 : 0}%"></i></div>
        ${list.length ? probTable(list) : mockBlock()}</details>`;
    }).join("");
  },

  refreshers() {
    const lessonLabel = (l) => l.title.replace(/^\d+\.\s*/, "").split(":")[0];
    const sel = S.refSel || "py:basics";
    const compact = !!S.refCompact, shut = S.refShut || {};
    const initials = (s) => s.split(/\s+/).filter((w) => /\w/.test(w)).map((w) => w[0].toUpperCase()).join("").slice(0, 2);
    // item = [key, label, progress, short label for the compact rail]
    const grp = (title, items) => `<button class="side-h" data-grp="${esc(title)}" title="${shut[title] ? "Expand" : "Collapse"} ${esc(title)}"><span class="lbl">${esc(title)}</span><span class="chev">${shut[title] ? "&#9656;" : "&#9662;"}</span></button>` +
      (shut[title] && !compact ? "" : items.map(([k, label, extra, short]) =>
        `<button class="side-i ${sel === k ? "active" : ""}" data-ref="${k}" title="${esc(label)}"><span class="lbl">${esc(label)}</span><span class="sh">${esc(short || initials(label))}</span>${extra ? `<span class="muted lbl">${extra}</span>` : ""}</button>`).join(""));
    const side = `<button class="side-toggle" id="ref-compact" title="${compact ? "Expand sidebar" : "Compact sidebar"}"><span class="lbl">Compact</span><span>${compact ? "&raquo;" : "&laquo;"}</span></button>`
      + grp("Python", LESSONS.map((l, i) => ["py:" + l.id, lessonLabel(l), `${l.exercises.filter((_, j) => S.ref[l.id + "-" + j]).length}/${l.exercises.length}`, String(i + 1)]))
      + grp("Java", JAVA_LESSONS.map((l, i) => ["j:" + l.id, lessonLabel(l), `${langLessonDone("java", l)}/${l.exercises.length}`, "J" + (i + 1)]))
      + grp("C#", CS_LESSONS.map((l, i) => ["c:" + l.id, lessonLabel(l), `${langLessonDone("cs", l)}/${l.exercises.length}`, "C" + (i + 1)]))
      + grp("Complexity", [["bigo", "Big-O", `${Object.keys(S.bigo).length}/${BIGO_QUIZ.length}`, "O(n)"]])
      + grp("System design", SD.map((d) => ["sd:" + d.id, d.title.replace(/^Design an? /, "").replace(/^Object-oriented design: /, "OOD: ").replace(/^\w/, (c) => c.toUpperCase()),
          d.kind === "case" ? `${sdChecked(d)}/${d.rubric.length}` : (S.sdRead?.[d.id] ? "✓" : ""), d.short]))
      + grp("Data structures", [["ds:overview", "Overview & cheat sheet", "", "≡"], ...DS.map((d) => ["ds:" + d.id, d.name, "", d.short])])
      + grp("DSA patterns", Object.keys(NOTES).map((k) => ["pat:" + k, CATS[k]]))
      + grp("Courses", [["courses", "Full courses", "", "▶"]]);
    let body;
    if (sel.startsWith("py:") && LESSONS.some((l) => l.id === sel.slice(3))) body = refPython(sel.slice(3));
    else if (sel.startsWith("j:") && JAVA_LESSONS.some((l) => l.id === sel.slice(2))) body = refLang("java", sel.slice(2));
    else if (sel.startsWith("c:") && CS_LESSONS.some((l) => l.id === sel.slice(2))) body = refLang("cs", sel.slice(2));
    else if (sel === "bigo") body = refBigo();
    else if (sel.startsWith("sd:") && SD.some((d) => d.id === sel.slice(3))) body = refSD(sel.slice(3));
    else if (sel === "ds:overview") body = refDSOverview();
    else if (sel.startsWith("ds:") && DS.some((d) => d.id === sel.slice(3))) body = refDS(sel.slice(3));
    else if (sel.startsWith("pat:") && NOTES[sel.slice(4)]) body = refPattern(sel.slice(4));
    else if (sel === "courses") body = refCourses();
    else body = refPython("basics");
    return `<div class="ref-layout ${compact ? "compact" : ""}"><aside class="ref-side">${side}</aside><section class="ref-main">${body}</section></div>`;
  },

  solutions() {
    const f = views._sf = views._sf || { cat: "", q: "" };
    const list = PROBLEMS.filter((p) => SOL[p.s] && (!f.cat || p.c === f.cat) && (!f.q || p.t.toLowerCase().includes(f.q.toLowerCase())));
    const cur = PROBLEMS.find((p) => p.s === views._sol);
    let panel = "";
    if (cur) {
      const s = SOL[cur.s], vid = VIDEOS[cur.s];
      panel = `<div class="card"><div class="row between"><div><div class="label">${esc(CATS[cur.c])}</div><h3 style="margin:4px 0 0">${link(cur)} ${diffBadge(cur.d)}</h3></div>
        <div class="row"><button class="btn small" data-log="${cur.s}">Log attempt</button><button class="btn small" data-practice="${cur.s}">Open in Practice</button></div></div>
        ${views._reveal ? `
          ${vid ? `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${vid}" title="${esc(cur.t)} video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`
                : `<p class="muted">No verified video for this one yet.</p>`}
          <p><a class="btn small" href="${videoUrl(cur)}" target="_blank" rel="noopener">${vid ? "Watch on YouTube" : "Search YouTube for videos"}</a></p>
          <p><b>Approach:</b> ${esc(s.a)}</p><p><b>Complexity:</b> ${esc(s.t)}</p>
          <pre>${esc(s.c)}</pre>
          <div class="row"><button class="btn small" data-copy="${cur.s}">Copy code</button><button class="btn small" data-tocode="${cur.s}">Load into editor</button></div>`
        : `<div class="empty"><span class="big">&#128161;</span>Hidden until you're ready.<div style="margin-top:12px"><button class="btn primary" id="reveal">Reveal video &amp; solution</button></div></div>`}</div>`;
    }
    return pageHead(`Solutions <span class="muted">${list.length}</span>`, "Worked Python solutions with video walkthroughs. Try each problem for 20-30 minutes before revealing.") + `${panel}
    <div class="card toolbar">
      ${searchBox("sf-q", f.q)}
      <select id="sf-cat"><option value="">All topics</option>${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${f.cat === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
    <div class="card"><div class="table-wrap"><table><tr><th>Problem</th><th>Difficulty</th><th class="hide-sm">Topic</th><th>Video</th><th></th></tr>
      ${list.map((p) => `<tr><td><b style="font-weight:500">${esc(p.t)}</b></td><td>${diffBadge(p.d)}</td><td class="hide-sm muted">${esc(CATS[p.c])}</td>
        <td>${VIDEOS[p.s] ? '<span class="badge accent">Video</span>' : '<span class="muted">Search</span>'}</td><td class="actions"><button class="btn small ${views._sol === p.s ? "primary" : ""}" data-sol="${p.s}">Open</button></td></tr>`).join("")}</table></div></div>`;
  },

  problems() {
    const f = views._f = views._f || { cat: "", diff: "", status: "", q: "" };
    let list = included().filter((p) =>
      (!f.cat || p.c === f.cat) && (!f.diff || p.d === f.diff) &&
      (!f.q || p.t.toLowerCase().includes(f.q.toLowerCase())) &&
      (!f.status || (f.status === "todo" ? !isDone(p.s) : f.status === "done" ? isDone(p.s) : isDone(p.s) && rec(p.s).next <= today())));
    return pageHead(`Problems <span class="muted">${list.length}</span>`, "Your curated list, filtered to your plan's level. Log every attempt so reviews come back on schedule.") + `
    <div class="card toolbar">
      ${searchBox("f-q", f.q)}
      <select id="f-cat"><option value="">All topics</option>${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${f.cat === k ? "selected" : ""}>${v}</option>`).join("")}</select>
      <select id="f-diff"><option value="">Any difficulty</option>${["E", "M", "H"].map((d) => `<option value="${d}" ${f.diff === d ? "selected" : ""}>${{ E: "Easy", M: "Medium", H: "Hard" }[d]}</option>`).join("")}</select>
      <select id="f-status">${[["", "Any status"], ["todo", "To do"], ["done", "Done"], ["due", "Review due"]].map(([v, l]) => `<option value="${v}" ${f.status === v ? "selected" : ""}>${l}</option>`).join("")}</select>
    </div><div class="card">${probTable(list)}</div>`;
  },

  practice() {
    const sel = views._slug || "";
    const code = S.code[sel] ?? "# Write your Python here. Use print() to see output.\n\n";
    return pageHead("Practice", "A Python editor that runs in your browser, with an interview timer.") + `<div class="card">
      <div class="row between" style="margin-bottom:12px"><div class="row">
        <select id="p-sel"><option value="">Scratchpad</option>${PROBLEMS.map((p) => `<option value="${p.s}" ${p.s === sel ? "selected" : ""}>${esc(p.t)}</option>`).join("")}</select>
        ${sel ? `<a class="btn small ghost" href="https://leetcode.com/problems/${sel}/" target="_blank" rel="noopener">Open on LeetCode &nearr;</a>` : ""}</div>
        <div class="row"><span id="timer" class="timer">00:00</span>
        <button class="btn" id="t-go">Start timer</button><button class="btn" id="t-reset">Reset</button></div></div>
      <textarea id="code" spellcheck="false">${esc(code)}</textarea>
      <div class="row" style="margin-top:8px"><button class="btn primary" id="run">Run</button>
        <span class="muted" id="py-status">Python loads on first run (needs internet, ~10 MB).</span></div>
      <pre id="out"></pre></div>
      <div class="card"><h3 style="margin-top:0">Interview routine</h3><ol>${MOCK_TIPS.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></div>`;
  },

  companies() {
    const tierName = (id) => TIERS.find((t) => t.id === +id).name;
    return pageHead("Companies", "Toronto &amp; Kitchener-Waterloo. Tiers are general guidance, not inside information: check recent postings and interview reports (Glassdoor, Levels.fyi, LeetCode Discuss) for each employer.") + `
    ${TIERS.map((t) => `<div class="card"><div class="row between"><h3 style="margin:0">${esc(t.name)}</h3><span class="pill">${esc(t.bar)} · up to ${lvlName[t.levels]} problems</span></div>
      <p>${esc(t.emphasis)}</p>
      <p><b>Prioritise:</b> ${t.focus.map((c) => `<span class="tag">${esc(CATS[c])}</span>`).join("")}</p>
      <p><b>Examples:</b> ${t.names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</p>
      <button class="btn small" data-setlevel="${t.levels}">Set my plan to this tier (${lvlName[t.levels]} and below)</button></div>`).join("")}
    <div class="card"><h3 style="margin-top:0">My application tracker</h3>
      <div class="row"><input id="c-name" placeholder="Company"><select id="c-tier">${TIERS.map((t) => `<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select>
      <button class="btn primary" id="c-add">Add</button></div>
      ${S.companies.length ? `<table><tr><th>Company</th><th class="hide-sm">Tier</th><th>Status</th><th>Notes</th><th></th></tr>${S.companies.map((c, i) => `<tr>
        <td>${esc(c.name)}</td><td class="hide-sm muted">${esc(tierName(c.tier))}</td>
        <td><select data-cstatus="${i}">${STATUSES.map((s) => `<option ${s === c.status ? "selected" : ""}>${s}</option>`).join("")}</select></td>
        <td><input data-cnote="${i}" value="${esc(c.note)}" placeholder="Interview date, contact..."></td>
        <td><button class="btn small" data-cdel="${i}">Remove</button></td></tr>`).join("")}</table>` : `<p class="muted">Add companies you're applying to.</p>`}</div>`;
  },

  home() { return homeView(); },

  settings() {
    const cur = S.theme || "system";
    const prev = (id) => `<div class="tp" data-theme="${id}"><div class="tp-card"><i class="l1"></i><i class="l2"></i><div class="row2"><i class="acc"></i><i class="ok"></i></div></div></div>`;
    const seg = (attr, val, opts) => `<div class="seg">${opts.map(([v, l]) => `<button ${attr}="${v}" class="${val === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
    return pageHead("Settings", "Appearance, your plan, and backups. Everything is saved in this browser.") + `
      <div class="card">
        <div class="section-head"><h3>Theme</h3><span class="muted">Now showing: ${esc(THEMES.find((t) => t.id === resolvedTheme())?.name || "")}</span></div>
        <div class="theme-grid">${THEMES.map((t) => `<button class="theme-card ${cur === t.id ? "on" : ""}" data-theme-pick="${t.id}">
          <div class="theme-prev">${t.id === "system" ? prev("light") + prev("dark") : prev(t.id)}</div>
          <div class="theme-meta"><span>${esc(t.name)}</span>${cur === t.id ? '<span class="check">&#10003;</span>' : ""}</div>
          <div class="theme-desc">${esc(t.desc)}</div></button>`).join("")}</div>
        <div class="setting"><div><b>Accent color</b><div class="muted">Use the theme's own accent, or pick one.</div></div>
          <div class="swatches"><button class="swatch auto ${!S.accent ? "on" : ""}" data-accent="" title="Theme default"></button>
            ${ACCENTS.map((c) => `<button class="swatch ${S.accent === c ? "on" : ""}" data-accent="${c}" style="background:${c}" title="${c}"></button>`).join("")}</div></div>
        <div class="setting"><div><b>Text size</b><div class="muted">Scales the whole interface.</div></div>
          ${seg("data-fs", S.fontSize || "m", [["s", "Small"], ["m", "Default"], ["l", "Large"]])}</div>
        <div class="setting"><div><b>Density</b><div class="muted">Compact tightens spacing in cards and lists.</div></div>
          ${seg("data-dens", S.density || "comfortable", [["comfortable", "Comfortable"], ["compact", "Compact"]])}</div>
      </div>
      <div class="card"><h3>Your plan</h3>
        ${["cloud", "ai"].map((id) => { const s = trState(id); return `<div class="setting"><div><b>${esc(TRACKS[id].name)} start date</b><div class="muted">${s.start ? `Week ${trackWeek(id)} of ${TRACKS[id].weeks.length}.` : "Not started. Pick a date or start it from the track's Overview."}</div></div>
          <input type="date" data-trstartdate="${id}" value="${s.start || ""}"></div>`; }).join("")}
        <div class="setting"><div><b>DSA start date</b><div class="muted">Week 1 begins on this day. Today is week ${currentWeek()}.</div></div>
          <input type="date" id="s-start" value="${S.start}"></div>
        <div class="setting"><div><b>Problem level</b><div class="muted">Core suits banks and local employers, Mid adds startups, Stretch adds big-tech Hards.</div></div>
          <select id="s-level">${[1, 2, 3].map((l) => `<option value="${l}" ${S.maxLevel === l ? "selected" : ""}>${lvlName[l]} and below (${PROBLEMS.filter((p) => p.l <= l).length})</option>`).join("")}</select></div>
      </div>
      <div class="card"><h3>Backup</h3>
        <div class="setting"><div><b>Your data</b><div class="muted">Progress lives in this browser only. Export now and then so you don't lose it.</div></div>
          <div class="row"><button class="btn" id="s-export">Export</button>
            <label class="btn">Import<input type="file" id="s-import" accept="application/json"></label>
            <button class="btn danger" id="s-reset">Reset everything</button></div></div>
      </div>`;
  },
};

// ---------- refreshers: content for each sidebar item ----------
function refPython(id) {
  const i = LESSONS.findIndex((l) => l.id === id), l = LESSONS[i];
  const done = l.exercises.filter((_, j) => S.ref[l.id + "-" + j]).length;
  return `<h2>${esc(l.title.replace(/^\d+\.\s*/, ""))}</h2>
    <p class="muted">${done} / ${l.exercises.length} exercises passed (${refDone()} / ${refTotal()} across all Python lessons). Your code runs against tests right here; Python loads on first run.</p>
    <div class="card">${l.body}<pre>${esc(l.example)}</pre>
      <div class="row"><button class="btn small" data-example="${i}">Try this example in Practice</button>
      <a class="btn small" href="${yt(LESSON_YT[l.id])}" target="_blank" rel="noopener">More videos</a></div>
      ${vids(EXPLAINERS.python[l.id])}</div>
    ${l.exercises.map((ex, j) => { const eid = l.id + "-" + j; return `<div class="card"><b>Exercise ${j + 1}${S.ref[eid] ? ' <span class="s-solved">passed</span>' : ""}</b>
      <p>${esc(ex.prompt)}</p><textarea id="ex-${eid}" class="ex" rows="${Math.max(5, ex.starter.split("\n").length + 2)}" spellcheck="false">${esc(S.code["ex:" + eid] ?? ex.starter)}</textarea>
      <div class="row"><button class="btn primary small" data-ex="${i}:${j}">Run tests</button><button class="btn small" data-exreset="${i}:${j}">Reset</button></div>
      <pre id="res-${eid}" class="muted" style="display:none"></pre></div>`; }).join("")}
    <div class="row between">${i > 0 ? `<button class="btn" data-ref="py:${LESSONS[i - 1].id}">&larr; Previous</button>` : "<span></span>"}
      ${i < LESSONS.length - 1 ? `<button class="btn primary" data-ref="py:${LESSONS[i + 1].id}">Next lesson &rarr;</button>` : `<button class="btn primary" data-ref="j:basics">Next: Java &rarr;</button>`}</div>`;
}

function refBigo() {
  const bq = views._bq = views._bq || {};
  const solved = BIGO_QUIZ.filter((q) => S.bigo[q.id]).length;
  return `<h2>Big-O</h2>
    <p class="muted">Read the sections, play with the growth calculator, then take the quiz. <a href="${yt("big o notation explained for coding interviews python")}" target="_blank" rel="noopener">More videos</a></p>
    <div class="card"><h3 style="margin-top:0">Watch first</h3>${vids(EXPLAINERS.bigo)}</div>` +
    BIGO_SECTIONS.map((s, i) => `<details class="card" ${i === 0 ? "open" : ""}><summary>${esc(s.title)}</summary>${s.html}</details>`).join("") +
    `<div class="card"><h3 style="margin-top:0">Growth calculator</h3>
      <label>Input size n: <b id="g-n"></b> <input type="range" id="g-slider" min="0" max="6" step="1" value="${views._gi ?? 3}" style="width:240px"></label>
      <div id="g-table"></div>
      <p class="muted">Time assumes about 100 million simple operations per second. Notice how O(n²) is fine at n = 1,000 but hopeless at n = 1,000,000.</p></div>
    <div class="card"><h3 style="margin-top:0">Quiz: what's the complexity? <span class="muted">${solved} / ${BIGO_QUIZ.length} solved</span></h3>
      <p class="muted">Time complexity unless the question says space.</p></div>` +
    BIGO_QUIZ.map((q, i) => {
      const ch = bq[q.id], done = ch !== undefined;
      return `<div class="card"><b>Q${i + 1}</b> ${S.bigo[q.id] ? '<span class="s-solved">solved</span>' : ""}<pre>${esc(q.q)}</pre>
        <div class="row">${BIGO_OPTIONS.map((o) => `<button class="btn small ${done && o === q.a ? "primary" : ""}" data-bq="${q.id}" data-opt="${esc(o)}" ${done ? "disabled" : ""}>${o}</button>`).join("")}</div>
        ${done ? `<p class="${ch === q.a ? "s-solved" : "M"}"><b>${ch === q.a ? "Correct." : "Not quite (you chose " + esc(ch) + "). Answer: " + q.a + "."}</b> ${esc(q.why)}</p><button class="btn small" data-bretry="${q.id}">Try again</button>` : ""}</div>`;
    }).join("");
}

const LANGS = [["py", "Python"], ["java", "Java"], ["cs", "C#"]];
const langSeg = () => `<div class="seg">${LANGS.map(([v, l]) => `<button data-dslang="${v}" class="${(S.dsLang || "py") === v ? "on" : ""}">${l}</button>`).join("")}</div>`;

// Videos card for a data structure: concept videos plus the selected language's videos.
function dsVideos(key, name) {
  const v = DS_VIDEOS[key] || {}, lang = S.dsLang || "py", label = LANGS.find(([k]) => k === lang)[1];
  const search = yt(`${name} ${label === "C#" ? "C# csharp" : label} tutorial`);
  const langList = v[lang] || [];
  return `<div class="card"><div class="section-head"><h3>Videos</h3>${langSeg()}</div>
    ${v.any && v.any.length ? `<div class="label" style="margin-top:4px">Concept (any language)</div>${vids(v.any)}` : ""}
    <div class="label" style="margin-top:8px">In ${label}</div>
    ${langList.length ? vids(langList) : `<p class="muted">No verified ${label} video for this one yet. The concept videos above apply, and the search below finds ${label}-specific ones.</p>`}
    <a class="btn small" href="${search}" target="_blank" rel="noopener">More ${label} videos on YouTube &nearr;</a></div>`;
}

function refDSOverview() {
  return `<h2>Data structures</h2>
    <p class="muted">The structures interviews lean on, with costs and the built-in type in Python, Java and C#. Pick one in the sidebar for code.</p>
    <div class="card"><h3>Cost cheat sheet</h3><div class="table-wrap"><table>
      <tr><th>Structure</th><th>Access</th><th>Search</th><th>Insert</th><th>Delete</th></tr>
      ${DS_OVERVIEW.table.map((r) => `<tr><td><b style="font-weight:500">${esc(r[0])}</b></td>${r.slice(1).map((c) => `<td class="muted">${esc(c)}</td>`).join("")}</tr>`).join("")}
    </table></div><p class="muted">* amortized. "avg" = average case; hash structures degrade to O(n) with heavy collisions.</p></div>
    <div class="card"><h3>Which one should I reach for?</h3><div class="list">
      ${DS_OVERVIEW.choose.map(([need, ds]) => `<div class="li"><span>${esc(need)}</span><span class="badge accent">${esc(ds)}</span></div>`).join("")}</div></div>
    <div class="card"><h3>Built-in types by language</h3><div class="table-wrap"><table>
      <tr><th>Structure</th><th>Python</th><th>Java</th><th>C#</th></tr>
      ${DS.map((d) => `<tr><td><button class="btn small ghost" data-ref="ds:${d.id}">${esc(d.name)}</button></td><td><code>${esc(d.builtin.py)}</code></td><td><code>${esc(d.builtin.java)}</code></td><td><code>${esc(d.builtin.cs)}</code></td></tr>`).join("")}
    </table></div></div>
    ${dsVideos("overview", "data structures full course")}`;
}

function refDS(id) {
  const i = DS.findIndex((d) => d.id === id), d = DS[i], lang = S.dsLang || "py";
  const prevK = i > 0 ? "ds:" + DS[i - 1].id : "ds:overview", nextK = i < DS.length - 1 ? "ds:" + DS[i + 1].id : null;
  return `<div class="label">Data structure</div><h2>${esc(d.name)}</h2>
    <div class="card"><p>${esc(d.what)}</p>
      <h3>Use it when</h3><ul>${d.when.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>
    <div class="cols-2">
      <div class="card"><h3>Operations</h3><table>${d.ops.map(([op, c]) => `<tr><td>${esc(op)}</td><td style="text-align:right"><code>${esc(c)}</code></td></tr>`).join("")}</table></div>
      <div class="card"><h3>Built-in</h3><div class="list">
        ${LANGS.map(([k, l]) => `<div class="li"><span class="t">${l}</span><code>${esc(d.builtin[k])}</code></div>`).join("")}</div>
        <h3>Watch out for</h3><ul>${d.pitfalls.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
    </div>
    <div class="card"><div class="section-head"><h3>Code</h3>${langSeg()}</div>
      <pre>${esc(d.code[lang])}</pre>
      <div class="row">${lang === "py" ? `<button class="btn small primary" data-dsrun="${d.id}">Run in Practice</button>` : `<span class="muted">${lang === "java" ? "Java" : "C#"} snippets are fragments: put statements in a method (C# also allows top-level statements) and keep the imports shown.</span>`}
        <button class="btn small" data-dscopy="${d.id}">Copy</button></div></div>
    ${dsVideos(d.id, d.name.replace(/\s*\(.*\)$/, "") + " data structure")}
    <div class="row between"><button class="btn" data-ref="${prevK}">&larr; Previous</button>${nextK ? `<button class="btn primary" data-ref="${nextK}">Next: ${esc(DS[i + 1].name)} &rarr;</button>` : `<button class="btn primary" data-ref="pat:arrays">Next: DSA patterns &rarr;</button>`}</div>`;
}

function refPattern(k) {
  const n = NOTES[k];
  return `<h2>${esc(CATS[k])}</h2>
    <div class="card"><p><b>Spot it:</b> ${esc(n.spot)}</p><p><b>Approach:</b> ${esc(n.how)}</p><p><b>Complexity:</b> ${esc(n.big)}</p>
      <pre>${esc(n.code)}</pre>
      <div class="row"><button class="btn small" data-probcat="${k}">See ${esc(CATS[k])} problems</button>
      <a class="btn small" href="${yt("neetcode " + CATS[k] + " explained")}" target="_blank" rel="noopener">More videos</a></div>
      ${vids(EXPLAINERS.cats[k])}</div>`;
}

function refCourses() {
  return `<h2>Full courses</h2><p class="muted">Long-form videos you can watch in chunks alongside the plan.</p>
    <div class="card">${vids(EXPLAINERS.general)}${vids(EXPLAINERS.cats.arrays.slice(1))}${vids(EXPLAINERS.cats.graphs.slice(0, 1))}${vids(EXPLAINERS.cats.dp1)}</div>`;
}

function mockBlock() {
  return `<div class="card"><b>Mock interview time.</b> Pick random unsolved or review problems, set a 35-minute timer in Practice, talk out loud, and follow the interview routine. Do 3-4 mocks this week, ideally with a friend or a site like Pramp.</div>`;
}

// ---------- practice: timer + python ----------
let timerId = null, timerSec = 0, pyodide = null;
function fmt(s) { return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); }
async function ensurePy() {
  if (pyodide) return pyodide;
  if (!window.loadPyodide) await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"; s.onload = res; s.onerror = () => rej(new Error("Could not load Pyodide (offline?)"));
    document.head.appendChild(s);
  });
  return (pyodide = await loadPyodide());
}
// Runs code (optionally in a fresh namespace); resolves { out, err } and never throws.
async function execPy(code, fresh) {
  let out = "", err = "";
  try {
    const py = await ensurePy();
    py.setStdout({ batched: (t) => (out += t + "\n") });
    py.setStderr({ batched: (t) => (out += t + "\n") });
    try { await py.runPythonAsync(code, fresh ? { globals: py.globals.get("dict")() } : undefined); }
    catch (e) { err = String(e.message || e).trim().split("\n").filter(Boolean).slice(-1)[0]; }
  } catch (e) { err = e.message; }
  return { out, err };
}
async function runPython() {
  const st = $("#py-status");
  S.code[views._slug || ""] = $("#code").value; save();
  st.textContent = "Running...";
  const { out, err } = await execPy($("#code").value);
  $("#out").textContent = (out + err) || "(no output)"; st.textContent = "Done.";
}
async function runExercise(i, j) {
  const l = LESSONS[i], ex = l.exercises[j], id = l.id + "-" + j;
  const code = $("#ex-" + id).value, res = $("#res-" + id);
  S.code["ex:" + id] = code; save();
  res.style.display = "block"; res.textContent = "Running...";
  const { out, err } = await execPy(code + "\n\n" + ex.tests, true);
  if (err) res.textContent = "Not yet:\n" + err + (out ? "\n\nOutput:\n" + out : "");
  else { S.ref[id] = true; save(); res.textContent = "All tests passed!" + (out ? "\n\nOutput:\n" + out : ""); }
  res.className = err ? "muted" : "s-solved";
  if (!err) { views._open = l.id; setTimeout(() => { const keep = res.textContent; render(); const r = $("#res-" + id); r.style.display = "block"; r.textContent = keep; r.className = "s-solved"; }, 0); }
}
// ---------- system design ----------
const sdChecked = (d) => (d.rubric || []).filter((_, k) => S.sdCheck?.[`${d.id}:${k}`]).length;
let sdDiagramSeq = 0;

// Boxes in columns, with curved arrows from every box to every box in the next column.
function sdDiagram(cols) {
  const NW = 136, NH = 48, CG = 58, RG = 16, PAD = 12, id = "sdarr" + ++sdDiagramSeq;
  const maxRows = Math.max(...cols.map((c) => c.length));
  const H = maxRows * NH + (maxRows - 1) * RG + PAD * 2, W = cols.length * NW + (cols.length - 1) * CG + PAD * 2;
  const pos = cols.map((col, ci) => {
    const total = col.length * NH + (col.length - 1) * RG, y0 = (H - total) / 2;
    return col.map((_, ri) => ({ x: PAD + ci * (NW + CG), y: y0 + ri * (NH + RG) }));
  });
  let edges = "";
  for (let ci = 0; ci < cols.length - 1; ci++) for (const a of pos[ci]) for (const b of pos[ci + 1]) {
    const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x - 3, y2 = b.y + NH / 2, mx = (x1 + x2) / 2;
    edges += `<path d="M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}" fill="none" stroke="currentColor" stroke-width="1.4" marker-end="url(#${id})"/>`;
  }
  const nodes = cols.map((col, ci) => col.map((label, ri) => {
    const p = pos[ci][ri], lines = label.split("\n"), cy = p.y + NH / 2 - (lines.length - 1) * 7.5;
    return `<g class="sd-node${ci === 0 ? " first" : ""}"><rect x="${p.x}" y="${p.y}" width="${NW}" height="${NH}" rx="10"/>
      ${lines.map((ln, k) => `<text x="${p.x + NW / 2}" y="${cy + k * 15}" text-anchor="middle" dominant-baseline="middle">${esc(ln)}</text>`).join("")}</g>`;
  }).join("")).join("");
  return `<div class="sd-diagram"><svg viewBox="0 0 ${W} ${H}" width="${W}" role="img" aria-label="Architecture diagram: ${esc(cols.map((c) => c.join(", ").replace(/\n/g, " ")).join(" then "))}">
    <defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="currentColor"/></marker></defs>
    ${edges}${nodes}</svg></div>`;
}

const SDC_FIELDS = [["dau", "Daily active users"], ["actions", "Writes per user per day"], ["ratio", "Reads per write"], ["size", "Bytes per item"], ["years", "Years retained"], ["peak", "Peak / average"]];
function sdCalcCard() {
  const c = views._sdc = views._sdc || { dau: 10000000, actions: 2, ratio: 10, size: 1000, years: 5, peak: 3 };
  return `<div class="card"><div class="section-head"><h3>Estimate calculator</h3><span class="muted">Change any number</span></div>
    <div class="calc-grid">${SDC_FIELDS.map(([k, l]) => `<label><span class="muted">${l}</span><input type="number" min="0" step="any" data-sdc="${k}" value="${c[k]}"></label>`).join("")}</div>
    <div id="sdc-out" class="grid" style="margin-top:14px"></div></div>`;
}
function sdCalcUpdate() {
  const out = $("#sdc-out"); if (!out) return;
  const c = views._sdc, w = (c.dau * c.actions) / 86400, r = w * c.ratio, perDay = c.dau * c.actions * c.size;
  const num = (n) => n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : n.toFixed(n < 10 ? 1 : 0);
  const bytes = (b) => { const u = ["B", "KB", "MB", "GB", "TB", "PB", "EB"]; let i = 0; while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; } return b.toFixed(b < 10 ? 1 : 0) + " " + u[i]; };
  const tile = (label, val, sub) => `<div class="card"><div class="label">${label}</div><div class="stat">${val}</div><div class="muted">${sub}</div></div>`;
  out.innerHTML = tile("Write QPS", num(w), `~${num(w * c.peak)}/s at peak`) + tile("Read QPS", num(r), `~${num(r * c.peak)}/s at peak`)
    + tile("New data / day", bytes(perDay), `${bytes(perDay * 365)} per year`) + tile(`Storage, ${c.years} yr`, bytes(perDay * 365 * c.years), `~${bytes(perDay * 365 * c.years * 3)} with 3 replicas`)
    + tile("Read bandwidth", bytes(r * c.size) + "/s", `~${bytes(r * c.size * c.peak)}/s at peak`);
}

function refSD(id) {
  const i = SD.findIndex((d) => d.id === id), d = SD[i], read = !!S.sdRead?.[id];
  const shown = views._sdq = views._sdq || {}, revealed = views._sdrev = views._sdrev || {};
  const nav = `<div class="row between">${i > 0 ? `<button class="btn" data-ref="sd:${SD[i - 1].id}">&larr; Previous</button>` : "<span></span>"}
    ${i < SD.length - 1 ? `<button class="btn primary" data-ref="sd:${SD[i + 1].id}">Next: ${esc(SD[i + 1].title)} &rarr;</button>` : `<button class="btn primary" data-ref="ds:overview">Next: Data structures &rarr;</button>`}</div>`;
  const videos = `<div class="card"><div class="section-head"><h3>Videos</h3><a class="btn small" href="${yt("system design " + d.title)}" target="_blank" rel="noopener">More videos &nearr;</a></div>
    ${SD_VIDEOS[id] && SD_VIDEOS[id].length ? vids(SD_VIDEOS[id]) : `<p class="muted">No verified video for this topic yet; the search link finds popular ones.</p>`}</div>`;
  const doneBtn = `<button class="btn ${read ? "" : "primary"}" data-sdread="${id}">${read ? "Reviewed ✓ (undo)" : d.kind === "case" ? "Mark case study done" : "Mark as reviewed"}</button>`;

  if (d.kind === "lesson") {
    return `<div class="label">System design · Fundamentals</div><h2>${esc(d.title)}</h2>
      <div class="card">${d.body}${d.diagram ? sdDiagram(d.diagram) : ""}${d.code ? `<pre>${esc(d.code)}</pre>` : ""}</div>
      ${d.calc ? sdCalcCard() : ""}
      <div class="card"><h3>Check yourself</h3>${d.cards.map(([q, a], k) => { const key = `${id}:${k}`; return `<div class="flash"><div class="row between"><b>${esc(q)}</b>
        <button class="btn small ${shown[key] ? "ghost" : ""}" data-sdq="${key}">${shown[key] ? "Hide" : "Show answer"}</button></div>${shown[key] ? `<p class="flash-a">${esc(a)}</p>` : ""}</div>`; }).join("")}</div>
      ${videos}<div class="row" style="margin-bottom:var(--gap)">${doneBtn}</div>${nav}`;
  }

  const ood = !!d.ood, open = !!revealed[id];
  return `<div class="label">${ood ? "Object-oriented design" : "System design · Case study"}</div><h2>${esc(d.title)}</h2>
    <div class="card"><div class="callout">${esc(d.prompt)}</div>
      <h3>Ask before designing</h3><ul>${d.clarify.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
      <h3>Your design</h3><p class="muted">Spend 20-30 minutes: requirements, estimates, API, data model, a diagram, then the hard parts. Notes save automatically.</p>
      <textarea data-sdnotes="${id}" rows="8" placeholder="Requirements...&#10;Estimates...&#10;API...&#10;Data model...&#10;Components and flow...&#10;Bottlenecks and trade-offs...">${esc(S.code["sd:" + id] || "")}</textarea>
      <div class="row" style="margin-top:10px"><button class="btn ${open ? "" : "primary"}" data-sdreveal="${id}">${open ? "Hide model answer" : "Reveal model answer"}</button></div></div>
    ${open ? `
      <div class="cols-2">
        <div class="card"><h3>Functional requirements</h3><ul>${d.functional.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="card"><h3>Non-functional requirements</h3><ul>${d.nonfunctional.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>
      <div class="card"><h3>${ood ? "Scope" : "Estimates"}</h3><p>${d.estimates}</p></div>
      <div class="card"><h3>${ood ? "Public interface" : "API"}</h3><pre>${esc(d.api)}</pre></div>
      <div class="card"><h3>${ood ? "Core code (Java)" : "Data model"}</h3><pre>${esc(d.data)}</pre></div>
      <div class="card"><h3>${ood ? "Class relationships" : "Architecture"}</h3>${sdDiagram(d.diagram)}</div>
      <div class="card"><h3>Deep dives</h3>${d.deep.map(([h, p]) => `<div class="flash"><b>${esc(h)}</b><p class="flash-a">${esc(p)}</p></div>`).join("")}</div>
      <div class="cols-2">
        <div class="card"><h3>Trade-offs to name</h3><ul>${d.tradeoffs.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="card"><h3>Likely follow-ups</h3><ul>${d.followups.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>` : ""}
    <div class="card"><div class="section-head"><h3>Self-check rubric</h3><span class="badge ${sdChecked(d) === d.rubric.length ? "done" : ""}">${sdChecked(d)} / ${d.rubric.length}</span></div>
      <p class="muted">Tick what your design covered. Revisit the ones you missed in a few days.</p>
      ${d.rubric.map((r, k) => `<label class="check"><input type="checkbox" data-sdcheck="${id}:${k}" ${S.sdCheck?.[`${id}:${k}`] ? "checked" : ""}><span>${esc(r)}</span></label>`).join("")}</div>
    ${videos}<div class="row" style="margin-bottom:var(--gap)">${doneBtn}</div>${nav}`;
}

// ---------- Java / C# refreshers (self-checked exercises) ----------
const LANG_META = {
  java: { name: "Java", lessons: () => JAVA_LESSONS, prefix: "j:", compiler: "https://www.jdoodle.com/online-java-compiler", compilerName: "JDoodle" },
  cs: { name: "C#", lessons: () => CS_LESSONS, prefix: "c:", compiler: "https://dotnetfiddle.net/", compilerName: ".NET Fiddle" },
};
const langKey = (lang, lid, j) => `${lang}:${lid}-${j}`;
const langLessonDone = (lang, l) => l.exercises.filter((_, j) => S.langDone?.[langKey(lang, l.id, j)]).length;
const langTotals = (lang) => {
  const ls = LANG_META[lang].lessons();
  return { done: ls.reduce((n, l) => n + langLessonDone(lang, l), 0), total: ls.reduce((n, l) => n + l.exercises.length, 0) };
};

function refLang(lang, id) {
  const m = LANG_META[lang], ls = m.lessons(), i = ls.findIndex((l) => l.id === id), l = ls[i];
  const shown = views._lsol = views._lsol || {}, tot = langTotals(lang);
  const nextBtn = i < ls.length - 1 ? `<button class="btn primary" data-ref="${m.prefix}${ls[i + 1].id}">Next lesson &rarr;</button>`
    : lang === "java" ? `<button class="btn primary" data-ref="c:basics">Next: C# &rarr;</button>` : `<button class="btn primary" data-ref="bigo">Next: Big-O &rarr;</button>`;
  return `<div class="label">${m.name}</div><h2>${esc(l.title.replace(/^\d+\.\s*/, ""))}</h2>
    <p class="muted">${langLessonDone(lang, l)} / ${l.exercises.length} exercises done here (${tot.done} / ${tot.total} across ${m.name}). ${m.name} can't run inside this page: write your answer, check it against the cases, then compare with the reference solution or run it in <a href="${m.compiler}" target="_blank" rel="noopener">${m.compilerName}</a>.</p>
    <div class="card">${l.body}<pre>${esc(l.example)}</pre>
      <div class="row"><button class="btn small" data-lcopy="${lang}|${l.id}">Copy example</button>
      <a class="btn small" href="${m.compiler}" target="_blank" rel="noopener">Open ${m.compilerName} &nearr;</a>
      <a class="btn small" href="${yt(`${m.name === "C#" ? "C# csharp" : "Java"} ${l.title.replace(/^\d+\.\s*/, "")} tutorial`)}" target="_blank" rel="noopener">More videos</a></div>
      ${vids(LANG_VIDEOS[lang][l.id])}</div>
    ${l.exercises.map((ex, j) => {
      const k = langKey(lang, l.id, j), done = !!S.langDone?.[k];
      return `<div class="card"><div class="section-head"><b>Exercise ${j + 1}</b>${done ? '<span class="badge done">Done</span>' : ""}</div>
        <p>${esc(ex.prompt)}</p>
        <textarea class="lx" data-lx="${k}" rows="${Math.max(6, ex.starter.split("\n").length + 3)}" spellcheck="false">${esc(S.code["lx:" + k] ?? ex.starter)}</textarea>
        <div class="label" style="margin-top:10px">Check your answer against</div>
        <ul>${ex.checks.map((c) => `<li><code>${esc(c)}</code></li>`).join("")}</ul>
        <div class="row"><button class="btn small" data-lsol="${k}">${shown[k] ? "Hide solution" : "Show solution"}</button>
          <button class="btn small ${done ? "" : "primary"}" data-ldone="${k}">${done ? "Mark not done" : "Mark done"}</button>
          <button class="btn small ghost" data-lreset="${k}">Reset</button></div>
        ${shown[k] ? `<pre>${esc(ex.solution)}</pre>` : ""}</div>`;
    }).join("")}
    <div class="row between">${i > 0 ? `<button class="btn" data-ref="${m.prefix}${ls[i - 1].id}">&larr; Previous</button>` : "<span></span>"}${nextBtn}</div>`;
}

const refTotal = () => LESSONS.reduce((n, l) => n + l.exercises.length, 0);
const refDone = () => Object.keys(S.ref).filter((k) => S.ref[k]).length;

// ---------- wiring ----------
const NS = [10, 100, 1e3, 1e4, 1e5, 1e6, 1e7];
function growth() {
  const n = NS[views._gi ?? 3];
  const fact = (k) => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
  const time = (ops) => {
    const s = ops / 1e8;
    if (s < 1e-3) return "instant"; if (s < 1) return (s * 1000).toFixed(0) + " ms"; if (s < 60) return s.toFixed(1) + " s";
    if (s < 3600) return (s / 60).toFixed(0) + " min"; if (s < 86400) return (s / 3600).toFixed(0) + " hours";
    if (s < 3.15e7 * 100) return (s / 3.15e7).toFixed(1) + " years"; return "longer than the universe has existed";
  };
  const big = (x) => (x === Infinity ? "astronomical" : x < 1e6 ? Math.round(x).toLocaleString() : x.toExponential(1));
  const rows = [["O(1)", 1], ["O(log n)", Math.log2(n)], ["O(n)", n], ["O(n log n)", n * Math.log2(n)], ["O(n²)", n * n],
    ["O(2ⁿ)", n > 1000 ? Infinity : 2 ** n], ["O(n!)", n > 170 ? Infinity : fact(n)]];
  $("#g-n").textContent = n.toLocaleString();
  $("#g-table").innerHTML = `<table><tr><th>Complexity</th><th>Operations</th><th>Time</th></tr>${rows.map(([c, o]) =>
    `<tr><td>${c}</td><td>${big(o)}</td><td>${o === Infinity || o > 1e300 ? "never" : time(o)}</td></tr>`).join("")}</table>`;
}

let tab = "home";
function render() {
  const sec = sectionOf(tab);
  if (sec === "cloud" || sec === "ai") $("#view").innerHTML = trackView(sec, tab.split(":")[1]);
  else if (sec === "aws") $("#view").innerHTML = awsView(tab.split(":")[1]);
  else $("#view").innerHTML = (views[tab] || views.home)();
  renderNav();
  if (tab === "refreshers" && S.refSel === "bigo") growth();
  if (tab === "refreshers" && S.refSel === "sd:estimates") sdCalcUpdate();
  if (tab === "practice") {
    $("#timer").textContent = fmt(timerSec);
    $("#t-go").textContent = timerId ? "Pause" : "Start timer";
  }
}
$("#nav").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.track) { const k = b.dataset.track; go(S.lastTab?.[k] || (k === "dsa" ? "today" : k + ":overview")); }
  else if (b.dataset.nav) go(b.dataset.nav);
});
$("#subnav").addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) go(b.dataset.tab); });

document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.log) return logDialog(t.dataset.log);
  if (t.dataset.practice) { views._slug = t.dataset.practice; tab = "practice"; return render(); }
  // appearance
  const tp = t.closest("[data-theme-pick]");
  if (tp) { S.theme = tp.dataset.themePick; save(); applyTheme(); return render(); }
  const ac = t.closest("[data-accent]");
  if (ac) { S.accent = ac.dataset.accent || null; save(); applyTheme(); return render(); }
  if (t.dataset.fs) { S.fontSize = t.dataset.fs; save(); applyTheme(); return render(); }
  if (t.dataset.dens) { S.density = t.dataset.dens; save(); applyTheme(); return render(); }
  if (t.closest("#theme-quick")) { S.theme = LIGHT_THEMES.has(resolvedTheme()) ? "dark" : "light"; save(); applyTheme(); return render(); }
  if (t.closest("#brand")) return go("home");
  if (t.dataset.gotoTab) return go(t.dataset.gotoTab);
  if (t.dataset.due) { views._f = { cat: "", diff: "", status: "due", q: "" }; tab = "problems"; render(); return window.scrollTo(0, 0); }
  if (t.dataset.sdq) { views._sdq = views._sdq || {}; views._sdq[t.dataset.sdq] = !views._sdq[t.dataset.sdq]; const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if (t.dataset.sdreveal) { views._sdrev = views._sdrev || {}; views._sdrev[t.dataset.sdreveal] = !views._sdrev[t.dataset.sdreveal]; const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if (t.dataset.sdread) { S.sdRead = S.sdRead || {}; S.sdRead[t.dataset.sdread] = !S.sdRead[t.dataset.sdread]; save(); const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if (t.dataset.lsol) { views._lsol = views._lsol || {}; views._lsol[t.dataset.lsol] = !views._lsol[t.dataset.lsol]; const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if (t.dataset.ldone) { S.langDone = S.langDone || {}; S.langDone[t.dataset.ldone] = !S.langDone[t.dataset.ldone]; save(); const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if (t.dataset.lreset) { delete S.code["lx:" + t.dataset.lreset]; save(); const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if (t.dataset.lcopy) {
    const [lang, lid] = t.dataset.lcopy.split("|"), l = LANG_META[lang].lessons().find((x) => x.id === lid);
    return navigator.clipboard?.writeText(l.example).then(() => { t.textContent = "Copied!"; }, () => {});
  }
  if (t.dataset.dslang) { S.dsLang = t.dataset.dslang; save(); const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if (t.dataset.dsrun) { views._slug = ""; S.code[""] = DS.find((d) => d.id === t.dataset.dsrun).code.py; save(); tab = "practice"; render(); return window.scrollTo(0, 0); }
  if (t.dataset.dscopy) {
    const d = DS.find((x) => x.id === t.dataset.dscopy);
    return navigator.clipboard?.writeText(d.code[S.dsLang || "py"]).then(() => { t.textContent = "Copied!"; }, () => {});
  }
  if (t.closest("#ref-compact")) { S.refCompact = !S.refCompact; save(); return render(); }
  const gb = t.closest("[data-grp]");
  if (gb) { S.refShut = S.refShut || {}; S.refShut[gb.dataset.grp] = !S.refShut[gb.dataset.grp]; save(); return render(); }
  const rb = t.closest("[data-ref]");
  if (rb) {
    S.refSel = rb.dataset.ref; if (rb.dataset.goto) tab = rb.dataset.goto;
    save(); render(); return window.scrollTo(0, 0);
  }
  if (t.dataset.probcat) { views._f = { cat: t.dataset.probcat, diff: "", status: "", q: "" }; tab = "problems"; render(); return window.scrollTo(0, 0); }
  const vc = t.closest(".vcard");
  if (vc) {
    vc.outerHTML = `<div class="vcard playing"><div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${vc.dataset.vid}?autoplay=1" title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div></div>`;
    return;
  }
  if (t.dataset.bq) {
    const q = BIGO_QUIZ.find((x) => x.id === t.dataset.bq);
    views._bq[q.id] = t.dataset.opt;
    if (t.dataset.opt === q.a) { S.bigo[q.id] = true; save(); }
    const y = window.scrollY; render(); return window.scrollTo(0, y);
  }
  if (t.dataset.bretry) { delete views._bq[t.dataset.bretry]; const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if (t.dataset.sol) { views._sol = t.dataset.sol; views._reveal = false; tab = "solutions"; render(); return window.scrollTo(0, 0); }
  if (t.id === "reveal") { views._reveal = true; return render(); }
  if (t.dataset.copy) { const c = SOL[t.dataset.copy].c; return navigator.clipboard?.writeText(c).then(() => { t.textContent = "Copied!"; }, () => {}); }
  if (t.dataset.tocode) { views._slug = t.dataset.tocode; S.code[t.dataset.tocode] = SOL[t.dataset.tocode].c; save(); tab = "practice"; return render(); }
  if (t.dataset.goto) { tab = t.dataset.goto; return render(); }
  if (t.dataset.example) { views._slug = ""; S.code[""] = LESSONS[+t.dataset.example].example; save(); tab = "practice"; return render(); }
  if (t.dataset.ex) { const [i, j] = t.dataset.ex.split(":").map(Number); return runExercise(i, j); }
  if (t.dataset.exreset) {
    const [i, j] = t.dataset.exreset.split(":").map(Number), id = LESSONS[i].id + "-" + j;
    delete S.code["ex:" + id]; save(); views._open = LESSONS[i].id; return render();
  }
  if (t.dataset.setlevel) { S.maxLevel = +t.dataset.setlevel; save(); return render(); }
  if (t.dataset.cdel) { S.companies.splice(+t.dataset.cdel, 1); save(); return render(); }
  switch (t.id) {
    case "run": return runPython();
    case "t-go":
      if (timerId) { clearInterval(timerId); timerId = null; }
      else timerId = setInterval(() => { timerSec++; const el = $("#timer"); if (el) el.textContent = fmt(timerSec); }, 1000);
      return render();
    case "t-reset": clearInterval(timerId); timerId = null; timerSec = 0; return render();
    case "c-add": {
      const name = $("#c-name").value.trim(); if (!name) return;
      S.companies.push({ name, tier: +$("#c-tier").value, status: "Researching", note: "" }); save(); return render();
    }
    case "s-export": {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: "application/json" }));
      a.download = `dsa-progress-${today()}.json`; a.click(); return;
    }
    case "s-reset": if (confirm("Delete all progress? This cannot be undone.")) { S = { start: today(), maxLevel: 2, solved: {}, companies: [], code: {}, activity: {}, ref: {}, bigo: {} }; save(); render(); } return;
  }
});

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.dataset.sdcheck) { S.sdCheck = S.sdCheck || {}; S.sdCheck[t.dataset.sdcheck] = t.checked; save(); const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if (t.id === "f-cat" || t.id === "f-diff" || t.id === "f-status") { views._f[t.id.slice(2)] = t.value; render(); }
  else if (t.id === "sf-cat") { views._sf.cat = t.value; render(); }
  else if (t.id === "p-sel") { S.code[views._slug || ""] = $("#code").value; save(); views._slug = t.value; render(); }
  else if (t.id === "s-start") { S.start = t.value || today(); save(); }
  else if (t.id === "s-level") { S.maxLevel = +t.value; save(); render(); }
  else if (t.dataset.cstatus) { S.companies[+t.dataset.cstatus].status = t.value; save(); }
  else if (t.dataset.cnote) { S.companies[+t.dataset.cnote].note = t.value; save(); }
  else if (t.id === "s-import" && t.files[0]) {
    t.files[0].text().then((txt) => {
      try { const d = JSON.parse(txt); if (!d.solved) throw 0; S = Object.assign(load(), d); save(); render(); }
      catch (err) { alert("That file isn't a valid progress export."); }
    });
  }
});
document.addEventListener("input", (e) => {
  if (e.target.dataset && e.target.dataset.sdnotes) { S.code["sd:" + e.target.dataset.sdnotes] = e.target.value; save(); return; }
  if (e.target.dataset && e.target.dataset.sdc) { views._sdc[e.target.dataset.sdc] = Math.max(0, +e.target.value || 0); sdCalcUpdate(); return; }
  if (e.target.dataset && e.target.dataset.lx) { S.code["lx:" + e.target.dataset.lx] = e.target.value; save(); return; }
  if (e.target.id === "g-slider") { views._gi = +e.target.value; growth(); }
  if (e.target.id === "sf-q") {
    views._sf.q = e.target.value; const pos = e.target.selectionStart; render();
    const el = $("#sf-q"); el.focus(); el.setSelectionRange(pos, pos);
  }
  if (e.target.id === "f-q") {
    views._f.q = e.target.value; const pos = e.target.selectionStart; render();
    const el = $("#f-q"); el.focus(); el.setSelectionRange(pos, pos);
  }
});

applyTheme();
render();
