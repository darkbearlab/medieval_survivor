import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';

// ── Building definitions ────────────────────────────────────────────────────
const DEFS = [
  { type: 'wall',       name: '城牆',   key: '1', desc: '阻擋敵人  HP 100',            costText: '木材×8',           texKey: 'building_wall'       },
  { type: 'tower',      name: '箭塔',   key: '2', desc: '自動射擊  射程 200',          costText: '木材×10  石材×5',  texKey: 'building_tower'      },
  { type: 'smith',      name: '鐵匠鋪', key: '3', desc: '防禦+5  HP 120',              costText: '木材×15  石材×10', texKey: 'building_smith'      },
  { type: 'training',   name: '訓練場', key: '4', desc: '攻擊+10  HP 100',             costText: '木材×12  石材×8',  texKey: 'building_training'   },
  { type: 'cafeteria',  name: '旅店',   key: '5', desc: '附近回血 3HP/s  HP 90',       costText: '木材×10  石材×5',  texKey: 'building_cafeteria'  },
  { type: 'gathering',  name: '採集所', key: '6', desc: '自動收集範圍內資源',          costText: '木材×12  石材×8',  texKey: 'building_gathering'  },
  { type: 'repair',     name: '維修工', key: '7', desc: '自動修復最低耐久建築',        costText: '木材×14  石材×10', texKey: 'building_repair'     },
  { type: 'barracks',   name: '兵營',   key: '8', desc: '自動生成士兵駐守',            costText: '木材×15  石材×12', texKey: 'building_barracks'   },
  { type: 'mage_tower', name: '法師塔', key: '9', desc: '召喚友方法師  AoE 攻擊',      costText: '木材×20  石材×15', texKey: 'building_mage_tower' },
  { type: 'farm',       name: '農田',   key: '0', desc: '生產糧食  手動/採集所採收',   costText: '木材×6',           texKey: 'building_farm'       },
  { type: 'granary',    name: '糧倉',   key: null, desc: '糧食上限+30  HP 80',          costText: '木材×12  石材×6',  texKey: 'building_granary'   },
];

// ── Resources row ───────────────────────────────────────────────────────────
const RES = [
  { prop: 'wood',  label: '木材', char: '木', fillColor: 0x336622, rimColor: 0x66cc44, textColor: '#88EE88' },
  { prop: 'stone', label: '石材', char: '石', fillColor: 0x555555, rimColor: 0xaaaaaa, textColor: '#CCCCCC' },
  { prop: 'food',  label: '糧食', char: '食', fillColor: 0x886600, rimColor: 0xddaa00, textColor: '#FFD700' },
  { prop: 'gold',  label: '金幣', char: '金', fillColor: 0x998800, rimColor: 0xffcc00, textColor: '#FFEE44' },
];

const SZ  = 52;   // slot width & height
const GAP = 4;    // gap between slots

export class BuildMenu {
  constructor(scene) {
    this.scene         = scene;
    this.selectedIndex = -1;
    this._allElements  = [];
    this._slotBgs      = [];
    this._resTexts     = {};
    this._build();
    this._subscribe();
  }

  _build() {
    const s = this.scene;
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;
    const N = DEFS.length;                           // 10
    const totalW = N * SZ + (N - 1) * GAP;          // 556
    const left   = Math.round((W - totalW) / 2);     // 362
    const slotY  = H - 32;                           // slot row centre Y
    const resY   = H - 72;                           // resource row centre Y

    // ── panel background ─────────────────────────────────────────────────────
    const panBg = s.add.rectangle(W / 2, H - 50, totalW + 24, 88, 0x080808, 0.90)
      .setDepth(90).setScrollFactor(0).setStrokeStyle(1, 0x2a2a2a);
    this._allElements.push(panBg);

    // thin separator between resource row and slot row
    const sep = s.add.rectangle(W / 2, H - 52, totalW + 16, 1, 0x333333)
      .setDepth(91).setScrollFactor(0);
    this._allElements.push(sep);

    // ── resource row ─────────────────────────────────────────────────────────
    const resSpan = totalW / RES.length;   // 139 px each

    RES.forEach((r, i) => {
      const cx = left + resSpan * i + resSpan / 2;

      // icon: small coloured square with a single Chinese character
      const iconRect = s.add.rectangle(cx - 20, resY, 18, 18, r.fillColor)
        .setDepth(92).setScrollFactor(0).setStrokeStyle(1, r.rimColor);
      const iconChar = s.add.text(cx - 20, resY, r.char, {
        fontSize: '11px', color: '#000000',
      }).setOrigin(0.5).setDepth(93).setScrollFactor(0);

      // value text
      const valTxt = s.add.text(cx - 8, resY, '0', {
        fontSize: '15px', color: r.textColor,
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5).setDepth(92).setScrollFactor(0);
      this._resTexts[r.prop] = valTxt;

      // invisible hit zone for tooltip
      const zone = s.add.rectangle(cx, resY, resSpan - 6, 26, 0x000000, 0)
        .setDepth(94).setScrollFactor(0).setInteractive();
      zone.on('pointerover', () =>
        this._showTooltip(cx, resY - 18, r.label, `目前數量: ${valTxt.text}`, ''));
      zone.on('pointerout',  () => this._hideTooltip());

      this._allElements.push(iconRect, iconChar, valTxt, zone);
    });

    // ── building slots ────────────────────────────────────────────────────────
    DEFS.forEach((def, i) => {
      const cx = left + i * (SZ + GAP) + SZ / 2;

      const slotBg = s.add.rectangle(cx, slotY, SZ, SZ, 0x181818)
        .setDepth(91).setScrollFactor(0)
        .setStrokeStyle(1, 0x444444)
        .setInteractive({ useHandCursor: true });

      // building icon (scaled-down texture)
      let icon = null;
      if (def.texKey && s.textures.exists(def.texKey)) {
        icon = s.add.image(cx, slotY - 2, def.texKey)
          .setDisplaySize(36, 36).setDepth(92).setScrollFactor(0);
      }

      // key number label (top-left corner of slot)
      const keyLbl = s.add.text(cx - SZ / 2 + 4, slotY - SZ / 2 + 3, def.key || '', {
        fontSize: '11px', color: '#666666',
      }).setOrigin(0, 0).setDepth(93).setScrollFactor(0);

      slotBg.on('pointerover', () => {
        if (i !== this.selectedIndex) slotBg.setFillStyle(0x2a2a2a);
        this._showTooltip(cx, slotY - SZ / 2 - 6, def.name, def.desc, def.costText);
      });
      slotBg.on('pointerout', () => {
        if (i !== this.selectedIndex) slotBg.setFillStyle(0x181818);
        this._hideTooltip();
      });
      slotBg.on('pointerdown', () => this._toggleSlot(i));

      this._slotBgs.push(slotBg);
      this._allElements.push(slotBg, keyLbl);
      if (icon) this._allElements.push(icon);
    });

    // ── shared tooltip (hidden by default) ───────────────────────────────────
    this._tip = {
      bg:   s.add.rectangle(0, 0, 10, 10, 0x0d0d0d, 0.95)
              .setDepth(200).setScrollFactor(0).setVisible(false).setStrokeStyle(1, 0x666666),
      name: s.add.text(0, 0, '', { fontSize: '14px', color: '#FFD700', stroke: '#000', strokeThickness: 2 })
              .setOrigin(0.5).setDepth(201).setScrollFactor(0).setVisible(false),
      desc: s.add.text(0, 0, '', { fontSize: '12px', color: '#AAAAAA' })
              .setOrigin(0.5).setDepth(201).setScrollFactor(0).setVisible(false),
      cost: s.add.text(0, 0, '', { fontSize: '12px', color: '#CCCC88' })
              .setOrigin(0.5).setDepth(201).setScrollFactor(0).setVisible(false),
    };

    // ── hint label ───────────────────────────────────────────────────────────
    const hint = s.add.text(W - 10, H - 8, '[F] 集結士兵  [ESC]/右鍵 取消放置', {
      fontSize: '11px', color: '#3a3a3a',
    }).setOrigin(1, 1).setDepth(92).setScrollFactor(0);
    this._allElements.push(hint);
  }

  _subscribe() {
    this._onCancelled = () => this._clearSelection();
    this._onResources = (r) => this._updateResources(r);
    EventBus.on('build_cancelled',   this._onCancelled);
    EventBus.on('resources_updated', this._onResources);
  }

  // ── slot selection ────────────────────────────────────────────────────────

  _toggleSlot(i) {
    if (this.selectedIndex === i) {
      // Same slot → deselect and cancel placing
      this._clearSelection();
      EventBus.emit('build_cancelled');
    } else {
      this._clearSelection();
      this._setSelected(i);
      EventBus.emit('build_select', DEFS[i].type);
    }
  }

  /** Called from GameScene when 1–0 keys are pressed. */
  selectByKey(i) { this._toggleSlot(i); }

  _setSelected(i) {
    this.selectedIndex = i;
    this._slotBgs[i].setFillStyle(0x1a3a1a).setStrokeStyle(2, 0x44AA44);
  }

  _clearSelection() {
    if (this.selectedIndex >= 0) {
      this._slotBgs[this.selectedIndex].setFillStyle(0x181818).setStrokeStyle(1, 0x444444);
      this.selectedIndex = -1;
    }
  }

  // ── resource update ───────────────────────────────────────────────────────

  _updateResources(res) {
    for (const r of RES) {
      if (!this._resTexts[r.prop]) continue;
      if (r.prop === 'food' && res.maxFood !== undefined) {
        this._resTexts[r.prop].setText(`${res.food}/${res.maxFood}`);
      } else {
        this._resTexts[r.prop].setText(`${res[r.prop] ?? 0}`);
      }
    }
  }

  // ── tooltip ───────────────────────────────────────────────────────────────

  _showTooltip(anchorX, anchorBottomY, name, desc, cost) {
    const W     = CONFIG.WIDTH;
    const lines = [name, desc, cost].filter(Boolean);
    const tipW  = Math.max(150, Math.max(...lines.map(l => l.length * 12)) + 24);
    const tipH  = lines.length * 20 + 10;
    const cx    = Math.min(Math.max(anchorX, tipW / 2 + 6), W - tipW / 2 - 6);
    const cy    = anchorBottomY - tipH / 2;

    this._tip.bg.setPosition(cx, cy).setSize(tipW, tipH).setVisible(true);

    const top = cy - tipH / 2 + 14;
    this._tip.name.setPosition(cx, top).setVisible(true).setText(name);
    if (desc) {
      this._tip.desc.setPosition(cx, top + 18).setVisible(true).setText(desc);
    } else {
      this._tip.desc.setVisible(false);
    }
    if (cost) {
      this._tip.cost.setPosition(cx, top + (desc ? 36 : 18)).setVisible(true).setText(cost);
    } else {
      this._tip.cost.setVisible(false);
    }
  }

  _hideTooltip() {
    this._tip.bg.setVisible(false);
    this._tip.name.setVisible(false);
    this._tip.desc.setVisible(false);
    this._tip.cost.setVisible(false);
  }

  // ── compatibility shims (old API no longer used) ─────────────────────────
  toggle() {}
  show()   {}
  hide()   {}

  destroy() {
    EventBus.off('build_cancelled',   this._onCancelled);
    EventBus.off('resources_updated', this._onResources);
    this._allElements.forEach(e => e.destroy());
    Object.values(this._tip).forEach(e => e.destroy());
  }
}
