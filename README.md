# STILL - Visual Archive

A cinematic image gallery with particle effects, scroll-driven animations, and a masonry layout. Drop images into the `images/` folder and they appear automatically.

## Features

- **Auto-discovery** — just put images in `images/`, no config needed
- **Particle system** — interactive canvas particles with mouse repulsion
- **Cinematic loader** — scramble-text reveal animation
- **Scroll animations** — parallax, fade-in reveals, horizontal track scrub
- **Masonry layout** — responsive 3-column grid (2 on tablet, 1 on mobile)
- **Lightbox** — scale-from-click open, keyboard navigation (← → Esc)
- **Drag-to-scroll** — horizontal gallery with inertia/momentum
- **Magnetic buttons** — cursor-following hover effect
- **Mobile responsive** — full touch support, adapted layouts

## Quick Start

```bash
# With Node.js
npm start
# → opens http://localhost:3456

# Or double-click start.bat (Windows)
```

## Project Structure

```
├── index.html          # Page structure
├── css/styles.css      # All styles
├── js/
│   ├── particles.js    # Canvas particle system
│   ├── animations.js   # Loader, scroll reveals, parallax, hover effects
│   └── gallery.js      # Image loading, rendering, lightbox, drag scroll
├── images/             # Drop your images here
├── server.js           # Node.js static file server
└── start.bat           # Windows quick-start
```

## Adding Images

Simply copy images into the `images/` folder. Supported formats:

- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.svg`

The server scans the folder on each page load — no restart needed.

## Tech Stack

- **anime.js v4** — animation engine
- **Vanilla JS** — no framework, no build step
- **Node.js** — zero-dependency static server
- **Google Fonts** — Inter + Playfair Display

## License

[MIT](LICENSE)
