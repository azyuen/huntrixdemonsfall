import Phaser from 'phaser';
import { GAMEPLAY } from './config/gameplay.js';
import BootScene from './scenes/BootScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import GameScene from './scenes/GameScene.js';
import LevelCompleteScene from './scenes/LevelCompleteScene.js';
import { installRunSummary } from './systems/RunSummaryPatch.js';

installRunSummary(GameScene);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAMEPLAY.width,
  height: GAMEPLAY.height,
  backgroundColor: '#0b0820',
  input: { activePointers: 4 },
  physics: { default: 'arcade', arcade: { gravity: { y: GAMEPLAY.gravity }, debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, CharacterSelectScene, GameScene, LevelCompleteScene]
});
