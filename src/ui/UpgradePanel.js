import { CONFIG } from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class UpgradePanel {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.currentBuilding = null;
    this._deleteArmed = false;   // two-click delete confirmation state
    this._build();
    this._subscribe();
  }

  _subscribe() {
    this._onClicked      = (b) => this.showFor(b);
    this._onClosePanel   = () => { if (this.visible) this.hide(); };
    EventBus.on('building_clicked',    this._onClicked);
    EventBus.on('close_upgrade_panel', this._onClosePanel);
  }

  _build() {
    const { WIDTH: W } = CONFIG;
    const panelW = 190;
    const panelH = 306;   // extended from 250 to fit delete button
    const cx = W - 20 - panelW / 2;
    const cy = 130 + panelH / 2;   // top of panel stays at y=130

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

    // ── Deploy button (barracks / mage_tower only) ────────────────────────────
    this.deployBtn = this.scene.add.rectangle(cx, cy + panelH / 2 - 140, 150, 32, 0x1a3a6a)
      .setDepth(101).setStrokeStyle(1, 0x4488CC)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }).setVisible(false);
    this.deployBtnText = this.scene.add.text(cx, cy + panelH / 2 - 140, '帶走', {
      fontSize: '14px', color: '#88CCFF',
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setVisible(false);

    // ── Upgrade button ────────────────────────────────────────────────────────
    this.upgradeBtn = this.scene.add.rectangle(cx, cy + panelH / 2 - 98, 150, 36, 0x2a5f2a)
      .setDepth(101).setStrokeStyle(1, 0x44AA44)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }).setVisible(false);
    this.upgradeBtnText = this.scene.add.text(cx, cy + panelH / 2 - 98, '升 級', {
      fontSize: '15px', color: '#FFFFFF',
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setVisible(false);

    // ── Delete button ─────────────────────────────────────────────────────────
    this.deleteBtn = this.scene.add.rectangle(cx, cy + panelH / 2 - 36, 150, 30, 0x4a0a0a)
      .setDepth(101).setStrokeStyle(1, 0x882222)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }).setVisible(false);
    this.deleteBtnText = this.scene.add.text(cx, cy + panelH / 2 - 36, '🗑 拆除建築', {
      fontSize: '13px', color: '#FF6666',
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setVisible(false);

    // ── Close button (×) ─────────────────────────────────────────────────────
    this.closeBtn = this.scene.add.text(cx + panelW / 2 - 14, cy - panelH / 2 + 14, '\u2715', {
      fontSize: '16px', color: '#FF4444',
    }).setOrigin(0.5).setDepth(102).setScrollFactor(0).setInteractive({ useHandCursor: true }).setVisible(false);

    // ── Button events ─────────────────────────────────────────────────────────
    this.closeBtn.on('pointerdown', () => this.hide());

    this.deployBtn.on('pointerover', () => this.deployBtn.setFillStyle(0x224488));
    this.deployBtn.on('pointerout',  () => this.deployBtn.setFillStyle(0x1a3a6a));
    this.deployBtn.on('pointerdown', () => this._doDeployAll());

    this.upgradeBtn.on('pointerover', () => this.upgradeBtn.setFillStyle(0x3a7f3a));
    this.upgradeBtn.on('pointerout',  () => this.upgradeBtn.setFillStyle(0x2a5f2a));
    this.upgradeBtn.on('pointerdown', () => this._doUpgrade());

    this.deleteBtn.on('pointerover', () => this.deleteBtn.setFillStyle(0x6a1010));
    this.deleteBtn.on('pointerout',  () => this.deleteBtn.setFillStyle(this._deleteArmed ? 0x8a1010 : 0x4a0a0a));
    this.deleteBtn.on('pointerdown', () => this._handleDeleteClick());

    this._allEls = [
      this.bg, this.nameText, this.levelText, this.hpText, this.statsText,
      this.costText,
      this.deployBtn, this.deployBtnText,
      this.upgradeBtn, this.upgradeBtnText,
      this.deleteBtn, this.deleteBtnText,
      this.closeBtn,
    ];
  }

  showFor(building) {
    this.currentBuilding = building;
    this.visible = true;
    this._deleteArmed = false;
    this._allEls.forEach(e => e.setVisible(true));
    // Pre-hide conditional buttons; _refresh() re-shows as needed
    this.deployBtn.setVisible(false);
    this.deployBtnText.setVisible(false);
    this._resetDeleteBtn();
    this._refresh();
  }

  hide() {
    this.visible = false;
    this.currentBuilding = null;
    this._deleteArmed = false;
    this._allEls.forEach(e => e.setVisible(false));
  }

  // ── Delete with two-click confirmation ─────────────────────────────────────

  _handleDeleteClick() {
    if (!this._deleteArmed) {
      // First click: arm the button
      this._deleteArmed = true;
      this.deleteBtnText.setText('確認拆除？');
      this.deleteBtn.setFillStyle(0x8a1010).setStrokeStyle(2, 0xFF4444);
      // Auto-disarm after 2.5 s
      if (this._disarmTimer) this._disarmTimer.remove();
      this._disarmTimer = this.scene.time.delayedCall(2500, () => {
        this._deleteArmed = false;
        if (this.deleteBtnText.active) this._resetDeleteBtn();
        this._disarmTimer = null;
      });
    } else {
      // Second click: confirm
      if (this._disarmTimer) { this._disarmTimer.remove(); this._disarmTimer = null; }
      this._doDelete();
    }
  }

  _resetDeleteBtn() {
    this._deleteArmed = false;
    this.deleteBtnText.setText('🗑 拆除建築');
    this.deleteBtn.setFillStyle(0x4a0a0a).setStrokeStyle(1, 0x882222);
  }

  _doDelete() {
    const b = this.currentBuilding;
    if (!b || b.dead) { this.hide(); return; }
    b._destroy();
    this.hide();
  }

  // ── Refresh panel content ──────────────────────────────────────────────────

  _refresh() {
    if (!this.currentBuilding) return;
    const b = this.currentBuilding;
    const nameMap = { wall: '城牆', tower: '箭塔', smith: '鐵匠鋪', training: '訓練場', cafeteria: '旅店', gathering: '採集所', repair: '維修工', barracks: '兵營', mage_tower: '法師塔', farm: '農田', granary: '糧倉', castle: '城堡' };
    const name = nameMap[b.type] || b.type;
    this.nameText.setText(name);
    this.hpText.setColor('#88FF88');

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

    this.deployBtn.setVisible(false);
    this.deployBtnText.setVisible(false);

    if (b.type === 'tower') {
      this.statsText.setText(`射程 ${b.range}  速率 ${(1000 / b.attackRate).toFixed(1)}/s`);
    } else if (b.type === 'smith') {
      this.statsText.setText(`士兵/法師防禦 +${b.defenseBonus}\n範圍 ${CONFIG.BUILDINGS.BLACKSMITH.BUFF_RANGE}px`);
    } else if (b.type === 'training') {
      this.statsText.setText(`士兵/法師攻擊 +${b.atkBonus}\n範圍 ${CONFIG.BUILDINGS.TRAINING_GROUND.BUFF_RANGE}px`);
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
    } else if (b.type === 'granary') {
      this.statsText.setText(`糧食上限 +${CONFIG.BUILDINGS.GRANARY.FOOD_CAP_BONUS}`);
    } else if (b.type === 'castle') {
      const soldiers = b.soldiers.filter(s => !s.dead).length;
      const mages    = b.mages.filter(m => !m.dead).length;
      this.statsText.setText(`士兵 ${soldiers}/1  法師 ${mages}/1\n射程 ${b.range}  傷害 ${b.damage}`);
    } else {
      this.statsText.setText('');
    }

    const nextLv = b.level + 1;
    const typeKeyMap = { smith: 'BLACKSMITH', training: 'TRAINING_GROUND', cafeteria: 'CAFETERIA', gathering: 'GATHERING_POST', repair: 'REPAIR_WORKSHOP', barracks: 'BARRACKS', mage_tower: 'MAGE_TOWER', granary: 'GRANARY', castle: 'CASTLE' };
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
    const typeKeyMap2 = { smith: 'BLACKSMITH', training: 'TRAINING_GROUND', cafeteria: 'CAFETERIA', gathering: 'GATHERING_POST', repair: 'REPAIR_WORKSHOP', barracks: 'BARRACKS', mage_tower: 'MAGE_TOWER', granary: 'GRANARY', castle: 'CASTLE' };
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
    EventBus.off('building_clicked',    this._onClicked);
    EventBus.off('close_upgrade_panel', this._onClosePanel);
    this._allEls.forEach(e => e.destroy());
  }
}
