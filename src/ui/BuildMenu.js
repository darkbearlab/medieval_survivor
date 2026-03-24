import { CONFIG } from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class BuildMenu {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.elements = [];
    this._build();
  }

  _build() {
    const s = this.scene;
    const { WIDTH: W, HEIGHT: H } = CONFIG;
    const panelW = 270;
    const panelH = 230;
    const cx = W / 2;
    const cy = H / 2;
    const py = cy - panelH / 2;

    const bg = s.add.rectangle(cx, cy, panelW, panelH, 0x0d0d0d, 0.93)
      .setDepth(100).setStrokeStyle(2, 0xBB9944);

    const title = s.add.text(cx, py + 22, '\u2692 建造選單', {
      fontSize: '20px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(101);

    const closeBtn = s.add.text(cx + panelW / 2 - 18, py + 18, '\u2715', {
      fontSize: '18px', color: '#FF4444',
    }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());

    this.elements = [bg, title, closeBtn];

    const defs = [
      {
        type: 'wall',
        name: '城牆',
        desc: '阻擋敵人  HP 100',
        costText: '木材 ×8',
        cost: CONFIG.BUILDINGS.WALL.COST,
      },
      {
        type: 'tower',
        name: '箭塔',
        desc: '自動射擊  射程 200',
        costText: '木材 ×10  石材 ×5',
        cost: CONFIG.BUILDINGS.TOWER.COST,
      },
    ];

    this.btnBgs = [];
    defs.forEach((def, i) => {
      const btnCy = py + 80 + i * 72;
      const btnBg = s.add.rectangle(cx, btnCy, 240, 58, 0x222222)
        .setDepth(101).setStrokeStyle(1, 0x666666).setInteractive({ useHandCursor: true });
      const nameTxt = s.add.text(cx - 105, btnCy - 12, def.name, {
        fontSize: '17px', color: '#FFFFFF',
      }).setOrigin(0, 0.5).setDepth(102);
      const descTxt = s.add.text(cx - 105, btnCy + 10, def.desc, {
        fontSize: '12px', color: '#999999',
      }).setOrigin(0, 0.5).setDepth(102);
      const costTxt = s.add.text(cx + 108, btnCy, def.costText, {
        fontSize: '12px', color: '#CCCC88',
      }).setOrigin(1, 0.5).setDepth(102);

      btnBg.on('pointerover', () => btnBg.setFillStyle(0x3a3a3a));
      btnBg.on('pointerout', () => btnBg.setFillStyle(0x222222));
      btnBg.on('pointerdown', () => {
        EventBus.emit('build_select', def.type);
        this.hide();
      });

      this.elements.push(btnBg, nameTxt, descTxt, costTxt);
      this.btnBgs.push({ bg: btnBg, cost: def.cost });
    });

    const hint = s.add.text(cx, cy + panelH / 2 - 16, '[B] 關閉選單    放置時按 [ESC] 取消', {
      fontSize: '11px', color: '#555555',
    }).setOrigin(0.5).setDepth(101);
    this.elements.push(hint);

    this.elements.forEach(e => e.setVisible(false));
  }

  toggle() { this.visible ? this.hide() : this.show(); }

  show() {
    this.visible = true;
    this.elements.forEach(e => e.setVisible(true));
  }

  hide() {
    this.visible = false;
    this.elements.forEach(e => e.setVisible(false));
  }

  destroy() {
    this.elements.forEach(e => e.destroy());
  }
}
