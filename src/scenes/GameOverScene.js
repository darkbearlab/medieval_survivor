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

    // ── Title ──────────────────────────────────────────────────────────────
    this.add.text(WIDTH / 2, 95, 'GAME OVER', {
      fontSize: '56px', fontFamily: 'Georgia, serif',
      color: '#FF2222', stroke: '#000000', strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, 170, '村莊已淪陷！', { fontSize: '22px', color: '#FFFFFF' }).setOrigin(0.5);
    this.add.text(WIDTH / 2, 210, `成功抵禦到第  ${this.waveReached}  波`, {
      fontSize: '28px', color: '#FFD700',
    }).setOrigin(0.5);

    // ── Separator ──────────────────────────────────────────────────────────
    const g = this.add.graphics();
    g.lineStyle(1, 0x444444, 0.8);
    g.lineBetween(WIDTH / 2 - 340, 248, WIDTH / 2 + 340, 248);

    // ── Balance settings grid ──────────────────────────────────────────────
    // 20 items displayed in 2 columns of 10, each row has name + value
    this.add.text(WIDTH / 2, 264, '本局平衡設定', {
      fontSize: '13px', color: '#777777',
    }).setOrigin(0.5);

    // Two columns: left = items 0-9, right = items 10-19
    const colX   = [WIDTH / 2 - 330, WIDTH / 2 + 10];
    const startY = 286;
    const rowH   = 24;

    const catColors = [
      0x66DDFF, 0x66DDFF, 0x66DDFF, 0x66DDFF, 0x66DDFF,  // 0-4 玩家
      0xFF9955, 0xFF9955, 0xFF9955, 0xFF9955, 0xFF9955,    // 5-9 敵人
      0xFF9955, 0xFF9955,                                   // 10-11 敵人
      0xFFDD44, 0xFFDD44, 0xFFDD44,                         // 12-14 波次
      0x66EE88, 0x66EE88, 0x66EE88,                         // 15-17 資源
      0xFFCC00, 0xFFCC00,                                   // 18-19 匯率
    ];

    BALANCE_SETTINGS.forEach((s, i) => {
      const col  = i < 10 ? 0 : 1;
      const row  = i < 10 ? i : i - 10;
      const x    = colX[col];
      const y    = startY + row * rowH;
      const val  = getConfigValue(s.path);
      const disp = s.fmt ? s.fmt(val) : String(val);
      const isDefault = (val === s.def);
      const labelColor = '#' + catColors[i].toString(16).padStart(6, '0');

      this.add.text(x, y, s.label + ':', {
        fontSize: '11px', color: labelColor,
      }).setOrigin(0, 0.5);

      this.add.text(x + 130, y, disp, {
        fontSize: '12px',
        color: isDefault ? '#888888' : '#FFDD44',
        fontStyle: isDefault ? 'normal' : 'bold',
      }).setOrigin(0, 0.5);
    });

    // ── Note ───────────────────────────────────────────────────────────────
    g.lineStyle(1, 0x333333, 0.6);
    g.lineBetween(WIDTH / 2 - 340, 538, WIDTH / 2 + 340, 538);
    this.add.text(WIDTH / 2, 550, '黃色粗體 = 已修改自預設值', {
      fontSize: '11px', color: '#555555',
    }).setOrigin(0.5);

    // ── Buttons ────────────────────────────────────────────────────────────
    const retryBtn = this.add.rectangle(WIDTH / 2 - 140, 606, 220, 50, 0x8B0000)
      .setInteractive({ useHandCursor: true });
    this.add.text(WIDTH / 2 - 140, 606, '再試一次', {
      fontSize: '22px', color: '#FFD700',
    }).setOrigin(0.5);
    retryBtn.on('pointerover', () => retryBtn.setFillStyle(0xAA1111));
    retryBtn.on('pointerout',  () => retryBtn.setFillStyle(0x8B0000));
    retryBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('GameScene');
    });

    const menuBtn = this.add.rectangle(WIDTH / 2 + 140, 606, 220, 50, 0x1a2a3a)
      .setStrokeStyle(1, 0x446688).setInteractive({ useHandCursor: true });
    this.add.text(WIDTH / 2 + 140, 606, '回到主選單', {
      fontSize: '22px', color: '#88CCFF',
    }).setOrigin(0.5);
    menuBtn.on('pointerover', () => menuBtn.setFillStyle(0x223344));
    menuBtn.on('pointerout',  () => menuBtn.setFillStyle(0x1a2a3a));
    menuBtn.on('pointerdown', () => {
      this.scene.stop('GameOverScene');
      this.scene.start('MenuScene');
    });

    // Fade in
    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 600 });
  }
}
