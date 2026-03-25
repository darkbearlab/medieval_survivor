import { CONFIG, BALANCE_SETTINGS, getConfigValue, setConfigValue, resetConfig } from '../config.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this._balancePanelOpen = false;
  }

  create() {
    const { WIDTH, HEIGHT } = CONFIG;

    // Background
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x0d1b2a);
    this.add.rectangle(WIDTH / 2, HEIGHT - 100, WIDTH, 200, 0x1a0a00, 0.5);

    // Title
    this.add.text(WIDTH / 2, HEIGHT / 2 - 150, 'MEDIEVAL SURVIVOR', {
      fontSize: '52px',
      fontFamily: 'Georgia, "Times New Roman", serif',
      color: '#FFD700',
      stroke: '#8B0000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 90, '中世紀生存塔防', {
      fontSize: '22px', fontFamily: 'serif', color: '#C8A832',
    }).setOrigin(0.5);

    this.add.text(WIDTH / 2, HEIGHT / 2 - 55, '保護村莊，抵禦波次攻擊', {
      fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);

    // Start button
    const btnBg = this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 20, 220, 58, 0x8B0000)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add.text(WIDTH / 2, HEIGHT / 2 + 20, '開始遊戲', {
      fontSize: '26px', color: '#FFD700',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => { btnBg.setFillStyle(0xAA1111); btnText.setScale(1.05); });
    btnBg.on('pointerout',  () => { btnBg.setFillStyle(0x8B0000); btnText.setScale(1);    });
    btnBg.on('pointerdown', () => { this.scene.start('GameScene'); });

    // Balance settings button
    const cfgBtnBg = this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 88, 220, 40, 0x1a2a1a)
      .setStrokeStyle(1, 0x447744).setInteractive({ useHandCursor: true });
    const cfgBtnText = this.add.text(WIDTH / 2, HEIGHT / 2 + 88, '⚙ 平衡設定', {
      fontSize: '17px', color: '#88CC88',
    }).setOrigin(0.5);

    cfgBtnBg.on('pointerover', () => { cfgBtnBg.setFillStyle(0x223322); cfgBtnText.setColor('#AAFFAA'); });
    cfgBtnBg.on('pointerout',  () => { cfgBtnBg.setFillStyle(0x1a2a1a); cfgBtnText.setColor('#88CC88'); });
    cfgBtnBg.on('pointerdown', () => { this._openBalancePanel(); });

    // Controls hint
    this.add.text(WIDTH / 2, HEIGHT - 90, '操作說明', {
      fontSize: '15px', color: '#888888',
    }).setOrigin(0.5);
    this.add.text(WIDTH / 2, HEIGHT - 65,
      'WASD 移動   靠近資源自動採集   [B] 建造選單   點擊建築升級   右鍵取消放置',
      { fontSize: '13px', color: '#666666' }).setOrigin(0.5);

    // Pulsing start button
    this.tweens.add({
      targets: btnBg, scaleX: 1.02, scaleY: 1.02,
      yoyo: true, repeat: -1, duration: 900,
    });
  }

  _openBalancePanel() {
    if (this._balancePanelOpen) return;
    this._balancePanelOpen = true;

    const { WIDTH, HEIGHT } = CONFIG;
    const cx = WIDTH / 2, cy = HEIGHT / 2;
    const panelW = 480, panelH = 510;
    const py = cy - panelH / 2;  // panel top y

    const els = [];
    const valueTxts = [];

    const closePanel = () => {
      els.forEach(e => e.destroy());
      this._balancePanelOpen = false;
    };

    // Dark background
    els.push(
      this.add.rectangle(cx, cy, panelW, panelH, 0x070d07, 0.97)
        .setStrokeStyle(2, 0x447744).setDepth(200)
    );

    // Title
    els.push(
      this.add.text(cx, py + 26, '⚙ 平衡設定', {
        fontSize: '20px', color: '#88FF88', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(201)
    );
    els.push(
      this.add.text(cx, py + 50, '直接修改本次遊戲數值 · 重新整理頁面可還原預設', {
        fontSize: '11px', color: '#555555',
      }).setOrigin(0.5).setDepth(201)
    );

    // Column headers
    els.push(this.add.text(cx - 210, py + 68, '設定項目',        { fontSize: '11px', color: '#777777' }).setOrigin(0, 0.5).setDepth(201));
    els.push(this.add.text(cx + 10,  py + 68, '目前值',          { fontSize: '11px', color: '#777777' }).setOrigin(0.5, 0.5).setDepth(201));
    els.push(this.add.text(cx + 120, py + 68, '範圍',            { fontSize: '11px', color: '#555555' }).setOrigin(0.5, 0.5).setDepth(201));

    // Settings rows
    BALANCE_SETTINGS.forEach((s, i) => {
      const rowY = py + 90 + i * 36;

      // Label
      els.push(
        this.add.text(cx - 210, rowY, s.label, { fontSize: '14px', color: '#CCCCCC' })
          .setOrigin(0, 0.5).setDepth(201)
      );

      // Range hint
      const rangeStr = s.step >= 1000
        ? `${s.min / 1000}k–${s.max / 1000}k`
        : `${s.min}–${s.max}`;
      els.push(
        this.add.text(cx + 120, rowY, rangeStr, { fontSize: '11px', color: '#555555' })
          .setOrigin(0.5, 0.5).setDepth(201)
      );

      // Value display
      const valT = this.add.text(cx + 10, rowY, String(getConfigValue(s.path)), {
        fontSize: '15px', color: '#FFFFFF',
      }).setOrigin(0.5, 0.5).setDepth(201);
      valueTxts.push(valT);
      els.push(valT);

      // Minus button
      const minusBg = this.add.rectangle(cx - 52, rowY, 34, 26, 0x441111)
        .setStrokeStyle(1, 0x773333).setDepth(201).setInteractive({ useHandCursor: true });
      const minusT  = this.add.text(cx - 52, rowY, '−', { fontSize: '17px', color: '#FF8888' })
        .setOrigin(0.5).setDepth(202);
      minusBg.on('pointerover', () => minusBg.setFillStyle(0x661111));
      minusBg.on('pointerout',  () => minusBg.setFillStyle(0x441111));
      minusBg.on('pointerdown', () => {
        const next = Math.max(s.min, getConfigValue(s.path) - s.step);
        setConfigValue(s.path, next);
        valT.setText(String(next));
      });
      els.push(minusBg, minusT);

      // Plus button
      const plusBg = this.add.rectangle(cx + 72, rowY, 34, 26, 0x114411)
        .setStrokeStyle(1, 0x337733).setDepth(201).setInteractive({ useHandCursor: true });
      const plusT  = this.add.text(cx + 72, rowY, '+', { fontSize: '17px', color: '#88FF88' })
        .setOrigin(0.5).setDepth(202);
      plusBg.on('pointerover', () => plusBg.setFillStyle(0x226622));
      plusBg.on('pointerout',  () => plusBg.setFillStyle(0x114411));
      plusBg.on('pointerdown', () => {
        const next = Math.min(s.max, getConfigValue(s.path) + s.step);
        setConfigValue(s.path, next);
        valT.setText(String(next));
      });
      els.push(plusBg, plusT);
    });

    // Footer buttons
    const footerY = py + panelH - 28;

    // Reset button
    const resetBg = this.add.rectangle(cx - 80, footerY, 130, 32, 0x222222)
      .setStrokeStyle(1, 0x555555).setDepth(201).setInteractive({ useHandCursor: true });
    const resetT = this.add.text(cx - 80, footerY, '重置預設值', { fontSize: '13px', color: '#AAAAAA' })
      .setOrigin(0.5).setDepth(202);
    resetBg.on('pointerover', () => resetBg.setFillStyle(0x333333));
    resetBg.on('pointerout',  () => resetBg.setFillStyle(0x222222));
    resetBg.on('pointerdown', () => {
      resetConfig();
      BALANCE_SETTINGS.forEach((s, i) => valueTxts[i].setText(String(getConfigValue(s.path))));
    });
    els.push(resetBg, resetT);

    // Close button
    const closeBg = this.add.rectangle(cx + 80, footerY, 130, 32, 0x1a0a0a)
      .setStrokeStyle(1, 0x884444).setDepth(201).setInteractive({ useHandCursor: true });
    const closeT = this.add.text(cx + 80, footerY, '關閉', { fontSize: '13px', color: '#FF8888' })
      .setOrigin(0.5).setDepth(202);
    closeBg.on('pointerover', () => closeBg.setFillStyle(0x331111));
    closeBg.on('pointerout',  () => closeBg.setFillStyle(0x1a0a0a));
    closeBg.on('pointerdown', () => closePanel());
    els.push(closeBg, closeT);
  }
}
