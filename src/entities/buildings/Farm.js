import { CONFIG } from '../../config.js';

/**
 * Farm — produces food over time.
 * Not attackable by enemies. Player or GatheringPost harvests it manually.
 * After harvest it regenerates over REGEN_TIME ms.
 */
export class Farm {
  constructor(scene, x, y) {
    this.scene     = scene;
    this.type      = 'farm';
    this.dead      = false;
    this.depleted  = false;
    this.regenTimer = 0;

    this.sprite = scene.add.sprite(x, y, 'building_farm');
    this.sprite.setDepth(3);
    this.sprite.setData('entity', this);
  }

  collect(economy) {
    if (this.depleted) return;
    economy.resources.food = (economy.resources.food || 0) + CONFIG.BUILDINGS.FARM.FOOD_YIELD;
    this.depleted  = true;
    this.regenTimer = 0;
    this.sprite.setAlpha(0.4);
  }

  update(delta) {
    if (!this.depleted) return;
    this.regenTimer += delta;
    const regenTime = CONFIG.BUILDINGS.FARM.REGEN_TIME;
    if (this.regenTimer >= regenTime) {
      this.depleted   = false;
      this.regenTimer = 0;
      this.sprite.setAlpha(1.0);
    } else {
      // Gradually brighten as it regenerates
      const pct = this.regenTimer / regenTime;
      this.sprite.setAlpha(0.4 + pct * 0.6);
    }
  }

  _destroy() {
    if (this.dead) return;
    this.dead = true;
    if (this.sprite.active) this.sprite.destroy();
    const idx = this.scene.buildingSystem.farms.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.farms.splice(idx, 1);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
