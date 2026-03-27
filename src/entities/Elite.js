import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';
import { Enemy, scaleCfg } from './Enemy.js';

const ELITE_NAMES = {
  bandit: '⚔ 精英匪徒',
  archer: '⚔ 精英弓手',
  heavy:  '⚔ 精英重甲',
  mage:   '⚔ 精英法師',
};

/**
 * Elite — a gold-tinted mid-tier threat that spawns once per wave.
 * Weaker than Boss but drops a Chest containing a weapon upgrade.
 */
export class Elite extends Enemy {
  constructor(scene, x, y, eliteType = 'bandit', wave = 1) {
    const ec      = CONFIG.ELITE;
    const baseCfg = scaleCfg(CONFIG.ENEMIES[eliteType.toUpperCase()], wave);
    const cfg     = {
      HP:          Math.round(baseCfg.HP     * ec.HP_MULT),
      SPEED:       Math.round(baseCfg.SPEED  * ec.SPEED_MULT),
      DAMAGE:      Math.round(baseCfg.DAMAGE * ec.DAMAGE_MULT),
      ATTACK_RATE: baseCfg.ATTACK_RATE,
      GOLD_REWARD: 0,    // loot handled in _die()
      TEXTURE:     CONFIG.ENEMIES[eliteType.toUpperCase()].TEXTURE,
    };

    super(scene, x, y, cfg);

    this.eliteType = eliteType;
    this.range     = baseCfg.RANGE || 0;   // for ranged types

    this.sprite.setScale(ec.SCALE);
    this.sprite.setTint(ec.TINT);
    if (this.sprite.body) this.sprite.body.setSize(ec.BODY_SIZE, ec.BODY_SIZE);

    this._nameTag = scene.add.text(x, y - 36, ELITE_NAMES[eliteType] || '⚔ 精英', {
      fontSize: '12px', color: '#FFAA00',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    if (this._nameTag) {
      this._nameTag.setPosition(this.sprite.x, this.sprite.y - 36);
    }

    // Archer elite: ranged behavior; all others: standard melee (bandit AI)
    if (this.eliteType === 'archer' && this.range > 0) {
      this._updateAsRanged(time);
    } else {
      super.update(time);
    }

    this._drawEliteHpBar();
  }

  _updateAsRanged(time) {
    const target = this._findNearestTarget();
    if (!target) { this._drawEliteHpBar(); return; }

    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);
    const isTc  = target === this.scene.townCenter;
    const atkR  = isTc ? CONFIG.TOWN_CENTER.RADIUS + 16 : this.range;

    if (isTc && dist < CONFIG.TOWN_CENTER.RADIUS + 16) {
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        this.scene.townCenter.takeDamage(this.damage);
        EventBus.emit('town_hp_changed', this.scene.townCenter.hp, this.scene.townCenter.maxHp);
        if (this.scene.townCenter.hp <= 0 && !this.scene.isGameOver) this.scene.gameOver();
      }
    } else if (!isTc && dist < atkR) {
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        // Archer elite: reduced damage to buildings, full damage to units
        const isUnit = this.scene.player && target === this.scene.player
                    || target.type === 'soldier' || target.type === 'allied_mage';
        const ratio  = CONFIG.ENEMIES.ARCHER.BUILDING_DAMAGE / CONFIG.ENEMIES.ARCHER.DAMAGE;
        const dmg    = isUnit ? this.damage : Math.round(this.damage * ratio);
        this.scene._fireEnemyProjectile(this.sprite.x, this.sprite.y, target, dmg);
      }
    } else {
      this._followPath(time, target.x, target.y);
    }
  }

  _drawEliteHpBar() {
    if (!this.hpBar || !this.sprite.active) return;
    this.hpBar.clear();
    const w = 36, h = 5;
    const bx = this.sprite.x - w / 2;
    const by = this.sprite.y - 30;
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x222222, 0.85);
    this.hpBar.fillRect(bx, by, w, h);
    // Gold → orange → red as health drops
    const color = pct > 0.5 ? 0xFFCC00 : pct > 0.25 ? 0xFF8800 : 0xFF2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  _die() {
    if (this.dead) return;
    this.dead = true;

    // Small resource bonus
    const loot = CONFIG.ELITE.LOOT;
    for (const [res, amount] of Object.entries(loot)) {
      this.scene.economy.add(res, amount);
    }
    EventBus.emit('resources_updated', this.scene.economy.resources);

    // Drop a chest at this position
    this.scene._spawnChest(this.sprite.x, this.sprite.y);

    // Floating resource text
    const lootStr = `木材+${loot.wood}  石材+${loot.stone}  金幣+${loot.gold}`;
    const t = this.scene.add.text(this.sprite.x, this.sprite.y - 20, lootStr, {
      fontSize: '13px', color: '#FFCC00',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: t, y: this.sprite.y - 70, alpha: 0, duration: 1800,
      onComplete: () => t.destroy(),
    });

    if (this._nameTag) { this._nameTag.destroy(); this._nameTag = null; }

    if (this.sprite.active) {
      this.scene.tweens.add({
        targets: this.sprite, alpha: 0, duration: 300,
        onComplete: () => { if (this.sprite.active) this.sprite.destroy(); },
      });
    }
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
  }
}
