import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class UpgradeChoiceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UpgradeChoiceScene' });
  }

  init(data) {
    this.upgrades = data.upgrades || [];   // array of 3 upgrade keys
  }

  create() {
    const { WIDTH: W, HEIGHT: H } = CONFIG;

    // Semi-transparent overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(0);

    // Title
    this.add.text(W / 2, H / 2 - 190, '☠ Boss 擊倒！選擇一項強化', {
      fontSize: '26px', fontFamily: 'Georgia, serif',
      color: '#FFD700', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);

    this.add.text(W / 2, H / 2 - 158, '按 1 / 2 / 3 或點擊選擇', {
      fontSize: '13px', color: '#666666',
    }).setOrigin(0.5).setDepth(1);

    // Cards
    const cardW  = 210, cardH = 170;
    const spacing = 240;
    const cardY  = H / 2 + 10;
    const startX = W / 2 - spacing;

    this.upgrades.forEach((key, i) => {
      const cfg = CONFIG.WEAPON_UPGRADES[key];
      const cx  = startX + i * spacing;

      const bg = this.add.rectangle(cx, cardY, cardW, cardH, 0x0d1a0d)
        .setStrokeStyle(2, 0x335533).setDepth(1).setInteractive({ useHandCursor: true });

      this.add.text(cx, cardY - cardH / 2 + 28, cfg.icon || '✦', {
        fontSize: '28px',
      }).setOrigin(0.5).setDepth(2);

      this.add.text(cx, cardY - cardH / 2 + 62, cfg.name, {
        fontSize: '17px', fontFamily: 'Georgia, serif',
        color: '#FFD700', stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(2);

      this.add.text(cx, cardY - cardH / 2 + 88, cfg.desc, {
        fontSize: '12px', color: '#AAAAAA',
        wordWrap: { width: cardW - 20 },
        align: 'center',
      }).setOrigin(0.5).setDepth(2);

      // Keyboard hint
      this.add.text(cx, cardY + cardH / 2 - 18, `[${i + 1}]`, {
        fontSize: '13px', color: '#445544',
      }).setOrigin(0.5).setDepth(2);

      bg.on('pointerover', () => bg.setFillStyle(0x142a14).setStrokeStyle(2, 0x44AA44));
      bg.on('pointerout',  () => bg.setFillStyle(0x0d1a0d).setStrokeStyle(2, 0x335533));
      bg.on('pointerdown', () => this._pick(key));
    });

    // Keyboard shortcuts
    this._keys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    ];
  }

  update() {
    this._keys.forEach((k, i) => {
      if (Phaser.Input.Keyboard.JustDown(k) && this.upgrades[i]) {
        this._pick(this.upgrades[i]);
      }
    });
  }

  _pick(key) {
    EventBus.emit('upgrade_chosen', key);
  }
}
