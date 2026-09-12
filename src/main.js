import Phaser from 'phaser';
import { GAMEPLAY } from './config/gameplay.js';
import BootScene from './scenes/BootScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import GameScene from './scenes/GameScene.js';
import VerticalSliceScene from './scenes/VerticalSliceScene.js';
import LevelCompleteScene from './scenes/LevelCompleteScene.js';
import { installRunSummary } from './systems/RunSummaryPatch.js';
import { installVisualArt } from './systems/VisualArtPatch.js';
import { installPolishPass } from './systems/PolishPass.js';
import { installCameraDirector } from './systems/CameraDirectorPatch.js';
import { installFinalRumiIdle } from './systems/FinalRumiIdlePatch.js';

installRunSummary(GameScene);
installVisualArt(GameScene);
installPolishPass(GameScene);
installCameraDirector(GameScene);
installFinalRumiIdle(GameScene);

new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'app',
  width: GAMEPLAY.width,
  height: GAMEPLAY.height,
  transparent: false,
  backgroundColor: '#09051a',
  render: { antialias: true, pixelArt: false, roundPixels: false },
  input: { activePointers: 4 },
  physics: { default: 'arcade', arcade: { gravity: { y: GAMEPLAY.gravity }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, CharacterSelectScene, VerticalSliceScene, LevelCompleteScene]
});
