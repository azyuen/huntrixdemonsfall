import Phaser from 'phaser';
import { GAMEPLAY } from './config/gameplay.js';
import BootScene from './scenes/BootScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import GameScene from './scenes/GameScene.js';
import LevelCompleteScene from './scenes/LevelCompleteScene.js';
import { installRunSummary } from './systems/RunSummaryPatch.js';
import { installVisualArt } from './systems/VisualArtPatch.js';

installRunSummary(GameScene);
installVisualArt(GameScene);

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'app',
  width: GAMEPLAY.width,
  height: GAMEPLAY.height,
  transparent: false,
  backgroundColor: '#09051a',
  input: { activePointers: 4 },
  physics: { default: 'arcade', arcade: { gravity: { y: GAMEPLAY.gravity }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, CharacterSelectScene, GameScene, LevelCompleteScene]
});
