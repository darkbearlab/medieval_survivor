import { CONFIG } from '../config.js';

const CHAR_KEYS = ['warrior', 'ranger', 'mage'];

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create() {
    const { WIDTH: W, HEIGHT: H } = CONFIG;
    this._selected = 'ranger';
    this._gameMode = 'timed';   // default: timed mode
    this._cardEls  = {};   // key → { bg, border }

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    // Title
    this.add.text(W / 2, 52, '選擇角色', {
      fontSize: '38px', fontFamily: 'Georgia, serif',
      color: '#FFD700', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 92, '每種角色有獨特能力，選擇適合你的玩法', {
      fontSize: '14px', color: '#888888',
    }).setOrigin(0.5);

    // Character cards
    const cardCentersX = [W / 2 - 290, W / 2, W / 2 + 290];
    CHAR_KEYS.forEach((key, i) => {
      this._buildCard(cardCentersX[i], 360, key);
    });

    // ── Mode selection ──────────────────────────────────────────────────────
    const modeY   = 545;
    const timedDur = CONFIG.GAME_MODES.TIMED.DURATION;
    const timedMin = Math.floor(timedDur / 60);
    const modeLabels = {
      timed:   `⏱  限時 ${timedMin} 分鐘`,
      endless: '∞  無盡模式',
    };

    const _makeModeBtn = (cx, modeKey) => {
      const bg  = this.add.rectangle(cx, modeY, 200, 40, 0x1a2a1a)
        .setStrokeStyle(2, 0x334433).setInteractive({ useHandCursor: true });
      const txt = this.add.text(cx, modeY, modeLabels[modeKey], {
        fontSize: '14px', color: '#88CC88',
      }).setOrigin(0.5);
      bg.on('pointerdown', () => this._selectMode(modeKey));
      return { bg, txt };
    };

    this._modeBtns = {
      timed:   _makeModeBtn(W / 2 - 110, 'timed'),
      endless: _makeModeBtn(W / 2 + 110, 'endless'),
    };
    this._selectMode('timed');   // highlight default

    // Start button
    const startBg = this.add.rectangle(W / 2, 608, 240, 50, 0x8B0000)
      .setInteractive({ useHandCursor: true });
    const startTxt = this.add.text(W / 2, 608, '開始冒險', {
      fontSize: '26px', color: '#FFD700',
    }).setOrigin(0.5);
    startBg.on('pointerover', () => startBg.setFillStyle(0xAA1111));
    startBg.on('pointerout',  () => startBg.setFillStyle(0x8B0000));
    startBg.on('pointerdown', () => {
      this.scene.start('GameScene', {
        characterKey: this._selected,
        gameMode:     this._gameMode,
        timeLimit:    CONFIG.GAME_MODES.TIMED.DURATION,
      });
    });
    this.tweens.add({ targets: startBg, scaleX: 1.02, scaleY: 1.02, yoyo: true, repeat: -1, duration: 900 });

    // Back button
    const backTxt = this.add.text(W / 2, 656, '← 返回主選單', {
      fontSize: '14px', color: '#555555',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backTxt.on('pointerover', () => backTxt.setColor('#888888'));
    backTxt.on('pointerout',  () => backTxt.setColor('#555555'));
    backTxt.on('pointerdown', () => this.scene.start('MenuScene'));

    // Select ranger by default
    this._selectCard('ranger');
  }

  _buildCard(cx, cy, key) {
    const cfg  = CONFIG.CHARACTERS[key];
    const cardW = 240, cardH = 350;

    // Card background
    const bg = this.add.rectangle(cx, cy, cardW, cardH, 0x111822)
      .setInteractive({ useHandCursor: true });

    // Coloured border (replaced on selection)
    const border = this.add.rectangle(cx, cy, cardW, cardH, 0x000000, 0)
      .setStrokeStyle(2, 0x333344);

    // Character sprite (scaled up)
    const sprite = this.add.image(cx, cy - 95, cfg.TEXTURE).setScale(3);

    // Name
    this.add.text(cx, cy - 38, cfg.name, {
      fontSize: '22px', fontFamily: 'Georgia, serif',
      color: '#' + cfg.ACCENT.toString(16).padStart(6, '0'),
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // Tagline
    this.add.text(cx, cy - 10, cfg.tagline, {
      fontSize: '12px', color: '#AAAAAA',
    }).setOrigin(0.5);

    // Stat bars
    const stats = [
      { label: 'HP',   pct: cfg.HP / 180 },
      { label: '速度', pct: cfg.SPEED / 180 },
      { label: '射程', pct: cfg.ATTACK_RANGE / 260 },
      { label: cfg.DEFENSE_PCT > 0 ? '減傷' : cfg.AOE ? 'AoE' : '防禦',
        pct: cfg.DEFENSE_PCT > 0 ? cfg.DEFENSE_PCT / 0.30 : cfg.AOE ? 1.0 : 0,
        special: cfg.DEFENSE_PCT > 0 ? `${Math.round(cfg.DEFENSE_PCT * 100)}%` : cfg.AOE ? '✓' : '─' },
    ];

    const barW = 130, barH = 8;
    const barStartY = cy + 28;
    stats.forEach((st, i) => {
      const ry = barStartY + i * 28;
      // Label
      this.add.text(cx - barW / 2 - 4, ry, st.label, {
        fontSize: '12px', color: '#777777',
      }).setOrigin(1, 0.5);
      // Bar background
      this.add.rectangle(cx + 10, ry, barW, barH, 0x222222).setOrigin(0, 0.5);
      // Bar fill
      const fillColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x224422),
        Phaser.Display.Color.ValueToColor(cfg.ACCENT),
        100, Math.round(st.pct * 100)
      );
      const fillHex = Phaser.Display.Color.GetColor(fillColor.r, fillColor.g, fillColor.b);
      this.add.rectangle(cx + 10, ry, barW * Math.min(1, st.pct), barH, fillHex).setOrigin(0, 0.5);
      // Special text (for last stat)
      if (st.special) {
        this.add.text(cx + 10 + barW + 6, ry, st.special, {
          fontSize: '11px', color: '#CCCCCC',
        }).setOrigin(0, 0.5);
      }
    });

    // Lore text
    this.add.text(cx, cy + 148, cfg.lore, {
      fontSize: '11px', color: '#555555',
    }).setOrigin(0.5);

    // Click handler
    bg.on('pointerover', () => {
      if (this._selected !== key) bg.setFillStyle(0x192233);
    });
    bg.on('pointerout', () => {
      if (this._selected !== key) bg.setFillStyle(0x111822);
    });
    bg.on('pointerdown', () => this._selectCard(key));

    this._cardEls[key] = { bg, border };
  }

  _selectCard(key) {
    // Deselect previous
    if (this._selected && this._cardEls[this._selected]) {
      const prev = this._cardEls[this._selected];
      prev.bg.setFillStyle(0x111822);
      prev.border.setStrokeStyle(2, 0x333344);
    }
    // Select new
    this._selected = key;
    const cfg = CONFIG.CHARACTERS[key];
    const cur = this._cardEls[key];
    cur.bg.setFillStyle(0x1a2a3a);
    cur.border.setStrokeStyle(3, cfg.ACCENT);
  }

  _selectMode(modeKey) {
    this._gameMode = modeKey;
    for (const [k, btn] of Object.entries(this._modeBtns)) {
      if (k === modeKey) {
        btn.bg.setFillStyle(0x1a3a1a).setStrokeStyle(2, 0x44AA44);
        btn.txt.setColor('#FFFFFF');
      } else {
        btn.bg.setFillStyle(0x1a2a1a).setStrokeStyle(2, 0x334433);
        btn.txt.setColor('#668866');
      }
    }
  }
}
