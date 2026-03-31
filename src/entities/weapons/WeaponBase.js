import { CONFIG } from '../../config.js';

/**
 * WeaponBase — base class for all player weapons.
 *
 * Each weapon manages its own:
 *  - attack timer
 *  - damage / range / rate
 *  - level & per-level effects
 *
 * Subclasses override:
 *  - _doAttack(time)   — called when the timer fires; execute the attack
 *  - onHit(px, py, entity, dmg, angle, isPiercing, isSplit)
 *                      — called by GameScene._onProjectileHitEnemy for projectile weapons
 *  - applyLevel(lvCfg, rarity, newLevel)  — apply a level-up from UPGRADE_POOL
 */
export class WeaponBase {
  constructor(scene, player, key) {
    this.scene  = scene;
    this.player = player;
    this.key    = key;

    // Load base stats from WEAPONS config
    const cfg        = CONFIG.WEAPONS[key] || {};
    this.baseDamage  = CONFIG.PROJECTILE.DAMAGE * (cfg.DAMAGE_MULT || 1.0);
    this.range       = cfg.RANGE  || 260;
    this.rate        = cfg.RATE   || 800;
    this.bonusDamage = 0;          // accumulated from attack_up / per-level atk effects
    this.rateBonus   = 0;          // accumulated ms reduction (subtracted from rate)

    this._nextAttackTime = 0;
    this.level = 0;
  }

  /** Final damage = (baseDamage + bonusDamage) × player damageMult */
  get totalDamage() {
    return Math.round((this.baseDamage + this.bonusDamage) * (this.player.damageMult || 1));
  }

  /** Effective attack interval, floored at 200 ms */
  get effectiveRate() {
    return Math.max(200, this.rate - this.rateBonus);
  }

  update(time, delta) {
    if (this.player.isDead) return;
    if (time >= this._nextAttackTime) {
      if (this._doAttack(time)) {
        this._nextAttackTime = time + this.effectiveRate;
      }
    }
  }

  /** Override in subclass. Return true if attack was executed, false if no target. */
  _doAttack(time) { return false; }

  /** Called by GameScene._onProjectileHitEnemy for projectile weapons. */
  onHit(px, py, entity, dmg, angle, isPiercing, isSplit) {}

  /**
   * Apply a level-up from UPGRADE_POOL.
   * lvCfg = CONFIG.UPGRADE_POOL[key].levels[newLevel - 1]
   */
  applyLevel(lvCfg, rarity, newLevel) {}

  /**
   * Apply a global bonus (e.g. attack_up).
   * type: 'atk' | 'rate'
   */
  applyGlobalBonus(type, amount) {
    if (type === 'atk')  this.bonusDamage += amount;
    if (type === 'rate') this.rateBonus    = Math.min(this.rateBonus + amount, this.rate - 200);
  }

  // ── Helpers available to subclasses ──────────────────────────────────────

  _findNearest(x, y, range) {
    return this.scene._findNearestEnemy(x, y, range);
  }

  /**
   * Fire a projectile via GameScene._fireProjectile.
   * Automatically tags projectile with this weapon's key.
   */
  _fire(x, y, target, damage, tint = null, extraOpts = {}) {
    this.scene._fireProjectile(x, y, target, damage, true, tint, {
      weaponKey: this.key,
      ...extraOpts,
    });
  }
}
