import { HUD } from '../ui/HUD.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.hud = new HUD(this);
  }

  update() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.waveSystem) {
      this.hud.update(gameScene.waveSystem);
    }
  }

  shutdown() {
    if (this.hud) this.hud.destroy();
  }
}
