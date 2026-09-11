# HUNTR/X: Demons Fall

Phase 1–2 prototype: a landscape mobile-first Phaser 3 + Vite action-platformer scaffold.

## Current prototype
- Rumi character selection
- scrolling Seoul rooftop placeholder level
- Arcade Physics, gravity and platforms
- left/right movement, jump and directional dodge
- smooth camera follow
- keyboard controls and mobile touch controls
- portrait orientation prompt
- centralized tuning in `src/config/gameplay.js`
- Attack is intentionally a placeholder until Phase 3

## Run locally
Requires a reasonably current Node.js/npm installation.

```bash
npm install
npm run dev
```

Open the local address Vite prints in your browser.

## Desktop controls
- A/D or arrow keys: move
- W/Space/Up: jump
- K: dodge
- J: attack placeholder
- Enter: choose Rumi

## Mobile
Run the dev server with `npm run dev`, open the network URL on a phone on the same network, and rotate to landscape. Touch joystick is on the left; Attack, Jump and Dodge are on the right.

## Next
Do not add enemies/combat/Sync until movement, jump, dodge, camera scale and touch-control feel have been tested and tuned.
