import { CONFIG } from '../../config.js';

export class Tower {
  constructor(scene, x, y) {
    this.scene = scene;
    this.type = 'tower';
    this.level = 1;
    this.dead = false;
    const cfg = CONFIG.BUILDINGS.TOWER;
    this.hp = cfg.HP;
    this.maxHp = cfg.HP;
    this.range = cfg.RANGE;
    this.attackRate = cfg.ATTACK_RATE;
    this.damage = cfg.DAMAGE;
    this.lastAttack = 0;

    this.sprite = scene.add.sprite(x, y, 'building_tower');
    this.sprite.setDepth(4);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(16);
    this._drawHpBar();
  }

  update(time) {
    if (this.dead) return;
    if (time - this.lastAttack > this.attackRate) {
      const target = this.scene._findNearestEnemy(this.x, this.y, this.range);
      if (target) {
        this.scene._fireProjectile(this.x, this.y, target, this.damage);
        this.lastAttack = time;
      }
    }
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this._drawHpBar();
    if (this.hp <= 0) this._destroy();
  }

  upgrade() {
    const upgCfg = CONFIG.BUILDINGS.TOWER.UPGRADE[2];
    if (!upgCfg || this.level >= 2) return false;
    this.level = 2;
    this.range = upgCfg.RANGE;
    this.attackRate = upgCfg.ATTACK_RATE;
    this.sprite.setTint(0xaaddff);
    this._drawHpBar();
    return true;
  }

  _destroy() {
    if (this.dead) return;
    this.dead = true;
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    if (this.sprite.active) this.sprite.destroy();
    const idx = this.scene.buildingSystem.towers.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.towers.splice(idx, 1);
  }

  _drawHpBar() {
    if (!this.hpBar || !this.sprite.active) return;
    this.hpBar.clear();
    const w = 30, h = 4;
    const bx = this.x - w / 2;
    const by = this.y - 34;
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x222222, 0.8);
    this.hpBar.fillRect(bx, by, w, h);
    const color = pct > 0.5 ? 0x44CC44 : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
