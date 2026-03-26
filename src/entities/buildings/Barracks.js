import { CONFIG }   from '../../config.js';
import { EventBus } from '../../utils/EventBus.js';
import { Soldier }  from '../Soldier.js';

/**
 * Barracks — garrison building.
 * Auto-spawns soldiers up to the level-based cap.
 * Soldiers leash back to this building when they wander too far.
 */
export class Barracks {
  constructor(scene, x, y) {
    this.scene = scene;
    this.type  = 'barracks';
    this.level = 1;
    this.dead  = false;

    const cfg = CONFIG.BUILDINGS.BARRACKS;
    this.hp    = cfg.HP;
    this.maxHp = cfg.HP;

    this.soldiers  = [];      // soldiers spawned by this barracks
    this.lastSpawn = -Infinity;

    this.sprite = scene.physics.add.staticSprite(x, y, 'building_barracks');
    this.sprite.setDepth(5);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(12);
    this._drawHpBar();
  }

  get maxSoldiers() {
    return CONFIG.SOLDIERS.LEVEL[this.level].MAX;
  }

  update(time) {
    if (this.dead) return;

    // Remove dead soldiers from tracking
    this.soldiers = this.soldiers.filter(s => !s.dead);

    // Update each living soldier
    for (const s of this.soldiers) s.update(time);

    // Spawn a new soldier if under cap, cooldown elapsed, and enough food
    if (this.soldiers.length < this.maxSoldiers && time - this.lastSpawn > CONFIG.SOLDIERS.SPAWN_RATE) {
      const foodCost = CONFIG.FOOD.SOLDIER_COST;
      if (foodCost > 0 && this.scene.economy.resources.food < foodCost) {
        // Not enough food — wait for next cycle without resetting timer
      } else {
        this.lastSpawn = time;
        if (foodCost > 0) {
          this.scene.economy.resources.food -= foodCost;
          EventBus.emit('resources_updated', this.scene.economy.resources);
        }
        this._spawnSoldier();
      }
    }

    this._drawHpBar();
  }

  _spawnSoldier() {
    const lvlCfg = CONFIG.SOLDIERS.LEVEL[this.level];
    let combatType;
    if (lvlCfg.TYPE === 'mixed') {
      const meleeCount  = this.soldiers.filter(s => s.combatType === 'melee').length;
      const rangedCount = this.soldiers.filter(s => s.combatType === 'ranged').length;
      combatType = meleeCount <= rangedCount ? 'melee' : 'ranged';
    } else {
      combatType = lvlCfg.TYPE;
    }

    const ox = Phaser.Math.Between(-30, 30);
    const oy = Phaser.Math.Between(-30, 30);
    const soldier = new Soldier(this.scene, this.x + ox, this.y + oy, combatType, this);

    this.soldiers.push(soldier);
    this.scene.soldiersGroup.add(soldier.sprite);
    this.scene.buildingSystem.soldiers.push(soldier);
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
    const upgCfg = CONFIG.BUILDINGS.BARRACKS.UPGRADE[this.level];
    if (upgCfg && upgCfg.HP_BONUS) {
      this.maxHp += upgCfg.HP_BONUS;
      this.hp = Math.min(this.hp + upgCfg.HP_BONUS, this.maxHp);
    }
    this._drawHpBar();
  }

  _destroy() {
    if (this.dead) return;
    this.dead = true;
    // Kill all soldiers from this barracks
    for (const s of this.soldiers) {
      if (!s.dead) s._die();
    }
    this.soldiers = [];
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    if (this.scene.barracksGroup) {
      this.scene.barracksGroup.remove(this.sprite, true, true);
    } else if (this.sprite.active) {
      this.sprite.destroy();
    }
    const idx = this.scene.buildingSystem.barracks.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.barracks.splice(idx, 1);
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
    const color = pct > 0.5 ? 0x4488FF : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
