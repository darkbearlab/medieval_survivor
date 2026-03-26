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
    const panelH = 250;
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

    this.deployBtn = this.scene.add.rectangle(cx, cy + panelH / 2 - 84, 150, 32, 0x1a3a6a)
      .setDepth(101).setStrokeStyle(1, 0x4488CC)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }).setVisible(false);
    this.deployBtnText = this.scene.add.text(cx, cy + panelH / 2 - 84, '帶走', {
      fontSize: '14px', color: '#88CCFF',
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setVisible(false);

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
    this.deployBtn.on('pointerover', () => this.deployBtn.setFillStyle(0x224488));
    this.deployBtn.on('pointerout',  () => this.deployBtn.setFillStyle(0x1a3a6a));
    this.deployBtn.on('pointerdown', () => this._doDeployAll());
    this.upgradeBtn.on('pointerover', () => this.upgradeBtn.setFillStyle(0x3a7f3a));
    this.upgradeBtn.on('pointerout', () => this.upgradeBtn.setFillStyle(0x2a5f2a));
    this.upgradeBtn.on('pointerdown', () => this._doUpgrade());

    this._allEls = [
      this.bg, this.nameText, this.levelText, this.hpText, this.statsText,
      this.costText, this.deployBtn, this.deployBtnText, this.upgradeBtn, this.upgradeBtnText, this.closeBtn,
    ];
  }

  showFor(building) {
    this.currentBuilding = building;
    this.visible = true;
    this._allEls.forEach(e => e.setVisible(true));
    // Always pre-hide conditional buttons; _refresh() re-shows them only when appropriate
    this.deployBtn.setVisible(false);
    this.deployBtnText.setVisible(false);
    this._refresh();
  }

  hide() {
    this.visible = false;
    this.currentBuilding = null;
    this._allEls.forEach(e => e.setVisible(false));
  }

  _refresh() {
    if (!this.currentBuilding) return;
    const b = this.currentBuilding;
    const nameMap = { wall: '城牆', tower: '箭塔', smith: '鐵匠鋪', training: '訓練場', cafeteria: '食堂', gathering: '採集所', repair: '維修工', barracks: '兵營', mage_tower: '法師塔', farm: '農田' };
    const name = nameMap[b.type] || b.type;
    this.nameText.setText(name);
    this.hpText.setColor('#88FF88'); // reset color before farm override

    if (b.type === 'farm') {
      this.levelText.setText('無法升級');
      this.hpText.setText(b.depleted ? '狀態：恢復中' : '狀態：可採集 ✓');
      this.hpText.setColor(b.depleted ? '#FF8844' : '#44FF88');
      this.statsText.setText(`產糧 ${CONFIG.BUILDINGS.FARM.FOOD_YIELD} 糧食/次\n恢復 ${CONFIG.BUILDINGS.FARM.REGEN_TIME / 1000}s`);
      this.costText.setText('');
      this.deployBtn.setVisible(false);
      this.deployBtnText.setVisible(false);
      this.upgradeBtn.setVisible(false);
      this.upgradeBtnText.setVisible(false);
      return;
    }

    this.levelText.setText(`等級 ${b.level}`);
    this.hpText.setText(`HP: ${Math.ceil(b.hp)} / ${b.maxHp}`);

    // Hide deploy button by default; barracks/mage_tower branches re-show it if applicable
    this.deployBtn.setVisible(false);
    this.deployBtnText.setVisible(false);

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
    } else if (b.type === 'barracks') {
      const alive    = b.soldiers.filter(s => !s.dead).length;
      const deployed = b.soldiers.filter(s => !s.dead && s.deployed).length;
      const ready    = alive - deployed;
      this.statsText.setText(`士兵 ${ready}/${b.maxSoldiers}  外出 ${deployed}`);
      const hasReady = ready > 0;
      this.deployBtn.setVisible(hasReady);
      this.deployBtnText.setVisible(hasReady);
      if (hasReady) this.deployBtnText.setText(`帶走 (${ready} 名)`);
    } else if (b.type === 'mage_tower') {
      const alive    = b.mages.filter(m => !m.dead).length;
      const deployed = b.mages.filter(m => !m.dead && m.deployed).length;
      const ready    = alive - deployed;
      this.statsText.setText(`法師 ${ready}/${b.maxMages}  外出 ${deployed}`);
      const hasReady = ready > 0;
      this.deployBtn.setVisible(hasReady);
      this.deployBtnText.setVisible(hasReady);
      if (hasReady) this.deployBtnText.setText(`帶走 (${ready} 名)`);
    } else {
      this.statsText.setText('');
    }

    const nextLv = b.level + 1;
    const typeKeyMap = { smith: 'BLACKSMITH', training: 'TRAINING_GROUND', cafeteria: 'CAFETERIA', gathering: 'GATHERING_POST', repair: 'REPAIR_WORKSHOP', barracks: 'BARRACKS', mage_tower: 'MAGE_TOWER' };
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
    const typeKeyMap2 = { smith: 'BLACKSMITH', training: 'TRAINING_GROUND', cafeteria: 'CAFETERIA', gathering: 'GATHERING_POST', repair: 'REPAIR_WORKSHOP', barracks: 'BARRACKS', mage_tower: 'MAGE_TOWER' };
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

  _doDeployAll() {
    const b = this.currentBuilding;
    if (!b) return;
    if (b.type === 'barracks' || b.type === 'mage_tower') {
      b._deployAll();
      this._refresh();
    }
  }

  destroy() {
    EventBus.off('building_clicked', this._onClicked);
    this._allEls.forEach(e => e.destroy());
  }
}
