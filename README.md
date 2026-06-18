# SHASN — The Digital Election

A digital, hotseat-playable **fan adaptation of [Shasn](https://www.shasnthegame.com/)**
by Memesys / Zubin Pastakia. 2–5 players take on rival politicians in a national
election: take a stand on tough policy **dilemmas**, build a **conviction** persona,
bankroll an **agenda**, win over **voter blocs**, and scheme with **conspiracies** —
first to **30 voters** seizes power.

> Fan tribute, not affiliated with the publisher. The card text here is **original**,
> written in the spirit of the game — it is not the official deck. Rules are reimagined
> for solo / hotseat play with bots.

## Components (matches the brief)

- **108 Ideology cards** — 36 original policy dilemmas (×3). Each has two answers that
  grant **conviction** in one of four ideologies and matching **resources**.
- **120 Resources** — a shared national reserve of 30 each: **Trust, Funds, Muscle, Buzz**
  (one fuel per ideology: Idealist · Capitalist · Supremo · Showman).
- **60 Voter cards** — 20 archetypes (×3): Farmers, Industrialists, Slum Dwellers,
  Media Houses, Veterans… each with a resource cost and a voter (peg) value.
- **20 Conspiracy cards** — rig polls, raid rivals, smear, gerrymander, build a cult of
  personality… unlocked as your conviction grows.

## How to play (as in the brief)

1. **Pick colours & mats** — each player chooses a colour. You can **add/remove players (2–5)**
   and toggle any seat between **Human** and **Bot**.
2. **Vote for the first player** — everyone votes (not for themselves); ties are re-voted.
   (Or skip to a random first player.)
3. **Resource draft** — clockwise from player 1, each drafts more than the last
   (player 1 takes 1 resource, player 2 takes 2, …) onto their mat.
4. **Take turns clockwise.** On your turn: resolve an **Ideology** dilemma → optionally
   **capture a Voter** by paying resources → optionally play a **Conspiracy**. First to
   30 voters wins; if the voter deck empties, the most voters wins.

## Simulator & bots (to understand the game)

- Any seat can be a **Bot** — fill empty seats or watch the AI.
- **Auto-play turn** plays your current turn for you.
- **Simulate ▶▶** lets the bots play the rest of the game out so you can see how a full
  election unfolds.

## Run

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
(Pure static — `index.html` + `data.js` + `app.js` + `styles.css`. No build, no network.)

## Files

| File | Purpose |
| --- | --- |
| `data.js` | All cards: 36 dilemmas, 20 voters, 20 conspiracies, ideologies, colours |
| `app.js` | Game engine (state machine: setup → vote → draft → play → result), bots, simulator, UI |
| `styles.css` | Bold, four-ideology visual style |
| `index.html` | Shell |

## Notes

Verified with headless Chromium: exact component counts (108 / 120 / 60 / 20, target 30);
full all-bot games for 2, 3, 4 and 5 players each resolve to a winner; the human flow
(first-player vote → resource draft → ideology turns → capture → win) works end to end;
responsive; no console errors.
