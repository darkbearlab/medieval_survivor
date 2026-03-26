import { HUD }          from '../ui/HUD.js';
import { BuildMenu }    from '../ui/BuildMenu.js';
import { UpgradePanel } from '../ui/UpgradePanel.js';
import { EventBus }     from '../utils/EventBus.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    this.hud          = new HUD(this);
    this.buildMenu    = new BuildMenu(this);
    this.upgradePanel = new UpgradePanel(this);

    // 'close_build_menu' (right-click while not placing) deselects the hotbar
    this._onClose = () => EventBus.emit('build_cancelled');
    EventBus.on('close_build_menu', this._onClose);
  }

  update() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.waveSystem) {
      this.hud.update(gameScene.waveSystem);
    }
  }

  shutdown() {
    EventBus.off('close_build_menu', this._onClose);
    if (this.hud)          this.hud.destroy();
    if (this.buildMenu)    this.buildMenu.destroy();
    if (this.upgradePanel) this.upgradePanel.destroy();
  }
}
