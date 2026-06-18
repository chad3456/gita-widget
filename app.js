/* =========================================================
   SHASN — digital adaptation · engine + UI
   ========================================================= */
(function () {
  "use strict";
  const D = window.SHASN;
  const RES = ["trust", "funds", "muscle", "buzz"];
  const RES_NAME = { trust: "Trust", funds: "Funds", muscle: "Muscle", buzz: "Buzz" };
  const RES_COLOR = { trust: "#f2b705", funds: "#2d9cdb", muscle: "#eb5757", buzz: "#27ae60" };
  const IDEO = D.IDEOLOGIES;
  const IDEO_BY = {}; IDEO.forEach(i => IDEO_BY[i.id] = i);
  const MARKET_SIZE = 5;
  const TARGET = D.VOTER_TARGET;

  const rint = n => Math.floor(Math.random() * n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rint(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sum = o => RES.reduce((s, k) => s + (o[k] || 0), 0);
  const el = id => document.getElementById(id);

  let S = null;            // game state
  let modal = null;        // {title, body} or null

  /* ---------------- setup ---------------- */
  function freshSetup() {
    return {
      players: [
        { name: "Player 1", colorId: "crimson", bot: false },
        { name: "Player 2", colorId: "azure", bot: false },
        { name: "Player 3", colorId: "amber", bot: true },
      ],
    };
  }
  function startApp() { S = { phase: "setup", setup: freshSetup() }; render(); }

  function buildGame(cfg) {
    const players = cfg.players.map((p, i) => ({
      id: i, name: p.name.trim() || ("Player " + (i + 1)),
      color: D.COLORS.find(c => c.id === p.colorId).hex, colorName: D.COLORS.find(c => c.id === p.colorId).name,
      bot: !!p.bot,
      conv: { idealist: 0, capitalist: 0, supremo: 0, showman: 0 },
      ctier: { idealist: 0, capitalist: 0, supremo: 0, showman: 0 },
      res: { trust: 0, funds: 0, muscle: 0, buzz: 0 },
      voters: 0, captured: [], hand: [],
    }));
    S = {
      phase: "vote", players, seatOrder: players.map(p => p.id),
      pool: { trust: D.POOL_EACH, funds: D.POOL_EACH, muscle: D.POOL_EACH, buzz: D.POOL_EACH },
      decks: {
        ideology: shuffle([].concat(D.IDEOLOGY, D.IDEOLOGY, D.IDEOLOGY)),
        voter: shuffle([].concat(D.VOTERS, D.VOTERS, D.VOTERS)),
        conspiracy: shuffle(D.CONSPIRACIES.slice()),
      },
      market: [], order: [], turnIdx: 0, step: "ideology", currentCard: null,
      capturesLeft: 1, usedConspiracy: false, winner: null, log: [],
      vote: { idx: 0, votes: {}, round: 1, pool: null },
    };
    voteAdvanceBots();
  }

  function logMsg(html) { S.log.unshift(html); if (S.log.length > 60) S.log.pop(); }

  /* ---------------- first-player vote ---------------- */
  function eligible() { const v = S.vote; return S.players.filter(p => (!v.pool || v.pool.includes(p.id))); }
  function voteAdvanceBots() {
    const v = S.vote;
    while (v.idx < S.players.length && S.players[v.idx].bot) {
      castVoteInternal(v.idx, pickBotVote(v.idx)); v.idx++;
    }
    if (v.idx >= S.players.length) tallyVotes();
  }
  function pickBotVote(voterId) {
    const opts = eligible().filter(p => p.id !== voterId);
    return opts[rint(opts.length)].id;
  }
  function castVoteInternal(voterId, targetId) { S.vote.votes[voterId] = targetId; }
  function castVote(targetId) {
    const v = S.vote;
    castVoteInternal(v.idx, targetId); v.idx++;
    voteAdvanceBots(); render();
  }
  function tallyVotes() {
    const v = S.vote, tally = {};
    Object.values(v.votes).forEach(t => tally[t] = (tally[t] || 0) + 1);
    let max = -1, winners = [];
    eligible().forEach(p => { const c = tally[p.id] || 0; if (c > max) { max = c; winners = [p.id]; } else if (c === max) winners.push(p.id); });
    if (winners.length === 1 || v.round >= 4) {
      const first = winners.length === 1 ? winners[0] : winners[rint(winners.length)];
      beginDraft(first);
    } else {
      v.pool = winners; v.votes = {}; v.idx = 0; v.round++; voteAdvanceBots();
    }
  }
  function quickStart() { beginDraft(rint(S.players.length)); }

  /* ---------------- resource draft ---------------- */
  function beginDraft(firstId) {
    const n = S.players.length, start = S.seatOrder.indexOf(firstId);
    S.order = []; for (let k = 0; k < n; k++) S.order.push(S.seatOrder[(start + k) % n]);
    S.phase = "draft"; S.draft = { i: 0, taken: 0 };
    logMsg(`<b style="color:${player(firstId).color}">${player(firstId).name}</b> won the vote and goes first.`);
    draftAdvanceBots(); render();
  }
  const draftNeed = i => i + 1; // order index i takes i+1 resources
  function draftAdvanceBots() {
    const d = S.draft;
    while (d.i < S.order.length && player(S.order[d.i]).bot) {
      const need = draftNeed(d.i), p = player(S.order[d.i]);
      for (let k = 0; k < need; k++) { const t = bestDraftRes(); if (t) { p.res[t]++; S.pool[t]--; } }
      d.i++; d.taken = 0;
    }
    if (d.i >= S.order.length) startPlay();
  }
  function bestDraftRes() { // pick the type with most left, for variety
    let best = null, bv = -1; RES.forEach(t => { if (S.pool[t] > bv) { bv = S.pool[t]; best = t; } }); return bv > 0 ? best : null;
  }
  function draftTake(type) {
    const d = S.draft, p = player(S.order[d.i]);
    if (S.pool[type] <= 0) return;
    p.res[type]++; S.pool[type]--; d.taken++;
    if (d.taken >= draftNeed(d.i)) { d.i++; d.taken = 0; draftAdvanceBots(); }
    render();
  }

  /* ---------------- play ---------------- */
  const cur = () => player(S.order[S.turnIdx]);
  function player(id) { return S.players.find(p => p.id === id); }

  function startPlay() {
    S.phase = "play"; S.turnIdx = 0; refillMarket(); drawTurnCard();
    logMsg(`The national election begins. First to <b>${TARGET}</b> voters wins.`);
    runBots(); render();
  }
  function refillMarket() { while (S.market.length < MARKET_SIZE && S.decks.voter.length) S.market.push(S.decks.voter.pop()); }
  function drawTurnCard() {
    if (!S.decks.ideology.length) S.decks.ideology = shuffle([].concat(D.IDEOLOGY, D.IDEOLOGY, D.IDEOLOGY));
    S.currentCard = S.decks.ideology.pop(); S.step = "ideology"; S.capturesLeft = 1; S.usedConspiracy = false;
  }
  function nextTurn() {
    if (S.decks.voter.length === 0 && S.market.length === 0) { endByExhaustion(); return; }
    S.turnIdx = (S.turnIdx + 1) % S.order.length; drawTurnCard();
  }
  function runBots() {
    let safety = 20000;
    while (!S.winner && cur().bot && safety-- > 0) { botResolve(cur()); if (S.winner) break; nextTurn(); }
  }
  function endTurnHuman() { if (S.winner) return; nextTurn(); runBots(); render(); }

  function gainRes(p, obj) { for (const k in obj) { const take = Math.min(obj[k], S.pool[k]); p.res[k] += take; S.pool[k] -= take; } }
  function addConv(p, obj) {
    for (const k in obj) {
      p.conv[k] += obj[k];
      const tier = Math.floor(p.conv[k] / 5);
      while (p.ctier[k] < tier) { p.ctier[k]++; drawConspiracy(p); }
    }
  }
  function drawConspiracy(p) {
    if (!S.decks.conspiracy.length) S.decks.conspiracy = shuffle(D.CONSPIRACIES.slice());
    const c = S.decks.conspiracy.pop(); p.hand.push(c);
    logMsg(`<b style="color:${p.color}">${p.name}</b> drew a conspiracy: <i>${c.n}</i>.`);
  }

  function applyAnswer(p, key) {
    const card = S.currentCard, ans = card[key];
    addConv(p, ans.c); gainRes(p, ans.r);
    logMsg(`<b style="color:${p.color}">${p.name}</b>: “${ans.t}.”`);
    S.step = "actions";
  }

  function canAfford(p, cost) { return RES.every(k => (p.res[k] || 0) >= (cost[k] || 0)); }
  function captureVoter(idx) {
    const p = cur(), card = S.market[idx];
    if (!card || S.capturesLeft < 1 || !canAfford(p, card.cost)) return false;
    for (const k in card.cost) { p.res[k] -= card.cost[k]; S.pool[k] += card.cost[k]; }
    p.voters += card.v; p.captured.push(card.n); S.market.splice(idx, 1); refillMarket();
    S.capturesLeft--;
    logMsg(`<b style="color:${p.color}">${p.name}</b> won over <b>${card.n}</b> (+${card.v} voters).`);
    checkWin(p); return true;
  }
  function checkWin(p) { if (p.voters >= TARGET && !S.winner) { S.winner = p; S.phase = "over"; logMsg(`🏆 <b style="color:${p.color}">${p.name}</b> seizes power with ${p.voters} voters!`); } }

  function strongestIdeo(p) { let best = "idealist", bv = -1; IDEO.forEach(i => { if (p.conv[i.id] > bv) { bv = p.conv[i.id]; best = i.id; } }); return best; }
  function richestOpponent(p) { let r = null, rv = -1; S.players.forEach(q => { if (q.id !== p.id) { const t = sum(q.res); if (t > rv) { rv = t; r = q; } } }); return r; }
  function takeResourcesFrom(q, n) { // returns map of what was taken
    const got = {}; let left = n;
    const order = RES.slice().sort((a, b) => q.res[b] - q.res[a]);
    for (const k of order) { while (left > 0 && q.res[k] > 0) { q.res[k]--; got[k] = (got[k] || 0) + 1; left--; } }
    return got;
  }
  function playConspiracy(handIdx) {
    const p = cur(), card = p.hand[handIdx];
    if (!card || S.usedConspiracy) return;
    const fx = card.fx;
    if (fx.k === "voters") { p.voters += fx.n; checkWin(p); }
    else if (fx.k === "res") { gainRes(p, { [fx.res]: fx.n }); }
    else if (fx.k === "conv") { addConv(p, { [strongestIdeo(p)]: fx.n }); }
    else if (fx.k === "steal") { const q = richestOpponent(p); if (q) { const g = takeResourcesFrom(q, fx.n); for (const k in g) p.res[k] += g[k]; } }
    else if (fx.k === "drain") { S.players.forEach(q => { if (q.id !== p.id) { const g = takeResourcesFrom(q, fx.n); for (const k in g) S.pool[k] += g[k]; } }); }
    else if (fx.k === "double") { S.capturesLeft += 1; }
    p.hand.splice(handIdx, 1); S.usedConspiracy = true;
    logMsg(`<b style="color:${p.color}">${p.name}</b> plays <i>${card.n}</i> — ${card.d}`);
    if (S.phase !== "over") render();
  }

  function endByExhaustion() {
    let best = S.players[0]; S.players.forEach(p => { if (p.voters > best.voters) best = p; });
    S.winner = best; S.phase = "over";
    logMsg(`🏁 The voter deck is empty. <b style="color:${best.color}">${best.name}</b> leads with ${best.voters} voters.`);
  }

  /* ---------------- bots ---------------- */
  function answerValue(p, ans) {
    let v = sum(ans.r) * 1.0;                 // resources are king (spent on voters)
    for (const k in ans.c) v += ans.c[k] * 0.45;
    // nudge toward resources the bot can use for an affordable voter soon
    return v + Math.random() * 0.2;
  }
  function botResolve(p) {
    if (S.step === "ideology") { const c = S.currentCard; applyAnswer(p, answerValue(p, c.a) >= answerValue(p, c.b) ? "a" : "b"); }
    // conspiracy: play a voters/steal/res card if it helps
    if (!S.usedConspiracy && p.hand.length) {
      let idx = p.hand.findIndex(c => c.fx.k === "voters" || c.fx.k === "double" || c.fx.k === "steal");
      if (idx < 0) idx = 0;
      const c = p.hand[idx];
      if (c.fx.k !== "double" || affordableMarket(p).length) playConspiracy(idx);
    }
    // capture best affordable voter(s)
    let guard = 6;
    while (S.capturesLeft > 0 && guard-- > 0) {
      const aff = affordableMarket(p);
      if (!aff.length) break;
      aff.sort((x, y) => S.market[y].v - S.market[x].v);
      if (!captureVoter(aff[0])) break;
    }
  }
  function affordableMarket(p) { const out = []; S.market.forEach((c, i) => { if (canAfford(p, c.cost)) out.push(i); }); return out; }

  function autoPlayTurn() { if (S.winner) return; botResolve(cur()); if (!S.winner) { nextTurn(); runBots(); } render(); }
  function simulateAll() {
    let safety = 20000;
    while (!S.winner && safety-- > 0) { botResolve(cur()); if (S.winner) break; nextTurn(); }
    render();
  }

  /* =========================================================
     RENDERING
     ========================================================= */
  function render() {
    const root = el("app");
    if (S.phase === "setup") root.innerHTML = viewSetup();
    else if (S.phase === "vote") root.innerHTML = viewVote();
    else if (S.phase === "draft") root.innerHTML = viewDraft();
    else if (S.phase === "play") root.innerHTML = viewPlay();
    else if (S.phase === "over") root.innerHTML = viewOver();
    el("modal").innerHTML = modal ? viewModal() : "";
    el("modal").style.display = modal ? "grid" : "none";
  }

  const pegRow = (color, n, max) => {
    let s = '<div class="pegs">';
    for (let i = 0; i < Math.min(n, 40); i++) s += `<span class="peg" style="background:${color}"></span>`;
    s += "</div>"; return s;
  };
  const resChip = (t, n) => `<span class="chip" style="--c:${RES_COLOR[t]}">${RES_NAME[t]} <b>${n}</b></span>`;
  const convPill = (p) => IDEO.map(i => `<span class="conv" style="--c:${i.color}" title="${i.name}">${i.name[0]}<b>${p.conv[i.id]}</b></span>`).join("");

  function viewSetup() {
    const used = S.setup.players.map(p => p.colorId);
    const rows = S.setup.players.map((p, i) => `
      <div class="srow">
        <span class="snum">${i + 1}</span>
        <input class="sname" data-act="name" data-i="${i}" value="${p.name}" maxlength="18"/>
        <div class="scolors">${D.COLORS.map(c => `<button class="sdot ${p.colorId === c.id ? "on" : ""}" data-act="color" data-i="${i}" data-c="${c.id}" style="background:${c.hex}" ${used.includes(c.id) && p.colorId !== c.id ? "disabled" : ""}></button>`).join("")}</div>
        <button class="sbot ${p.bot ? "on" : ""}" data-act="bot" data-i="${i}">${p.bot ? "🤖 Bot" : "🙂 Human"}</button>
        ${S.setup.players.length > 2 ? `<button class="srm" data-act="rmplayer" data-i="${i}">✕</button>` : ""}
      </div>`).join("");
    return `
    <div class="screen setup">
      <div class="brand"><span>SHASN</span><i>the digital election</i></div>
      <p class="tagline">2–5 politicians. 108 ideologies, 120 resources, 60 voter blocs, 20 conspiracies.
        Build a persona, bankroll an agenda, win the masses — by hook or by crook.</p>
      <div class="card setup__card">
        <div class="setup__h">PLAYERS <small>${S.setup.players.length}/5</small></div>
        ${rows}
        ${S.setup.players.length < 5 ? `<button class="ghost add" data-act="addplayer">+ Add player</button>` : ""}
      </div>
      <div class="setup__go">
        <button class="primary big" data-act="begin">Hold the election ▶</button>
        <button class="ghost" data-act="rules">How to play</button>
      </div>
      <p class="fineprint">A fan-made tribute to <b>Shasn</b> by Memesys / Zubin Pastakia. Original card text; not affiliated with the publisher.</p>
    </div>`;
  }

  function viewVote() {
    const v = S.vote, voter = S.players[v.idx];
    return `<div class="screen vote">
      <div class="phasehead"><span>STEP 1</span> CHOOSE THE FIRST PLAYER ${v.round > 1 ? "· RE-VOTE (tie)" : ""}</div>
      <p class="phasesub">Everyone votes for who should take the first turn — you cannot vote for yourself. A tie means another round.</p>
      <div class="card votecard">
        <div class="voteturn"><span class="dot" style="background:${voter.color}"></span> <b>${voter.name}</b>, who goes first?</div>
        <div class="voteopts">
          ${eligible().filter(p => p.id !== voter.id).map(p => `<button class="voteopt" data-act="vote" data-t="${p.id}"><span class="dot" style="background:${p.color}"></span>${p.name}</button>`).join("")}
        </div>
      </div>
      <button class="ghost" data-act="quick">Skip — randomise first player</button>
    </div>`;
  }

  function viewDraft() {
    const d = S.draft, p = player(S.order[d.i]), need = draftNeed(d.i);
    return `<div class="screen draft">
      <div class="phasehead"><span>STEP 2</span> THE RESOURCE DRAFT</div>
      <p class="phasesub">Going clockwise from the first player, each takes more than the last: player 1 takes 1 resource, player 2 takes 2, and so on. Stock your war chest.</p>
      <div class="pool">${RES.map(t => `<div class="poolres"><span class="chip" style="--c:${RES_COLOR[t]}">${RES_NAME[t]}</span><b>${S.pool[t]}</b><small>left</small></div>`).join("")}</div>
      <div class="card draftcard">
        <div class="voteturn"><span class="dot" style="background:${p.color}"></span> <b>${p.name}</b> — take <b>${need - d.taken}</b> more (${d.taken}/${need})</div>
        <div class="voteopts">
          ${RES.map(t => `<button class="voteopt" data-act="draft" data-t="${t}" ${S.pool[t] <= 0 ? "disabled" : ""}><span class="dot" style="background:${RES_COLOR[t]}"></span>${RES_NAME[t]} <small>(${S.pool[t]})</small></button>`).join("")}
        </div>
      </div>
      <div class="mats">${S.order.map((id, k) => matMini(player(id), k === d.i)).join("")}</div>
    </div>`;
  }
  function matMini(p, active) {
    return `<div class="matmini ${active ? "active" : ""}" style="--c:${p.color}">
      <div class="mm__name">${p.bot ? "🤖 " : ""}${p.name}</div>
      <div class="mm__res">${RES.map(t => `<span class="chip sm" style="--c:${RES_COLOR[t]}">${p.res[t]}</span>`).join("")}</div>
    </div>`;
  }

  function viewPlay() {
    const p = cur();
    const center = S.step === "ideology" ? ideologyCard(p) : actionPanel(p);
    return `<div class="screen play">
      <div class="topbar">
        <div class="brand sm"><span>SHASN</span></div>
        <div class="turnind">TURN: <b style="color:${p.color}">${p.bot ? "🤖 " : ""}${p.name}</b> <small>· target ${TARGET} voters</small></div>
        <div class="tools">
          ${p.bot ? "" : `<button class="ghost sm" data-act="auto">Auto-play turn</button>`}
          <button class="ghost sm" data-act="simulate">Simulate ▶▶</button>
          <button class="ghost sm" data-act="rules">Rules</button>
          <button class="ghost sm" data-act="restart">New game</button>
        </div>
      </div>
      <div class="playgrid">
        <div class="col-main">${center}</div>
        <div class="col-side">
          <div class="poolbar">${RES.map(t => `<span class="chip sm" style="--c:${RES_COLOR[t]}" title="${RES_NAME[t]} in bank">${RES_NAME[t][0]} ${S.pool[t]}</span>`).join("")}<small>national reserve</small></div>
          <div class="mats col">${S.players.map(pl => matFull(pl, pl.id === p.id)).join("")}</div>
        </div>
      </div>
      <div class="log" id="log">${S.log.slice(0, 7).map(l => `<div>${l}</div>`).join("")}</div>
    </div>`;
  }

  function ideologyCard(p) {
    const c = S.currentCard;
    const ans = (key) => { const a = c[key]; return `
      <button class="ansbtn" data-act="answer" data-k="${key}" ${p.bot ? "disabled" : ""}>
        <span class="ans__t">${a.t}</span>
        <span class="ans__g">${Object.keys(a.c).map(k => `<span class="conv" style="--c:${IDEO_BY[k].color}">${IDEO_BY[k].name} +${a.c[k]}</span>`).join("")}
          ${Object.keys(a.r).map(k => `<span class="chip sm" style="--c:${RES_COLOR[k]}">+${a.r[k]} ${RES_NAME[k]}</span>`).join("")}</span>
      </button>`; };
    return `<div class="card ideocard">
      <div class="ideocard__tag">IDEOLOGY · TAKE A STAND</div>
      <div class="ideocard__q">${c.q}</div>
      <div class="ideocard__ans">${ans("a")}${ans("b")}</div>
      ${p.bot ? `<div class="botnote">🤖 ${p.name} is deciding… press <b>Simulate</b> or <b>Auto-play</b> to continue.</div>` : ""}
    </div>`;
  }

  function actionPanel(p) {
    const aff = new Set(affordableMarket(p));
    const market = S.market.map((c, i) => `
      <div class="voter ${aff.has(i) ? "ok" : "no"}">
        <div class="voter__name">${c.n}</div>
        <div class="voter__cost">${Object.keys(c.cost).map(k => `<span class="chip xs" style="--c:${RES_COLOR[k]}">${c.cost[k]} ${RES_NAME[k]}</span>`).join("")}</div>
        <div class="voter__v">+${c.v}<small>voters</small></div>
        <button class="cap" data-act="capture" data-i="${i}" ${(!aff.has(i) || S.capturesLeft < 1) ? "disabled" : ""}>Win over</button>
      </div>`).join("");
    const hand = p.hand.length ? `<div class="hand"><div class="hand__h">YOUR CONSPIRACIES ${S.usedConspiracy ? "· used this turn" : ""}</div>
      <div class="hand__cards">${p.hand.map((c, i) => `<button class="consp" data-act="conspiracy" data-i="${i}" ${S.usedConspiracy ? "disabled" : ""}><b>${c.n}</b><span>${c.d}</span></button>`).join("")}</div></div>` : "";
    return `<div class="actionwrap">
      <div class="actbar">
        <span>Captures left: <b>${S.capturesLeft}</b></span>
        ${p.bot ? "" : `<button class="primary" data-act="end">End turn ▶</button>`}
      </div>
      <div class="market">${market || '<div class="empty">The voter deck is exhausted.</div>'}</div>
      ${hand}
    </div>`;
  }

  function matFull(p, active) {
    const top = strongestIdeo(p);
    return `<div class="mat ${active ? "active" : ""}" style="--c:${p.color}">
      <div class="mat__top"><span class="dot" style="background:${p.color}"></span><b>${p.bot ? "🤖 " : ""}${p.name}</b><span class="mat__vt">${p.voters}<small>/${TARGET}</small></span></div>
      <div class="mat__bar"><span style="width:${Math.min(100, p.voters / TARGET * 100)}%;background:${p.color}"></span></div>
      <div class="mat__res">${RES.map(t => `<span class="chip xs" style="--c:${RES_COLOR[t]}">${p.res[t]}</span>`).join("")}</div>
      <div class="mat__conv">${convPill(p)}</div>
      ${p.hand.length ? `<div class="mat__cons">🃏 ${p.hand.length} conspiracy${p.hand.length > 1 ? "s" : ""}</div>` : ""}
    </div>`;
  }

  function viewOver() {
    const w = S.winner;
    const ranked = S.players.slice().sort((a, b) => b.voters - a.voters);
    return `<div class="screen over">
      <div class="winwrap" style="--c:${w.color}">
        <div class="wintag">ELECTION RESULT</div>
        <div class="winname">${w.name} wins.</div>
        <div class="winsub">A ${IDEO_BY[strongestIdeo(w)].name.toUpperCase()} at heart — ${w.voters} voters secured.</div>
      </div>
      <div class="results">${ranked.map((p, i) => `<div class="resrow" style="--c:${p.color}">
        <span class="rank">${i + 1}</span><span class="dot" style="background:${p.color}"></span>
        <b>${p.name}</b><span class="rv">${p.voters} voters</span>
        <span class="ri">${IDEO_BY[strongestIdeo(p)].name}</span></div>`).join("")}</div>
      <button class="primary big" data-act="restart">Play again</button>
    </div>`;
  }

  function viewModal() {
    return `<div class="modal__card">
      <button class="modal__x" data-act="closemodal">✕</button>
      <h2>${modal.title}</h2>${modal.body}</div>`;
  }
  function rulesBody() {
    return `
      <p><b>Goal.</b> Be first to win over <b>${TARGET} voters</b> in the national election.</p>
      <h3>Setup</h3>
      <ol>
        <li>Each player picks a colour and a mat.</li>
        <li>Everyone votes for who goes first (not yourself); ties are re-voted.</li>
        <li>Clockwise from player 1, each drafts more resources than the last (1, 2, 3 …) onto their mat.</li>
      </ol>
      <h3>On your turn</h3>
      <ol>
        <li><b>Take a stand.</b> Resolve an <b>Ideology card</b> — pick one of two answers. It builds your <b>conviction</b> (Idealist · Capitalist · Supremo · Showman) and earns matching <b>resources</b>.</li>
        <li><b>Win the masses.</b> Spend resources to capture a <b>Voter card</b> from the market (one per turn).</li>
        <li><b>Scheme.</b> Cross every 5th point of conviction in an ideology to draw a <b>Conspiracy</b>; play one per turn for an edge.</li>
      </ol>
      <p>Each ideology is fuelled by its own resource — Idealist↔Trust, Capitalist↔Funds, Supremo↔Muscle, Showman↔Buzz — drawn from a shared reserve of 120.</p>
      <p class="fineprint">Fan adaptation; rules reimagined in the spirit of Shasn for solo/hotseat play with bots.</p>`;
  }

  /* ---------------- event handling ---------------- */
  document.addEventListener("input", e => {
    const t = e.target.closest("[data-act='name']"); if (!t) return;
    S.setup.players[+t.dataset.i].name = t.value;
  });
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-act]"); if (!t) return;
    const a = t.dataset.act, i = +t.dataset.i;
    if (a === "addplayer") { const used = S.setup.players.map(p => p.colorId); const free = D.COLORS.find(c => !used.includes(c.id)); S.setup.players.push({ name: "Player " + (S.setup.players.length + 1), colorId: free.id, bot: true }); render(); }
    else if (a === "rmplayer") { S.setup.players.splice(i, 1); render(); }
    else if (a === "color") { if (!S.setup.players.some((p, k) => k !== i && p.colorId === t.dataset.c)) { S.setup.players[i].colorId = t.dataset.c; render(); } }
    else if (a === "bot") { S.setup.players[i].bot = !S.setup.players[i].bot; render(); }
    else if (a === "begin") { buildGame(S.setup); render(); }
    else if (a === "quick") { quickStart(); render(); }
    else if (a === "vote") { castVote(+t.dataset.t); }
    else if (a === "draft") { draftTake(t.dataset.t); }
    else if (a === "answer") { applyAnswer(cur(), t.dataset.k); render(); }
    else if (a === "capture") { captureVoter(i); render(); }
    else if (a === "conspiracy") { playConspiracy(i); }
    else if (a === "end") { endTurnHuman(); }
    else if (a === "auto") { autoPlayTurn(); }
    else if (a === "simulate") { if (confirm("Let the bots play out the rest of the game?")) simulateAll(); }
    else if (a === "restart") { startApp(); }
    else if (a === "rules") { modal = { title: "How to play", body: rulesBody() }; render(); }
    else if (a === "closemodal") { modal = null; render(); }
  });

  // expose for verification / debugging
  window.__SHASN = {
    state: () => S,
    build: (cfg) => { if (cfg) S.setup = cfg; buildGame(S.setup); render(); }, // all-bot configs auto-run to a winner
    simulate: () => simulateAll(),
    data: D,
  };

  startApp();
})();
