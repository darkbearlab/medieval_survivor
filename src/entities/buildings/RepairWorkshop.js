import { CONFIG } from '../../config.js';

export class RepairWorkshop {
  constructor(scene, x, y) {
    this.scene = scene;
    this.type = 'repair';
    this.level = 1;
    this.dead = false;
    const cfg = CONFIG.BUILDINGS.REPAIR_WORKSHOP;
    this.hp = cfg.HP;
    this.maxHp = cfg.HP;
    this.repairRate = cfg.REPAIR_RATE;
    this.scanRate = cfg.SCAN_RATE;
    this.lastScan = 0;
    this.target = null;
    this._lastParticle = 0;

    this.sprite = scene.physics.add.staticSprite(x, y, 'building_repair');
    this.sprite.setDepth(4);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(16);
    this._drawHpBar();
  }

  update(time, delta, buildingSystem) {
    if (time - this.lastScan > this.scanRate) {
      this.lastScan = time;
      this.target = this._findLowestHpBuilding(buildingSystem);
    }
    if (this.target && !this.target.dead && this.target.hp < this.target.maxHp) {
      this.target.hp = Math.min(this.target.maxHp, this.target.hp + this.repairRate * delta / 1000);
      this.target._drawHpBar();
      this._showRepairParticle(time);
    } else {
      this.target = null;
    }
  }

  _findLowestHpBuilding(bs) {
    let best = null, bestPct = 1;
    const lists = [
      bs.walls, bs.towers, bs.smiths, bs.trainingGrounds,
      bs.cafeterias, bs.gatheringPosts, bs.repairWorkshops,
      bs.barracks, bs.mageTowers,
    ];
    for (const list of lists) {
      for (const b of list) {
        if (b.dead || b === this) continue;
        const pct = b.hp / b.maxHp;
        if (pct < bestPct) { best = b; bestPct = pct; }
      }
    }
    return best;
  }

  _showRepairParticle(time) {
    if (time - this._lastParticle < 1000 || !this.target) return;
    this._lastParticle = time;
    const t = this.scene.add.text(this.target.x, this.target.y - 30,
      `+${this.repairRate}`, {
        fontSize: '14px', color: '#44FF88',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: t, y: this.target.y - 60, alpha: 0,
      duration: 900, onComplete: () => t.destroy(),
    });
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
    if (this.scene.repairGroup) {
      this.scene.repairGroup.remove(this.sprite, true, true);
    } else if (this.sprite.active) {
      this.sprite.destroy();
    }
    const idx = this.scene.buildingSystem.repairWorkshops.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.repairWorkshops.splice(idx, 1);
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
