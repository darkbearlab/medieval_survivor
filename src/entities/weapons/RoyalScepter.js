import { WeaponBase } from './WeaponBase.js';

export class RoyalScepter extends WeaponBase {
  constructor(scene, player) {
    super(scene, player, 'royal_scepter');
  }

  _doAttack(time) {
    const target = this._findNearest(this.player.x, this.player.y, this.range);
    if (!target) return false;
    this._fire(this.player.x, this.player.y, target, this.totalDamage, 0xFF88CC);
    this.scene.soundManager.play('player_shoot');
    return true;
  }

  onHit(px, py, entity, dmg) {
    // 20% chance to apply frost on hit
    if (entity && !entity.dead && Math.random() < 0.20) {
      this.scene._applyFrost(entity, Math.max(1, this.player._frostBolt || 0));
    }
  }

  applyLevel(lvCfg, rarity, newLevel) {
    if (!lvCfg) return;
    const val = (lvCfg.values && lvCfg.values[rarity]) || 0;
    if (lvCfg.effect === 'atk')  this.bonusDamage += val;
    if (lvCfg.effect === 'rate') this.rateBonus = Math.min(this.rateBonus + val, this.rate - 200);
  }
}
