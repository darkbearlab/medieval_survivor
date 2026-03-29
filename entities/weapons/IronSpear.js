import { WeaponBase } from './WeaponBase.js';

export class IronSpear extends WeaponBase {
  constructor(scene, player) {
    super(scene, player, 'iron_spear');
  }

  _doAttack(time) {
    const target = this._findNearest(this.player.x, this.player.y, this.range);
    if (!target) return false;
    // Iron spear always pierces — straight line through all enemies
    this._fire(this.player.x, this.player.y, target, this.totalDamage, 0xCCDDEE, {
      piercing: true,
    });
    this.scene.soundManager.play('player_shoot');
    return true;
  }

  applyLevel(lvCfg, rarity, newLevel) {
    if (!lvCfg) return;
    const val = (lvCfg.values && lvCfg.values[rarity]) || 0;
    if (lvCfg.effect === 'atk')  this.bonusDamage += val;
    if (lvCfg.effect === 'rate') this.rateBonus = Math.min(this.rateBonus + val, this.rate - 200);
  }
}
