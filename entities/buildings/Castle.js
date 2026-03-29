import { CONFIG }    from '../../config.js';
import { EventBus }  from '../../utils/EventBus.js';
import { Soldier }   from '../Soldier.js';
import { AlliedMage } from '../AlliedMage.js';

export class Castle {
  constructor(scene, x, y) {
    this.scene = scene;
    this.type  = 'castle';
    this.level = 1;
    this.dead  = false;

    const cfg = CONFIG.BUILDINGS.CASTLE;
    this.hp         = cfg.HP;
    this.maxHp      = cfg.HP;
    this.range      = cfg.RANGE;
    this.attackRate = cfg.ATTACK_RATE;
    this.damage     = cfg.DAMAGE;
    this.lastAttack = 0;
    this.lastSoldierSpawn = -Infinity;
    this.lastMageSpawn    = -Infinity;

    this.soldiers = [];
    this.mages    = [];

    this.sprite = scene.physics.add.staticSprite(x, y, 'building_castle');
    this.sprite.setDepth(5);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(16);
    this._drawHpBar();
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  update(time) {
    if (this.dead) return;
    const cfg = CONFIG.BUILDINGS.CASTLE;

    // ── Arrow fire ──────────────────────────────────────────────────────────
    if (time - this.lastAttack > this.attackRate) {
      const target = this.scene._findNearestEnemy(this.x, this.y, this.range);
      if (target) {
        this.scene._fireProjectile(this.x, this.y, target, this.damage);
        this.lastAttack = time;
      }
    }

    // ── Soldier upkeep ─────────────────────────────────────────────────────
    this.soldiers = this.soldiers.filter(s => !s.dead);
    for (const s of this.soldiers) s.update(time);
    if (this.soldiers.length < cfg.MAX_SOLDIERS && time - this.lastSoldierSpawn > cfg.SOLDIER_RATE) {
      const foodCost = CONFIG.FOOD.SOLDIER_COST;
      if (foodCost <= 0 || this.scene.economy.resources.food >= foodCost) {
        this.lastSoldierSpawn = time;
        if (foodCost > 0) {
          this.scene.economy.resources.food -= foodCost;
          EventBus.emit('resources_updated', this.scene.economy.resources);
        }
        this._spawnSoldier();
      }
    }

    // ── Mage upkeep ────────────────────────────────────────────────────────
    this.mages = this.mages.filter(m => !m.dead);
    for (const m of this.mages) m.update(time);
    if (this.mages.length < cfg.MAX_MAGES && time - this.lastMageSpawn > cfg.MAGE_RATE) {
      const foodCost = CONFIG.FOOD.MAGE_COST;
      if (foodCost <= 0 || this.scene.economy.resources.food >= foodCost) {
        this.lastMageSpawn = time;
        if (foodCost > 0) {
          this.scene.economy.resources.food -= foodCost;
          EventBus.emit('resources_updated', this.scene.economy.resources);
        }
        this._spawnMage();
      }
    }
  }

  _spawnSoldier() {
    const ox = Phaser.Math.Between(-24, 24);
    const oy = Phaser.Math.Between(-24, 24);
    const s = new Soldier(this.scene, this.x + ox, this.y + oy, 'melee', this);
    this.soldiers.push(s);
    this.scene.buildingSystem.soldiers.push(s);
    this.scene.soldiersGroup.add(s.sprite);
  }

  _spawnMage() {
    const ox = Phaser.Math.Between(-24, 24);
    const oy = Phaser.Math.Between(-24, 24);
    const m = new AlliedMage(this.scene, this.x + ox, this.y + oy, this);
    this.mages.push(m);
    this.scene.buildingSystem.alliedMages.push(m);
    this.scene.alliedMagesGroup.add(m.sprite);
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this._drawHpBar();
    if (this.hp <= 0) this._destroy();
  }

  upgrade() { return false; }

  _destroy() {
    if (this.dead) return;
    this.dead = true;
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    if (this.scene.castleGroup) {
      this.scene.castleGroup.remove(this.sprite, true, true);
    } else if (this.sprite.active) {
      this.sprite.destroy();
    }
    const idx = this.scene.buildingSystem.castles.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.castles.splice(idx, 1);
  }

  _drawHpBar() {
    if (!this.hpBar || !this.sprite.active) return;
    this.hpBar.clear();
    const w = 50, h = 5;
    const bx = this.x - w / 2;
    const by = this.y - 36;
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x222222, 0.8);
    this.hpBar.fillRect(bx, by, w, h);
    const color = pct > 0.5 ? 0x4488FF : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }
}
