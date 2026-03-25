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
      color: '#FFD700', stroke: '#8B0000', strokeThickness: 5,
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
    btnBg.on('pointerout',  () => { btnBg.setFillStyle(0x8B0000); btnText.setScale(1); });
    btnBg.on('pointerdown', () => { this.scene.start('GameScene'); });

    // Balance panel button
    const cfgBg = this.add.rectangle(WIDTH / 2, HEIGHT / 2 + 88, 220, 40, 0x1a2a1a)
      .setStrokeStyle(1, 0x447744).setInteractive({ useHandCursor: true });
    const cfgTxt = this.add.text(WIDTH / 2, HEIGHT / 2 + 88, '⚙ 平衡設定', {
      fontSize: '17px', color: '#88CC88',
    }).setOrigin(0.5);
    cfgBg.on('pointerover', () => { cfgBg.setFillStyle(0x223322); cfgTxt.setColor('#AAFFAA'); });
    cfgBg.on('pointerout',  () => { cfgBg.setFillStyle(0x1a2a1a); cfgTxt.setColor('#88CC88'); });
    cfgBg.on('pointerdown', () => { this._openBalancePanel(); });

    // Controls hint
    this.add.text(WIDTH / 2, HEIGHT - 90, '操作說明', { fontSize: '15px', color: '#888888' }).setOrigin(0.5);
    this.add.text(WIDTH / 2, HEIGHT - 65,
      'WASD 移動   靠近資源自動採集   [B] 建造   點擊建築升級   右鍵 / [ESC] 取消   [P] 暫停',
      { fontSize: '12px', color: '#666666' }).setOrigin(0.5);

    // Pulsing start button
    this.tweens.add({ targets: btnBg, scaleX: 1.02, scaleY: 1.02, yoyo: true, repeat: -1, duration: 900 });
  }

  _openBalancePanel() {
    if (this._balancePanelOpen) return;
    this._balancePanelOpen = true;

    const { WIDTH, HEIGHT } = CONFIG;
    const cx = WIDTH / 2, cy = HEIGHT / 2;

    // ── Panel geometry ─────────────────────────────────────────────────────
    // 20 settings split into 2 columns of 10 rows each.
    const panelW = 780, panelH = 530;
    const py = cy - panelH / 2;           // panel top y
    const rowH = 34;
    const contentTop = py + 80;           // first row y

    // Column start X values (label left edge)
    const L = cx - panelW / 2 + 12;      // left col label x
    const R = cx + 8;                     // right col label x

    // Control cluster offsets from column label start
    const LABEL_W  = 155;
    const MINUS_X  = LABEL_W + 12;        // center of minus btn, relative to col start
    const VAL_X    = LABEL_W + 52;
    const PLUS_X   = LABEL_W + 96;

    const els = [];
    const valueTxts = [];

    const closePanel = () => {
      els.forEach(e => e.destroy());
      this._balancePanelOpen = false;
    };

    // Panel background
    els.push(
      this.add.rectangle(cx, cy, panelW, panelH, 0x060c06, 0.97)
        .setStrokeStyle(2, 0x447744).setDepth(200)
    );

    // Title
    els.push(
      this.add.text(cx, py + 22, '⚙ 平衡設定', {
        fontSize: '19px', color: '#88FF88', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(201)
    );
    els.push(
      this.add.text(cx, py + 46, '修改本次遊戲數值 · 金幣匯率決定資源不足時的換算比例 · 重新整理頁面還原預設', {
        fontSize: '10px', color: '#555555',
      }).setOrigin(0.5).setDepth(201)
    );

    // Vertical separator
    const sepG = this.add.graphics().setDepth(201);
    sepG.lineStyle(1, 0x333333, 1);
    sepG.lineBetween(cx - 2, py + 62, cx - 2, py + panelH - 45);
    els.push(sepG);

    // Category color map (index → hex colour)
    const catColors = [
      // 0-4: 玩家 — cyan
      0x66DDFF, 0x66DDFF, 0x66DDFF, 0x66DDFF, 0x66DDFF,
      // 5-9: 敵人前段 — orange
      0xFF9955, 0xFF9955, 0xFF9955, 0xFF9955, 0xFF9955,
      // 10-11: 敵人後段
      0xFF9955, 0xFF9955,
      // 12-14: 波次 — yellow
      0xFFDD44, 0xFFDD44, 0xFFDD44,
      // 15-17: 資源 — green
      0x66EE88, 0x66EE88, 0x66EE88,
      // 18-19: 匯率 — gold
      0xFFCC00, 0xFFCC00,
    ];

    // ── Render rows ────────────────────────────────────────────────────────
    BALANCE_SETTINGS.forEach((s, i) => {
      const col    = i < 10 ? 0 : 1;
      const rowIdx = i < 10 ? i : i - 10;
      const colL   = col === 0 ? L : R;
      const rowY   = contentTop + rowIdx * rowH;
      const color  = '#' + catColors[i].toString(16).padStart(6, '0');

      // Label
      els.push(
        this.add.text(colL, rowY, s.label, { fontSize: '13px', color })
          .setOrigin(0, 0.5).setDepth(201)
      );

      // Value display
      const rawVal = getConfigValue(s.path);
      const dispVal = s.fmt ? s.fmt(rawVal) : String(rawVal);
      const valT = this.add.text(colL + VAL_X, rowY, dispVal, {
        fontSize: '14px', color: '#FFFFFF',
      }).setOrigin(0.5, 0.5).setDepth(201);
      valueTxts.push(valT);
      els.push(valT);

      // Minus button
      const minusBg = this.add.rectangle(colL + MINUS_X, rowY, 32, 24, 0x3a0d0d)
        .setStrokeStyle(1, 0x663333).setDepth(201).setInteractive({ useHandCursor: true });
      const minusT  = this.add.text(colL + MINUS_X, rowY, '−', { fontSize: '16px', color: '#FF8888' })
        .setOrigin(0.5).setDepth(202);
      minusBg.on('pointerover', () => minusBg.setFillStyle(0x5a1a1a));
      minusBg.on('pointerout',  () => minusBg.setFillStyle(0x3a0d0d));
      minusBg.on('pointerdown', () => {
        const next = parseFloat(Math.max(s.min, getConfigValue(s.path) - s.step).toFixed(4));
        setConfigValue(s.path, next);
        valT.setText(s.fmt ? s.fmt(next) : String(next));
      });
      els.push(minusBg, minusT);

      // Plus button
      const plusBg = this.add.rectangle(colL + PLUS_X, rowY, 32, 24, 0x0d3a0d)
        .setStrokeStyle(1, 0x336633).setDepth(201).setInteractive({ useHandCursor: true });
      const plusT  = this.add.text(colL + PLUS_X, rowY, '+', { fontSize: '16px', color: '#88FF88' })
        .setOrigin(0.5).setDepth(202);
      plusBg.on('pointerover', () => plusBg.setFillStyle(0x1a5a1a));
      plusBg.on('pointerout',  () => plusBg.setFillStyle(0x0d3a0d));
      plusBg.on('pointerdown', () => {
        const next = parseFloat(Math.min(s.max, getConfigValue(s.path) + s.step).toFixed(4));
        setConfigValue(s.path, next);
        valT.setText(s.fmt ? s.fmt(next) : String(next));
      });
      els.push(plusBg, plusT);
    });

    // ── Footer buttons ─────────────────────────────────────────────────────
    const footY = py + panelH - 24;

    const resetBg = this.add.rectangle(cx - 80, footY, 140, 30, 0x222222)
      .setStrokeStyle(1, 0x555555).setDepth(201).setInteractive({ useHandCursor: true });
    const resetT = this.add.text(cx - 80, footY, '重置全部預設', { fontSize: '13px', color: '#AAAAAA' })
      .setOrigin(0.5).setDepth(202);
    resetBg.on('pointerover', () => resetBg.setFillStyle(0x333333));
    resetBg.on('pointerout',  () => resetBg.setFillStyle(0x222222));
    resetBg.on('pointerdown', () => {
      resetConfig();
      BALANCE_SETTINGS.forEach((s, i) => {
        const v = getConfigValue(s.path);
        valueTxts[i].setText(s.fmt ? s.fmt(v) : String(v));
      });
    });
    els.push(resetBg, resetT);

    const closeBg = this.add.rectangle(cx + 80, footY, 140, 30, 0x1a0a0a)
      .setStrokeStyle(1, 0x884444).setDepth(201).setInteractive({ useHandCursor: true });
    const closeT = this.add.text(cx + 80, footY, '關閉', { fontSize: '13px', color: '#FF8888' })
      .setOrigin(0.5).setDepth(202);
    closeBg.on('pointerover', () => closeBg.setFillStyle(0x331111));
    closeBg.on('pointerout',  () => closeBg.setFillStyle(0x1a0a0a));
    closeBg.on('pointerdown', () => closePanel());
    els.push(closeBg, closeT);
  }
}
