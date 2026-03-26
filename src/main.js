import { BootScene }            from './scenes/BootScene.js';
import { MenuScene }            from './scenes/MenuScene.js';
import { CharacterSelectScene } from './scenes/CharacterSelectScene.js';
import { GameScene }            from './scenes/GameScene.js';
import { UIScene }              from './scenes/UIScene.js';
import { GameOverScene }        from './scenes/GameOverScene.js';
import { VictoryScene }         from './scenes/VictoryScene.js';
import { UpgradeChoiceScene }  from './scenes/UpgradeChoiceScene.js';
import { CONFIG }               from './config.js';

const gameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, CharacterSelectScene, GameScene, UIScene, GameOverScene, VictoryScene, UpgradeChoiceScene],
};

new Phaser.Game(gameConfig);
