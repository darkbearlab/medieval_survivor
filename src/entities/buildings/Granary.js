import { CONFIG }   from '../../config.js';
import { EventBus } from '../../utils/EventBus.js';

export class Granary {
  constructor(scene, x, y) {
    this.scene = scene;
    this.type  = 'granary';
    this.level = 1;
    this.dead  = false;
    const cfg = CONFIG.BUILDINGS.GRANARY;
    this.hp    = cfg.HP;
    this.maxHp = cfg.HP;

    this.sprite = scene.physics.add.staticSprite(x, y, 'building_granary');
    this.sprite.setDepth(4);
    this.sprite.setData('entity', this);

    // Increase food cap immediately on construction
    scene.economy.resources.maxFood += cfg.FOOD_CAP_BONUS;
    EventBus.emit('resources_updated', scene.economy.resources);

    this.hpBar = scene.add.graphics().setDepth(16);
    this._drawHpBar();
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

    // Shrink food cap; any food above new cap is lost
    const bonus = CONFIG.BUILDINGS.GRANARY.FOOD_CAP_BONUS;
    this.scene.economy.resources.maxFood = Math.max(
      CONFIG.FOOD.BASE_CAP,
      this.scene.economy.resources.maxFood - bonus
    );
    this.scene.economy.resources.food = Math.min(
      this.scene.economy.resources.food,
      this.scene.economy.resources.maxFood
    );
    EventBus.emit('resources_updated', this.scene.economy.resources);

    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    if (this.scene.granaryGroup) {
      this.scene.granaryGroup.remove(this.sprite, true, true);
    } else if (this.sprite.active) {
      this.sprite.destroy();
    }
    const idx = this.scene.buildingSystem.granaries.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.granaries.splice(idx, 1);
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
    const color = pct > 0.5 ? 0xDDAA44 : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
