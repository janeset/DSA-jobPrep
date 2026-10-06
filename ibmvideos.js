"use strict";
// IBM Videos tab for the AI track, laid out like Learn: every IBM Technology playlist (grouped,
// AI first) and the IBM videos attached to each AI and Roles lesson. Playlist ids, titles and thumbnails were confirmed via
// YouTube oEmbed; video counts are as of October 2026 and grow over time.
// `pairs` are [trackId, topicId] lessons the playlist goes well with.

const IBM_PL = (id, title, count, thumb, pairs = [], desc = "") => ({ id, title, count, thumb, pairs, desc });
const IBM_PLAYLIST_GROUPS = [
  { name: "AI essentials", ai: true, lists: [
    IBM_PL("PLOspHqNVtKADfxkuDuHduUkDExBpEt3DF", "AI Fundamentals", 72, "kyJ1vd7yEPc", [["ai", "mlbasics"], ["ai", "foundations"]], "Core concepts from machine learning to generative AI, one short whiteboard video each."),
    IBM_PL("PLOspHqNVtKAC-FUNMq8qjYVw6_semZHw0", "AI Models Explained", 46, "F3hlZSZc6UI", [["ai", "foundations"], ["ai", "customization"], ["ai", "multimodal"]], "Model types and techniques: transformers, mixture of experts, reasoning and vision models, tuning."),
    IBM_PL("PLOspHqNVtKAAsiohuZj1Bt4XpA3_bkS3c", "Large Language Models and Chatbots", 12, "yu27PWzJI_Y", [["ai", "foundations"], ["ai", "prompting"]], "How LLMs and chatbots work, and how they're adapted with prompting and tuning."),
    IBM_PL("PLOspHqNVtKACJx_ue2EXC1MerohY_lLKO", "AI Academy", 24, "s4r5gXdSVPM", [["ai", "cloudai"]], "Adopting AI in a business: strategy, data, governance and scaling beyond pilots."),
    IBM_PL("PLOspHqNVtKADe2YWKvnuqWbddubJZvQf0", "What's Popular", 41, "N3-zrhoBx6w", [], "The channel's most-watched videos across AI, cloud and security."),
  ] },
  { name: "Building with AI", ai: true, lists: [
    IBM_PL("PLOspHqNVtKADc8E1JLd_kBBPdEBDdmwsR", "RAG Explained", 24, "VSFuqMh4hus", [["ai", "embeddings"], ["ai", "vectorstores"], ["ai", "rag"], ["roles", "permrag"]], "Retrieval-augmented generation end to end: vector databases, retrieval strategies, GraphRAG and agentic RAG."),
    IBM_PL("PLOspHqNVtKAB6AzNie7BrFhbg4dv4Gfz8", "AI Agents Explained", 64, "F8NKVhkZZWI", [["ai", "agents"], ["ai", "tools"], ["roles", "entagents"]], "Agents from basics to production: types, multi-agent systems, memory, frameworks and human-in-the-loop."),
    IBM_PL("PLOspHqNVtKAAY8UCxA15eIK3lgE9BLc4n", "MCP Explained", 16, "7j1t3UZA1TY", [["ai", "tools"]], "The Model Context Protocol: what it is, building servers, and how it compares with APIs, A2A and skills."),
    IBM_PL("PLOspHqNVtKADqC3pf-SjB23mtqJbmwsWw", "Agentic & AI Coding Explained", 23, "mViFYTwWvcM", [["roles", "aicoding"], ["ai", "agents"]], "AI coding assistants, agentic coding, spec-driven development and AI across the SDLC."),
    IBM_PL("PLOspHqNVtKACI0uR7Oa-bkWbtTufpJNhi", "AI Technical Tutorials", 34, "OuBxnfPA15g", [["ai", "apis"], ["ai", "llmops"], ["roles", "selfhost"]], "More technical walkthroughs: inference engines, developer tooling and building AI apps."),
    IBM_PL("PLOspHqNVtKADcG4vf83D97cKUrs5WdXXR", "AI in Action", null, "eZ1NizUx9U4", [["ai", "cloudai"]], "Real-world AI use cases and how teams put them into production."),
  ] },
  { name: "Responsible & secure AI", ai: true, lists: [
    IBM_PL("PLOspHqNVtKADin6JGozvzSvUQFTQRdum-", "AI Security Explained", 25, "OvjccOrr-iw", [["ai", "safety"], ["roles", "entagents"]], "Prompt injection, jailbreaks, the OWASP LLM Top 10 and securing AI agents."),
    IBM_PL("PLOspHqNVtKABEKVgWGrf6_x6OQYnYnCiM", "AI Ethics and Governance Explained", 12, "jRMbbRdju7Q", [["ai", "safety"]], "Responsible AI: bias, explainability, governance and regulation."),
  ] },
  { name: "Podcasts & talks", ai: true, lists: [
    IBM_PL("PLOspHqNVtKADvnJYHm3HButDlWykOTzlP", "Mixture of Experts", null, "oBdLhD5nPYw", [], "Panel podcast on the week's AI news, models and research. Good for staying current before interviews."),
    IBM_PL("PLOspHqNVtKAC0-KCayX4_nEfSjE8VhbZx", "Smart Talks with IBM", null, "Ac-BIziJPXQ", [], "Conversations on how organizations put AI and technology to work."),
    IBM_PL("PLOspHqNVtKABGIbaWP1xYQHbwuXjZwqpH", "Security Intelligence", null, "dHn0qzSDMO0", [], "Security news podcast, increasingly about AI threats and defences."),
  ] },
  { name: "Cloud, DevOps & platforms", lists: [
    IBM_PL("PLOspHqNVtKAC-_ZAGresP-i0okHe5FjcJ", "Cloud Fundamentals", 67, "20QUNgFIrK0", [["cloud", "fundamentals"]]),
    IBM_PL("PLOspHqNVtKABAVX4azqPIu6UfsPzSu2YN", "Kubernetes Essentials", 18, "2vMEQ5zs1ko", [["cloud", "kubernetes"], ["roles", "openshift"]]),
    IBM_PL("PLOspHqNVtKACSagAEeIY20NMVLNeQ1ZJx", "Cloud Native Explained", 13, "fp9_ubiKqFU", [["cloud", "containers"]]),
    IBM_PL("PLOspHqNVtKADX-InvL3aRFYuOYvi-Qmep", "Cloud Native / Containers", 5, "aSrqRSk43lY", [["cloud", "containers"]]),
    IBM_PL("PLOspHqNVtKAAm1dmyiR9WMmw1UBoOwZVj", "DevOps Explained", 18, "UbtB4sMaaNM", [["cloud", "devops"], ["roles", "azdevops"]]),
    IBM_PL("PLOspHqNVtKAA75RfVxm-CLdARe0VpBwbx", "DevOps: AiOps, Application Health and Observability", 3, "CAQ_a2-9UOI", [["roles", "aiobs"], ["cloud", "operations"]]),
    IBM_PL("PLOspHqNVtKAAihZ-Zrs1Gk7BZjqaa1pi2", "DevOps: ARM and FinOps", 1, "Y1vpWDusoSs", [["cloud", "operations"]]),
    IBM_PL("PLOspHqNVtKAAAq9pHWlEiRUVcYMCcu4X0", "API Essentials", 12, "hWRRdICvMNs", [["roles", "integration"]]),
    IBM_PL("PLOspHqNVtKACfjqfEwR3iKz1gJILKj5Tn", "Cloud Security Explained", 32, "aXMPqfZt1gk", [["cloud", "security"]]),
    IBM_PL("PLOspHqNVtKAA_5N3pI49wkH4WsTkeZ_iQ", "Cloud Networking Explained", 8, "sCR3SAVdyCc", [["cloud", "networking"]]),
    IBM_PL("PLOspHqNVtKAAXDobTc9kBWwnfgzNV2k_a", "Cloud Data Storage Explained", 26, "Q5aTUc7c4jg", [["cloud", "storage"]]),
    IBM_PL("PLOspHqNVtKABPTyvxoNW0e4XSgCNdZ40F", "Hybrid Cloud Explained", 8, "sUoeVhbp4cQ", [["cloud", "architecture"]]),
    IBM_PL("PLOspHqNVtKACWzKwzaPCPTiByXhyRY8NU", "Unlock IT / Hybrid Cloud", 6, "vxJobGtqKVM", [["cloud", "architecture"]]),
    IBM_PL("PLOspHqNVtKABcMvsegAjlnKYMMV5KsSml", "Multicloud Management", 9, "AjtdZ3gFRjU", [["cloud", "governance"]]),
    IBM_PL("PLOspHqNVtKACLF9lk3edNG43LfUPcWioZ", "Edge Computing", 8, "cEOUeItHDdo"),
  ] },
  { name: "Data", lists: [
    IBM_PL("PLOspHqNVtKABpPMnwkx27tEO2KOBvHLu6", "Data Explained", 11, "GE3JOFwTWVM", [["cloud", "data"]]),
    IBM_PL("PLOspHqNVtKAD74tcRKW9FhETyKSaKxl3J", "Data Management", 6, "hRulZhTtUTg", [["cloud", "data"]]),
    IBM_PL("PLFV4g2rfT2rs", "Data Governance Explained", 10, "uPsUjKLHLAg", [["cloud", "governance"]]),
    IBM_PL("PLAZfI25B5sr0", "Data Streaming Explained", 6, "aj9CDZm0Glc", [["cloud", "messaging"]]),
    IBM_PL("PLOspHqNVtKABIVwvKy4xY0lz0FUPnH1JD", "Data Fabric", 3, "0Zzn4eVbqfk", [["cloud", "data"]]),
    IBM_PL("PLOspHqNVtKADA_xaKgpekj_bgqsC58VXm", "Data Lake essentials", 5, "LxcH6z8TFpI", [["cloud", "data"]]),
    IBM_PL("PLOspHqNVtKABPJWHc_2VOHGtjwaxnw5fE", "Data Storage Essentials", 12, "LxcH6z8TFpI", [["cloud", "storage"]]),
  ] },
  { name: "Security", lists: [
    IBM_PL("PLOspHqNVtKADRD_mso6us7QpiSJ9AlY5r", "Cybersecurity Explained", 20, "jRMbbRdju7Q", [["cloud", "security"]]),
    IBM_PL("PLOspHqNVtKADkWLFt9OcziQF7EatuANSY", "Cybersecurity Architecture Series", 10, "jq_LZ1RFPfU", [["cloud", "security"]]),
    IBM_PL("PLOspHqNVtKAB9uAIH6rAYNtiI3frm5Di0", "Hacking Explained", 5, "WYkbKzDfgqo"),
    IBM_PL("PLOspHqNVtKAC5kOcteVAhUOuXWgqFpzkd", "Know your attack surface", 4, "NqKid53v5x8"),
    IBM_PL("PLOspHqNVtKABreqPsgh9nSNA03BicMYMC", "Accelerate your response", 4, "9RfsRn7m7OE"),
    IBM_PL("PLZJ7euO9T11A", "Through the Years: Cost of a Data Breach", 3, "b2PESRl7De4"),
  ] },
  { name: "Other", lists: [
    IBM_PL("PLOspHqNVtKADPNAxbcP2u6CPzD1g_bBhe", "Quantum Computing Essentials", 10, "lt4OsgmUTGI"),
  ] },
];

AI.tabs = [["overview", "Overview"], ["roadmap", "Roadmap"], ["learn", "Learn"], ["ibm", "IBM Videos"], ["questions", "Questions"], ["quiz", "Quiz"], ["labs", AI.labsName], ["certs", "Certs"]];

const ibmDone = () => { const st = trState("ai"); return (st.ibm = st.ibm || {}); };
const ibmLessonVideos = (T, tid) => (T.videos[tid] || []).filter((v) => v.ch === "IBM Technology");
// Full video lists live in ibmplaylists.js; fall back to the stored count if a list is missing.
const plVideos = (p) => (typeof IBM_PLAYLIST_VIDEOS !== "undefined" && IBM_PLAYLIST_VIDEOS[p.id]) || [];
const plCount = (p) => plVideos(p).length || p.count;
const ibmWatched = () => { const st = trState("ai"); return (st.ibmW = st.ibmW || {}); };
const plWatched = (p) => plVideos(p).filter(([id]) => ibmWatched()[id]).length;

function ibmPlaylistCard(p) {
  const done = !!ibmDone()[p.id];
  const pairs = pairTags(p);
  return `<div class="card pl-card ${done ? "pl-done" : ""}">
    <div class="vcard" data-plist="${p.id}" role="button" tabindex="0" title="Play playlist here"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/${p.thumb}/mqdefault.jpg"><span class="play">&#9654;</span>
      <span class="pl-count">${plCount(p) ? `${plCount(p)} videos` : "Series"}</span></div>
    <div class="pl-body"><div class="row between" style="align-items:flex-start;flex-wrap:nowrap"><button class="pl-title" data-ibmsel="pl:${p.id}" title="Open in the panel">${esc(p.title)}</button>${done ? '<span class="badge done">Done</span>' : ""}</div>
      ${p.desc ? `<p class="muted" style="margin:6px 0 0;font-size:.86rem">${esc(p.desc)}</p>` : ""}
      ${pairs ? `<div class="pl-pairs"><span class="label">Pairs with</span><div class="rl-tags">${pairs}</div></div>` : ""}
      <div class="row" style="margin-top:auto;padding-top:10px"><a class="btn small" href="https://www.youtube.com/playlist?list=${p.id}" target="_blank" rel="noopener">Open on YouTube &nearr;</a>
        <button class="btn small ${done ? "" : "ghost"}" data-ibmdone="${p.id}">${done ? "Done ✓ (undo)" : "Mark done"}</button></div></div></div>`;
}

// Learn-style layout: a side panel of playlists and per-lesson videos, the selection on the right.
// Selection keys: "overview", "search", "pl:<playlistId>", "ls:<trackId>:<topicId>".
const ibmPlaylists = () => IBM_PLAYLIST_GROUPS.flatMap((g) => g.lists);
const ibmLessonGroups = () => [...AI.groups.map(([g, tids]) => [g, AI, tids]), ...ROLES.groups.map(([g, tids]) => ["Roles · " + g, ROLES, tids])]
  .map(([g, TT, tids]) => [g, TT, tids.filter((tid) => ibmLessonVideos(TT, tid).length)]).filter(([, , tids]) => tids.length);
function ibmOrder() {
  return ["overview", ...ibmPlaylists().map((p) => "pl:" + p.id), ...ibmLessonGroups().flatMap(([, TT, tids]) => tids.map((tid) => `ls:${TT.id}:${tid}`)), "search"];
}
function ibmLabel(key) {
  if (key === "overview") return "Overview";
  if (key === "search") return "Search all lesson videos";
  if (key.startsWith("pl:")) return ibmPlaylists().find((p) => p.id === key.slice(3)).title;
  const [, tr, tid] = key.split(":");
  return topicById(TRACKS[tr], tid).title;
}
// Which panel groups are collapsed (saved). Groups never toggled use the default: non-AI playlists shut.
const ibmGroupNames = () => [...IBM_PLAYLIST_GROUPS.map((g) => g.name), ...ibmLessonGroups().map(([g]) => g), "Reference"];
function ibmShutState() {
  const st = trState("ai"), saved = (st.ibmShut = st.ibmShut || {});
  const defaults = Object.fromEntries(IBM_PLAYLIST_GROUPS.map((g) => [g.name, !g.ai]));
  return (name) => (name in saved ? saved[name] : !!defaults[name]);
}
const pairTags = (p) => p.pairs.map(([tr, tid]) => { const t = topicById(TRACKS[tr], tid); return t ? `<button class="tag tag-btn" ${goLearn(tr, tid)}>${tr === "ai" ? "" : `<span class="muted">${esc(TRACKS[tr].short)}:&nbsp;</span>`}${esc(t.title)}</button>` : ""; }).join("");

function ibmView(T, st) {
  const order = ibmOrder(), sel = order.includes(st.ibmSel) ? st.ibmSel : "overview", done = ibmDone();
  // Collapsible groups and a compact rail, like the Refreshers panel. Non-AI playlist groups start collapsed.
  const compact = !!st.ibmCompact, shut = ibmShutState();
  const initials = (s) => s.split(/\s+/).filter((w) => /\w/.test(w)).map((w) => w[0].toUpperCase()).join("").slice(0, 2);
  const item = (key, label, meta = "", short = "") => `<button class="side-i ${sel === key ? "active" : ""}" data-ibmsel="${key}" title="${esc(label)}"><span class="lbl">${esc(label)}</span><span class="sh">${esc(short || initials(label))}</span><span class="muted lbl">${meta}</span></button>`;
  const grp = (name, count, items) => `<button class="side-h" data-ibmgrp="${esc(name)}" title="${shut(name) ? "Expand" : "Collapse"} ${esc(name)}"><span class="lbl">${esc(name)}</span><span class="chev">${shut(name) ? "&#9656;" : "&#9662;"}&nbsp;${count}</span></button>` +
    (shut(name) && !compact ? "" : items.join(""));
  const tools = `<div class="side-tools"><button class="side-toggle" id="ibm-compact" title="${compact ? "Expand sidebar" : "Compact sidebar"}"><span class="lbl">Compact</span><span>${compact ? "&raquo;" : "&laquo;"}</span></button>
    <span class="lbl side-tools-r"><button class="side-tool" data-ibmall="open" title="Expand all groups">Expand</button><button class="side-tool" data-ibmall="shut" title="Collapse all groups">Collapse</button></span></div>`;
  const side = tools + item("overview", "Overview", "", "≡") +
    `<div class="side-sec lbl">Playlists</div>` +
    IBM_PLAYLIST_GROUPS.map((g) => grp(g.name, g.lists.length, g.lists.map((p) => item("pl:" + p.id, p.title, done[p.id] ? "✓" : plCount(p) || "")))).join("") +
    `<div class="side-sec lbl">Videos by lesson</div>` +
    ibmLessonGroups().map(([g, TT, tids]) => grp(g, tids.length, tids.map((tid) => item(`ls:${TT.id}:${tid}`, topicById(TT, tid).title, ibmLessonVideos(TT, tid).length)))).join("") +
    grp("Reference", 1, [item("search", "Search all lesson videos", "", "⌕")]);

  const body = sel === "overview" ? ibmOverview() : sel === "search" ? ibmSearch() : sel.startsWith("pl:") ? ibmPlaylistPage(sel.slice(3)) : ibmLessonPage(sel);
  const i = order.indexOf(sel), prev = order[i - 1], next = order[i + 1];
  const nav = `<div class="row between" style="margin-bottom:var(--gap)">${prev ? `<button class="btn" data-ibmsel="${prev}">&larr; ${esc(ibmLabel(prev))}</button>` : "<span></span>"}
    ${next ? `<button class="btn primary" data-ibmsel="${next}">${esc(ibmLabel(next))} &rarr;</button>` : ""}</div>`;
  return `<div class="ref-layout ${compact ? "compact" : ""}"><aside class="ref-side">${side}</aside><section class="ref-main">${body}${nav}</section></div>`;
}

function ibmOverview() {
  const aiLists = IBM_PLAYLIST_GROUPS.filter((g) => g.ai).flatMap((g) => g.lists), doneCount = aiLists.filter((p) => ibmDone()[p.id]).length;
  const lessonCount = ibmLessonGroups().reduce((n, [, TT, tids]) => n + tids.reduce((m, tid) => m + ibmLessonVideos(TT, tid).length, 0), 0);
  return `<section class="card hero t-ai">
      <div style="position:relative;z-index:1">
        <div class="eyebrow">IBM Technology on YouTube</div>
        <h1>IBM Videos</h1>
        <p>Short whiteboard explainers that pair well with every lesson: ${ibmPlaylists().length} playlists and ${lessonCount} videos picked for specific lessons. Pick anything from the panel to watch it here.</p>
        <div class="row" style="margin-top:14px"><a class="btn primary" href="${IBM_CHANNEL.url}" target="_blank" rel="noopener">Visit the channel &nearr;</a><a class="btn" href="${IBM_CHANNEL.url}/playlists" target="_blank" rel="noopener">All playlists &nearr;</a></div>
      </div>
      ${ring(aiLists.length ? doneCount / aiLists.length : 0, `${doneCount}/${aiLists.length} AI playlists`)}
    </section>` +
    IBM_PLAYLIST_GROUPS.filter((g) => g.ai).map((g) => `<div class="section-head" style="margin-top:6px"><h3>${esc(g.name)}</h3><span class="muted">${g.lists.length} playlist${g.lists.length === 1 ? "" : "s"}</span></div>
      <div class="pl-grid">${g.lists.map(ibmPlaylistCard).join("")}</div>`).join("") +
    `<p class="muted" style="font-size:.82rem">Cloud, data and security playlists are in the collapsible groups in the panel. Playlist sizes as of October 2026; the channel adds videos regularly.</p>`;
}

function ibmPlaylistPage(id) {
  const g = IBM_PLAYLIST_GROUPS.find((x) => x.lists.some((p) => p.id === id)), p = g.lists.find((x) => x.id === id), done = !!ibmDone()[id], pairs = pairTags(p);
  const list = plVideos(p), playing = (views._ibmPlay || {})[id], now = list.find(([v]) => v === playing);
  const src = playing ? `${playing}?list=${id}&autoplay=1` : `videoseries?list=${id}`;
  return `<div class="label">${esc(g.name)}</div><h2>${esc(p.title)} ${done ? '<span class="badge done">Done</span>' : ""}</h2>
    <div class="card" id="ibm-player"><div class="video" style="margin-top:0"><iframe src="https://www.youtube-nocookie.com/embed/${src}" title="${esc(p.title)} playlist" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
      ${now ? `<p style="margin-top:0"><span class="label">Now playing</span><br><b>${esc(now[1])}</b></p>` : ""}
      <div class="row" style="margin-bottom:8px"><span class="pill">${plCount(p) ? `${plCount(p)} videos` : "Ongoing series"}</span>${list.length ? `<span class="pill">${plWatched(p)} watched</span>` : ""}<span class="pill">IBM Technology</span></div>
      ${p.desc ? `<p style="margin-bottom:0">${esc(p.desc)}</p>` : ""}</div>
    ${list.length ? ibmVideoList(p, list, playing) : ""}
    ${pairs ? `<div class="card"><h3>Pairs with these lessons</h3><div class="rl-tags">${pairs}</div></div>` : ""}
    <div class="row" style="margin-bottom:var(--gap)"><button class="btn ${done ? "" : "primary"}" data-ibmdone="${id}">${done ? "Done ✓ (undo)" : "Mark as done"}</button>
      <a class="btn ghost" href="https://www.youtube.com/playlist?list=${id}" target="_blank" rel="noopener">Open on YouTube &nearr;</a></div>`;
}

function ibmLessonPage(key) {
  const [, tr, tid] = key.split(":"), TT = TRACKS[tr], t = topicById(TT, tid);
  const group = (TT.groups.find(([, ids]) => ids.includes(tid)) || [""])[0];
  const lists = ibmPlaylists().filter((p) => p.pairs.some(([a, b]) => a === tr && b === tid));
  return `<div class="label">${tr === "roles" ? "Roles · " : ""}${esc(group)}</div><h2>${esc(t.title)}</h2>
    <div class="card"><div class="section-head"><h3>IBM videos for this lesson</h3><button class="btn small" ${goLearn(tr, tid)}>Open lesson &rarr;</button></div>${vids(ibmLessonVideos(TT, tid))}</div>
    ${lists.length ? `<div class="card"><h3>Related playlists</h3><div class="list">${lists.map((p) => `<div class="li"><div><span class="t">${esc(p.title)}</span><div class="muted">${plCount(p) ? `${plCount(p)} videos` : "Series"}</div></div><button class="btn small" data-ibmsel="pl:${p.id}">Watch</button></div>`).join("")}</div></div>` : ""}`;
}

function ibmSearch() {
  const q = (views._ibmq || "").toLowerCase(), match = (v) => !q || v.title.toLowerCase().includes(q);
  const blocks = ibmLessonGroups().map(([g, TT, tids]) => {
    const rows = tids.map((tid) => [topicById(TT, tid), ibmLessonVideos(TT, tid).filter(match)]).filter(([, v]) => v.length);
    return rows.length ? `<div class="label" style="margin:18px 0 8px">${esc(g)}</div>` + rows.map(([t, v]) => `<div class="card"><div class="section-head"><h3>${esc(t.title)}</h3><button class="btn small ghost" ${goLearn(TT.id, t.id)}>Open lesson &rarr;</button></div>${vids(v)}</div>`).join("") : "";
  }).join("");
  return `<h2>Search lesson videos</h2><p class="muted">Every IBM video picked for an AI or Roles lesson, filtered by title.</p>
    <div class="card toolbar"><label class="search">${ICON_SEARCH}<input data-ibmq placeholder="Search video titles..." value="${esc(views._ibmq || "")}" autocomplete="off"></label></div>
    ${blocks || '<div class="card empty">No videos match that search.</div>'}`;
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ibmdone], [data-ibmsel], [data-ibmgrp], [data-ibmall], #ibm-compact");
  if (!b) return;
  if (b.dataset.ibmsel) { const st = trState("ai"); st.ibmSel = b.dataset.ibmsel; save(); render(); return window.scrollTo(0, 0); }
  if (b.dataset.ibmgrp) { const isShut = ibmShutState()(b.dataset.ibmgrp), st = trState("ai"); st.ibmShut[b.dataset.ibmgrp] = !isShut; save(); return render(); }
  if (b.dataset.ibmall) { const st = trState("ai"); st.ibmShut = Object.fromEntries(ibmGroupNames().map((n) => [n, b.dataset.ibmall === "shut"])); save(); return render(); }
  if (b.id === "ibm-compact") { const st = trState("ai"); st.ibmCompact = !st.ibmCompact; save(); return render(); }
  const d = ibmDone(), id = b.dataset.ibmdone;
  if (d[id]) delete d[id]; else { d[id] = true; bump(); }
  save(); const y = window.scrollY; render(); window.scrollTo(0, y);
});
document.addEventListener("input", (e) => {
  if (!("ibmq" in (e.target.dataset || {}))) return;
  views._ibmq = e.target.value; const pos = e.target.selectionStart; render();
  const el = document.querySelector("[data-ibmq]"); el.focus(); el.setSelectionRange(pos, pos);
});

// Expandable list of every video in a playlist: click a title to play it above, tick it when watched.
function ibmVideoList(p, list, playing) {
  const open = (views._ibmListOpen = views._ibmListOpen || {})[p.id] !== false, w = ibmWatched();
  const q = ((views._ibmf || {})[p.id] || "").toLowerCase();
  const rows = list.map((v, i) => [v, i]).filter(([[, t]]) => !q || t.toLowerCase().includes(q));
  const watched = plWatched(p);
  return `<details class="card pl-list" data-ibmlist="${p.id}" ${open ? "open" : ""}>
    <summary><span style="flex:1"><b>All ${list.length} videos</b> <span class="muted">· ${watched} watched</span></span><span class="muted pl-chev">${open ? "Hide" : "Show"}</span></summary>
    <div class="bar" style="margin:10px 0 12px"><i style="width:${(100 * watched / list.length) | 0}%"></i></div>
    ${list.length > 12 ? `<div class="toolbar" style="margin-bottom:8px"><label class="search">${ICON_SEARCH}<input data-ibmf="${p.id}" placeholder="Filter ${list.length} videos..." value="${esc((views._ibmf || {})[p.id] || "")}" autocomplete="off"></label></div>` : ""}
    <ol class="pl-rows">${rows.map(([[id, t, len], i]) => `<li class="pl-row ${id === playing ? "playing" : ""} ${w[id] ? "watched" : ""}">
        <span class="pl-n">${id === playing ? "&#9654;" : i + 1}</span>
        <button class="pl-thumb" data-ibmplay="${p.id}|${id}" title="Play"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/${id}/default.jpg"></button>
        <button class="pl-row-t" data-ibmplay="${p.id}|${id}">${esc(t)}</button>
        <span class="muted pl-len">${esc(len)}</span>
        <label class="pl-w" title="Watched"><input type="checkbox" data-ibmw="${id}" ${w[id] ? "checked" : ""}></label></li>`).join("") || '<li class="empty">No videos match.</li>'}</ol>
    <p class="muted" style="font-size:.8rem;margin-bottom:0">From YouTube on 6 Oct 2026. Private or removed videos aren't listed, so a few playlists show one or two fewer than YouTube's count.</p></details>`;
}

// Re-render without losing the page position or the video list's own scroll position.
function ibmRerender() {
  const y = window.scrollY, list = document.querySelector(".pl-rows"), top = list ? list.scrollTop : 0;
  render(); window.scrollTo(0, y);
  const again = document.querySelector(".pl-rows"); if (again) again.scrollTop = top;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ibmplay]");
  if (!b) return;
  const [pid, vid] = b.dataset.ibmplay.split("|");
  (views._ibmPlay = views._ibmPlay || {})[pid] = vid;
  ibmRerender();
  // bring the player back into view only if it has scrolled off screen
  const pl = document.getElementById("ibm-player");
  if (pl && pl.getBoundingClientRect().top < 110) { pl.scrollIntoView({ block: "start" }); window.scrollBy(0, -120); }
});
document.addEventListener("change", (e) => {
  const id = (e.target.dataset || {}).ibmw;
  if (!id) return;
  const w = ibmWatched();
  if (e.target.checked) { w[id] = true; bump(); } else delete w[id];
  save(); ibmRerender();
});
document.addEventListener("toggle", (e) => {
  const pid = e.target.dataset && e.target.dataset.ibmlist;
  if (!pid) return;
  (views._ibmListOpen = views._ibmListOpen || {})[pid] = e.target.open;
  const c = e.target.querySelector(".pl-chev"); if (c) c.textContent = e.target.open ? "Hide" : "Show";
}, true);
document.addEventListener("input", (e) => {
  const pid = (e.target.dataset || {}).ibmf;
  if (!pid) return;
  (views._ibmf = views._ibmf || {})[pid] = e.target.value; const pos = e.target.selectionStart; ibmRerender();
  const list = document.querySelector(".pl-rows"); if (list) list.scrollTop = 0;
  const el = document.querySelector(`[data-ibmf="${pid}"]`); el.focus(); el.setSelectionRange(pos, pos);
});
