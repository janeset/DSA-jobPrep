"use strict";
// Roles section: role switcher, skill demand computed from POSTINGS, readiness, posting fit, and
// the shared track engine (trackview.js) for Learn / Questions / Quiz / Projects.
// Data: roles.js (roles, skills, postings) and roles-learn.js (ROLES lessons and questions).

TRACKS.roles = ROLES;
TRACK_ICON.roles = `<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/></svg>`;

const ROLE_LEVELS = [["", "Not yet"], ["learning", "Learning"], ["confident", "Confident"]];
const LEVEL_VALUE = { learning: 0.5, confident: 1 };
const roleById = (id) => ROLE_DEFS.find((r) => r.id === id);
const skillById = (id) => SKILLS.find((s) => s.id === id);
const roleName = (id) => (id === "all" ? "All roles" : roleById(id).name);

function rlState() {
  const st = trState("roles");
  st.role = st.role || "ai";
  st.conf = st.conf || {};
  return st;
}

// Skills for a role (or "all"), weighted by how often postings ask for them: required counts 2,
// preferred 1. Baseline skills with no posting demand yet get weight 1. Ties keep the order the
// postings list skills in (most central first).
function roleDemand(role) {
  const posts = POSTINGS.filter((p) => role === "all" || p.role === role);
  const rows = new Map();
  const row = (id) => {
    if (!rows.has(id)) rows.set(id, { skill: skillById(id), req: [], pref: [], base: false, pos: Infinity });
    return rows.get(id);
  };
  (role === "all" ? ROLE_DEFS : [roleById(role)]).forEach((r) => r.baseline.forEach((id) => { row(id).base = true; }));
  posts.forEach((p) => {
    p.required.forEach((id, i) => { const r = row(id); r.req.push(p); r.pos = Math.min(r.pos, i); });
    p.preferred.forEach((id, i) => { const r = row(id); r.pref.push(p); r.pos = Math.min(r.pos, 100 + i); });
  });
  const list = [...rows.values()].map((r) => Object.assign(r, { score: 2 * r.req.length + r.pref.length }))
    .map((r) => Object.assign(r, { weight: r.score || 1 }))
    .sort((a, b) => b.score - a.score || a.pos - b.pos || b.base - a.base || a.skill.name.localeCompare(b.skill.name));
  return { posts, list };
}
const levelOf = (id) => rlState().conf[id] || "";
function roleReadiness(list) {
  const total = list.reduce((n, r) => n + r.weight, 0);
  return total ? list.reduce((n, r) => n + r.weight * (LEVEL_VALUE[levelOf(r.skill.id)] || 0), 0) / total : 0;
}
function postingFit(p) {
  const total = 2 * p.required.length + p.preferred.length;
  const got = p.required.reduce((n, id) => n + 2 * (LEVEL_VALUE[levelOf(id)] || 0), 0) + p.preferred.reduce((n, id) => n + (LEVEL_VALUE[levelOf(id)] || 0), 0);
  return total ? got / total : 0;
}

// ---------------- small pieces ----------------
function roleSwitch(st) {
  return `<div class="role-switch"><div class="seg">${[...ROLE_DEFS.map((r) => [r.id, r.name]), ["all", "All roles"]].map(([id, name]) => {
    const n = POSTINGS.filter((p) => id === "all" || p.role === id).length;
    return `<button data-rlrole="${id}" class="${st.role === id ? "on" : ""}">${esc(name)} <span class="muted">${n}</span></button>`;
  }).join("")}</div></div>`;
}
function demandText(r, nPosts) {
  if (!r.req.length && !r.pref.length) return "Baseline (not in a posting yet)";
  const who = (ps) => ps.map((p) => p.company).join(", ");
  return [r.req.length ? `Required in ${r.req.length}/${nPosts}` : "", r.pref.length ? `preferred in ${r.pref.length}/${nPosts}` : ""].filter(Boolean).join(", ") +
    ` <span class="muted">(${esc(who([...new Set([...r.req, ...r.pref])]))})</span>`;
}
function learnLinks(s) {
  return `<span class="rl-tags">` + s.learn.map(([tr, tid]) => {
    const t = topicById(TRACKS[tr], tid);
    return t ? `<button class="tag tag-btn" ${goLearn(tr, tid)} title="${esc(TRACKS[tr].name)}">${tr === "roles" ? "" : `<span class="muted">${esc(TRACKS[tr].short)}:&nbsp;</span>`}${esc(t.title)}</button>` : "";
  }).join("") + "</span>";
}
const levelBadge = (id) => { const l = levelOf(id); return l === "confident" ? '<span class="badge done">Confident</span>' : l === "learning" ? '<span class="badge due">Learning</span>' : '<span class="badge">Not yet</span>'; };
function skillTag(id) {
  const s = skillById(id), [tr, tid] = s.learn[0];
  return `<button class="tag tag-btn lv-${levelOf(id) || "none"}" ${goLearn(tr, tid)} title="Open lesson">${esc(s.name)}</button>`;
}
const inTracker = (p) => S.companies.some((c) => c.name.toLowerCase() === p.company.toLowerCase());

// ---------------- pages ----------------
function roleView(sub) {
  const st = rlState();
  switch (sub) {
    case "skills": return rlSkills(st);
    case "postings": return rlPostings(st);
    case "learn": return trLearn(ROLES, st);
    case "questions": return trQuestions(ROLES, st);
    case "quiz": return trQuiz(ROLES, st);
    case "labs": return trLabs(ROLES, st);
    default: return rlOverview(st);
  }
}

function rlOverview(st) {
  const { posts, list } = roleDemand(st.role), ready = roleReadiness(list), role = st.role === "all" ? null : roleById(st.role);
  const confident = list.filter((r) => levelOf(r.skill.id) === "confident").length;
  const lessonsRead = ROLES.topics.filter((t) => st.read[t.id]).length;
  const top = list.filter((r) => r.score).slice(0, 8), shownTop = top.length ? top : list.slice(0, 8);
  const maxScore = Math.max(1, ...list.map((r) => r.score));
  const gaps = list.filter((r) => levelOf(r.skill.id) !== "confident").slice(0, 5);
  return roleSwitch(st) + `<section class="card hero t-roles">
      <div style="position:relative;z-index:1">
        <div class="eyebrow">${posts.length} posting${posts.length === 1 ? "" : "s"} · ${list.length} skills tracked</div>
        <h1>${esc(roleName(st.role))}</h1>
        <p>${esc(role ? role.tagline : "Every role combined: the skills employers ask for most across all the postings you've collected.")}.</p>
        <div class="row" style="margin-top:14px"><button class="btn primary" data-nav-go="roles:skills">Rate your skills &rarr;</button><button class="btn" data-nav-go="roles:postings">View postings</button></div>
      </div>
      ${ring(ready, "ready")}
    </section>
    ${posts.length ? "" : `<div class="callout" style="margin-bottom:var(--gap)">No postings for this role yet, so the skills below are a <b>baseline</b> from the Cloud and AI tracks. Share postings and the demand numbers will come from real employers.</div>`}
    <div class="grid">
      <div class="card"><div class="label">Postings</div><div class="stat">${posts.length}</div><div class="muted">${POSTINGS.length} across all roles</div></div>
      <div class="card"><div class="label">Skills confident</div><div class="stat">${confident}<small> / ${list.length}</small></div><div class="bar"><i style="width:${(100 * confident / Math.max(1, list.length)) | 0}%"></i></div></div>
      <div class="card"><div class="label">Role lessons reviewed</div><div class="stat">${lessonsRead}<small> / ${ROLES.topics.length}</small></div><div class="muted">Gap lessons in Learn</div></div>
      <div class="card"><div class="label">Readiness</div><div class="stat">${Math.round(ready * 100)}%</div><div class="muted">Weighted by posting demand</div></div>
    </div>
    <div class="cols-2">
      <div class="card"><div class="section-head"><h3>${top.length ? "Most requested" : "Baseline skills"}</h3><button class="btn small ghost" data-nav-go="roles:skills">All skills &rarr;</button></div>
        <div class="list">${shownTop.map((r) => `<div class="li"><div style="flex:1;min-width:0"><span class="t">${esc(r.skill.name)}</span>
          <div class="muted" style="font-size:.84rem">${demandText(r, posts.length)}</div>
          ${r.score ? `<div class="bar" style="margin-top:6px"><i style="width:${(100 * r.score / maxScore) | 0}%"></i></div>` : ""}</div>${levelBadge(r.skill.id)}</div>`).join("")}</div></div>
      <div class="card"><div class="section-head"><h3>Biggest gaps</h3><span class="muted">Highest demand, not yet confident</span></div>
        <div class="list">${gaps.length ? gaps.map((r) => `<div class="li"><div style="flex:1;min-width:0"><span class="t">${esc(r.skill.name)}</span><div>${learnLinks(r.skill)}</div></div>${levelBadge(r.skill.id)}</div>`).join("")
          : `<div class="empty"><span class="big">&#127881;</span>You've marked every skill for this role as confident.</div>`}</div></div>
    </div>
    <div class="card"><h3>How this section grows</h3>
      <p class="muted" style="margin-bottom:0">Each posting you share is filed under a role and mapped to the shared skill list: must-haves and core duties count as <b>required</b>, nice-to-haves as <b>preferred</b>. Demand and readiness update automatically, and new lessons are only added for real gaps. Rate yourself on the Skills tab; readiness weights each skill by how often employers ask for it.</p></div>`;
}

function rlSkills(st) {
  const { posts, list } = roleDemand(st.role), f = views._rlf = views._rlf || { area: "", level: "" };
  const shown = list.filter((r) => (!f.area || r.skill.area === f.area) && (!f.level || (f.level === "none" ? !levelOf(r.skill.id) : levelOf(r.skill.id) === f.level)));
  return roleSwitch(st) + pageHead(`Skills · ${esc(roleName(st.role))} <span class="muted">${shown.length}</span>`, "Sorted by how often postings ask for each skill. Rate yourself honestly; lessons for each skill are one click away.") +
    `<div class="card toolbar">
      <select data-rlf="area"><option value="">All areas</option>${SKILL_AREAS.map((a) => `<option ${f.area === a ? "selected" : ""}>${esc(a)}</option>`).join("")}</select>
      <select data-rlf="level">${[["", "Any level"], ["none", "Not yet"], ["learning", "Learning"], ["confident", "Confident"]].map(([v, l]) => `<option value="${v}" ${f.level === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <span class="muted">Readiness ${Math.round(roleReadiness(list) * 100)}% · ${posts.length} posting${posts.length === 1 ? "" : "s"}</span></div>` +
    (shown.length ? `<div class="card"><div class="table-wrap"><table class="skills-table"><tr><th>Skill</th><th class="hide-sm">Demand</th><th class="hide-sm">Learn</th><th>Your level</th></tr>
      ${shown.map((r) => `<tr><td><b style="font-weight:600">${esc(r.skill.name)}</b><div class="muted" style="font-size:.8rem">${esc(r.skill.area)}</div><div class="show-sm" style="font-size:.84rem">${demandText(r, posts.length)}</div><div class="show-sm">${learnLinks(r.skill)}</div></td>
        <td class="hide-sm" style="font-size:.86rem">${demandText(r, posts.length)}</td>
        <td class="hide-sm">${learnLinks(r.skill)}</td>
        <td><select data-rlconf="${r.skill.id}">${ROLE_LEVELS.map(([v, l]) => `<option value="${v}" ${levelOf(r.skill.id) === v ? "selected" : ""}>${l}</option>`).join("")}</select></td></tr>`).join("")}
    </table></div></div>` : `<div class="card empty">No skills match these filters.</div>`);
}

function rlPostings(st) {
  const posts = POSTINGS.filter((p) => st.role === "all" || p.role === st.role).slice().sort((a, b) => b.added.localeCompare(a.added));
  return roleSwitch(st) + pageHead(`Postings · ${esc(roleName(st.role))} <span class="muted">${posts.length}</span>`, "Real job postings behind this section. Fit is your weighted coverage of each posting's required (x2) and preferred skills.") +
    (posts.length ? posts.map((p) => {
      const fit = postingFit(p);
      return `<div class="card posting">
        <div class="section-head"><div><h3>${esc(p.title)}</h3><div class="muted">${esc(p.company)}</div></div>
          <div class="row"><span class="badge accent">${esc(roleById(p.role).name)}</span><span class="badge ${fit >= 0.7 ? "done" : fit >= 0.4 ? "due" : "plain"}">Fit ${Math.round(fit * 100)}%</span></div></div>
        <div class="row" style="margin-bottom:10px">${[p.location, p.mode, p.pay, p.seniority, `Added ${p.added}`].filter(Boolean).map((x) => `<span class="pill">${esc(x)}</span>`).join("")}</div>
        <p>${esc(p.summary)}</p>
        <div class="bar" style="margin-bottom:12px"><i style="width:${Math.round(fit * 100)}%"></i></div>
        <div class="label">Required (${p.required.length})</div><div style="margin:4px 0 10px">${p.required.map(skillTag).join("")}</div>
        <div class="label">Preferred (${p.preferred.length})</div><div style="margin:4px 0 10px">${p.preferred.map(skillTag).join("")}</div>
        <p class="muted" style="font-size:.8rem;margin-top:0">Tag colours: green confident, amber learning, grey not yet. Click a skill to open its lesson.</p>
        <h3>How to prepare</h3><ul>${p.prep.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="row">${inTracker(p) ? '<span class="badge done">In your application tracker</span><button class="btn small ghost" data-nav-go="companies">Open tracker</button>'
          : `<button class="btn small primary" data-rltrack="${p.id}">Add to application tracker</button>`}
          ${p.link ? `<a class="btn small ghost" href="${esc(p.link)}" target="_blank" rel="noopener">Employer careers page &nearr;</a>` : ""}</div></div>`;
    }).join("") : `<div class="card empty"><span class="big">&#128203;</span>No postings for ${esc(roleName(st.role))} yet. Share one in Claude Code chat and it will be added here.</div>`) +
    `<div class="card"><h3>Adding a posting</h3><p class="muted" style="margin-bottom:0">Share the PDF or text of a posting and say which role it's for. It's mapped to the skill list (required vs preferred), any real gaps get new lessons, questions or projects, and every number here updates.</p></div>`;
}

// ---------------- home card ----------------
function rolesHomeCard() {
  const rows = ROLE_DEFS.map((r) => {
    const { posts, list } = roleDemand(r.id), pct = roleReadiness(list);
    return `<div class="li"><div><span class="t">${esc(r.name)}</span><div class="muted">${posts.length} posting${posts.length === 1 ? "" : "s"} · ${Math.round(pct * 100)}% ready</div></div>
      <div class="bar" style="width:70px;margin:0"><i style="width:${Math.round(pct * 100)}%"></i></div></div>`;
  }).join("");
  return `<div class="card track-card t-roles">
    <div class="tc-head"><span class="tc-icon">${TRACK_ICON.roles}</span><div><h3>Roles</h3><p class="muted">Prep shaped by real postings for AI, Cloud and AI Cloud engineering</p></div></div>
    <div class="list">${rows}</div>
    <div class="row"><button class="btn primary" data-track-go="roles">Continue &rarr;</button></div></div>`;
}

// ---------------- events ----------------
function rlRerender() { const y = window.scrollY; render(); window.scrollTo(0, y); }
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-rlrole], [data-rltrack]");
  if (!b) return;
  if (b.dataset.rlrole) { rlState().role = b.dataset.rlrole; save(); return rlRerender(); }
  const p = POSTINGS.find((x) => x.id === b.dataset.rltrack);
  if (p && !inTracker(p)) { S.companies.push({ name: p.company, tier: p.tier || 2, status: "Researching", note: `${p.title} (${p.location})` }); bump(); save(); }
  rlRerender();
});
document.addEventListener("change", (e) => {
  const d = e.target.dataset || {};
  if (d.rlconf) {
    const st = rlState();
    if (e.target.value) { if (e.target.value === "confident" && st.conf[d.rlconf] !== "confident") bump(); st.conf[d.rlconf] = e.target.value; } else delete st.conf[d.rlconf];
    save(); return rlRerender();
  }
  if (d.rlf) { views._rlf[d.rlf] = e.target.value; return render(); }
});
