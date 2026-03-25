import { CONFIG } from '../../config.js';
import { EventBus } from '../../utils/EventBus.js';
import { Enemy }  from '../Enemy.js';

/**
 * Mage — ranged, fires slow explosion projectiles. Targets the nearest entity
 * (player or non-wall building). Backs away only from the player if too close.
 * Falls back to melee on town center when no other target is available.
 */
export class Mage extends Enemy {
  constructor(scene, x, y) {
    super(scene, x, y, CONFIG.ENEMIES.MAGE);
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    const cfg    = CONFIG.ENEMIES.MAGE;
    const tc     = this.scene.townCenter;
    const target = this._findNearestTarget();
    const isPlayer = target === this.scene.player;
    const isTc     = target === tc;
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);

    if (isTc) {
      // No other target — melee the town center
      if (dist < CONFIG.TOWN_CENTER.RADIUS + 16) {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          tc.takeDamage(this.damage);
          EventBus.emit('town_hp_changed', tc.hp, tc.maxHp);
          if (tc.hp <= 0 && !this.scene.isGameOver) this.scene.gameOver();
        }
      } else {
        this._followPath(time, tc.x, tc.y);
      }
    } else if (isPlayer && dist < cfg.KEEP_MIN) {
      // Back away from player if too close
      const angle = Phaser.Math.Angle.Between(target.x, target.y, this.sprite.x, this.sprite.y);
      if (this.sprite.body) this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
      this.sprite.setFlipX(Math.cos(angle) < 0);
    } else if (dist < cfg.RANGE) {
      // In range — stop and fire mage projectile
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        this.scene._fireMageProjectile(this.x, this.y, target, this.damage);
      }
    } else {
      this._followPath(time, target.x, target.y);
    }

    this._drawHpBar();
  }
}
