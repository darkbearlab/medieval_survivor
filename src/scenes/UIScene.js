import { HUD }          from '../ui/HUD.js';
import { BuildMenu }    from '../ui/BuildMenu.js';
import { UpgradePanel } from '../ui/UpgradePanel.js';
import { EventBus }     from '../utils/EventBus.js';
import { CONFIG }       from '../config.js';
import { offensiveEditorOverlay } from '../ui/OffensiveEditorOverlay.js';

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

    // ── Offensive editor gear button (top-right, below wave panel) ────────────
    const { WIDTH } = CONFIG;
    this._gearBg = this.add.rectangle(WIDTH - 22, 170, 36, 26, 0x0d0d0d, 0.82)
      .setStrokeStyle(1, 0x4a3418).setScrollFactor(0).setDepth(200)
      .setInteractive({ useHandCursor: true });
    this._gearTxt = this.add.text(WIDTH - 22, 170, '⚙', {
      fontSize: '15px', color: '#7a5820',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    this._gearBg.on('pointerover', () => {
      this._gearBg.setStrokeStyle(1, 0xd4a43a);
      this._gearTxt.setColor('#d4a43a');
    });
    this._gearBg.on('pointerout', () => {
      this._gearBg.setStrokeStyle(1, 0x4a3418);
      this._gearTxt.setColor('#7a5820');
    });
    this._gearBg.on('pointerdown', () => offensiveEditorOverlay.toggle(true));

    // ── Test mode button (below gear) ─────────────────────────────────────────
    this._testMode = false;
    this._testBg = this.add.rectangle(WIDTH - 22, 200, 36, 22, 0x0d0d0d, 0.82)
      .setStrokeStyle(1, 0x1a4a1a).setScrollFactor(0).setDepth(200)
      .setInteractive({ useHandCursor: true });
    this._testTxt = this.add.text(WIDTH - 22, 200, '🧪', {
      fontSize: '13px',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    this._testBg.on('pointerover', () => this._testBg.setStrokeStyle(1, 0x44dd44));
    this._testBg.on('pointerout',  () => this._testBg.setStrokeStyle(1, this._testMode ? 0x44aa44 : 0x1a4a1a));
    this._testBg.on('pointerdown', () => {
      this._testMode = !this._testMode;
      const gameScene = this.scene.get('GameScene');
      if (gameScene) gameScene._testMode = this._testMode;
      this._testBg.setFillStyle(this._testMode ? 0x0d2a0d : 0x0d0d0d);
      this._testBg.setStrokeStyle(1, this._testMode ? 0x44aa44 : 0x1a4a1a);
    });
  }

  update() {
    const gameScene = this.scene.get('GameScene');
    if (gameScene && gameScene.waveSystem) {
      this.hud.update(gameScene.waveSystem, gameScene.gameMode, gameScene.gameTimer);
    }
  }

  shutdown() {
    EventBus.off('close_build_menu', this._onClose);
    if (this.hud)          this.hud.destroy();
    if (this.buildMenu)    this.buildMenu.destroy();
    if (this.upgradePanel) this.upgradePanel.destroy();
    // Ensure overlay is closed when scene shuts down
    offensiveEditorOverlay.hide();
  }
}
