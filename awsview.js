"use strict";
// AWS certification prep section (data in awscerts.js). Loaded after trackview.js and before
// app.js; uses app.js/trackview.js helpers at call time only.

const AWS_TABS = [["overview", "Overview"], ...AWS_EXAMS.map((e) => [e.id, e.code]), ["tips", "Exam tips"]];
const examById = (id) => AWS_EXAMS.find((e) => e.id === id);
let axTimer = null;

function awsState(id) {
  S.aws = S.aws || {};
  S.aws[id] = Object.assign({ ready: {}, attempts: [] }, S.aws[id] || {});
  return S.aws[id];
}
const isMulti = (q) => Array.isArray(q.answer);
const correctSet = (q) => (isMulti(q) ? [...q.answer] : [q.answer]).sort().join(",");

// Exam pool: exam-specific questions + matching track quiz questions mapped to domains.
function examPool(e) {
  const own = e.questions.map((q) => ({ ...q, src: e.code }));
  if (!e.reuse) return own;
  const r = e.reuse, T = TRACKS[r.track];
  const reused = T.quiz.filter((q) => q.tags.includes(r.tag)).map((q) => ({ ...q, id: `${r.track}:${q.id}`, d: r.override[q.id] ?? r.topicMap[q.topic], src: T.name }))
    .filter((q) => q.d);
  return own.concat(reused);
}
function readiness(e) {
  const st = awsState(e.id), items = e.domains.flatMap((d) => d.ready.map((_, k) => `${d.n}:${k}`));
  const checked = items.filter((k) => st.ready[k]).length;
  const best = st.attempts.filter((a) => a.mode === "exam").reduce((m, a) => Math.max(m, a.pct), 0);
  return { checked, total: items.length, best, pct: items.length ? 0.5 * (checked / items.length) + 0.5 * Math.min(1, best / 80) : 0 };
}

function awsView(sub) {
  clearInterval(axTimer); axTimer = null;
  const ax = views._ax;
  if (ax && ax.exam === sub) return axView(ax);
  if (sub === "tips") return awsTips();
  const e = examById(sub);
  return e ? awsExam(e) : awsOverview();
}

// ---------------- overview ----------------
function awsOverview() {
  return `<section class="card hero t-aws">
      <div style="position:relative;z-index:1">
        <div class="eyebrow">AWS certification prep</div>
        <h1>Pass your AWS exams.</h1>
        <p>Official domains and weightings, study notes for each domain, readiness checklists, week-by-week plans and timed practice exams for four AWS certifications. Practice questions are new, exam-style items plus matching questions from the Cloud and AI tracks.</p>
      </div></section>
    <div class="card"><h3>Suggested paths</h3><div class="list">
      <div class="li"><div><span class="t">Cloud path</span><div class="muted">CLF-C02 (optional warm-up, ~3 weeks) &rarr; SAA-C03 (~6 weeks). SAA is the one employers ask for most.</div></div></div>
      <div class="li"><div><span class="t">AI path</span><div class="muted">AIF-C01 (~3 weeks) &rarr; AIP-C01 (professional; after building the AI track projects on Bedrock).</div></div></div>
      <div class="li"><div><span class="t">If you only do one</span><div class="muted">SAA-C03 for cloud/backend roles; AIF-C01 for a quick AI signal; both pair well with your DSA prep.</div></div></div>
    </div></div>
    <div class="track-grid">${AWS_EXAMS.map((e) => {
      const r = readiness(e), st = awsState(e.id), last = st.attempts[st.attempts.length - 1];
      return `<div class="card track-card t-aws">
        <div class="tc-head"><span class="tc-icon">${TRACK_ICON.aws}</span><div><h3>${esc(e.code)}</h3><p class="muted">${esc(e.name)}</p></div></div>
        <div class="tc-body">${ring(r.pct, "readiness", 96)}
          <div class="tc-meta"><span class="badge plain">${esc(e.level)}</span>
            <div class="muted">${e.facts.questions} questions · ${e.facts.minutes} min · pass ${e.facts.pass}</div>
            <div class="muted">Checklist ${r.checked}/${r.total} · best exam ${r.best ? r.best + "%" : "-"}</div>
            ${last ? `<div class="muted">Last attempt: ${last.pct}% (${esc(last.date)})</div>` : ""}</div></div>
        <div class="row"><button class="btn primary" data-awsgo="${e.id}">Study &rarr;</button><button class="btn" data-axstart="${e.id}|exam|">Practice exam</button></div></div>`;
    }).join("")}</div>`;
}

// ---------------- exam page ----------------
function awsExam(e) {
  const st = awsState(e.id), r = readiness(e), pool = examPool(e);
  const perDomain = (n) => pool.filter((q) => q.d === n).length;
  const examLen = Math.min(pool.length, 30);
  const examMin = Math.round(e.facts.minutes * examLen / e.facts.questions);
  return `<section class="card hero t-aws">
      <div style="position:relative;z-index:1">
        <div class="eyebrow">${esc(e.level)} · ${esc(e.code)}</div>
        <h1>${esc(e.name)}</h1>
        <p>${esc(e.who)}</p>
        <div class="row" style="margin-top:12px">
          <span class="badge plain">${e.facts.questions} questions (${e.facts.scored} scored)</span><span class="badge plain">${e.facts.minutes} minutes</span>
          <span class="badge plain">Pass: ${e.facts.pass} / 1000</span><span class="badge plain">${esc(e.facts.cost)}</span></div>
        <div class="row" style="margin-top:14px">
          <button class="btn primary" data-axstart="${e.id}|exam|">Practice exam: ${examLen} questions, ${examMin} min</button>
          <button class="btn" data-axstart="${e.id}|tutor|">Quick 10 (tutor mode)</button>
          <a class="btn ghost" href="${e.page}" target="_blank" rel="noopener">Official page &nearr;</a>
          ${e.guide !== e.page ? `<a class="btn ghost" href="${e.guide}" target="_blank" rel="noopener">Exam guide &nearr;</a>` : ""}</div>
      </div>
      ${ring(r.pct, "readiness")}
    </section>
    <div class="cols-2">
      <div class="card"><h3>Domains &amp; weighting</h3>
        ${e.domains.map((d) => `<div class="dom-row"><div class="row between"><span>${d.n}. ${esc(d.name)}</span><b>${d.weight}%</b></div><div class="bar"><i style="width:${d.weight * 2.5}%"></i></div></div>`).join("")}
        <p class="muted">Weights are the share of scored questions. Spend study time in proportion, plus extra on your weakest domain.</p></div>
      <div class="card"><h3>Your progress</h3>
        <div class="list">
          <div class="li"><span>Readiness checklist</span><b>${r.checked}/${r.total}</b></div>
          <div class="li"><span>Best full practice exam</span><b>${r.best ? r.best + "%" : "-"}</b></div>
          <div class="li"><span>Practice questions available</span><b>${pool.length}</b></div>
        </div>
        ${st.attempts.length ? `<h3>Recent attempts</h3><table><tr><th>Date</th><th>Mode</th><th>Score</th></tr>${st.attempts.slice(-5).reverse().map((a) => `<tr><td>${esc(a.date)}</td><td class="muted">${a.mode === "exam" ? "Exam" : a.domain ? "Domain " + a.domain : "Tutor"}</td><td><span class="badge ${a.pct >= 80 ? "done" : a.pct >= 65 ? "due" : "H"}">${a.pct}%</span></td></tr>`).join("")}</table>` : `<p class="muted">No attempts yet. Take a quick tutor-mode set to find your weak spots.</p>`}
        <p class="muted">Book the exam when your checklist is complete and you score 80%+ on two practice exams.</p></div>
    </div>
    <div class="card"><h3>Study plan</h3><div class="list">${e.plan.map((p) => `<div class="li"><div><span class="t">Week ${p.w}: ${esc(p.title)}</span>
        <div class="muted">${p.items.map(esc).join(" · ")}</div>
        ${p.topics.length ? `<div style="margin-top:6px">${p.topics.map(([tr, tid]) => `<button class="tag tag-btn" data-trgo="${tr}|learn|${tid}">${esc(topicById(TRACKS[tr], tid).title)}</button>`).join("")}</div>` : ""}</div></div>`).join("")}</div></div>
    ${e.domains.map((d) => `<details class="card" ${d.n === 1 ? "open" : ""}><summary><span style="flex:1">Domain ${d.n}: ${esc(d.name)}</span><span class="badge accent">${d.weight}%</span><span class="muted">${d.ready.filter((_, k) => st.ready[`${d.n}:${k}`]).length}/${d.ready.length}</span></summary>
        <h3 style="margin-top:4px">What to know</h3><ul>${d.know.map((k) => `<li>${esc(k)}</li>`).join("")}</ul>
        <h3>Key services</h3><div>${d.services.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div>
        <h3>Readiness checklist</h3>${d.ready.map((t, k) => `<label class="check"><input type="checkbox" data-awsready="${e.id}|${d.n}:${k}" ${st.ready[`${d.n}:${k}`] ? "checked" : ""}><span>${esc(t)}</span></label>`).join("")}
        <div class="row" style="margin-top:12px"><button class="btn small primary" data-axstart="${e.id}|tutor|${d.n}">Practice this domain (${perDomain(d.n)} questions)</button>
          ${d.topics.map(([tr, tid]) => `<button class="btn small ghost" data-trgo="${tr}|learn|${tid}">${esc(topicById(TRACKS[tr], tid).title)}</button>`).join("")}</div>
      </details>`).join("")}
    <div class="card"><h3>Full course</h3>${vids(e.videos)}</div>`;
}

function awsTips() {
  return pageHead("Exam tips", "How AWS exams work and how to approach the questions.") +
    `<div class="track-grid">${AWS_TIPS.map(([h, p]) => `<div class="card"><h3 style="margin-top:0">${esc(h)}</h3><p class="muted" style="margin:0">${esc(p)}</p></div>`).join("")}</div>`;
}

// ---------------- practice runner ----------------
function axStart(id, mode, domain) {
  const e = examById(id);
  let pool = examPool(e);
  if (domain) pool = pool.filter((q) => q.d === +domain);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const n = mode === "exam" ? Math.min(pool.length, 30) : Math.min(pool.length, domain ? pool.length : 10);
  const qs = pool.slice(0, n);
  views._ax = { exam: id, mode, domain: domain ? +domain : null, qs, i: 0, answers: {}, checked: {}, flagged: {}, done: false,
    deadline: mode === "exam" ? Date.now() + Math.round(e.facts.minutes * 60 * n / e.facts.questions) * 1000 : null };
  go("aws:" + id);
}
function axGrade(ax) {
  const per = {};
  let right = 0;
  for (const q of ax.qs) {
    const ok = (ax.answers[q.id] || []).slice().sort().join(",") === correctSet(q);
    if (ok) right++;
    per[q.d] = per[q.d] || [0, 0]; per[q.d][1]++; if (ok) per[q.d][0]++;
  }
  return { right, total: ax.qs.length, pct: ax.qs.length ? Math.round(100 * right / ax.qs.length) : 0, per };
}
function axFinish() {
  const ax = views._ax; if (!ax || ax.done) return;
  clearInterval(axTimer); axTimer = null;
  ax.done = true; ax.result = axGrade(ax);
  const st = awsState(ax.exam);
  st.attempts.push({ date: today(), mode: ax.mode, domain: ax.domain, pct: ax.result.pct, per: ax.result.per });
  st.attempts = st.attempts.slice(-30);
  bump(); save(); render(); window.scrollTo(0, 0);
}
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
function axTick() {
  const ax = views._ax, el = document.getElementById("ax-time");
  if (!ax || ax.done || !ax.deadline) return;
  const left = Math.max(0, Math.round((ax.deadline - Date.now()) / 1000));
  if (el) { el.textContent = fmtClock(left); el.classList.toggle("H", left < 300); }
  if (left <= 0) axFinish();
}

function axView(ax) {
  const e = examById(ax.exam);
  if (ax.done) return axResults(ax, e);
  if (ax.deadline) setTimeout(() => { clearInterval(axTimer); axTimer = setInterval(axTick, 1000); axTick(); }, 0);
  const q = ax.qs[ax.i], chosen = ax.answers[q.id] || [], tutor = ax.mode === "tutor", checked = tutor && ax.checked[q.id];
  const need = isMulti(q) ? q.answer.length : 1, answered = ax.qs.filter((x) => (ax.answers[x.id] || []).length).length;
  const optClass = (k) => {
    if (!checked) return chosen.includes(k) ? "picked" : "";
    const isRight = isMulti(q) ? q.answer.includes(k) : q.answer === k;
    return isRight ? "right" : chosen.includes(k) ? "wrong" : "";
  };
  return `<div class="card ax-bar"><div class="row between">
      <div class="row"><b>${esc(e.code)}</b><span class="muted">${tutor ? (ax.domain ? `Domain ${ax.domain} practice` : "Tutor mode") : "Practice exam"}</span></div>
      <div class="row">${ax.deadline ? `<span class="timer" id="ax-time">--:--</span>` : ""}<span class="muted">${answered}/${ax.qs.length} answered</span>
        <button class="btn small" data-axquit="1">Quit</button></div></div>
      <div class="ax-map">${ax.qs.map((x, k) => `<button class="${k === ax.i ? "cur" : ""} ${(ax.answers[x.id] || []).length ? "ans" : ""} ${ax.flagged[x.id] ? "flag" : ""}" data-axjump="${k}">${k + 1}</button>`).join("")}</div></div>
    <div class="card">
      <div class="section-head"><span class="label">Question ${ax.i + 1} of ${ax.qs.length} · Domain ${q.d}: ${esc(e.domains[q.d - 1].name)}</span>
        <button class="btn small ${ax.flagged[q.id] ? "primary" : "ghost"}" data-axflag="1">${ax.flagged[q.id] ? "Flagged" : "Flag for review"}</button></div>
      <p style="font-weight:600;font-size:1.05rem;margin-top:4px">${esc(q.q)}</p>
      ${isMulti(q) ? `<p class="muted" style="margin-top:-4px">Select ${need}.</p>` : ""}
      <div class="quiz-opts">${q.options.map((o, k) => `<button class="quiz-opt ${optClass(k)}" data-axpick="${k}" ${checked ? "disabled" : ""}><span class="qk">${"ABCDEF"[k]}</span>${esc(o)}</button>`).join("")}</div>
      ${checked ? `<p class="${correctSet(q) === chosen.slice().sort().join(",") ? "s-solved" : "M"}" style="margin-top:12px"><b>${correctSet(q) === chosen.slice().sort().join(",") ? "Correct." : "Not quite."}</b> <span style="color:var(--text);font-weight:400">${esc(q.why)}</span></p>` : ""}
      <div class="row between" style="margin-top:16px">
        <button class="btn" data-axnav="-1" ${ax.i === 0 ? "disabled" : ""}>&larr; Previous</button>
        <div class="row">${tutor && !checked ? `<button class="btn" data-axcheck="1" ${chosen.length !== need ? "disabled" : ""}>Check answer</button>` : ""}
          ${ax.i < ax.qs.length - 1 ? `<button class="btn primary" data-axnav="1">Next &rarr;</button>` : `<button class="btn primary" data-axfinish="1">Finish &amp; score</button>`}</div>
      </div></div>
    <p class="muted" style="text-align:center">${tutor ? "Tutor mode shows the answer after you check each question." : "Exam mode shows results at the end, like the real exam. Unanswered questions count as wrong."}</p>`;
}

function axResults(ax, e) {
  const r = ax.result, showAll = !!views._axall;
  const review = ax.qs.filter((q) => showAll || (ax.answers[q.id] || []).slice().sort().join(",") !== correctSet(q));
  const letter = (k) => "ABCDEF"[k];
  return `<section class="card hero t-aws"><div style="position:relative;z-index:1">
      <div class="eyebrow">${esc(e.code)} · ${ax.mode === "exam" ? "Practice exam" : ax.domain ? "Domain " + ax.domain + " practice" : "Tutor set"} results</div>
      <h1>${r.pct}% <small class="muted" style="font-size:1rem">${r.right}/${r.total} correct</small></h1>
      <p>${r.pct >= 80 ? "Strong result. Two of these in a row and you're ready to book." : r.pct >= 65 ? "Getting close. Review the misses below and drill your weakest domain." : "Keep going: study the domain notes for the weak areas, then try again."} Practice percentages aren't AWS scaled scores; aim for 80%+.</p>
      <div class="row" style="margin-top:12px"><button class="btn primary" data-axstart="${e.id}|${ax.mode}|${ax.domain || ""}">Try another set</button><button class="btn" data-axquit="1">Back to ${esc(e.code)}</button></div>
    </div>${ring(r.pct / 100, "score")}</section>
    <div class="card"><h3>By domain</h3>${e.domains.filter((d) => r.per[d.n]).map((d) => { const [c, t] = r.per[d.n], p = Math.round(100 * c / t); return `<div class="dom-row"><div class="row between"><span>${d.n}. ${esc(d.name)}</span><b>${c}/${t} · ${p}%</b></div><div class="bar ${p < 65 ? "bad" : ""}"><i style="width:${p}%"></i></div></div>`; }).join("")}</div>
    <div class="card"><div class="section-head"><h3>${showAll ? "All questions" : `Review your misses (${review.length})`}</h3><button class="btn small ghost" data-axall="1">${showAll ? "Show misses only" : "Show all"}</button></div>
      ${review.length ? review.map((q) => { const mine = (ax.answers[q.id] || []); return `<div class="flash"><div class="label">Domain ${q.d} · ${esc(q.src)}</div><b>${esc(q.q)}</b>
        <p class="flash-a">Your answer: ${mine.length ? mine.map((k) => `${letter(k)}. ${esc(q.options[k])}`).join("; ") : "<i>none</i>"}<br>Correct: <span class="s-solved">${(isMulti(q) ? q.answer : [q.answer]).map((k) => `${letter(k)}. ${esc(q.options[k])}`).join("; ")}</span></p>
        <p class="flash-a">${esc(q.why)}</p></div>`; }).join("") : `<p class="muted">No misses. Nice!</p>`}</div>`;
}

// ---------------- events ----------------
document.addEventListener("click", (ev) => {
  const t = ev.target, el = (s) => t.closest(s);
  let b;
  if ((b = el("[data-awsgo]"))) { views._ax = null; return go("aws:" + b.dataset.awsgo); }
  if ((b = el("[data-axstart]"))) { const [id, mode, dom] = b.dataset.axstart.split("|"); views._axall = false; return axStart(id, mode, dom); }
  const ax = views._ax;
  if (!ax) return;
  if ((b = el("[data-axquit]"))) { clearInterval(axTimer); axTimer = null; const id = ax.exam; views._ax = null; return go("aws:" + id); }
  if (ax.done) { if (el("[data-axall]")) { views._axall = !views._axall; render(); } return; }
  const q = ax.qs[ax.i];
  if ((b = el("[data-axpick]"))) {
    const k = +b.dataset.axpick, cur = ax.answers[q.id] || [];
    if (isMulti(q)) ax.answers[q.id] = cur.includes(k) ? cur.filter((x) => x !== k) : cur.concat(k).slice(-q.answer.length);
    else ax.answers[q.id] = [k];
    if (ax.mode === "tutor" && !isMulti(q)) ax.checked[q.id] = true;
    return render();
  }
  if (el("[data-axcheck]")) { ax.checked[q.id] = true; return render(); }
  if ((b = el("[data-axnav]"))) { ax.i = Math.max(0, Math.min(ax.qs.length - 1, ax.i + +b.dataset.axnav)); render(); return window.scrollTo(0, 0); }
  if ((b = el("[data-axjump]"))) { ax.i = +b.dataset.axjump; return render(); }
  if (el("[data-axflag]")) { ax.flagged[q.id] = !ax.flagged[q.id]; return render(); }
  if (el("[data-axfinish]")) {
    const unanswered = ax.qs.filter((x) => !(ax.answers[x.id] || []).length).length;
    if (unanswered && !confirm(`${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered and will count as wrong. Finish anyway?`)) return;
    return axFinish();
  }
});
document.addEventListener("change", (ev) => {
  const d = ev.target.dataset || {};
  if (d.awsready) {
    const [id, key] = d.awsready.split("|"), st = awsState(id);
    if (ev.target.checked) { st.ready[key] = true; bump(); } else delete st.ready[key];
    save(); const y = window.scrollY; render(); window.scrollTo(0, y);
  }
});
