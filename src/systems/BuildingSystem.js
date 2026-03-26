import { CONFIG } from '../config.js';
import { EventBus } from '../utils/EventBus.js';
import { Wall } from '../entities/buildings/Wall.js';
import { Tower } from '../entities/buildings/Tower.js';
import { Blacksmith } from '../entities/buildings/Blacksmith.js';
import { TrainingGround } from '../entities/buildings/TrainingGround.js';
import { Cafeteria } from '../entities/buildings/Cafeteria.js';
import { GatheringPost } from '../entities/buildings/GatheringPost.js';
import { RepairWorkshop } from '../entities/buildings/RepairWorkshop.js';
import { Barracks }   from '../entities/buildings/Barracks.js';
import { MageTower }  from '../entities/buildings/MageTower.js';
import { Farm }       from '../entities/buildings/Farm.js';

export class BuildingSystem {
  constructor(scene) {
    this.scene = scene;
    this.walls = [];
    this.towers = [];
    this.smiths = [];
    this.trainingGrounds = [];
    this.cafeterias = [];
    this.gatheringPosts = [];
    this.repairWorkshops = [];
    this.barracks    = [];
    this.soldiers    = [];   // all living soldiers across all barracks
    this.mageTowers  = [];
    this.alliedMages = [];   // all living allied mages across all mage towers
    this.farms       = [];
    this.placingType = null;
    this.previewSprite = null;
    this._justStarted = false;  // prevent same-click placement
  }

  startPlacing(type) {
    this.cancelPlacing();
    this.placingType = type;
    const texMap = { wall: 'building_wall', tower: 'building_tower', smith: 'building_smith', training: 'building_training', cafeteria: 'building_cafeteria', gathering: 'building_gathering', repair: 'building_repair', barracks: 'building_barracks', mage_tower: 'building_mage_tower', farm: 'building_farm' };
    const texKey = texMap[type] || 'building_wall';
    this.previewSprite = this.scene.add.sprite(0, 0, texKey)
      .setAlpha(0.55)
      .setDepth(20)
      .setTint(0x88ff88);
    this._justStarted = true;
  }

  cancelPlacing() {
    if (this.previewSprite) {
      this.previewSprite.destroy();
      this.previewSprite = null;
    }
    this.placingType = null;
    this._justStarted = false;
  }

  _snapToGrid(v) {
    const g = CONFIG.BUILDING_GRID;
    return Math.round(v / g) * g;
  }

  updatePreview(worldX, worldY) {
    if (this.previewSprite) {
      this.previewSprite.setPosition(
        this._snapToGrid(worldX),
        this._snapToGrid(worldY)
      );
    }
  }

  tryPlace(worldX, worldY) {
    if (!this.placingType) return false;
    if (this._justStarted) {
      this._justStarted = false;
      return false;
    }

    // Snap to grid
    worldX = this._snapToGrid(worldX);
    worldY = this._snapToGrid(worldY);

    const typeKeyMap = { wall: 'WALL', tower: 'TOWER', smith: 'BLACKSMITH', training: 'TRAINING_GROUND', cafeteria: 'CAFETERIA', gathering: 'GATHERING_POST', repair: 'REPAIR_WORKSHOP', barracks: 'BARRACKS', mage_tower: 'MAGE_TOWER', farm: 'FARM' };
    const typeKey = typeKeyMap[this.placingType] || this.placingType.toUpperCase();
    const cfg = CONFIG.BUILDINGS[typeKey];
    if (!cfg) return false;

    // Check cost (gold can cover resource deficits at the configured rate)
    if (!this.scene.economy.canAffordWithGold(cfg.COST)) {
      EventBus.emit('build_failed', '資源不足（含金幣換算）');
      return false;
    }

    // Check not overlapping town center
    const tc = this.scene.townCenter;
    if (Phaser.Math.Distance.Between(worldX, worldY, tc.x, tc.y) < 80) {
      EventBus.emit('build_failed', '太靠近村莊中心');
      return false;
    }

    // Spend resources (auto-exchanges gold for any deficit)
    this.scene.economy.spendWithGold(cfg.COST);
    EventBus.emit('resources_updated', this.scene.economy.resources);

    // Create building
    if (this.placingType === 'wall') {
      const wall = new Wall(this.scene, worldX, worldY);
      this.walls.push(wall);
      this.scene.wallsGroup.add(wall.sprite);
      wall.sprite.refreshBody();
      if (this.scene.pathFinder) this.scene.pathFinder.setBlocked(worldX, worldY, true);
    } else if (this.placingType === 'tower') {
      const tower = new Tower(this.scene, worldX, worldY);
      this.towers.push(tower);
      this.scene.towersGroup.add(tower.sprite);
      tower.sprite.refreshBody();
    } else if (this.placingType === 'smith') {
      const smith = new Blacksmith(this.scene, worldX, worldY);
      this.smiths.push(smith);
      this.scene.smithGroup.add(smith.sprite);
      smith.sprite.refreshBody();
    } else if (this.placingType === 'training') {
      const tg = new TrainingGround(this.scene, worldX, worldY);
      this.trainingGrounds.push(tg);
      this.scene.trainingGroup.add(tg.sprite);
      tg.sprite.refreshBody();
    } else if (this.placingType === 'cafeteria') {
      const cf = new Cafeteria(this.scene, worldX, worldY);
      this.cafeterias.push(cf);
      this.scene.cafeteriaGroup.add(cf.sprite);
      cf.sprite.refreshBody();
    } else if (this.placingType === 'gathering') {
      const gp = new GatheringPost(this.scene, worldX, worldY);
      this.gatheringPosts.push(gp);
      this.scene.gatheringGroup.add(gp.sprite);
      gp.sprite.refreshBody();
    } else if (this.placingType === 'repair') {
      const rw = new RepairWorkshop(this.scene, worldX, worldY);
      this.repairWorkshops.push(rw);
      this.scene.repairGroup.add(rw.sprite);
      rw.sprite.refreshBody();
    } else if (this.placingType === 'barracks') {
      const b = new Barracks(this.scene, worldX, worldY);
      this.barracks.push(b);
      this.scene.barracksGroup.add(b.sprite);
      b.sprite.refreshBody();
    } else if (this.placingType === 'mage_tower') {
      const mt = new MageTower(this.scene, worldX, worldY);
      this.mageTowers.push(mt);
      this.scene.mageTowerGroup.add(mt.sprite);
      mt.sprite.refreshBody();
    } else if (this.placingType === 'farm') {
      const farm = new Farm(this.scene, worldX, worldY);
      this.farms.push(farm);
    }

    return true;
  }

  isPlacing() {
    return this.placingType !== null;
  }

  update(time) {
    for (const tower of this.towers) {
      if (!tower.dead) tower.update(time);
    }
    for (const b of this.barracks) {
      if (!b.dead) b.update(time);
    }
    for (const mt of this.mageTowers) {
      if (!mt.dead) mt.update(time);
    }
    // Prune dead units from global lists
    this.soldiers    = this.soldiers.filter(s => !s.dead);
    this.alliedMages = this.alliedMages.filter(m => !m.dead);
  }
}
