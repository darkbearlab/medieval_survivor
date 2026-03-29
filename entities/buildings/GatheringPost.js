import { CONFIG } from '../../config.js';

export class GatheringPost {
  constructor(scene, x, y) {
    this.scene = scene;
    this.type = 'gathering';
    this.level = 1;
    this.dead = false;
    const cfg = CONFIG.BUILDINGS.GATHERING_POST;
    this.hp = cfg.HP;
    this.maxHp = cfg.HP;
    this.range = cfg.RANGE;
    this.collectRate = cfg.COLLECT_RATE;
    this.collectProgress = new Map(); // ResourceNode → ms accumulated

    this.sprite = scene.physics.add.staticSprite(x, y, 'building_gathering');
    this.sprite.setDepth(4);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(16);
    this._drawHpBar();
  }

  update(delta, economy, resourceNodes, farms = []) {
    let collected = false;
    const targets = [...resourceNodes, ...farms];
    for (const node of targets) {
      if (node.depleted || node.dead) { this.collectProgress.delete(node); continue; }
      const dist = Phaser.Math.Distance.Between(this.x, this.y, node.x, node.y);
      if (dist > this.range) { this.collectProgress.delete(node); continue; }
      const prev = this.collectProgress.get(node) || 0;
      const next = prev + delta;
      if (next >= this.collectRate) {
        this.collectProgress.delete(node);
        node.collect(economy);
        collected = true;
      } else {
        this.collectProgress.set(node, next);
      }
    }
    return collected;
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
    if (this.scene.gatheringGroup) {
      this.scene.gatheringGroup.remove(this.sprite, true, true);
    } else if (this.sprite.active) {
      this.sprite.destroy();
    }
    const idx = this.scene.buildingSystem.gatheringPosts.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.gatheringPosts.splice(idx, 1);
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
    const color = pct > 0.5 ? 0x44FF88 : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
