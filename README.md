# VANTA DYNAMICS

A modern, awwwards-style marketing site for a **fictional** autonomous-defence
startup. Built as a single static page with cinematic motion — a Three.js hero,
GSAP scroll choreography and Lenis smooth scroll — and fully responsive down to
mobile.

> ⚠️ VANTA Dynamics is entirely fictional. Nothing here represents a real
> product, company, or capability.

## Stack

- **HTML / CSS / vanilla JS** — no build step, no framework
- **[Three.js](https://threejs.org/)** — WebGL hero scene (wireframe core + drifting particle field with pointer parallax and scroll-driven camera)
- **[GSAP](https://gsap.com/) + ScrollTrigger** — preloader, hero reveal, word-clip text reveals, pinned horizontal scroll, animated counters, magnetic buttons, custom cursor
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scrolling, synced to ScrollTrigger

All three libraries are **vendored locally** in [`/vendor`](./vendor) so the site
has no external runtime dependency (fonts are the only CDN call, with a system
fallback).

## Run it

It's a static site — just serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or open `index.html` directly in a browser.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Markup and content |
| `styles.css` | Design system, layout, responsive rules |
| `main.js` | Three.js scene + all GSAP/Lenis interactions |
| `vendor/` | Pinned copies of three, gsap, ScrollTrigger, lenis |

## Sections

Hero · doctrine/mission · the fleet (Wraith V, Halo Mesh, Sentinel OS) ·
capabilities (pinned horizontal scroll) · stats · briefing CTA · footer.

## Notes on quality

- **Mobile-first responsive** — verified at 390 × 844 and 1440 × 900 with
  headless Chromium. The horizontal capability scroll gracefully collapses to a
  vertical stack on small screens.
- **Accessible motion** — everything respects `prefers-reduced-motion`, and the
  experience degrades gracefully if a library fails to load.
- **Performance** — capped device-pixel-ratio, reduced particle count on mobile,
  and the WebGL loop pauses when the tab is hidden.
