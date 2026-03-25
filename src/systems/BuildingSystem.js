import { CONFIG } from '../config.js';
import { EventBus } from '../utils/EventBus.js';
import { Wall } from '../entities/buildings/Wall.js';
import { Tower } from '../entities/buildings/Tower.js';
import { Blacksmith } from '../entities/buildings/Blacksmith.js';
import { TrainingGround } from '../entities/buildings/TrainingGround.js';
import { Cafeteria } from '../entities/buildings/Cafeteria.js';

export class BuildingSystem {
  constructor(scene) {
    this.scene = scene;
    this.walls = [];
    this.towers = [];
    this.smiths = [];
    this.trainingGrounds = [];
    this.cafeterias = [];
    this.placingType = null;
    this.previewSprite = null;
    this._justStarted = false;  // prevent same-click placement
  }

  startPlacing(type) {
    this.cancelPlacing();
    this.placingType = type;
    const texMap = { wall: 'building_wall', tower: 'building_tower', smith: 'building_smith', training: 'building_training', cafeteria: 'building_cafeteria' };
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

    const typeKeyMap = { wall: 'WALL', tower: 'TOWER', smith: 'BLACKSMITH', training: 'TRAINING_GROUND', cafeteria: 'CAFETERIA' };
    const typeKey = typeKeyMap[this.placingType] || this.placingType.toUpperCase();
    const cfg = CONFIG.BUILDINGS[typeKey];
    if (!cfg) return false;

    // Check cost
    if (!this.scene.economy.canAfford(cfg.COST)) {
      EventBus.emit('build_failed', '資源不足');
      return false;
    }

    // Check not overlapping town center
    const tc = this.scene.townCenter;
    if (Phaser.Math.Distance.Between(worldX, worldY, tc.x, tc.y) < 80) {
      EventBus.emit('build_failed', '太靠近村莊中心');
      return false;
    }

    // Spend resources
    this.scene.economy.spend(cfg.COST);
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
  }
}
