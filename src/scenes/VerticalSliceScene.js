import GameScene from './GameScene.js';

// Focused Level 1-1 development slice.
// Keep the full GameScene systems intact, but expose only the small section we
// need while we refine Rumi, the camera, combat feel and Seoul rooftop art.
const ACTIVE_PLATFORM_COUNT = 5;
const ACTIVE_ENEMY = 'grunt';
const ACTIVE_ENEMY_MAX_X = 2350;

export default class VerticalSliceScene extends GameScene {
  spawnEnemy(type, x, y) {
    // For now, Level 1-1 only tests Stalkers. The Brute, Wraith and boss code
    // remain in GameScene and GAMEPLAY for later reactivation.
    if (type !== ACTIVE_ENEMY || x > ACTIVE_ENEMY_MAX_X) return null;
    return super.spawnEnemy(type, x, y);
  }

  spawnPowerup() {
    // Upgrades are intentionally parked during the Rumi/environment polish pass.
    return null;
  }

  create() {
    super.create();

    // The original prototype contains a much longer course. Keep only the first
    // five platform specs active for checkpoint/fall calculations in this slice.
    this.platformSpecs = this.platformSpecs.slice(0, ACTIVE_PLATFORM_COUNT);

    // Disable the unused prototype platforms. Their definitions remain in
    // GameScene so the longer level can be restored later without rebuilding it.
    this.platforms?.getChildren().forEach((platform, index) => {
      if (index < ACTIVE_PLATFORM_COUNT) return;
      if (platform.body) platform.body.enable = false;
      platform.setVisible(false);
    });

    // Boss progression is parked for this focused test level.
    this.boss = null;
    this.bossActive = false;
    this.bossDefeated = false;
  }
}
