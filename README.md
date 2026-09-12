# HUNTR/X: Demons Fall — V2

A clean Phaser 3 + Vite rebuild of the HUNTR/X action-platformer prototype.

## Why V2 exists

The original prototype accumulated several overlapping patch systems, generated assets and compatibility layers. It is preserved on the `archive/prototype-v1` branch. V2 keeps the approved art direction and gameplay decisions, but rebuilds the implementation one small milestone at a time.

## Current milestone: Rumi idle

The live V2 currently does only one important thing:

- renders the approved four-frame Rumi idle animation
- uses ordinary WebP files from `public/assets`
- uses a single Phaser scene
- keeps Rumi at roughly 33% of screen height for normal gameplay framing
- records 27% as the future boss-view framing target

There is deliberately no combat, enemy logic, character select, powerup system or patch layer active yet.

## Active code

- `src/main.js` — Phaser bootstrap
- `src/scenes/GameScene.js` — current test scene
- `src/characters/Rumi.js` — Rumi sprite specification and idle animation

Old V1 source files may still exist in the repository while the rebuild is underway, but they are not imported by the V2 entry point and therefore are not part of the running game.

## Build

```bash
npm install
npm run dev
npm run build
```
