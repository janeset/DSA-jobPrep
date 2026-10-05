"use strict";
// Track engine for Cloud Prep and AI/LLM Prep (data in cloud.js / ai.js), plus the Home page.
// Loaded before app.js; it only calls app.js helpers (esc, $, vids, yt, execPy, render, S, save,
// today, dayDiff, streak, included, isDone, refDone...) at event/render time, after app.js has run.

const TRACK_TABS = (id) => [["overview", "Overview"], ["roadmap", "Roadmap"], ["learn", "Learn"], ["questions", "Questions"], ["quiz", "Quiz"], ["labs", TRACKS[id].labsName], ["certs", "Certs"]];
const DSA_TABS = [["today", "Today"], ["roadmap", "Roadmap"], ["refreshers", "Refreshers"], ["problems", "Problems"], ["solutions", "Solutions"], ["practice", "Practice"]];
const CERT_STATUSES = ["Not planned", "Planning", "Studying", "Booked", "Passed"];
const TRACK_ICON = {
  dsa: `<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="18" r="2.2"/><path d="M11 7 7 16M13 7l4 9"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24"><path d="M7 18h10.5a4 4 0 0 0 .4-8A6 6 0 0 0 6.4 9.2 4.5 4.5 0 0 0 7 18z"/></svg>`,
  ai: `<svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>`,
  aws: `<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="M8.5 13 7 21l5-2.5L17 21l-1.5-8"/></svg>`,
};

function sectionOf(t) {
  if (DSA_TABS.some(([k]) => k === t)) return "dsa";
  const m = /^(cloud|ai|aws):/.exec(t);
  return m ? m[1] : null;
}

function trState(id) {
  S.tr = S.tr || {};
  S.tr[id] = Object.assign({ start: null, read: {}, qa: {}, quiz: {}, labs: {}, certs: {}, ex: {}, sel: null }, S.tr[id] || {});
  return S.tr[id];
}
function bump() { const t = today(); S.activity[t] = (S.activity[t] || 0) + 1; }
function trackWeek(id) {
  const st = trState(id), T = TRACKS[id];
  if (!st.start) return 0;
  return Math.min(T.weeks.length, Math.max(1, Math.floor(dayDiff(st.start, today()) / 7) + 1));
}
const labDone = (id, lab) => lab.steps.every((_, k) => trState(id).labs[`${lab.id}:${k}`]);
const labSteps = (id, lab) => lab.steps.filter((_, k) => trState(id).labs[`${lab.id}:${k}`]).length;
function trackProgress(id) {
  const T = TRACKS[id], st = trState(id);
  const read = T.topics.filter((t) => st.read[t.id]).length, labs = T.labs.filter((l) => labDone(id, l)).length;
  const answered = Object.keys(st.quiz).length, correct = Object.values(st.quiz).filter(Boolean).length;
  const got = T.questions.filter((q) => st.qa[q.id] === "got").length;
  const exTotal = T.topics.reduce((n, t) => n + (t.exercises || []).length, 0), exDone = Object.keys(st.ex).filter((k) => st.ex[k]).length;
  const units = T.topics.length + T.labs.length;
  return { read, labs, answered, correct, got, exTotal, exDone, pct: units ? (read + labs) / units : 0 };
}
function ring(pct, label, size = 120) {
  const C = 2 * Math.PI * 52;
  return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="10"/>
    <circle class="prog" cx="60" cy="60" r="52" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
    <div class="ring-label"><b>${Math.round(pct * 100)}%</b><span>${label}</span></div></div>`;
}
const topicById = (T, tid) => T.topics.find((t) => t.id === tid);
const goLearn = (id, tid) => `data-trgo="${id}|learn|${tid}"`;

// ---------------- navigation ----------------
function renderNav() {
  const sec = sectionOf(tab);
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("active", (b.dataset.nav && b.dataset.nav === tab) || (!!b.dataset.track && b.dataset.track === sec)));
  const sub = $("#subnav");
  if (!sub) return;
  if (!sec) { sub.hidden = true; sub.innerHTML = ""; return; }
  const items = sec === "dsa" ? DSA_TABS : sec === "aws" ? AWS_TABS.map(([k, l]) => ["aws:" + k, l]) : TRACK_TABS(sec).map(([k, l]) => [sec + ":" + k, l]);
  sub.hidden = false;
  sub.innerHTML = `<div class="subnav-inner"><span class="subnav-title t-${sec}">${TRACK_ICON[sec]}${sec === "dsa" ? "DSA Prep" : sec === "aws" ? "AWS Certs" : esc(TRACKS[sec].name)}</span>
    <div class="subnav-tabs">${items.map(([k, l]) => `<button data-tab="${k}" class="${k === tab ? "active" : ""}">${esc(l)}</button>`).join("")}</div></div>`;
}
function go(t) {
  tab = t;
  const s = sectionOf(t);
  if (s) { S.lastTab = S.lastTab || {}; S.lastTab[s] = t; save(); }
  render();
  window.scrollTo(0, 0);
}

// ---------------- home ----------------
function homeView() {
  const hr = new Date().getHours(), hello = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
  const dateStr = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const inc = included(), dsaDone = inc.filter((p) => isDone(p.s)).length, dsaWk = currentWeek(), dsaDue = dueReviews().length;
  const nextDsa = weekProblems(WEEKS[dsaWk - 1]).find((p) => !isDone(p.s));
  const st = streak(), todayCount = S.activity[today()] || 0;

  const dsaCard = `<div class="card track-card t-dsa">
      <div class="tc-head"><span class="tc-icon">${TRACK_ICON.dsa}</span><div><h3>DSA Prep</h3><p class="muted">Data structures & algorithms for coding interviews</p></div></div>
      <div class="tc-body">${ring(inc.length ? dsaDone / inc.length : 0, `${dsaDone}/${inc.length} solved`, 104)}
        <div class="tc-meta"><div class="label">Week ${dsaWk} of 12</div><div>${esc(WEEKS[dsaWk - 1].title)}</div>
          ${nextDsa ? `<div class="muted">Next: ${esc(nextDsa.t)}</div>` : ""}${dsaDue ? `<span class="badge due">${dsaDue} review${dsaDue === 1 ? "" : "s"} due</span>` : ""}</div></div>
      <div class="row"><button class="btn primary" data-track-go="dsa">Continue &rarr;</button><button class="btn ghost" data-nav-go="refreshers">Refreshers</button></div></div>`;

  const trackCard = (id) => {
    const T = TRACKS[id], s = trState(id), p = trackProgress(id), wk = trackWeek(id);
    const w = wk ? T.weeks[wk - 1] : T.weeks[0];
    const nextTopic = w.topics.map((t) => topicById(T, t)).find((t) => !s.read[t.id]);
    return `<div class="card track-card t-${id}">
      <div class="tc-head"><span class="tc-icon">${TRACK_ICON[id]}</span><div><h3>${esc(T.name)}</h3><p class="muted">${esc(T.tagline)}</p></div></div>
      <div class="tc-body">${ring(p.pct, `${p.read + p.labs}/${T.topics.length + T.labs.length} done`, 104)}
        <div class="tc-meta"><div class="label">${wk ? `Week ${wk} of ${T.weeks.length}` : "Not started"}</div><div>${esc(w.title)}</div>
          ${nextTopic ? `<div class="muted">Next: ${esc(nextTopic.title)}</div>` : ""}
          ${p.answered ? `<span class="badge plain">Quiz ${Math.round(100 * p.correct / p.answered)}%</span>` : ""}</div></div>
      <div class="row">${s.start ? `<button class="btn primary" data-track-go="${id}">Continue &rarr;</button>` : `<button class="btn primary" data-trstart="${id}">Start this track</button><button class="btn ghost" data-track-go="${id}">Explore</button>`}</div></div>`;
  };

  return `<section class="card hero home-hero">
      <div style="position:relative;z-index:1">
        <div class="eyebrow">${esc(dateStr)} · Toronto &amp; Kitchener-Waterloo</div>
        <h1>${hello}.</h1>
        <p>Three prep tracks for software roles: algorithms for coding rounds, cloud for the infrastructure questions, and AI/LLM engineering for the new wave of roles. Pick up wherever you left off.</p>
        <div class="row" style="margin-top:14px">
          <span class="badge plain">&#128293; ${st} day streak</span><span class="badge plain">${todayCount} thing${todayCount === 1 ? "" : "s"} done today</span>
        </div>
      </div>
    </section>
    <div class="track-grid">${dsaCard}${trackCard("cloud")}${trackCard("ai")}${awsHomeCard()}</div>
    <div class="cols-2">
      <div class="card"><h3>A sustainable weekly rhythm</h3>
        <table><tr><th>Day</th><th>Focus</th></tr>
          <tr><td>Mon / Wed / Fri</td><td>DSA: 2 problems + reviews (60-90 min)</td></tr>
          <tr><td>Tue / Thu</td><td>Cloud: one lesson + quiz, lab work (45-60 min)</td></tr>
          <tr><td>Sat</td><td>AI/LLM: one lesson + exercises, project work (60-90 min)</td></tr>
          <tr><td>Sun</td><td>Light review: flashcards, question bank, plan the week</td></tr></table>
        <p class="muted">Daily DSA reviews take 10 minutes and keep spaced repetition working even on cloud and AI days.</p></div>
      <div class="card"><h3>Suggested 12-week phasing</h3><div class="list">
        <div class="li"><div><span class="t">Weeks 1-4</span><div class="muted">DSA weeks 1-4 + Python refresher, Cloud weeks 1-3 (fundamentals, identity, storage)</div></div></div>
        <div class="li"><div><span class="t">Weeks 5-8</span><div class="muted">DSA continues, Cloud weeks 4-8 with labs, start AI weeks 1-3</div></div></div>
        <div class="li"><div><span class="t">Weeks 9-12</span><div class="muted">DSA mocks, AI weeks 4-8 with projects, one cloud or AI certification, resume polish</div></div></div>
      </div><p class="muted">Applying to banks and insurers? Lean Azure. Startups and mid-size tech? Lean AWS. Both value the AI projects.</p></div>
    </div>`;
}

function awsHomeCard() {
  const rows = AWS_EXAMS.map((e) => { const r = readiness(e); return `<div class="li"><div><span class="t">${esc(e.code)}</span><div class="muted">${esc(e.level)} · best ${r.best ? r.best + "%" : "-"}</div></div>
    <div class="bar" style="width:70px;margin:0"><i style="width:${Math.round(r.pct * 100)}%"></i></div></div>`; }).join("");
  return `<div class="card track-card t-aws">
    <div class="tc-head"><span class="tc-icon">${TRACK_ICON.aws}</span><div><h3>AWS Certs</h3><p class="muted">Exam prep for CLF, SAA, AI Practitioner and GenAI Developer Pro</p></div></div>
    <div class="list">${rows}</div>
    <div class="row"><button class="btn primary" data-track-go="aws">Continue &rarr;</button></div></div>`;
}

// ---------------- track pages ----------------
function trackView(id, sub) {
  const T = TRACKS[id], st = trState(id);
  switch (sub) {
    case "roadmap": return trRoadmap(T, st);
    case "learn": return trLearn(T, st);
    case "questions": return trQuestions(T, st);
    case "quiz": return trQuiz(T, st);
    case "labs": return trLabs(T, st);
    case "certs": return trCerts(T, st);
    default: return trOverview(T, st);
  }
}

function topicRow(T, st, tid) {
  const t = topicById(T, tid);
  return `<div class="li"><div><span class="t">${esc(t.title)}</span>${t.exercises ? `<div class="muted">${t.exercises.length} coding exercise${t.exercises.length === 1 ? "" : "s"}</div>` : ""}</div>
    <div class="row">${st.read[tid] ? '<span class="badge done">Reviewed</span>' : '<span class="badge">To do</span>'}<button class="btn small" ${goLearn(T.id, tid)}>Open</button></div></div>`;
}
function labRow(T, lab) {
  const n = labSteps(T.id, lab);
  return `<div class="li"><div><span class="t">${esc(lab.title)}</span><div class="muted">${esc(T.labsName.slice(0, -1))} · ${esc(lab.level)} · ${esc(lab.time)}</div></div>
    <div class="row"><span class="badge ${n === lab.steps.length ? "done" : ""}">${n}/${lab.steps.length} steps</span><button class="btn small" data-trgo="${T.id}|labs|${lab.id}">Open</button></div></div>`;
}

function trOverview(T, st) {
  const id = T.id, p = trackProgress(id), wk = trackWeek(id), w = wk ? T.weeks[wk - 1] : T.weeks[0];
  const nextTopic = w.topics.map((t) => topicById(T, t)).find((t) => !st.read[t.id]) || T.topics.find((t) => !st.read[t.id]);
  return `<section class="card hero t-${id}">
      <div style="position:relative;z-index:1">
        <div class="eyebrow">${wk ? `Week ${wk} of ${T.weeks.length}` : "Not started yet"}</div>
        <h1>${esc(T.name)}</h1>
        <p>${esc(T.tagline)}. ${wk ? `This week: <b style="color:var(--text)">${esc(w.title)}</b>.` : `An ${T.weeks.length}-week plan you can run alongside DSA.`}</p>
        <div class="row" style="margin-top:14px">
          ${st.start ? (nextTopic ? `<button class="btn primary" ${goLearn(id, nextTopic.id)}>Continue: ${esc(nextTopic.title)} &rarr;</button>` : `<button class="btn primary" data-trgo="${id}|quiz|">Take a quiz &rarr;</button>`)
            : `<button class="btn primary" data-trstart="${id}">Start the ${T.weeks.length}-week plan</button>`}
          <button class="btn" data-trgo="${id}|roadmap|">View roadmap</button>
        </div>
      </div>
      ${ring(p.pct, `${p.read + p.labs}/${T.topics.length + T.labs.length} done`)}
    </section>
    <div class="grid">
      <div class="card"><div class="label">Topics reviewed</div><div class="stat">${p.read}<small> / ${T.topics.length}</small></div><div class="bar"><i style="width:${(100 * p.read / T.topics.length) | 0}%"></i></div></div>
      <div class="card"><div class="label">Questions mastered</div><div class="stat">${p.got}<small> / ${T.questions.length}</small></div><div class="muted">Interview question bank</div></div>
      <div class="card"><div class="label">Quiz accuracy</div><div class="stat">${p.answered ? Math.round(100 * p.correct / p.answered) + "%" : "-"}</div><div class="muted">${p.answered} answered</div></div>
      <div class="card"><div class="label">${esc(T.labsName)} completed</div><div class="stat">${p.labs}<small> / ${T.labs.length}</small></div><div class="muted">${p.exTotal ? `${p.exDone}/${p.exTotal} coding exercises` : "Resume-ready hands-on work"}</div></div>
    </div>
    <div class="cols-2">
      <div class="card"><div class="section-head"><h3>${wk ? "This week" : "Week 1 preview"} · ${esc(w.title)}</h3></div>
        <p class="muted">${esc(w.goal)}</p>
        <div class="list">${w.topics.map((t) => topicRow(T, st, t)).join("")}${w.labs.map((l) => labRow(T, T.labs.find((x) => x.id === l))).join("")}
          ${!w.topics.length && !w.labs.length ? `<div class="li"><span>Review week: quizzes, the question bank and certification prep.</span><button class="btn small" data-trgo="${id}|quiz|">Quiz</button></div>` : ""}</div></div>
      <div class="card"><div class="section-head"><h3>Certifications</h3><button class="btn small ghost" data-trgo="${id}|certs|">All certs &rarr;</button></div>
        <div class="list">${T.certs.map((c) => `<div class="li"><div><span class="t">${esc(c.code)}</span><div class="muted">${esc(c.name)}</div></div><span class="badge ${st.certs[c.id]?.status === "Passed" ? "done" : "plain"}">${esc(st.certs[c.id]?.status || "Not planned")}</span></div>`).join("")}</div></div>
    </div>
    <div class="card"><h3>Full courses</h3>${vids(T.videos.courses)}</div>`;
}

function trRoadmap(T, st) {
  const wk = trackWeek(T.id);
  return pageHead(`${esc(T.name)} roadmap`, `${T.weeks.length} weeks. ${st.start ? `Started ${st.start}; change the date in Settings.` : "Start the plan from the Overview to track your current week."}`) +
    T.weeks.map((w) => {
      const done = w.topics.filter((t) => st.read[t]).length + w.labs.filter((l) => labDone(T.id, T.labs.find((x) => x.id === l))).length, total = w.topics.length + w.labs.length;
      return `<details class="card week ${w.n === wk ? "current" : ""}" ${w.n === wk || (!wk && w.n === 1) ? "open" : ""}>
        <summary><span style="flex:1">Week ${w.n} · ${esc(w.title)}</span>${w.n === wk ? '<span class="badge accent">This week</span>' : ""}<span class="muted">${total ? `${done}/${total}` : "review"}</span></summary>
        <p class="muted">${esc(w.goal)}</p>
        <div class="list">${w.topics.map((t) => topicRow(T, st, t)).join("")}${w.labs.map((l) => labRow(T, T.labs.find((x) => x.id === l))).join("")}
          ${!total ? `<div class="li"><span>Take full quizzes for your target exam and drill the question bank.</span><div class="row"><button class="btn small" data-trgo="${T.id}|quiz|">Quiz</button><button class="btn small" data-trgo="${T.id}|questions|">Questions</button></div></div>` : ""}</div></details>`;
    }).join("");
}

// ---------------- learn ----------------
function trLearn(T, st) {
  const id = T.id, sel = st.sel && (st.sel === "courses" || st.sel === "glossary" || topicById(T, st.sel)) ? st.sel : T.topics[0].id;
  const side = T.groups.map(([g, tids]) => `<div class="side-h" style="cursor:default">${esc(g)}</div>` + tids.map((tid) => {
    const t = topicById(T, tid);
    return `<button class="side-i ${sel === tid ? "active" : ""}" data-trsel="${id}|${tid}"><span class="lbl">${esc(t.title)}</span><span class="muted lbl">${st.read[tid] ? "✓" : ""}</span></button>`;
  }).join("")).join("") + `<div class="side-h" style="cursor:default">Reference</div>
    ${T.glossary && T.glossary.length ? `<button class="side-i ${sel === "glossary" ? "active" : ""}" data-trsel="${id}|glossary"><span class="lbl">Glossary</span><span class="muted lbl">${T.glossary.length}</span></button>` : ""}
    <button class="side-i ${sel === "courses" ? "active" : ""}" data-trsel="${id}|courses"><span class="lbl">Full courses</span></button>`;
  const body = sel === "courses" ? `<h2>Full courses</h2><p class="muted">Long-form videos to watch in chunks alongside the plan.</p><div class="card">${vids(T.videos.courses)}</div>`
    : sel === "glossary" ? trGlossary(T) : trTopic(T, st, sel);
  return `<div class="ref-layout"><aside class="ref-side">${side}</aside><section class="ref-main">${body}</section></div>`;
}

function trGlossary(T) {
  const q = ((views._trgl = views._trgl || {})[T.id] || "").toLowerCase();
  const list = T.glossary.filter(([term, def]) => !q || term.toLowerCase().includes(q) || def.toLowerCase().includes(q));
  return `<h2>Glossary <span class="muted">${list.length}</span></h2><p class="muted">Key terms in one line each. Great for a last review before an interview or exam.</p>
    <div class="card toolbar"><label class="search">${ICON_SEARCH}<input data-trgl="${T.id}" placeholder="Search terms..." value="${esc(views._trgl[T.id] || "")}" autocomplete="off"></label></div>
    <div class="card"><dl class="gloss">${list.map(([term, def]) => `<dt>${esc(term)}</dt><dd>${esc(def)}</dd>`).join("") || '<p class="muted">No matching terms.</p>'}</dl></div>`;
}

function trTopic(T, st, tid) {
  const id = T.id, i = T.topics.findIndex((t) => t.id === tid), t = T.topics[i];
  const group = (T.groups.find(([, ids]) => ids.includes(tid)) || [""])[0], shown = views._trq = views._trq || {};
  const mapTable = t.map ? `<div class="card"><h3>AWS vs Azure</h3><div class="table-wrap"><table><tr><th>Concept</th><th>AWS</th><th>Azure</th></tr>
    ${t.map.map(([c, a, z]) => `<tr><td>${esc(c)}</td><td><b style="font-weight:500">${esc(a)}</b></td><td><b style="font-weight:500">${esc(z)}</b></td></tr>`).join("")}</table></div></div>` : "";
  const codes = (t.code || []).map((c, k) => `<div class="card"><div class="section-head"><h3>${esc(c.label)}</h3><button class="btn small" data-trcopy="${id}|${tid}|${k}">Copy</button></div><pre>${esc(c.code)}</pre></div>`).join("");
  const exercises = (t.exercises || []).map((ex, j) => {
    const key = `${id}:${tid}-${j}`, rid = `trres-${id}-${tid}-${j}`;
    return `<div class="card"><b>Exercise ${j + 1}${st.ex[key] ? ' <span class="s-solved">passed</span>' : ""}</b><p>${esc(ex.prompt)}</p>
      <textarea data-trcode="${id}|${tid}|${j}" rows="${Math.max(6, ex.starter.split("\n").length + 3)}" spellcheck="false">${esc(S.code["tx:" + key] ?? ex.starter)}</textarea>
      <div class="row"><button class="btn primary small" data-trex="${id}|${tid}|${j}">Run tests</button><button class="btn small" data-trexreset="${id}|${tid}|${j}">Reset</button></div>
      <pre id="${rid}" class="muted" style="display:none"></pre></div>`;
  }).join("");
  const vlist = T.videos[tid] || [];
  const read = !!st.read[tid];
  return `<div class="label">${esc(group)}</div><h2>${esc(t.title)}</h2>
    <div class="card">${t.body}</div>${mapTable}${codes}
    ${exercises ? `<div class="label" style="margin:6px 0 8px">Coding exercises (run in your browser)</div>${exercises}` : ""}
    <div class="card"><h3>Check yourself</h3>${t.cards.map(([q, a], k) => { const key = `${id}:${tid}:${k}`; return `<div class="flash"><div class="row between"><b>${esc(q)}</b>
      <button class="btn small ${shown[key] ? "ghost" : ""}" data-trq="${key}">${shown[key] ? "Hide" : "Show answer"}</button></div>${shown[key] ? `<p class="flash-a">${esc(a)}</p>` : ""}</div>`; }).join("")}</div>
    <div class="card"><div class="section-head"><h3>Videos</h3><a class="btn small" href="${yt(t.title + (id === "cloud" ? " AWS Azure explained" : " LLM explained"))}" target="_blank" rel="noopener">More videos &nearr;</a></div>
      ${vlist.length ? vids(vlist) : `<p class="muted">No verified video for this topic yet; the search link finds popular ones. The full courses cover it too.</p>`}</div>
    <div class="row" style="margin-bottom:var(--gap)"><button class="btn ${read ? "" : "primary"}" data-trread="${id}|${tid}">${read ? "Reviewed ✓ (undo)" : "Mark as reviewed"}</button>
      <button class="btn ghost" data-trgo="${id}|questions|${tid}">Interview questions on this</button><button class="btn ghost" data-trgo="${id}|quiz|${tid}">Quiz on this</button></div>
    <div class="row between">${i > 0 ? `<button class="btn" data-trsel="${id}|${T.topics[i - 1].id}">&larr; ${esc(T.topics[i - 1].title)}</button>` : "<span></span>"}
      ${i < T.topics.length - 1 ? `<button class="btn primary" data-trsel="${id}|${T.topics[i + 1].id}">${esc(T.topics[i + 1].title)} &rarr;</button>` : `<button class="btn primary" data-trgo="${id}|quiz|">Take a quiz &rarr;</button>`}</div>`;
}

// ---------------- questions ----------------
function trQuestions(T, st) {
  const id = T.id, f = (views._trqf = views._trqf || {})[id] = (views._trqf[id] || { topic: "", status: "" });
  const shown = views._tra = views._tra || {};
  const list = T.questions.filter((q) => (!f.topic || q.topic === f.topic) && (!f.status || (f.status === "new" ? !st.qa[q.id] : st.qa[q.id] === f.status)));
  const got = T.questions.filter((q) => st.qa[q.id] === "got").length, rev = T.questions.filter((q) => st.qa[q.id] === "review").length;
  return pageHead(`Interview questions <span class="muted">${list.length}</span>`, "Say your answer out loud first (or write it down), then reveal the model answer and mark how you did.") +
    `<div class="card toolbar">
      <select data-trqf="${id}|topic"><option value="">All topics</option>${T.topics.map((t) => `<option value="${t.id}" ${f.topic === t.id ? "selected" : ""}>${esc(t.title)}</option>`).join("")}</select>
      <select data-trqf="${id}|status">${[["", "Any status"], ["new", "Not tried"], ["review", "Review again"], ["got", "Got it"]].map(([v, l]) => `<option value="${v}" ${f.status === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <span class="muted">${got} got it · ${rev} to review · ${T.questions.length - got - rev} not tried</span></div>` +
    (list.length ? list.map((q) => {
      const key = `${id}:${q.id}`, s = st.qa[q.id];
      return `<div class="card"><div class="section-head"><span class="label">${esc(topicById(T, q.topic).title)}</span>${s === "got" ? '<span class="badge done">Got it</span>' : s === "review" ? '<span class="badge due">Review again</span>' : ""}</div>
        <p style="font-weight:600;font-size:1.02rem;margin-top:0">${esc(q.q)}</p>
        ${shown[key] ? `<div class="callout">${esc(q.a)}</div>` : ""}
        <div class="row" style="margin-top:12px"><button class="btn small ${shown[key] ? "ghost" : ""}" data-trshow="${key}">${shown[key] ? "Hide answer" : "Show model answer"}</button>
          <button class="btn small ${s === "got" ? "primary" : ""}" data-trqa="${id}|${q.id}|got">Got it</button>
          <button class="btn small" data-trqa="${id}|${q.id}|review">Review again</button></div></div>`;
    }).join("") : `<div class="card empty">No questions match these filters.</div>`);
}

// ---------------- quiz ----------------
function trQuiz(T, st) {
  const id = T.id, f = (views._tqf = views._tqf || {})[id] = (views._tqf[id] || { tag: "", topic: "" });
  const pool = T.quiz.filter((q) => (!f.tag || q.tags.includes(f.tag)) && (!f.topic || q.topic === f.topic));
  const set = (views._tqs = views._tqs || {})[id], chosen = (views._tqa = views._tqa || {})[id] = views._tqa[id] || {};
  const qs = set ? set.map((qid) => T.quiz.find((q) => q.id === qid)).filter(Boolean) : pool;
  const answered = qs.filter((q) => chosen[q.id] !== undefined), right = answered.filter((q) => chosen[q.id] === q.answer).length;
  const tags = [...new Set(T.quiz.flatMap((q) => q.tags))];
  const certName = (tag) => (T.certs.find((c) => c.tag === tag) || {}).code || tag;
  return pageHead("Practice quiz", "Exam-style multiple choice. Filter by certification or topic, or take a random 10-question set.") +
    `<div class="card toolbar">
      <select data-tqf="${id}|tag"><option value="">All exams</option>${tags.map((t) => `<option value="${t}" ${f.tag === t ? "selected" : ""}>${esc(certName(t))}</option>`).join("")}</select>
      <select data-tqf="${id}|topic"><option value="">All topics</option>${T.topics.map((t) => `<option value="${t.id}" ${f.topic === t.id ? "selected" : ""}>${esc(t.title)}</option>`).join("")}</select>
      <button class="btn primary" data-tqnew="${id}">Random 10</button>${set ? `<button class="btn" data-tqall="${id}">Show all ${pool.length}</button>` : ""}
      <button class="btn ghost" data-tqreset="${id}">Clear answers</button></div>
    <div class="card row between"><div><b>${set ? "Random set" : "All matching questions"}:</b> ${answered.length}/${qs.length} answered${answered.length ? `, <b>${Math.round(100 * right / answered.length)}%</b> correct` : ""}</div>
      ${answered.length === qs.length && qs.length ? `<span class="badge ${right / qs.length >= 0.7 ? "done" : "due"}">${right / qs.length >= 0.7 ? "Passing range" : "Keep practicing"}</span>` : ""}</div>` +
    (qs.length ? qs.map((q, n) => {
      const c = chosen[q.id], done = c !== undefined;
      return `<div class="card"><div class="section-head"><span class="label">Q${n + 1} · ${esc(topicById(T, q.topic).title)}</span><span class="row">${q.tags.map((t) => `<span class="tag">${esc(certName(t))}</span>`).join("")}</span></div>
        <p style="font-weight:600;margin-top:0">${esc(q.q)}</p>
        <div class="quiz-opts">${q.options.map((o, k) => `<button class="quiz-opt ${done ? (k === q.answer ? "right" : k === c ? "wrong" : "") : ""}" data-tq="${id}|${q.id}|${k}" ${done ? "disabled" : ""}><span class="qk">${"ABCD"[k]}</span>${esc(o)}</button>`).join("")}</div>
        ${done ? `<p class="${c === q.answer ? "s-solved" : "M"}" style="margin-top:12px"><b>${c === q.answer ? "Correct." : "Not quite."}</b> <span style="color:var(--text);font-weight:400">${esc(q.why)}</span></p>` : ""}</div>`;
    }).join("") : `<div class="card empty">No questions match these filters.</div>`);
}

// ---------------- labs ----------------
function trLabs(T, st) {
  const id = T.id, focus = views._trlab;
  return pageHead(esc(T.labsName), "Hands-on work to put on your resume. Tick steps as you go; each one has a ready-made resume bullet.") +
    T.labs.map((l) => {
      const n = labSteps(id, l), all = n === l.steps.length;
      return `<div class="card lab ${focus === l.id ? "focus" : ""}" id="lab-${l.id}">
        <div class="section-head"><h3>${esc(l.title)}</h3><span class="badge ${all ? "done" : ""}">${n}/${l.steps.length} steps</span></div>
        <div class="row" style="margin-bottom:10px"><span class="pill">${esc(l.level)}</span><span class="pill">${esc(l.time)}</span>${l.stack.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div>
        <p>${esc(l.goal)}</p>
        <div class="bar" style="margin-bottom:10px"><i style="width:${(100 * n / l.steps.length) | 0}%"></i></div>
        ${l.steps.map((s, k) => `<label class="check"><input type="checkbox" data-trlab="${id}|${l.id}|${k}" ${st.labs[`${l.id}:${k}`] ? "checked" : ""}><span>${esc(s)}</span></label>`).join("")}
        <div class="callout" style="margin-top:12px"><b>Cost &amp; safety:</b> ${esc(l.cost)}</div>
        <h3>Resume bullet</h3><div class="row between resume"><p style="margin:0;flex:1">${esc(l.resume)}</p><button class="btn small" data-trres="${id}|${l.id}">Copy</button></div>
        <h3>Stretch goals</h3><ul>${l.stretch.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>`;
    }).join("");
}

// ---------------- certs ----------------
function trCerts(T, st) {
  const id = T.id;
  return pageHead("Certifications", "Pick one that matches your target employers. Exam codes and content change, so always confirm details on the official page before booking.") +
    `<div class="track-grid">${T.certs.map((c) => {
      const s = st.certs[c.id] || {};
      return `<div class="card cert"><div class="section-head"><span class="badge accent">${esc(c.provider)} · ${esc(c.level)}</span><b class="cert-code">${esc(c.code)}</b></div>
        <h3 style="margin-top:6px">${esc(c.name)}</h3><p class="muted">${esc(c.why)}</p>
        <div class="label" style="margin-top:10px">Covered in Learn</div><div>${c.topics.map((tid) => `<button class="tag tag-btn" ${goLearn(id, tid)}>${esc(topicById(T, tid).title)}</button>`).join("")}</div>
        <div class="row" style="margin-top:12px"><select data-trcert="${id}|${c.id}">${CERT_STATUSES.map((v) => `<option ${v === (s.status || "Not planned") ? "selected" : ""}>${v}</option>`).join("")}</select>
          <input type="date" data-trcertdate="${id}|${c.id}" value="${esc(s.date || "")}" title="Exam date"></div>
        <div class="row" style="margin-top:12px">${AWS_EXAMS.some((x) => x.code === c.code) ? `<button class="btn small primary" data-awsgo="${AWS_EXAMS.find((x) => x.code === c.code).id}">Open exam prep &rarr;</button>` : ""}
          ${T.quiz.some((q) => q.tags.includes(c.tag)) ? `<button class="btn small ${AWS_EXAMS.some((x) => x.code === c.code) ? "" : "primary"}" data-tqtag="${id}|${c.tag}">Practice questions</button>` : ""}
          <a class="btn small ghost" href="${c.link}" target="_blank" rel="noopener">Official page &nearr;</a></div></div>`;
    }).join("")}</div>
    <div class="card"><h3>Full certification courses</h3>${vids(T.videos.courses)}</div>`;
}

// ---------------- running AI exercises ----------------
async function runTrackExercise(id, tid, j) {
  const t = topicById(TRACKS[id], tid), ex = t.exercises[j], key = `${id}:${tid}-${j}`, rid = `trres-${id}-${tid}-${j}`;
  const code = document.querySelector(`[data-trcode="${id}|${tid}|${j}"]`).value;
  S.code["tx:" + key] = code; save();
  const res = document.getElementById(rid);
  res.style.display = "block"; res.className = "muted"; res.textContent = "Running... (Python loads on first run)";
  const { out, err } = await execPy(code + "\n\n" + ex.tests, true);
  if (err) { res.textContent = "Not yet:\n" + err + (out ? "\n\nOutput:\n" + out : ""); res.className = "M"; return; }
  const st = trState(id);
  if (!st.ex[key]) bump();
  st.ex[key] = true; save();
  const y = window.scrollY; render(); window.scrollTo(0, y);
  const r = document.getElementById(rid); r.style.display = "block"; r.className = "s-solved"; r.textContent = "All tests passed!" + (out ? "\n\nOutput:\n" + out : "");
}

// ---------------- events ----------------
document.addEventListener("click", (e) => {
  const t = e.target;
  const el = (sel) => t.closest(sel);
  let b;
  if ((b = el("[data-track-go]"))) { const k = b.dataset.trackGo; return go(S.lastTab?.[k] || (k === "dsa" ? "today" : k + ":overview")); }
  if ((b = el("[data-nav-go]"))) return go(b.dataset.navGo);
  if ((b = el("[data-trstart]"))) { const st = trState(b.dataset.trstart); st.start = st.start || today(); save(); return go(b.dataset.trstart + ":overview"); }
  if ((b = el("[data-trgo]"))) {
    const [id, sub, arg] = b.dataset.trgo.split("|"), st = trState(id);
    if (sub === "learn" && arg) st.sel = arg;
    if (sub === "questions") ((views._trqf = views._trqf || {})[id] = { topic: arg || "", status: "" });
    if (sub === "quiz") { (views._tqf = views._tqf || {})[id] = { tag: "", topic: arg || "" }; (views._tqs = views._tqs || {})[id] = null; }
    views._trlab = sub === "labs" ? arg : null;
    save(); go(id + ":" + sub);
    if (sub === "labs" && arg) { const n = document.getElementById("lab-" + arg); if (n) n.scrollIntoView({ block: "start" }); window.scrollBy(0, -120); }
    return;
  }
  if ((b = el("[data-trsel]"))) { const [id, tid] = b.dataset.trsel.split("|"); trState(id).sel = tid; save(); render(); return window.scrollTo(0, 0); }
  if ((b = el("[data-trread]"))) {
    const [id, tid] = b.dataset.trread.split("|"), st = trState(id);
    st.read[tid] = !st.read[tid]; if (st.read[tid]) bump(); else delete st.read[tid];
    save(); const y = window.scrollY; render(); return window.scrollTo(0, y);
  }
  if ((b = el("[data-trq]"))) { views._trq = views._trq || {}; views._trq[b.dataset.trq] = !views._trq[b.dataset.trq]; const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if ((b = el("[data-trshow]"))) { views._tra = views._tra || {}; views._tra[b.dataset.trshow] = !views._tra[b.dataset.trshow]; const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if ((b = el("[data-trqa]"))) {
    const [id, qid, v] = b.dataset.trqa.split("|"), st = trState(id);
    if (st.qa[qid] !== v && v === "got") bump();
    st.qa[qid] = v; save(); const y = window.scrollY; render(); return window.scrollTo(0, y);
  }
  if ((b = el("[data-trex]"))) { const [id, tid, j] = b.dataset.trex.split("|"); return runTrackExercise(id, tid, +j); }
  if ((b = el("[data-trexreset]"))) { const [id, tid, j] = b.dataset.trexreset.split("|"); delete S.code[`tx:${id}:${tid}-${j}`]; save(); const y = window.scrollY; render(); return window.scrollTo(0, y); }
  if ((b = el("[data-trcopy]"))) {
    const [id, tid, k] = b.dataset.trcopy.split("|");
    return navigator.clipboard?.writeText(topicById(TRACKS[id], tid).code[+k].code).then(() => { b.textContent = "Copied!"; }, () => {});
  }
  if ((b = el("[data-trres]"))) {
    const [id, lid] = b.dataset.trres.split("|");
    return navigator.clipboard?.writeText(TRACKS[id].labs.find((l) => l.id === lid).resume).then(() => { b.textContent = "Copied!"; }, () => {});
  }
  if ((b = el("[data-tq]"))) {
    const [id, qid, k] = b.dataset.tq.split("|"), q = TRACKS[id].quiz.find((x) => x.id === qid), st = trState(id);
    views._tqa = views._tqa || {}; (views._tqa[id] = views._tqa[id] || {})[qid] = +k;
    st.quiz[qid] = +k === q.answer; bump(); save();
    const y = window.scrollY; render(); return window.scrollTo(0, y);
  }
  if ((b = el("[data-tqnew]"))) {
    const id = b.dataset.tqnew, T = TRACKS[id], f = (views._tqf || {})[id] || { tag: "", topic: "" };
    const pool = T.quiz.filter((q) => (!f.tag || q.tags.includes(f.tag)) && (!f.topic || q.topic === f.topic)).map((q) => q.id);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    (views._tqs = views._tqs || {})[id] = pool.slice(0, 10);
    (views._tqa = views._tqa || {})[id] = {};
    render(); return window.scrollTo(0, 0);
  }
  if ((b = el("[data-tqall]"))) { (views._tqs = views._tqs || {})[b.dataset.tqall] = null; return render(); }
  if ((b = el("[data-tqreset]"))) { (views._tqa = views._tqa || {})[b.dataset.tqreset] = {}; return render(); }
  if ((b = el("[data-tqtag]"))) {
    const [id, tag] = b.dataset.tqtag.split("|");
    (views._tqf = views._tqf || {})[id] = { tag, topic: "" }; (views._tqs = views._tqs || {})[id] = null; (views._tqa = views._tqa || {})[id] = {};
    return go(id + ":quiz");
  }
});

document.addEventListener("change", (e) => {
  const t = e.target, d = t.dataset || {};
  if (d.trlab) {
    const [id, lid, k] = d.trlab.split("|"), st = trState(id);
    if (t.checked) { st.labs[`${lid}:${k}`] = true; bump(); } else delete st.labs[`${lid}:${k}`];
    save(); const y = window.scrollY; render(); return window.scrollTo(0, y);
  }
  if (d.trqf) { const [id, key] = d.trqf.split("|"); views._trqf[id][key] = t.value; return render(); }
  if (d.tqf) { const [id, key] = d.tqf.split("|"); views._tqf[id][key] = t.value; (views._tqs = views._tqs || {})[id] = null; return render(); }
  if (d.trcert) { const [id, cid] = d.trcert.split("|"), st = trState(id); st.certs[cid] = Object.assign({}, st.certs[cid], { status: t.value }); if (t.value === "Passed") bump(); save(); return; }
  if (d.trcertdate) { const [id, cid] = d.trcertdate.split("|"), st = trState(id); st.certs[cid] = Object.assign({}, st.certs[cid], { date: t.value }); save(); return; }
  if (d.trstartdate) { const st = trState(d.trstartdate); st.start = t.value || null; save(); return render(); }
});

document.addEventListener("input", (e) => {
  const d = e.target.dataset || {};
  if (d.trcode) { const [id, tid, j] = d.trcode.split("|"); S.code[`tx:${id}:${tid}-${j}`] = e.target.value; save(); }
  if (d.trgl) {
    views._trgl[d.trgl] = e.target.value; const pos = e.target.selectionStart; render();
    const el = document.querySelector(`[data-trgl="${d.trgl}"]`); el.focus(); el.setSelectionRange(pos, pos);
  }
});
