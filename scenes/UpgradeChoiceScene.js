import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';

// Rarity border colours (hex numbers for Phaser setStrokeStyle)
const RARITY_STROKE = {
  common:    0xBBBBBB,
  rare:      0x4499FF,
  epic:      0xCC55FF,
  legendary: 0xFFD700,
};

// Rarity background tints (lighter fill when hovered)
const RARITY_FILL = {
  common:    0x1a1a1a,
  rare:      0x0d1a2e,
  epic:      0x1a0d2e,
  legendary: 0x2e2000,
};

const RARITY_FILL_HOVER = {
  common:    0x2a2a2a,
  rare:      0x142a44,
  epic:      0x2a1444,
  legendary: 0x443200,
};

export class UpgradeChoiceScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UpgradeChoiceScene' });
  }

  // picks: [{ key, rarity }, { key, rarity }, { key, rarity }]
  init(data) {
    this.picks = data.picks || [];
  }

  create() {
    const { WIDTH: W, HEIGHT: H } = CONFIG;

    // Semi-transparent overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(0);

    // Title
    this.add.text(W / 2, H / 2 - 195, '選擇一項強化', {
      fontSize: '26px', fontFamily: 'Georgia, serif',
      color: '#FFD700', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);

    this.add.text(W / 2, H / 2 - 163, '按 1 / 2 / 3 或點擊選擇', {
      fontSize: '13px', color: '#666666',
    }).setOrigin(0.5).setDepth(1);

    // Cards
    const cardW   = 210;
    const cardH   = 200;
    const spacing = 245;
    const cardY   = H / 2 + 15;
    const startX  = W / 2 - spacing;

    this.picks.forEach(({ key, rarity }, i) => {
      const cfg       = CONFIG.UPGRADE_POOL[key];
      if (!cfg) return;
      const rarCfg    = CONFIG.UPGRADE_RARITIES[rarity] || CONFIG.UPGRADE_RARITIES.common;
      const stroke    = RARITY_STROKE[rarity]       || 0xBBBBBB;
      const fill      = RARITY_FILL[rarity]         || 0x1a1a1a;
      const fillHover = RARITY_FILL_HOVER[rarity]   || 0x2a2a2a;
      const cx        = startX + i * spacing;

      // Current level of this upgrade
      const gameScene  = this.scene.get('GameScene');
      const curLevel   = (gameScene?.player?._upgradeLevels?.[key]) || 0;
      const nextLevel  = Math.min(curLevel + 1, cfg.maxLevel);
      const isTransform = nextLevel === cfg.maxLevel && cfg.maxLevel === 10;

      // Card background
      const bg = this.add.rectangle(cx, cardY, cardW, cardH, fill)
        .setStrokeStyle(2, stroke).setDepth(1)
        .setInteractive({ useHandCursor: true });

      // Rarity label (top strip)
      const rarLabel = this.add.text(cx, cardY - cardH / 2 + 14, rarCfg.label, {
        fontSize: '11px', fontFamily: 'Georgia, serif',
        color: rarCfg.color,
      }).setOrigin(0.5).setDepth(2);

      // Icon
      this.add.text(cx, cardY - cardH / 2 + 42, cfg.icon || '✦', {
        fontSize: '28px',
      }).setOrigin(0.5).setDepth(2);

      // Weapon name
      this.add.text(cx, cardY - cardH / 2 + 76, cfg.name, {
        fontSize: '17px', fontFamily: 'Georgia, serif',
        color: rarCfg.color, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(2);

      // Level indicator  e.g.  "Lv 2 → 3"  or  "★ 蛻變！" at level 10
      const levelText = isTransform
        ? '★ 蛻變！'
        : `Lv ${curLevel === 0 ? '—' : curLevel} → ${nextLevel}`;
      const levelColor = isTransform ? '#FFD700' : '#888888';
      this.add.text(cx, cardY - cardH / 2 + 100, levelText, {
        fontSize: '12px', color: levelColor,
      }).setOrigin(0.5).setDepth(2);

      // Description: use per-level label/desc if defined, otherwise rarityBonus fallback
      const nextLvCfg = cfg.levels ? cfg.levels[nextLevel - 1] : null;
      let descText;
      if (isTransform) {
        descText = (nextLvCfg && nextLvCfg.desc) || '解鎖獨特蛻變效果';
      } else if (nextLvCfg) {
        const val = nextLvCfg.values ? nextLvCfg.values[rarity] : null;
        descText = nextLvCfg.label + (val != null ? `  [${rarity === 'common' ? '普' : rarity === 'rare' ? '稀' : rarity === 'epic' ? '詩' : '傳'}+${val}]` : '');
      } else {
        const bonusVal = (cfg.rarityBonus && cfg.rarityBonus[rarity]) || 0;
        descText = `攻擊力 +${bonusVal}`;
      }
      this.add.text(cx, cardY - cardH / 2 + 128, descText, {
        fontSize: '11px', color: '#AAAAAA',
        wordWrap: { width: cardW - 20 }, align: 'center',
      }).setOrigin(0.5).setDepth(2);

      // Max level bar (10 pips)
      const pipW    = 14;
      const pipGap  = 3;
      const barW    = cfg.maxLevel * (pipW + pipGap) - pipGap;
      const barX0   = cx - barW / 2;
      const barY    = cardY + cardH / 2 - 28;
      for (let p = 0; p < cfg.maxLevel; p++) {
        const filled = p < curLevel;
        const px = barX0 + p * (pipW + pipGap) + pipW / 2;
        this.add.rectangle(px, barY, pipW, 6,
          filled ? stroke : 0x333333
        ).setDepth(2);
      }

      // Keyboard hint
      this.add.text(cx, cardY + cardH / 2 - 11, `[${i + 1}]`, {
        fontSize: '13px', color: '#445544',
      }).setOrigin(0.5).setDepth(2);

      // Hover effects
      bg.on('pointerover', () => {
        bg.setFillStyle(fillHover).setStrokeStyle(3, stroke);
        rarLabel.setColor('#FFFFFF');
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(fill).setStrokeStyle(2, stroke);
        rarLabel.setColor(rarCfg.color);
      });
      bg.on('pointerdown', () => this._pick(key, rarity));
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
      if (Phaser.Input.Keyboard.JustDown(k) && this.picks[i]) {
        this._pick(this.picks[i].key, this.picks[i].rarity);
      }
    });
  }

  _pick(key, rarity) {
    EventBus.emit('upgrade_chosen', { key, rarity });
  }
}
