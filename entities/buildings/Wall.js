import { CONFIG } from '../../config.js';

export class Wall {
  constructor(scene, x, y) {
    this.scene = scene;
    this.type = 'wall';
    this.level = 1;
    this.dead = false;
    this.hp = CONFIG.BUILDINGS.WALL.HP;
    this.maxHp = CONFIG.BUILDINGS.WALL.HP;

    this.sprite = scene.physics.add.staticSprite(x, y, 'building_wall');
    this.sprite.setDepth(4);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(16);
    this._drawHpBar();
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp = Math.max(0, this.hp - amount);
    this._drawHpBar();
    if (this.hp <= 0) this._destroy();
  }

  upgrade() {
    const upgCfg = CONFIG.BUILDINGS.WALL.UPGRADE[2];
    if (!upgCfg || this.level >= 2) return false;
    this.level = 2;
    this.maxHp += upgCfg.HP_BONUS;
    this.hp = Math.min(this.hp + upgCfg.HP_BONUS, this.maxHp);
    this.sprite.setTint(0xaaddff);
    this._drawHpBar();
    return true;
  }

  _destroy() {
    if (this.dead) return;
    this.dead = true;
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    // Unblock pathfinder cell
    if (this.scene.pathFinder) {
      this.scene.pathFinder.setBlocked(this.sprite.x, this.sprite.y, false);
    }
    if (this.scene.wallsGroup) {
      this.scene.wallsGroup.remove(this.sprite, true, true);
    } else if (this.sprite.active) {
      this.sprite.destroy();
    }
    const idx = this.scene.buildingSystem.walls.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.walls.splice(idx, 1);
  }

  _drawHpBar() {
    if (!this.hpBar || !this.sprite.active) return;
    this.hpBar.clear();
    const w = 36, h = 4;
    const bx = this.sprite.x - w / 2;
    const by = this.sprite.y - 26;
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
