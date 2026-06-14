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
- **Works gallery** + an **outro** with rising embers and `1821 — 1881`.
- **Blipping cursor** — the pointer emits Dostoevskian words (SUFFERING, FAITH,
  REDEMPTION, СТРАДАНИЕ…) as you move.

## Stack

- **[Three.js](https://threejs.org/)** — candle + ember particle scenes
- **[GSAP](https://gsap.com/) + ScrollTrigger** — reveals, redaction bars, the pinned
  book-flip timeline, parallax, loader
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scroll, synced to ScrollTrigger

Everything is **self-contained** — libraries vendored in `/vendor`, artwork generated
in SVG/canvas/WebGL, no external runtime assets (fonts are the only CDN call, with
serif/sans fallbacks).

## Run

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | All sections + content |
| `styles.css` | Palette, grain, book-flip 3D, responsive |
| `app.js` | Three.js scenes, Lenis, ScrollTrigger reveals, book-flip, cursor blips, procedural engraving |
| `vendor/` | three, gsap, ScrollTrigger, lenis |

## Notes

- **Production-hardened** — verified end-to-end with headless Chromium at 1440×820
  and 390×844: every section scrolls without breaking the pinned book, no console
  errors, the grid/newspaper collapse cleanly on mobile.
- **`prefers-reduced-motion`** — disables smooth scroll, blips and animation; the
  book opens to a static spread and all content stays visible.
