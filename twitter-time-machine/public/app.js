// Tweet Time Machine — frontend. Talks to the backend at /api/*.
"use strict";

const $ = (s) => document.querySelector(s);
const NOW_YEAR = new Date().getUTCFullYear();
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const state = { source: "archive", items: [], handle: "", yearFilter: null, profile: null, mode: null };

// ---- year selects ----
const fromSel = $("#from"), toSel = $("#to");
for (let y = NOW_YEAR; y >= 2006; y--) {
  fromSel.insertAdjacentHTML("beforeend", `<option value="${y}">${y}</option>`);
  toSel.insertAdjacentHTML("beforeend", `<option value="${y}">${y}</option>`);
}
fromSel.value = "2006"; toSel.value = String(NOW_YEAR);

// ---- theme ----
$("#themeBtn").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
});

// ---- discover available sources ----
fetch("/api/config").then((r) => r.json()).then((cfg) => {
  const xBtn = document.querySelector('.sources [data-src="xapi"]');
  if (cfg.sources && cfg.sources.xapi) { xBtn.disabled = false; xBtn.title = "Official X API v2"; }
}).catch(() => {});

// ---- source toggle ----
$("#sources").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-src]"); if (!b || b.disabled) return;
  state.source = b.dataset.src;
  document.querySelectorAll(".sources button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  $("#textToggleWrap").style.display = state.source === "archive" ? "" : "none";
});

// ---- presets ----
$("#presets").addEventListener("click", (e) => {
  const b = e.target.closest(".preset"); if (!b) return;
  fromSel.value = b.dataset.f;
  toSel.value = String(Math.min(+b.dataset.t, NOW_YEAR));
  document.querySelectorAll(".preset").forEach((p) => p.classList.toggle("on", p === b));
  run();
});

const setStatus = (html, spin) => { $("#status").innerHTML = (spin ? '<span class="spinner"></span>' : "") + html; };
const note = (html, warn) => { $("#notes").innerHTML += `<div class="note ${warn ? "warn" : ""}">${html}</div>`; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmtDate = (iso) => { const d = new Date(iso); return MON[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear(); };
const fmtCap = (ts) => ts.slice(0,4) + "-" + ts.slice(4,6) + "-" + ts.slice(6,8);
const fmtNum = (n) => (n == null ? "" : n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1e3 ? (n/1e3).toFixed(1)+"K" : ""+n);

async function run() {
  const from = +fromSel.value, to = +toSel.value;
  const rawHandle = $("#handle").value.trim();
  if (!rawHandle) { setStatus("Enter a handle to begin.", false); return; }
  $("#go").disabled = true;
  $("#notes").innerHTML = ""; $("#feed").innerHTML = ""; $("#histWrap").innerHTML = ""; $("#profile").innerHTML = "";
  state.items = []; state.yearFilter = null; state.profile = null; state.mode = null;
  setStatus(`Searching ${state.source === "archive" ? "the Internet Archive" : "the X API"} for tweets…`, true);

  const qs = new URLSearchParams({ handle: rawHandle, from: String(from), to: String(to) });
  const endpoint = state.source === "archive" ? "/api/archive" : "/api/xapi";
  let data;
  try {
    const res = await fetch(`${endpoint}?${qs}`);
    data = await res.json();
    if (!res.ok) throw Object.assign(new Error(data.message || "Request failed"), { code: data.error });
  } catch (e) {
    setStatus("", false);
    note(`<b>Couldn't load tweets.</b> ${esc(e.message || "Network error.")}`, true);
    $("#go").disabled = false;
    return;
  }

  state.handle = data.handle || rawHandle.replace(/^@/, "");
  state.items = data.tweets || [];
  state.mode = data.mode || null;
  state.profile = data.user || null;

  setStatus("", false);
  if (state.profile) renderProfile(state.profile);

  if (!state.items.length) {
    $("#feed").innerHTML = `<div class="empty"><div class="big">🕳️</div>No tweets found for <b>@${esc(state.handle)}</b> in ${from}–${to}.<br>Try widening the years${state.source === "archive" ? ", or a more heavily-archived account" : ""}.</div>`;
    $("#go").disabled = false;
    return;
  }

  if (state.source === "archive") {
    const dated = state.items.filter((t) => t.iso).length;
    setStatus(`Found <b>${data.count}</b> archived tweet${data.count !== 1 ? "s" : ""} for <b>@${esc(state.handle)}</b> · ${dated} precisely dated.`, false);
    if (data.truncated) note(`This account is heavily archived; results were capped at the first ${data.scanned}. Narrow the year range to see more.`, false);
  } else {
    setStatus(`Loaded <b>${data.count}</b> tweet${data.count !== 1 ? "s" : ""} for <b>@${esc(state.handle)}</b> via the X API.`, false);
    if (state.mode === "timeline") note(`This token's access tier doesn't include full-archive search, so this shows the account's most recent tweets only (filtered to your year range). Full history to 2012 needs an elevated (Academic/Pro/Enterprise) tier.`, true);
  }

  renderHist();
  renderFeed();
  if (state.source === "archive" && $("#tryText").checked) hydrateText();
  $("#go").disabled = false;
}

function renderProfile(u) {
  $("#profile").innerHTML = `<div class="profile">
    ${u.avatar ? `<img src="${esc(u.avatar)}" alt="" referrerpolicy="no-referrer" />` : ""}
    <div>
      <div class="nm">${esc(u.name || "@" + u.username)}</div>
      <div class="mt">@${esc(u.username)}${u.created_at ? " · joined " + new Date(u.created_at).getUTCFullYear() : ""}${u.metrics ? " · " + fmtNum(u.metrics.followers_count) + " followers · " + fmtNum(u.metrics.tweet_count) + " tweets" : ""}</div>
    </div></div>`;
}

function yearOf(t) { return t.year || (t.iso ? new Date(t.iso).getUTCFullYear() : (t.capTs ? +t.capTs.slice(0,4) : null)); }

function renderHist() {
  const counts = {};
  state.items.forEach((t) => { const y = yearOf(t); if (y) counts[y] = (counts[y] || 0) + 1; });
  const years = Object.keys(counts).map(Number).sort((a, b) => a - b);
  if (!years.length) { $("#histWrap").innerHTML = ""; return; }
  const span = []; for (let y = years[0]; y <= years[years.length - 1]; y++) span.push(y);
  const mx = Math.max(...Object.values(counts));
  $("#histWrap").innerHTML = `<div class="hist-card"><h2>Tweets per year</h2>
    <div class="h-sub">Click a year to filter${state.source === "archive" ? " · dated from each tweet's Snowflake ID" : ""}</div>
    <div class="hist">${span.map((y) => `
      <div class="hb ${state.yearFilter === y ? "on" : ""} ${state.yearFilter && state.yearFilter !== y ? "dim" : ""}" data-y="${y}">
        <div class="hc">${counts[y] || ""}</div>
        <div class="bar" style="height:${((counts[y] || 0) / mx) * 100}%"></div>
        <div class="yl">${String(y).slice(2)}</div>
      </div>`).join("")}</div></div>`;
  $("#histWrap").querySelectorAll(".hb").forEach((b) => b.addEventListener("click", () => {
    const y = +b.dataset.y; state.yearFilter = state.yearFilter === y ? null : y;
    renderHist(); renderFeed(); if (state.source === "archive" && $("#tryText").checked) hydrateText();
  }));
}

function renderFeed() {
  const list = state.yearFilter ? state.items.filter((t) => yearOf(t) === state.yearFilter) : state.items;
  const groups = {};
  list.forEach((t) => {
    const key = t.iso ? t.iso.slice(0, 7) : "undated";
    (groups[key] = groups[key] || []).push(t);
  });
  const keys = Object.keys(groups).sort().reverse();
  $("#feed").innerHTML = keys.map((k) => {
    const label = k === "undated" ? "Undated captures" : MON[+k.slice(5, 7) - 1] + " " + k.slice(0, 4);
    return `<div class="mgroup"><div class="mh">${label} · ${groups[k].length}</div>${groups[k].map(card).join("")}</div>`;
  }).join("");
}

function card(t) {
  const avatar = state.profile && state.profile.avatar
    ? `<img src="${esc(state.profile.avatar)}" alt="" referrerpolicy="no-referrer" />`
    : esc((state.handle[0] || "?").toUpperCase());
  const when = t.iso ? fmtDate(t.iso) : "date unknown";
  const text = t.text != null
    ? `<div class="txt">${esc(t.text)}</div>`
    : `<div class="txt pending" data-txt="${t.id}" data-cap="${t.capTs || ""}">Loading archived text…</div>`;
  const metrics = t.metrics ? `<span class="met">♥ ${fmtNum(t.metrics.like_count)} · ↻ ${fmtNum(t.metrics.retweet_count)}</span>` : "";
  const archivedLink = t.wayback ? `<a href="${esc(t.wayback)}" target="_blank" rel="noopener">↗ Archived</a>` : "";
  const cap = t.capTs ? `<span class="cap">archived ${fmtCap(t.capTs)}</span>` : "";
  return `<div class="tw" id="tw-${t.id}">
    <div class="av">${avatar}</div>
    <div class="body">
      <div class="top"><span class="nm">@${esc(state.handle)}</span><span class="hd">·</span><span class="dt">${when}</span></div>
      ${text}
      <div class="acts">
        ${archivedLink}
        <a href="${esc(t.live || "https://twitter.com/" + state.handle + "/status/" + t.id)}" target="_blank" rel="noopener">↗ Live</a>
        ${metrics}${cap}
      </div>
    </div></div>`;
}

async function hydrateText() {
  const pend = [...document.querySelectorAll(".txt.pending")].slice(0, 20);
  await Promise.allSettled(pend.map(async (el) => {
    const id = el.dataset.txt, cap = el.dataset.cap;
    try {
      const r = await fetch(`/api/archive/text?handle=${encodeURIComponent(state.handle)}&id=${id}&capTs=${cap}`);
      const j = await r.json();
      if (j.text) { el.textContent = j.text; el.classList.remove("pending"); }
      else { el.textContent = ""; el.classList.remove("pending"); }
    } catch { el.textContent = ""; el.classList.remove("pending"); }
  }));
  document.querySelectorAll(".txt.pending").forEach((t) => { t.textContent = ""; t.classList.remove("pending"); });
}

$("#go").addEventListener("click", run);
$("#handle").addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
$("#tryText").addEventListener("change", () => {
  if (state.source === "archive" && state.items.length) {
    if ($("#tryText").checked) hydrateText();
    else document.querySelectorAll(".txt").forEach((t) => { t.textContent = ""; t.classList.remove("pending"); });
  }
});

setStatus('Enter a handle and pick an era — try <b>@jack</b> (first tweet, 2006) or <b>@nasa</b>.', false);
