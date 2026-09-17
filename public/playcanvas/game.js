import { whenReady } from '@playcanvas/web-components';

const statusEl = document.getElementById('status');
const rumiModelEl = document.getElementById('rumi');
const appEl = document.querySelector('pc-app');
const rumiAssetEl = document.getElementById('rumiAsset');

const input = {
  left: false,
  right: false,
  jumpQueued: false,
  attackQueued: false
};

const state = {
  x: -2,
  y: 0,
  vy: 0,
  grounded: true,
  facing: 1,
  attackTimer: 0,
  attackCooldown: 0,
  hitFlashTimer: 0,
  fallback: false
};

const MOVE_SPEED = 4.3;
const AIR_CONTROL = 0.82;
const JUMP_SPEED = 6.45;
const GRAVITY = -16.5;
const STAGE_MIN_X = -6.7;
const STAGE_MAX_X = 6.7;
const RUMI_SCALE = 0.01;

const surfaces = [
  { xMin: -50, xMax: 50, y: 0 },
  { xMin: -5.10, xMax: -2.10, y: 1.69 },
  { xMin: 1.90, xMax: 4.70, y: 2.44 }
];

function setStatus(text) {
  statusEl.textContent = text;
}

function bindHoldButton(id, key) {
  const button = document.getElementById(id);
  const down = (event) => {
    event.preventDefault();
    input[key] = true;
    button.classList.add('active');
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
  };
  const up = (event) => {
    event.preventDefault();
    input[key] = false;
    button.classList.remove('active');
  };
  button.addEventListener('pointerdown', down, { passive: false });
  button.addEventListener('pointerup', up, { passive: false });
  button.addEventListener('pointercancel', up, { passive: false });
  button.addEventListener('lostpointercapture', up, { passive: false });
}

function bindPressButton(id, callback) {
  const button = document.getElementById(id);
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.classList.add('active');
    callback();
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
  }, { passive: false });
  const release = (event) => {
    event.preventDefault();
    button.classList.remove('active');
  };
  button.addEventListener('pointerup', release, { passive: false });
  button.addEventListener('pointercancel', release, { passive: false });
  button.addEventListener('lostpointercapture', release, { passive: false });
}

bindHoldButton('left', 'left');
bindHoldButton('right', 'right');
bindPressButton('jump', () => { input.jumpQueued = true; });
bindPressButton('attack', () => { input.attackQueued = true; });

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'KeyA'].includes(event.code)) input.left = true;
  if (['ArrowRight', 'KeyD'].includes(event.code)) input.right = true;
  if (['ArrowUp', 'KeyW', 'Space'].includes(event.code) && !event.repeat) input.jumpQueued = true;
  if (['KeyJ', 'KeyK', 'KeyX'].includes(event.code) && !event.repeat) input.attackQueued = true;
});

window.addEventListener('keyup', (event) => {
  if (['ArrowLeft', 'KeyA'].includes(event.code)) input.left = false;
  if (['ArrowRight', 'KeyD'].includes(event.code)) input.right = false;
});

window.addEventListener('blur', () => {
  input.left = false;
  input.right = false;
});

rumiAssetEl.addEventListener('error', () => { state.fallback = true; });
rumiModelEl.addEventListener('error', () => { state.fallback = true; });
appEl.addEventListener('error', (event) => setStatus(`3D failed to start: ${event.message}`));

function surfaceUnder(x, fromY, toY) {
  let best = null;
  for (const surface of surfaces) {
    if (x < surface.xMin || x > surface.xMax) continue;
    if (fromY >= surface.y - 0.03 && toY <= surface.y + 0.03) {
      if (!best || surface.y > best.y) best = surface;
    }
  }
  return best;
}

function updateFacing(rumiEntity) {
  // The source GLB has a -90° X root transform. Compensate with +90° X
  // on the host, then yaw ±90° so the fighter faces along the gameplay axis.
  rumiEntity.setLocalEulerAngles(90, state.facing > 0 ? 90 : -90, 0);
}

function pulseDummy(dummyEntity, dt) {
  if (state.hitFlashTimer <= 0) {
    dummyEntity.setLocalScale(1, 1, 1);
    return;
  }
  state.hitFlashTimer -= dt;
  const squeeze = 1 - Math.sin(state.hitFlashTimer * 45) * 0.08;
  dummyEntity.setLocalScale(1.08, squeeze, 1.08);
}

async function boot() {
  const { app } = await whenReady('pc-app');
  const { entity: playerEntity } = await whenReady('#player');
  const { entity: fallbackEntity } = await whenReady('#fallback');
  const { entity: slashEntity } = await whenReady('#slash');
  const { entity: dummyEntity } = await whenReady('#dummy');
  const { entity: rumiEntity } = await whenReady('#rumi');

  if (!rumiModelEl.contentEntity) {
    state.fallback = true;
    rumiModelEl.entity.enabled = false;
    fallbackEntity.enabled = true;
    setStatus('Prototype ready • Rumi model failed to load');
  } else {
    state.fallback = false;
    fallbackEntity.enabled = false;
    rumiModelEl.entity.enabled = true;
    rumiEntity.setLocalScale(RUMI_SCALE, RUMI_SCALE, RUMI_SCALE);
    setStatus('Rumi loaded • upright transform applied');
  }

  updateFacing(rumiEntity);

  app.on('update', (dt) => {
    dt = Math.min(dt, 1 / 20);

    let move = 0;
    if (input.left) move -= 1;
    if (input.right) move += 1;

    if (move !== 0) {
      state.facing = move > 0 ? 1 : -1;
      updateFacing(rumiEntity);
    }

    state.x += move * MOVE_SPEED * (state.grounded ? 1 : AIR_CONTROL) * dt;
    state.x = Math.max(STAGE_MIN_X, Math.min(STAGE_MAX_X, state.x));

    if (input.jumpQueued) {
      input.jumpQueued = false;
      if (state.grounded) {
        state.vy = JUMP_SPEED;
        state.grounded = false;
      }
    }

    const previousY = state.y;
    if (!state.grounded) {
      state.vy += GRAVITY * dt;
      state.y += state.vy * dt;
      if (state.vy <= 0) {
        const landed = surfaceUnder(state.x, previousY, state.y);
        if (landed) {
          state.y = landed.y;
          state.vy = 0;
          state.grounded = true;
        }
      }
    } else {
      const standingSurface = surfaces
        .filter((surface) => state.x >= surface.xMin && state.x <= surface.xMax)
        .sort((a, b) => b.y - a.y)
        .find((surface) => Math.abs(surface.y - state.y) < 0.06);
      if (!standingSurface) {
        state.grounded = false;
        state.vy = 0;
      }
    }

    if (state.y < -5) {
      state.x = -2;
      state.y = 0;
      state.vy = 0;
      state.grounded = true;
    }

    playerEntity.setLocalPosition(state.x, state.y, 0);

    state.attackCooldown = Math.max(0, state.attackCooldown - dt);
    state.attackTimer = Math.max(0, state.attackTimer - dt);

    if (input.attackQueued) {
      input.attackQueued = false;
      if (state.attackCooldown <= 0) {
        state.attackCooldown = 0.38;
        state.attackTimer = 0.14;
        const distance = Math.abs(dummyEntity.getLocalPosition().x - state.x);
        const facingDummy = Math.sign(dummyEntity.getLocalPosition().x - state.x) === state.facing;
        if (distance < 1.75 && facingDummy && Math.abs(state.y) < 1.15) {
          state.hitFlashTimer = 0.18;
          setStatus('HIT! • placeholder combat works');
          window.setTimeout(() => setStatus(state.fallback ? 'Prototype ready • Rumi model failed to load' : 'Rumi loaded • upright transform applied'), 520);
        }
      }
    }

    slashEntity.enabled = state.attackTimer > 0;
    slashEntity.setLocalPosition(state.facing * 0.95, 1.05, 0.1);
    slashEntity.setLocalEulerAngles(0, 0, state.facing > 0 ? -22 : 22);
    pulseDummy(dummyEntity, dt);
  });
}

boot().catch((error) => {
  console.error(error);
  setStatus(`Prototype error: ${error.message}`);
});
