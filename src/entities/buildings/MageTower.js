import { CONFIG }    from '../../config.js';
import { EventBus }  from '../../utils/EventBus.js';
import { AlliedMage } from '../AlliedMage.js';

/**
 * MageTower — garrison building for allied mages.
 * Auto-spawns AlliedMage units up to the level-based cap.
 */
export class MageTower {
  constructor(scene, x, y) {
    this.scene = scene;
    this.type  = 'mage_tower';
    this.level = 1;
    this.dead  = false;

    const cfg = CONFIG.BUILDINGS.MAGE_TOWER;
    this.hp    = cfg.HP;
    this.maxHp = cfg.HP;

    this.mages     = [];
    this.lastSpawn = -Infinity;

    this.sprite = scene.physics.add.staticSprite(x, y, 'building_mage_tower');
    this.sprite.setDepth(5);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(12);
    this._drawHpBar();
  }

  get maxMages() {
    return CONFIG.ALLIED_MAGES.LEVEL[this.level].MAX;
  }

  update(time) {
    if (this.dead) return;

    this.mages = this.mages.filter(m => !m.dead);
    for (const m of this.mages) m.update(time);

    if (this.mages.length < this.maxMages && time - this.lastSpawn > CONFIG.ALLIED_MAGES.SPAWN_RATE) {
      const foodCost = CONFIG.FOOD.MAGE_COST;
      if (foodCost > 0 && this.scene.economy.resources.food < foodCost) {
        // Not enough food — wait for next cycle without resetting timer
      } else {
        this.lastSpawn = time;
        if (foodCost > 0) {
          this.scene.economy.resources.food -= foodCost;
          EventBus.emit('resources_updated', this.scene.economy.resources);
        }
        this._spawnMage();
      }
    }

    this._drawHpBar();
  }

  _spawnMage() {
    const ox = Phaser.Math.Between(-30, 30);
    const oy = Phaser.Math.Between(-30, 30);
    const mage = new AlliedMage(this.scene, this.x + ox, this.y + oy, this);
    this.mages.push(mage);
    this.scene.alliedMagesGroup.add(mage.sprite);
    this.scene.buildingSystem.alliedMages.push(mage);
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this._drawHpBar();
    if (this.hp <= 0) this._destroy();
  }

  upgrade() {
    if (this.level >= 2) return;
    this.level++;
    const upgCfg = CONFIG.BUILDINGS.MAGE_TOWER.UPGRADE[this.level];
    if (upgCfg && upgCfg.HP_BONUS) {
      this.maxHp += upgCfg.HP_BONUS;
      this.hp = Math.min(this.hp + upgCfg.HP_BONUS, this.maxHp);
    }
    this._drawHpBar();
  }

  _destroy() {
    if (this.dead) return;
    this.dead = true;
    for (const m of this.mages) {
      if (!m.dead) m._die();
    }
    this.mages = [];
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    if (this.scene.mageTowerGroup) {
      this.scene.mageTowerGroup.remove(this.sprite, true, true);
    } else if (this.sprite.active) {
      this.sprite.destroy();
    }
    const idx = this.scene.buildingSystem.mageTowers.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.mageTowers.splice(idx, 1);
  }

  _drawHpBar() {
    if (!this.hpBar || !this.sprite.active) return;
    this.hpBar.clear();
    const w = 36, h = 4;
    const bx = this.x - w / 2;
    const by = this.y - 26;
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x222222, 0.8);
    this.hpBar.fillRect(bx, by, w, h);
    const color = pct > 0.5 ? 0xAA44FF : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
