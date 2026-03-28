import { CONFIG } from '../config.js';

/**
 * Soldier — friendly unit spawned by Barracks.
 * combatType 'melee' : melee, targets nearest enemy.
 * combatType 'ranged': ranged, backs away if enemy too close.
 *
 * Building-anchored mode (default):
 *   Scans for enemies within DETECT_RANGE of the barracks.
 *   If found → pursues & attacks the nearest enemy to itself.
 *   If none  → returns to barracks via direct path.
 *
 * Deployed / rally mode:
 *   Follows player; leashes back if > LEASH_RANGE away.
 */
export class Soldier {
  constructor(scene, x, y, combatType, barracks) {
    this.scene      = scene;
    this.barracks   = barracks;
    this.combatType = combatType;
    this.type       = 'soldier';
    this.dead       = false;
    this.deployed   = false;   // true = permanently leashed to player (detached from barracks)
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

    const player       = this.scene.player;
    const rallyMode    = this.scene.soldierRallyMode && player && !player.isDead;
    const followPlayer = this.deployed || rallyMode;

    if (followPlayer) {
      // ── Deployed / rally: leash to player ────────────────────────────────
      const leashDist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y, player.x, player.y
      );
      if (leashDist > CONFIG.SOLDIERS.LEASH_RANGE) {
        this._moveDirectTo(player.x, player.y);
        this._drawHpBar();
        return;
      }
      const target = this._findNearestEnemyFromPos(this.sprite.x, this.sprite.y, CONFIG.SOLDIERS.LEASH_RANGE * 1.5);
      if (!target) {
        if (leashDist > 60) this._moveDirectTo(player.x, player.y);
        else if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        this._drawHpBar();
        return;
      }
      this._doAttack(time, target);
    } else {
      // ── Building-anchored: detect from SELF position ──────────────────────
      // Using self position prevents the archer "dance" — if a soldier has
      // chased an enemy, it keeps fighting until the enemy leaves the soldier's
      // own detection radius, not the building's.
      const bx = this.barracks.x, by = this.barracks.y;
      const target = this._findNearestEnemyFromPos(this.sprite.x, this.sprite.y, CONFIG.SOLDIERS.DETECT_RANGE);

      if (!target) {
        // No enemy in sight — return home
        const homeDist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, bx, by);
        if (homeDist > 40) this._moveDirectTo(bx, by);
        else if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        this._drawHpBar();
        return;
      }
      this._doAttack(time, target);
    }

    this._drawHpBar();
  }

  _doAttack(time, target) {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);

    if (this.combatType === 'ranged') {
      const cfg = CONFIG.SOLDIERS.RANGED;
      if (dist < cfg.KEEP_MIN) {
        const angle = Phaser.Math.Angle.Between(target.x, target.y, this.sprite.x, this.sprite.y);
        if (this.sprite.body) this.sprite.body.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
        this.sprite.setFlipX(Math.cos(angle) < 0);
      } else if (dist < cfg.RANGE) {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          this.scene._fireProjectile(this.sprite.x, this.sprite.y, target, this.damage + (this.atkBonus || 0));
        }
      } else {
        this._moveDirectTo(target.x, target.y);
      }
    } else {
      const meleeCfg = CONFIG.SOLDIERS.MELEE;
      if (dist < meleeCfg.RANGE) {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          this.scene._fireProjectile(this.sprite.x, this.sprite.y, target, this.damage + (this.atkBonus || 0));
        }
      } else {
        this._moveDirectTo(target.x, target.y);
      }
    }
  }

  _findNearestEnemyFromPos(fromX, fromY, maxRange) {
    let nearest = null, nearestDist = maxRange;
    this.scene.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const entity = sprite.getData('entity');
      if (!entity || entity.dead) return;
      const d = Phaser.Math.Distance.Between(fromX, fromY, sprite.x, sprite.y);
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
    const effective = Math.max(1, amount - (this.defBonus || 0));
    this.hp -= effective;
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
