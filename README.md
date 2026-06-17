# DOSTOEVSKY — Notes from the Soul

An immersive, scroll-driven literary website imagining **what a website for Fyodor
Dostoevsky might feel like** — his thoughts, quotes, novels and philosophy rendered
as a vintage manuscript. Built in the spirit of [orwell.byholm.co](https://orwell.byholm.co/):
grain, oxblood-red and parchment, propaganda-weight type set against a 19th-century
literary serif, a page-turning book, and 3D candlelight.

> A fan-made homage. Quotes are Dostoevsky's; the "newspaper" dramatises his real
> 1849 mock-execution and Siberian sentence.

## Experience

- **Hero** — a flickering 3D candle (Three.js) with rising embers behind a towering
  `DOSTOEVSKY`, framed by four aphorisms and a recurring `THE DOUBLE` concept label.
- **Statement & quotes** — word-by-word reveals; a hand-drawn engraving portrait
  bleeds behind the Crime & Punishment quote.
- **The Petersburg Herald** — a censored period front page (the scaffold pardon of
  1849) beside a procedurally-drawn engraving of chained prisoners marched to katorga.
- **The Collected Works** — a **scroll-driven page-turning book** (CSS 3D leaves,
  GSAP-pinned) cycling quotes from nine of his books.
- **Creed** — dense Notes-from-Underground columns around a floating black volume.
- **In His Own Words** — a deck of quote cards that **fan out with GSAP Flip** on
  enter, leading into…
- **A Life in Six Rooms** — an **immersive 3D life tour** (Three.js): a torch-lit
  camera journey through stylised architecture from his world — the Moscow hospital,
  the Semyonovsky scaffold, the Siberian palisade, a Petersburg tenement canyon, an
  Orthodox church with onion domes, and the final candle — each "room" cross-fading a
  **vintage sepia plate** and a chapter of his life as you scroll.
- **Book Walkthroughs** — click any novel in the gallery to open a full-screen study:
  a synopsis ("walkthrough"), its philosophy, a thematic illustration, an **interactive
  character-relationship graph** (hover a name to trace their bonds), the full cast, and
  that book's popular quotes. Content cross-checked against public references.
- **The Quote Archive** — a searchable, source-checked concordance of ~50 quotations
  across his novels and tales. Live search (with highlighting), filter by book, and
  click any line to copy it. Attributions were cross-checked against public quote
  repositories and the texts; commonly mis-attributed lines were excluded.
- **Works gallery** + an **outro** with rising embers and `1821 — 1881`.
- **Dostoevsky's Slambook** — a deliberately clashing **Y2K / high-school scrapbook**
  page: gel-pen fonts, WordArt, lined paper, sketchy doodles and stickers, filled in
  as "Fedya" from his real biography (with a couple of knowing anachronistic gags).
  Includes a **"Class of Y-Combinator" yearbook** — flip-cards of ~26 **real** YC-backed
  companies, each given a Dostoevskian verdict. (The full 5,000+ YC directory can't be
  scraped in this sandbox — outbound network is blocked — so it's a hand-picked, clearly
  labelled sample of genuine YC alumni, not invented startups.)
- **Blipping cursor** — the pointer emits Dostoevskian words (SUFFERING, FAITH,
  REDEMPTION, СТРАДАНИЕ…) as you move.

## Stack

- **[Three.js](https://threejs.org/)** — candle + ember particle scenes and the
  architectural 3D life-tour corridor
- **[GSAP](https://gsap.com/)** — **ScrollTrigger** (reveals, redaction bars, the
  pinned book-flip, the pinned scrubbed life-tour camera, parallax) and **Flip**
  (the fanning quote deck)
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scroll, synced to ScrollTrigger

Everything is **self-contained** — libraries vendored in `/vendor`, artwork generated
in SVG/canvas/WebGL (including the vintage sepia life plates), no external runtime
assets (fonts are the only CDN call, with serif/sans fallbacks).

## Run

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All sections + content |
| `styles.css` | Palette, grain, book-flip 3D, responsive |
| `app.js` | Three.js scenes (candle, embers, life-tour architecture), Lenis, ScrollTrigger reveals + book-flip + life-tour, Flip quote deck, cursor blips, procedural engravings/plates |
| `vendor/` | three, gsap, ScrollTrigger, Flip, lenis |

## Notes

- **Production-hardened** — verified end-to-end with headless Chromium at 1440×820
  and 390×844: every section scrolls without breaking the pinned book, no console
  errors, the grid/newspaper collapse cleanly on mobile.
- **`prefers-reduced-motion`** — disables smooth scroll, blips and animation; the
  book opens to a static spread and all content stays visible.
