import { CONFIG }   from '../../config.js';
import { EventBus } from '../../utils/EventBus.js';
import { Enemy }    from '../Enemy.js';

/**
 * Heavy — high HP, slow, targets buildings first (walls > towers > town center).
 * Deals extra BUILDING_DAMAGE to structures; ignores player unless no building available.
 */
export class Heavy extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, CONFIG.ENEMIES.HEAVY);
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    const target = this._findBuildingTarget();
    const isTc   = target === this.scene.townCenter;
    const dist   = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);
    const atkR   = isTc ? CONFIG.TOWN_CENTER.RADIUS + 20 : 32;

    if (dist < atkR) {
      this.sprite.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        const dmg = isTc ? this.damage : CONFIG.ENEMIES.HEAVY.BUILDING_DAMAGE;
        target.takeDamage(dmg);
        this._showDamageNumber(target.x, target.y - 30);
        if (isTc) {
          EventBus.emit('town_hp_changed', target.hp, target.maxHp);
          if (target.hp <= 0 && !this.scene.isGameOver) this.scene.gameOver();
        }
      }
    } else {
      this._followPath(time, target.x, target.y);
    }

    this._drawHpBar();
  }

  _findBuildingTarget() {
    let nearest = null;
    let nearestDist = Infinity;

    const check = (list) => {
      for (const b of list) {
        if (b.dead) continue;
        const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, b.x, b.y);
        if (d < nearestDist) { nearestDist = d; nearest = b; }
      }
    };

    check(this.scene.buildingSystem.walls);
    check(this.scene.buildingSystem.towers);
    return nearest || this.scene.townCenter;
  }
}
