import { CONFIG } from '../config.js';

function weapCfg(charKey) {
  const wKey = CONFIG.CHARACTERS[charKey]?.STARTING_WEAPON || 'hunter_bow';
  return CONFIG.WEAPONS[wKey] || CONFIG.WEAPONS.hunter_bow;
}

export const CHAR_KEYS = ['warrior', 'ranger', 'mage', 'princess'];

const LIST_W   = 220;   // left panel width
const CARD_H   = 90;    // list item height
const CARD_GAP = 6;     // gap between items
const LIST_TOP = 52;    // y where list starts (below panel title)

// Building name lookup for bonus display
const BNAME = { castle: '城堡', tower: '箭塔', barracks: '兵營', mage_tower: '法師塔' };

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create() {
    const { WIDTH: W, HEIGHT: H } = CONFIG;
    this._selected = null;
    this._gameMode = 'timed';
    this._listY    = 0;

    // ── Background ───────────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1b2a);

    // ── Left panel ───────────────────────────────────────────────────────────
    this.add.rectangle(LIST_W / 2, H / 2, LIST_W, H, 0x080f18);
    this.add.rectangle(LIST_W, H / 2, 2, H, 0x1a3040);
    this.add.text(LIST_W / 2, 28, '選擇角色', {
      fontSize: '17px', fontFamily: 'Georgia, serif',
      color: '#FFD700', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    // ── Scrollable list ──────────────────────────────────────────────────────
    this._listContainer = this.add.container(0, 0).setDepth(5);
    this._cardObjs = {};
    this._buildList();

    // Mask: clips list to the area below the title
    const maskGfx = this.make.graphics({ add: false });
    maskGfx.fillRect(0, LIST_TOP, LIST_W, H - LIST_TOP);
    this._listContainer.setMask(maskGfx.createGeometryMask());

    // Scroll: mouse wheel
    this.input.on('wheel', (_p, _go, _dx, dy) => {
      if (this.input.activePointer.x < LIST_W) this._scroll(dy * 0.6);
    });

    // Scroll: drag
    let dragY0 = null, scrollY0 = 0;
    this.input.on('pointerdown', p => {
      if (p.x < LIST_W) { dragY0 = p.y; scrollY0 = this._listY; }
    });
    this.input.on('pointermove', p => {
      if (dragY0 !== null && p.isDown) this._setScroll(scrollY0 - (p.y - dragY0));
    });
    this.input.on('pointerup', () => { dragY0 = null; });

    // ── Right panel (rebuilt on each selection) ───────────────────────────────
    this._detailContainer = this.add.container(0, 0).setDepth(5);

    // ── Mode selection ────────────────────────────────────────────────────────
    const panelCX  = LIST_W + (W - LIST_W) / 2;
    const modeY    = H - 112;
    const timedMin = Math.floor(CONFIG.GAME_MODES.TIMED.DURATION / 60);
    const modeLabels = {
      timed:   `⏱  限時 ${timedMin} 分鐘`,
      endless: '∞  無盡模式',
    };
    const _makeModeBtn = (cx, modeKey) => {
      const bg  = this.add.rectangle(cx, modeY, 200, 38, 0x1a2a1a)
        .setStrokeStyle(2, 0x334433).setInteractive({ useHandCursor: true }).setDepth(10);
      const txt = this.add.text(cx, modeY, modeLabels[modeKey], {
        fontSize: '13px', color: '#88CC88',
      }).setOrigin(0.5).setDepth(11);
      bg.on('pointerdown', () => this._selectMode(modeKey));
      return { bg, txt };
    };
    this._modeBtns = {
      timed:   _makeModeBtn(panelCX - 108, 'timed'),
      endless: _makeModeBtn(panelCX + 108, 'endless'),
    };
    this._selectMode('timed');

    // ── Start button ──────────────────────────────────────────────────────────
    const startBg = this.add.rectangle(panelCX, H - 58, 240, 50, 0x8B0000)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.add.text(panelCX, H - 58, '開始冒險', {
      fontSize: '26px', color: '#FFD700',
    }).setOrigin(0.5).setDepth(11);
    startBg.on('pointerover', () => startBg.setFillStyle(0xAA1111));
    startBg.on('pointerout',  () => startBg.setFillStyle(0x8B0000));
    startBg.on('pointerdown', () => {
      if (!this._selected) return;
      this.scene.start('GameScene', {
        characterKey: this._selected,
        gameMode:     this._gameMode,
        timeLimit:    CONFIG.GAME_MODES.TIMED.DURATION,
      });
    });
    this.tweens.add({ targets: startBg, scaleX: 1.02, scaleY: 1.02, yoyo: true, repeat: -1, duration: 900 });

    // ── Back button ───────────────────────────────────────────────────────────
    const backTxt = this.add.text(panelCX, H - 20, '← 返回主選單', {
      fontSize: '14px', color: '#555555',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    backTxt.on('pointerover', () => backTxt.setColor('#888888'));
    backTxt.on('pointerout',  () => backTxt.setColor('#555555'));
    backTxt.on('pointerdown', () => this.scene.start('MenuScene'));

    // Default selection
    this._selectCard('ranger');
  }

  // ── Build the scrollable character list ─────────────────────────────────────
  _buildList() {
    CHAR_KEYS.forEach((key, i) => {
      const cfg = CONFIG.CHARACTERS[key];
      const cy  = LIST_TOP + i * (CARD_H + CARD_GAP) + CARD_H / 2;
      const accentHex = '#' + cfg.ACCENT.toString(16).padStart(6, '0');

      const bg = this.add.rectangle(LIST_W / 2, cy, LIST_W - 10, CARD_H, 0x111822)
        .setInteractive({ useHandCursor: true });
      const border = this.add.rectangle(LIST_W / 2, cy, LIST_W - 10, CARD_H, 0x000000, 0)
        .setStrokeStyle(2, 0x222233);
      const sprite = this.add.image(38, cy, cfg.TEXTURE).setScale(2.5);
      const name   = this.add.text(74, cy - 14, cfg.name, {
        fontSize: '15px', fontFamily: 'Georgia, serif',
        color: accentHex, stroke: '#000000', strokeThickness: 2,
      });
      const tag = this.add.text(74, cy + 8, cfg.tagline, {
        fontSize: '10px', color: '#556677',
        wordWrap: { width: 130 },
      });

      bg.on('pointerover', () => { if (this._selected !== key) bg.setFillStyle(0x161f2e); });
      bg.on('pointerout',  () => { if (this._selected !== key) bg.setFillStyle(0x111822); });
      bg.on('pointerdown', () => this._selectCard(key));

      this._listContainer.add([bg, border, sprite, name, tag]);
      this._cardObjs[key] = { bg, border };
    });
  }

  // ── Rebuild the right-panel detail view for a given character ─────────────
  _refreshDetail(key) {
    this._detailContainer.removeAll(true);

    const cfg = CONFIG.CHARACTERS[key];
    const wCfg = weapCfg(key);
    const { WIDTH: W, HEIGHT: H } = CONFIG;
    const accentHex = '#' + cfg.ACCENT.toString(16).padStart(6, '0');

    // Layout anchors
    const panelCX = LIST_W + (W - LIST_W) / 2;   // center of right panel
    const contentX = LIST_W + 50;                  // left edge of content
    const spriteX  = contentX + 60;               // sprite center
    const infoX    = contentX + 140;              // text start (right of sprite)
    const barX     = contentX + 10;               // bar left edge
    const barW     = 260;

    const add = (obj) => { this._detailContainer.add(obj); return obj; };

    // ── Large character sprite ───────────────────────────────────────────────
    add(this.add.image(spriteX, 115, cfg.TEXTURE).setScale(5));

    // ── Name ─────────────────────────────────────────────────────────────────
    add(this.add.text(infoX, 60, cfg.name, {
      fontSize: '40px', fontFamily: 'Georgia, serif',
      color: accentHex, stroke: '#000000', strokeThickness: 4,
    }));

    // ── Tagline ───────────────────────────────────────────────────────────────
    add(this.add.text(infoX, 112, cfg.tagline, {
      fontSize: '14px', color: '#778899',
    }));

    // ── Weapon ───────────────────────────────────────────────────────────────
    add(this.add.text(infoX, 134, `${wCfg.icon} ${wCfg.name} — ${wCfg.desc}`, {
      fontSize: '12px', color: accentHex,
    }));

    // ── Stat section header ───────────────────────────────────────────────────
    const barH     = 10;
    const barStartY = 186;
    add(this.add.text(barX, barStartY - 22, '屬性', {
      fontSize: '12px', color: '#FFD700',
    }));

    // ── Stat bars ─────────────────────────────────────────────────────────────
    const stats = [
      { label: 'HP',   pct: cfg.HP / 180 },
      { label: '速度', pct: cfg.SPEED / 180 },
      { label: '射程', pct: wCfg.RANGE / 260 },
      { label: wCfg.AOE ? 'AoE' : cfg.DEFENSE_PCT > 0 ? '減傷' : '防禦',
        pct:     wCfg.AOE ? 1.0  : cfg.DEFENSE_PCT > 0 ? cfg.DEFENSE_PCT / 0.30 : 0,
        special: wCfg.AOE ? '✓'  : cfg.DEFENSE_PCT > 0 ? `${Math.round(cfg.DEFENSE_PCT * 100)}%` : '─' },
    ];

    stats.forEach((st, i) => {
      const ry = barStartY + i * 28;
      const fillW = barW * Math.min(1, st.pct);

      add(this.add.text(barX - 6, ry, st.label, {
        fontSize: '12px', color: '#778899',
      }).setOrigin(1, 0.5));

      add(this.add.rectangle(barX + barW / 2, ry, barW, barH, 0x151e2a)
        .setStrokeStyle(1, 0x2a3a4a));

      if (fillW > 0) {
        const fc = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.ValueToColor(0x224422),
          Phaser.Display.Color.ValueToColor(cfg.ACCENT),
          100, Math.round(Math.min(1, st.pct) * 100)
        );
        add(this.add.rectangle(
          barX + fillW / 2, ry, fillW, barH,
          Phaser.Display.Color.GetColor(fc.r, fc.g, fc.b)
        ));
      }

      if (st.special) {
        add(this.add.text(barX + barW + 8, ry, st.special, {
          fontSize: '12px', color: '#BBBBBB',
        }).setOrigin(0, 0.5));
      }
    });

    // ── Starting bonus ────────────────────────────────────────────────────────
    const bonus = cfg.STARTING_BONUS || {};
    const bonusLines = [];
    if (bonus.food)  bonusLines.push(`🍞 初始糧食 +${bonus.food}`);
    if (bonus.gold)  bonusLines.push(`💰 初始金幣 +${bonus.gold}`);
    if (bonus.wood)  bonusLines.push(`🪵 初始木材 +${bonus.wood}`);
    if (bonus.stone) bonusLines.push(`🪨 初始石材 +${bonus.stone}`);
    if (Array.isArray(bonus.freeBuildings))
      bonus.freeBuildings.forEach(b => bonusLines.push(`🏗 免費 ${BNAME[b] || b}`));
    if (Array.isArray(bonus.upgrades))
      bonus.upgrades.forEach(u => {
        const up = CONFIG.WEAPON_UPGRADES[u];
        bonusLines.push(`⬆ 起始升級: ${up ? up.name : u}`);
      });

    if (bonusLines.length > 0) {
      const bonusY = barStartY + stats.length * 28 + 18;
      add(this.add.text(barX, bonusY, '起始加成', {
        fontSize: '12px', color: '#FFD700',
      }));
      bonusLines.forEach((line, i) => {
        add(this.add.text(barX + 8, bonusY + 20 + i * 20, line, {
          fontSize: '12px', color: '#CCAA44',
        }));
      });
    }

    // ── Lore ─────────────────────────────────────────────────────────────────
    add(this.add.text(panelCX, H - 152, `"${cfg.lore}"`, {
      fontSize: '13px', color: '#445566',
      fontStyle: 'italic',
    }).setOrigin(0.5));
  }

  // ── Select a character ────────────────────────────────────────────────────
  _selectCard(key) {
    if (this._selected && this._cardObjs[this._selected]) {
      const prev = this._cardObjs[this._selected];
      prev.bg.setFillStyle(0x111822);
      prev.border.setStrokeStyle(2, 0x222233);
    }
    this._selected = key;
    const cfg = CONFIG.CHARACTERS[key];
    const cur = this._cardObjs[key];
    cur.bg.setFillStyle(0x1a2a3a);
    cur.border.setStrokeStyle(3, cfg.ACCENT);

    this._refreshDetail(key);
  }

  // ── Select a game mode ────────────────────────────────────────────────────
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

  // ── Scroll helpers ────────────────────────────────────────────────────────
  _scroll(delta) {
    this._setScroll(this._listY + delta);
  }

  _setScroll(val) {
    const { HEIGHT: H } = CONFIG;
    const totalH  = CHAR_KEYS.length * (CARD_H + CARD_GAP);
    const visibleH = H - LIST_TOP;
    const maxScroll = Math.max(0, totalH - visibleH);
    this._listY = Phaser.Math.Clamp(val, 0, maxScroll);
    this._listContainer.y = -this._listY;
  }
}
