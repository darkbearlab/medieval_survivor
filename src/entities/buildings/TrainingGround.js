import { CONFIG } from '../../config.js';

export class TrainingGround {
  constructor(scene, x, y) {
    this.scene = scene;
    this.type = 'training';
    this.level = 1;
    this.dead = false;
    const cfg = CONFIG.BUILDINGS.TRAINING_GROUND;
    this.hp = cfg.HP;
    this.maxHp = cfg.HP;
    this.atkBonus = cfg.ATTACK_BONUS;

    this.sprite = scene.physics.add.staticSprite(x, y, 'building_training');
    this.sprite.setDepth(4);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(16);
    this._drawHpBar();

    if (scene.player) scene.player.attackBonus += this.atkBonus;
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
    if (this.scene.player) this.scene.player.attackBonus -= this.atkBonus;
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
    if (this.scene.trainingGroup) {
      this.scene.trainingGroup.remove(this.sprite, true, true);
    } else if (this.sprite.active) {
      this.sprite.destroy();
    }
    const idx = this.scene.buildingSystem.trainingGrounds.indexOf(this);
    if (idx !== -1) this.scene.buildingSystem.trainingGrounds.splice(idx, 1);
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
    const color = pct > 0.5 ? 0xFFAA00 : pct > 0.25 ? 0xFF6600 : 0xFF2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
