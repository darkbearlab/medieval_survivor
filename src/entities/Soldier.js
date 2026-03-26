import { CONFIG } from '../config.js';

/**
 * Soldier — friendly unit spawned by Barracks.
 * combatType 'melee' : Bandit-like melee, targets nearest enemy.
 * combatType 'ranged': Archer-like ranged, backs away if enemy too close.
 * Leashes back to barracks if distance > CONFIG.SOLDIERS.LEASH_RANGE.
 */
export class Soldier {
  constructor(scene, x, y, combatType, barracks) {
    this.scene      = scene;
    this.barracks   = barracks;
    this.combatType = combatType;
    this.type       = 'soldier';
    this.dead       = false;
    this.lastAttack = 0;

    const cfg = combatType === 'ranged' ? CONFIG.SOLDIERS.RANGED : CONFIG.SOLDIERS.MELEE;
    this.hp         = cfg.HP;
    this.maxHp      = cfg.HP;
    this.speed      = cfg.SPEED;
    this.damage     = cfg.DAMAGE;
    this.attackRate = cfg.ATTACK_RATE;

    const texKey = combatType === 'ranged' ? 'soldier_ranged' : 'soldier_melee';
    this.sprite = scene.physics.add.sprite(x, y, texKey);
    this.sprite.setDepth(8);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(15);
    this._drawHpBar();
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    // Determine leash point: player (rally mode) or barracks (default)
    const player    = this.scene.player;
    const rallyMode = this.scene.soldierRallyMode && player && !player.isDead;
    const leashX    = rallyMode ? player.x : this.barracks.x;
    const leashY    = rallyMode ? player.y : this.barracks.y;
    const idleRange = rallyMode ? 60 : 40;  // tighter formation near player

    const leashDist = Phaser.Math.Distance.Between(
      this.sprite.x, this.sprite.y, leashX, leashY
    );

    // Return to leash point if too far
    if (leashDist > CONFIG.SOLDIERS.LEASH_RANGE) {
      this._moveDirectTo(leashX, leashY);
      this._drawHpBar();
      return;
    }

    const target = this._findNearestEnemy(CONFIG.SOLDIERS.LEASH_RANGE * 1.5);

    // No nearby enemy — maintain position near leash point
    if (!target) {
      if (leashDist > idleRange) {
        this._moveDirectTo(leashX, leashY);
      } else {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      }
      this._drawHpBar();
      return;
    }

    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);

    if (this.combatType === 'ranged') {
      const cfg = CONFIG.SOLDIERS.RANGED;
      if (dist < cfg.KEEP_MIN) {
        // Back away from enemy
        const angle = Phaser.Math.Angle.Between(target.x, target.y, this.sprite.x, this.sprite.y);
        if (this.sprite.body) this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
        this.sprite.setFlipX(Math.cos(angle) < 0);
      } else if (dist < cfg.RANGE) {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          this.scene._fireProjectile(this.sprite.x, this.sprite.y, target, this.damage);
        }
      } else {
        this._moveDirectTo(target.x, target.y);
      }
    } else {
      // Melee
      if (dist < 28) {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          const entity = target.getData('entity');
          if (entity) entity.takeDamage(this.damage);
        }
      } else {
        this._moveDirectTo(target.x, target.y);
      }
    }

    this._drawHpBar();
  }

  _findNearestEnemy(maxRange) {
    let nearest = null, nearestDist = maxRange;
    this.scene.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const entity = sprite.getData('entity');
      if (!entity || entity.dead) return;
      const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, sprite.x, sprite.y);
      if (d < nearestDist) { nearestDist = d; nearest = sprite; }
    });
    return nearest;
  }

  _moveDirectTo(tx, ty) {
    if (!this.sprite || !this.sprite.body) return;
    const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, tx, ty);
    this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    this.sprite.setFlipX(Math.cos(angle) < 0);
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp -= amount;
    if (this.hp <= 0) this._die();
    else this._drawHpBar();
  }

  _die() {
    if (this.dead) return;
    this.dead = true;
    if (this.sprite.active) {
      if (this.sprite.body) this.sprite.body.enable = false;
      this.scene.tweens.add({
        targets: this.sprite, alpha: 0, duration: 200,
        onComplete: () => { if (this.sprite.active) this.sprite.destroy(); },
      });
    }
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
  }

  _drawHpBar() {
    if (!this.hpBar || !this.sprite.active) return;
    this.hpBar.clear();
    const w = 26, h = 4;
    const bx = this.sprite.x - w / 2;
    const by = this.sprite.y - 24;
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x222222, 0.8);
    this.hpBar.fillRect(bx, by, w, h);
    // Teal HP bar to distinguish from enemy
    const color = pct > 0.5 ? 0x44CCFF : pct > 0.25 ? 0xFFAA00 : 0xFF4444;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
