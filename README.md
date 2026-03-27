# crevo

A static web creature-evolution terrarium.

## What it does

- Side-view canvas world using the provided scrapyard/slime background with upright ant-ish procedural creatures
- Click / tap a creature to clone it with mutation
- Right-click / long-press a creature to explode it
- Creatures age, wander, reproduce, and die on their own
- Gene drift readout shows population-level change over time
- Mobile-friendly, designed for landscape use

## Stack

- React + Vite
- Canvas 2D renderer
- Zustand for lightweight UI/sim bridge
- Seeded RNG for stable-ish evolution behavior

## Scripts

- `npm run dev` — local dev
- `npm test` — genetics/simulation tests
- `npm run build` — production build
- `npm run smoke` — test + build

## Notes

The simulation is intentionally toy-like rather than realistic. The core design goal is readable family resemblance plus mutation drift, not ecosystem complexity.
