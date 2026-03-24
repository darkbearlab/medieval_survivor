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

    this._onToggleBuildMenu = () => this.buildMenu.toggle();
    this._onCloseBuildMenu  = () => this.buildMenu.hide();

    EventBus.on('toggle_build_menu', this._onToggleBuildMenu);
    EventBus.on('close_build_menu',  this._onCloseBuildMenu);
  }

  update() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.waveSystem) {
      this.hud.update(gameScene.waveSystem);
    }
  }

  shutdown() {
    EventBus.off('toggle_build_menu', this._onToggleBuildMenu);
    EventBus.off('close_build_menu',  this._onCloseBuildMenu);
    if (this.hud)          this.hud.destroy();
    if (this.buildMenu)    this.buildMenu.destroy();
    if (this.upgradePanel) this.upgradePanel.destroy();
  }
}
