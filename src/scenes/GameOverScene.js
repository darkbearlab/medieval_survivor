import { CONFIG, BALANCE_SETTINGS, getConfigValue } from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.waveReached = data.wave || 0;
  }

  create() {
    const { WIDTH, HEIGHT } = CONFIG;

    EventBus.removeAllListeners();

    // Background
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.90);

    // ── Title ──
    this.add.text(WIDTH / 2, 110, 'GAME OVER', {
      fontSize: '58px', fontFamily: 'Georgia, serif',
      color: '#FF2222', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 185, '村莊已淪陷！', {
      fontSize: '24px', color: '#FFFFFF',
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 228, `成功抵禦到第  ${this.waveReached}  波`, {
      fontSize: '28px', color: '#FFD700',
    }).setOrigin(0.5);

    // ── Separator ──
    const sepG = this.add.graphics();
    sepG.lineStyle(1, 0x444444, 0.8);
    sepG.lineBetween(WIDTH / 2 - 300, 265, WIDTH / 2 + 300, 265);

    // ── Balance Settings Used ──
    this.add.text(WIDTH / 2, 285, '本局平衡設定', {
      fontSize: '14px', color: '#888888',
    }).setOrigin(0.5);

    // 2-column grid: col1 = items 0..5, col2 = items 6..10
    const col1X = WIDTH / 2 - 260;
    const col2X = WIDTH / 2 + 20;
    const startY = 310;
    const rowH   = 26;

    BALANCE_SETTINGS.forEach((s, i) => {
      const col = i < 6 ? 0 : 1;
      const row = i < 6 ? i : i - 6;
      const x   = col === 0 ? col1X : col2X;
      const y   = startY + row * rowH;
      const val = getConfigValue(s.path);
      const isDefault = val === s.def;

      this.add.text(x, y, `${s.label}:`, {
        fontSize: '12px', color: '#777777',
      }).setOrigin(0, 0.5);

      this.add.text(x + 120, y, String(val), {
        fontSize: '12px', color: isDefault ? '#AAAAAA' : '#FFDD44',
        fontStyle: isDefault ? 'normal' : 'bold',
      }).setOrigin(0, 0.5);
    });

    // ── Buttons ──
    const retryBtn = this.add.rectangle(WIDTH / 2 - 130, 620, 210, 52, 0x8B0000)
      .setInteractive({ useHandCursor: true });
    const retryText = this.add.text(WIDTH / 2 - 130, 620, '再試一次', {
      fontSize: '23px', color: '#FFD700',
    }).setOrigin(0.5);

    retryBtn.on('pointerover', () => retryBtn.setFillStyle(0xAA1111));
    retryBtn.on('pointerout',  () => retryBtn.setFillStyle(0x8B0000));
    retryBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });

    const menuBtn = this.add.rectangle(WIDTH / 2 + 130, 620, 210, 52, 0x1a2a3a)
      .setStrokeStyle(1, 0x446688).setInteractive({ useHandCursor: true });
    const menuText = this.add.text(WIDTH / 2 + 130, 620, '回到主選單', {
      fontSize: '23px', color: '#88CCFF',
    }).setOrigin(0.5);

    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x223344));
    menuBtn.on('pointerout',  () => menuBtn.setFillStyle(0x1a2a3a));
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });

    // Note: modified settings show in yellow, default values in grey
    this.add.text(WIDTH / 2, 662, '黃色 = 已修改自預設值', {
      fontSize: '11px', color: '#555555',
    }).setOrigin(0.5);

    // Fade in
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 600 });
  }
}
