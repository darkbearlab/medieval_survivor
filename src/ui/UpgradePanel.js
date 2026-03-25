import { CONFIG } from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class UpgradePanel {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.currentBuilding = null;
    this._build();
    this._subscribe();
  }

  _subscribe() {
    this._onClicked = (b) => this.showFor(b);
    EventBus.on('building_clicked', this._onClicked);
  }

  _build() {
    const { WIDTH: W } = CONFIG;
    const panelW = 190;
    const panelH = 210;
    const cx = W - 20 - panelW / 2;
    const cy = 130 + panelH / 2;

    this.bg = this.scene.add.rectangle(cx, cy, panelW, panelH, 0x0d0d0d, 0.92)
      .setDepth(100).setStrokeStyle(2, 0x888888).setScrollFactor(0).setVisible(false);

    this.nameText = this.scene.add.text(cx, cy - panelH / 2 + 22, '', {
      fontSize: '18px', color: '#FFD700', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setVisible(false);

    this.levelText = this.scene.add.text(cx, cy - panelH / 2 + 48, '', {
      fontSize: '14px', color: '#CCCCCC',
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setVisible(false);

    this.hpText = this.scene.add.text(cx, cy - panelH / 2 + 72, '', {
      fontSize: '13px', color: '#88FF88',
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setVisible(false);

    this.statsText = this.scene.add.text(cx, cy - panelH / 2 + 96, '', {
      fontSize: '12px', color: '#AAAAAA',
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setVisible(false);

    this.costText = this.scene.add.text(cx, cy - panelH / 2 + 120, '', {
      fontSize: '12px', color: '#CCCC88',
    }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setVisible(false);

    this.upgradeBtn = this.scene.add.rectangle(cx, cy + panelH / 2 - 42, 150, 36, 0x2a5f2a)
      .setDepth(101).setStrokeStyle(1, 0x44AA44)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }).setVisible(false);
    this.upgradeBtnText = this.scene.add.text(cx, cy + panelH / 2 - 42, '升 級', {
      fontSize: '15px', color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setVisible(false);

    this.closeBtn = this.scene.add.text(cx + panelW / 2 - 14, cy - panelH / 2 + 14, '\u2715', {
      fontSize: '16px', color: '#FF4444',
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setInteractive({ useHandCursor: true }).setVisible(false);

    this.closeBtn.on('pointerdown', () => this.hide());
    this.upgradeBtn.on('pointerover', () => this.upgradeBtn.setFillStyle(0x3a7f3a));
    this.upgradeBtn.on('pointerout', () => this.upgradeBtn.setFillStyle(0x2a5f2a));
    this.upgradeBtn.on('pointerdown', () => this._doUpgrade());

    this._allEls = [
      this.bg, this.nameText, this.levelText, this.hpText, this.statsText,
      this.costText, this.upgradeBtn, this.upgradeBtnText, this.closeBtn,
    ];
  }

  showFor(building) {
    this.currentBuilding = building;
    this.visible = true;
    this._refresh();
    this._allEls.forEach(e => e.setVisible(true));
  }

  hide() {
    this.visible = false;
    this.currentBuilding = null;
    this._allEls.forEach(e => e.setVisible(false));
  }

  _refresh() {
    if (!this.currentBuilding) return;
    const b = this.currentBuilding;
    const nameMap = { wall: '城牆', tower: '箭塔', smith: '鐵匠鋪', training: '訓練場', cafeteria: '食堂', gathering: '採集所', repair: '維修工' };
    const name = nameMap[b.type] || b.type;
    this.nameText.setText(name);
    this.levelText.setText(`等級 ${b.level}`);
    this.hpText.setText(`HP: ${Math.ceil(b.hp)} / ${b.maxHp}`);

    if (b.type === 'tower') {
      this.statsText.setText(`射程 ${b.range}  速率 ${(1000 / b.attackRate).toFixed(1)}/s`);
    } else if (b.type === 'smith') {
      this.statsText.setText(`防禦加成 +${b.defenseBonus}`);
    } else if (b.type === 'training') {
      this.statsText.setText(`攻擊加成 +${b.atkBonus}`);
    } else if (b.type === 'cafeteria') {
      this.statsText.setText(`回血 ${b.healRate}HP/s  範圍 ${b.healRange}`);
    } else if (b.type === 'gathering') {
      this.statsText.setText(`採集範圍 ${b.range}  速率 ${b.collectRate}ms`);
    } else if (b.type === 'repair') {
      this.statsText.setText(`修復速度 ${b.repairRate}HP/s`);
    } else {
      this.statsText.setText('');
    }

    const nextLv = b.level + 1;
    const typeKeyMap = { smith: 'BLACKSMITH', training: 'TRAINING_GROUND', cafeteria: 'CAFETERIA', gathering: 'GATHERING_POST', repair: 'REPAIR_WORKSHOP' };
    const cfgTypeKey = typeKeyMap[b.type] || b.type.toUpperCase();
    const upgCfg = CONFIG.BUILDINGS[cfgTypeKey]?.UPGRADE?.[nextLv];

    if (upgCfg) {
      const costStr = Object.entries(upgCfg.COST).map(([r, v]) => {
        const names = { wood: '木材', stone: '石材', gold: '金幣', food: '糧食' };
        return `${names[r] || r}×${v}`;
      }).join('  ');
      this.costText.setText(`升級費用: ${costStr}`);
      this.upgradeBtn.setVisible(true);
      this.upgradeBtnText.setVisible(true);
    } else {
      this.costText.setText('已達最高等級');
      this.upgradeBtn.setVisible(false);
      this.upgradeBtnText.setVisible(false);
    }
  }

  _doUpgrade() {
    if (!this.currentBuilding) return;
    const b = this.currentBuilding;
    const nextLv = b.level + 1;
    const typeKeyMap2 = { smith: 'BLACKSMITH', training: 'TRAINING_GROUND', cafeteria: 'CAFETERIA', gathering: 'GATHERING_POST', repair: 'REPAIR_WORKSHOP' };
    const typeKey = typeKeyMap2[b.type] || b.type.toUpperCase();
    const upgCfg = CONFIG.BUILDINGS[typeKey]?.UPGRADE?.[nextLv];
    if (!upgCfg) return;

    const gameScene = this.scene.scene.get('GameScene');
    if (!gameScene.economy.canAffordWithGold(upgCfg.COST)) {
      this.costText.setColor('#FF4444');
      this.scene.time.delayedCall(600, () => this.costText.setColor('#CCCC88'));
      return;
    }

    gameScene.economy.spendWithGold(upgCfg.COST);
    EventBus.emit('resources_updated', gameScene.economy.resources);
    b.upgrade();
    this._refresh();
  }

  destroy() {
    EventBus.off('building_clicked', this._onClicked);
    this._allEls.forEach(e => e.destroy());
  }
}
