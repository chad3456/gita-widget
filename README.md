# PHANTOM — Spherical Gallery

A WebGL recreation of the [phantom.land](https://www.phantom.land/) homepage
experience: a gallery of project tiles arranged on the **inside of a sphere**.
You sit at the centre and **drag to look around**, with momentum/easing that
feels like Lenis smooth scroll. Tapping a tile flies the camera in and animates
a project page over the top.

> Built as a homage / study. The PHANTOM name and project tiles are used to
> recreate the reference; tiles are procedurally generated, not real assets.

## Stack

- **[Three.js](https://threejs.org/)** — the sphere of cards. Camera sits at the
  origin; each tile is a textured plane placed on a lat/long grid and oriented to
  face the centre, so you're always looking at it from inside.
- **Custom Lenis-style easing** — pointer drag sets a *target* rotation that the
  view eases toward with exponential smoothing (the Lenis "feel"), plus
  release-inertia. On desktop, wheel/trackpad input is run through a real
  **[Lenis](https://lenis.darkroom.engineering/)** instance for authentic
  momentum.
- **[GSAP](https://gsap.com/)** — intro stagger, hover scale, and the
  click-to-open transition (centre the tile → dolly the camera in → reveal the
  detail page).

Tile artwork is generated at runtime on `<canvas>` (gradient + title + tags),
so the whole thing is **self-contained** — libraries are vendored in `/vendor`
and there are no external runtime assets (fonts are the only CDN call, with a
monospace fallback).

## Controls

| Input | Action |
| --- | --- |
| **Left-click + drag** / touch drag | Orbit the gallery (both axes, with easing + inertia) |
| **Scroll / trackpad** | Spin the gallery (Lenis-smoothed, desktop) |
| **Click a tile** | Fly in and open its project page |
| **Back / `Esc`** | Return to the gallery |

## Run it

Static site — serve the folder:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Canvas, UI chrome (logo, clocks, nav, filter) and the detail-page template |
| `styles.css` | UI chrome + detail page styling, responsive rules |
| `app.js` | Three.js sphere, drag/inertia controller, raycasting, GSAP transitions, canvas tile textures, live clocks |
| `vendor/` | Pinned three, gsap, lenis |

## Notes

- **Responsive** — verified at 1440×820 and 390×844 with headless Chromium; the
  chrome collapses gracefully and touch drag drives the orbit on mobile.
- **Curvature** — the bowed columns come for free from being inside the sphere
  with a wide FOV, matching the reference.
- **`prefers-reduced-motion`** — skips the intro/auto-drift and Lenis wheel
  smoothing; the gallery is still fully draggable.
