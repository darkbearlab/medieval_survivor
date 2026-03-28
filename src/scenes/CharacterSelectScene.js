import { CONFIG } from '../config.js';

// Helper: read a character's starting weapon config
function weapCfg(charKey) {
  const wKey = CONFIG.CHARACTERS[charKey]?.STARTING_WEAPON || 'hunter_bow';
  return CONFIG.WEAPONS[wKey] || CONFIG.WEAPONS.hunter_bow;
}

const CHAR_KEYS = ['warrior', 'ranger', 'mage', 'princess'];

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create() {
    const { WIDTH: W, HEIGHT: H } = CONFIG;
    this._selected = 'ranger';
    this._gameMode = 'timed';
    this._cardEls  = {};   // key → { bg, border, details[] }

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    // Title
    this.add.text(W / 2, 52, '選擇角色', {
      fontSize: '38px', fontFamily: 'Georgia, serif',
      color: '#FFD700', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 92, '將滑鼠移到角色上查看詳情，點擊選擇', {
      fontSize: '14px', color: '#555555',
    }).setOrigin(0.5);

    // Character cards — evenly spaced for up to 4 characters
    const cardSpacing = 260;
    const totalW = cardSpacing * (CHAR_KEYS.length - 1);
    const cardCentersX = CHAR_KEYS.map((_, i) => W / 2 - totalW / 2 + i * cardSpacing);
    CHAR_KEYS.forEach((key, i) => {
      this._buildCard(cardCentersX[i], 330, key);
    });

    // ── Mode selection ──────────────────────────────────────────────────────
    const modeY    = 530;
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
    this._selectMode('timed');

    // Start button
    const startBg = this.add.rectangle(W / 2, 594, 240, 50, 0x8B0000)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, 594, '開始冒險', {
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
    const backTxt = this.add.text(W / 2, 645, '← 返回主選單', {
      fontSize: '14px', color: '#555555',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backTxt.on('pointerover', () => backTxt.setColor('#888888'));
    backTxt.on('pointerout',  () => backTxt.setColor('#555555'));
    backTxt.on('pointerdown', () => this.scene.start('MenuScene'));

    // Select ranger by default (show its details immediately)
    this._selectCard('ranger');
  }

  _buildCard(cx, cy, key) {
    const cfg   = CONFIG.CHARACTERS[key];
    const cardW = 240, cardH = 390;
    const accentHex = '#' + cfg.ACCENT.toString(16).padStart(6, '0');

    // ── Permanent elements ──────────────────────────────────────────────────
    const bg = this.add.rectangle(cx, cy, cardW, cardH, 0x111822)
      .setInteractive({ useHandCursor: true });

    const border = this.add.rectangle(cx, cy, cardW, cardH, 0x000000, 0)
      .setStrokeStyle(2, 0x333344);

    // Sprite sits at the vertical center of the compact view
    const sprite = this.add.image(cx, cy - 60, cfg.TEXTURE).setScale(3);

    // Name always visible
    const nameText = this.add.text(cx, cy + 50, cfg.name, {
      fontSize: '22px', fontFamily: 'Georgia, serif',
      color: accentHex, stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5);

    // ── Detail elements (hidden by default) ────────────────────────────────
    const details = [];

    const tagline = this.add.text(cx, cy + 78, cfg.tagline, {
      fontSize: '12px', color: '#888888',
    }).setOrigin(0.5).setVisible(false);
    details.push(tagline);

    // Weapon tag (shown below tagline)
    const wCfg = weapCfg(key);
    const weapTag = this.add.text(cx, cy + 96, `${wCfg.icon} ${wCfg.name}`, {
      fontSize: '12px', color: '#' + cfg.ACCENT.toString(16).padStart(6,'0'),
    }).setOrigin(0.5).setVisible(false);
    details.push(weapTag);

    // Stat bars
    const stats = [
      { label: 'HP',   pct: cfg.HP / 180 },
      { label: '速度', pct: cfg.SPEED / 180 },
      { label: '射程', pct: wCfg.RANGE / 260 },
      { label: wCfg.AOE ? 'AoE' : cfg.DEFENSE_PCT > 0 ? '減傷' : '防禦',
        pct:     wCfg.AOE ? 1.0 : cfg.DEFENSE_PCT > 0 ? cfg.DEFENSE_PCT / 0.30 : 0,
        special: wCfg.AOE ? '✓'  : cfg.DEFENSE_PCT > 0 ? `${Math.round(cfg.DEFENSE_PCT * 100)}%` : '─' },
    ];

    const barW = 120, barH = 8;
    const barStartY = cy + 126;  // shifted down to make room for weapon tag at cy+96
    stats.forEach((st, i) => {
      const ry = barStartY + i * 26;

      const lbl = this.add.text(cx - barW / 2 - 4, ry, st.label, {
        fontSize: '11px', color: '#666666',
      }).setOrigin(1, 0.5).setVisible(false);

      const barBg = this.add.rectangle(cx + 8, ry, barW, barH, 0x222222)
        .setOrigin(0, 0.5).setVisible(false);

      const fillColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x224422),
        Phaser.Display.Color.ValueToColor(cfg.ACCENT),
        100, Math.round(Math.min(1, st.pct) * 100)
      );
      const fillHex = Phaser.Display.Color.GetColor(fillColor.r, fillColor.g, fillColor.b);
      const barFill = this.add.rectangle(cx + 8, ry, barW * Math.min(1, st.pct), barH, fillHex)
        .setOrigin(0, 0.5).setVisible(false);

      details.push(lbl, barBg, barFill);

      if (st.special) {
        const spTxt = this.add.text(cx + 8 + barW + 5, ry, st.special, {
          fontSize: '11px', color: '#BBBBBB',
        }).setOrigin(0, 0.5).setVisible(false);
        details.push(spTxt);
      }
    });

    const lore = this.add.text(cx, cy + 238, cfg.lore, {
      fontSize: '11px', color: '#444444',
    }).setOrigin(0.5).setVisible(false);
    details.push(lore);

    // ── Interaction ─────────────────────────────────────────────────────────
    bg.on('pointerover', () => {
      if (this._selected !== key) bg.setFillStyle(0x161f2e);
      details.forEach(e => e.setVisible(true));
    });
    bg.on('pointerout', () => {
      if (this._selected !== key) {
        bg.setFillStyle(0x111822);
        details.forEach(e => e.setVisible(false));
      }
    });
    bg.on('pointerdown', () => this._selectCard(key));

    this._cardEls[key] = { bg, border, details };
  }

  _selectCard(key) {
    // Hide details on previously selected card (unless mouse is still over it)
    if (this._selected && this._cardEls[this._selected] && this._selected !== key) {
      const prev = this._cardEls[this._selected];
      prev.bg.setFillStyle(0x111822);
      prev.border.setStrokeStyle(2, 0x333344);
      prev.details.forEach(e => e.setVisible(false));
    }
    // Highlight new selection and show its details
    this._selected = key;
    const cfg = CONFIG.CHARACTERS[key];
    const cur = this._cardEls[key];
    cur.bg.setFillStyle(0x1a2a3a);
    cur.border.setStrokeStyle(3, cfg.ACCENT);
    cur.details.forEach(e => e.setVisible(true));
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
