import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';
import { Enemy, scaleCfg } from './Enemy.js';

const BOSS_NAMES = {
  bandit: '☠ 強盜首領',
  archer: '☠ 神射手',
  heavy:  '☠ 重甲將軍',
  mage:   '☠ 黑暗法師',
};

/**
 * Boss — a super-sized variant of one of the four enemy types.
 * Spawns every CONFIG.BOSS.SPAWN_INTERVAL seconds.
 * Stats scaled up via CONFIG.BOSS multipliers.
 * Never backs away from close targets (no KEEP_MIN logic).
 * Drops resources on death instead of gold.
 */
export class Boss extends Enemy {
  constructor(scene, x, y, bossType, wave = 1) {
    const bc      = CONFIG.BOSS;
    const baseCfg = scaleCfg(CONFIG.ENEMIES[bossType.toUpperCase()], wave);
    const bossCfg = {
      HP:          Math.round(baseCfg.HP    * bc.HP_MULT),
      SPEED:       Math.round(baseCfg.SPEED * bc.SPEED_MULT),
      DAMAGE:      Math.round(baseCfg.DAMAGE * bc.DAMAGE_MULT),
      ATTACK_RATE: baseCfg.ATTACK_RATE,
      GOLD_REWARD: 0,   // loot handled in _die()
      TEXTURE:     CONFIG.ENEMIES[bossType.toUpperCase()].TEXTURE,
    };

    super(scene, x, y, bossCfg);

    this.bossType = bossType;
    this.range    = baseCfg.RANGE || 0;   // for ranged boss types

    this.sprite.setScale(bc.SCALE);
    this.sprite.setTint(0xFF3300);
    if (this.sprite.body) {
      this.sprite.body.setSize(50, 50);
    }

    this._nameTag = scene.add.text(x, y - 50, BOSS_NAMES[bossType] || '☠ Boss', {
      fontSize: '14px', color: '#FF3300',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    if (this._nameTag) {
      this._nameTag.setPosition(this.sprite.x, this.sprite.y - 50);
    }

    switch (this.bossType) {
      case 'archer': this._updateArcher(time); break;
      case 'heavy':  this._updateHeavy(time);  break;
      case 'mage':   this._updateMage(time);   break;
      default:       super.update(time);        break;  // bandit
    }
  }

  _updateArcher(time) {
    const bs = this.scene.buildingSystem;
    const tc = this.scene.townCenter;
    let target = null, bestDist = Infinity;

    const check = (entity) => {
      if (!entity || entity.dead) return;
      const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, entity.x, entity.y);
      if (d < bestDist) { bestDist = d; target = entity; }
    };

    const player = this.scene.player;
    if (player && !player.isDead) check(player);
    for (const list of [bs.soldiers, bs.alliedMages]) {
      if (!list) continue;
      for (const u of list) check(u);
    }
    const bLists = [bs.walls, bs.towers, bs.smiths, bs.trainingGrounds,
                    bs.cafeterias, bs.gatheringPosts, bs.repairWorkshops,
                    bs.barracks, bs.mageTowers];
    for (const list of bLists) {
      if (!list) continue;
      for (const b of list) check(b);
    }
    check(tc);

    if (!target) { this._drawHpBar(); return; }

    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);
    const isTc = target === tc;

    if (isTc && dist < CONFIG.TOWN_CENTER.RADIUS + 16) {
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        tc.takeDamage(this.damage);
        EventBus.emit('town_hp_changed', tc.hp, tc.maxHp);
        if (tc.hp <= 0 && !this.scene.isGameOver) this.scene.gameOver();
      }
    } else if (dist < this.range) {
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        // Archer boss also deals reduced damage to buildings
        const isUnit = target === this.scene.player || target === tc
                    || target.type === 'soldier'    || target.type === 'allied_mage';
        const dmg = isUnit ? this.damage
                           : Math.round(this.damage * (CONFIG.ENEMIES.ARCHER.BUILDING_DAMAGE / CONFIG.ENEMIES.ARCHER.DAMAGE));
        this.scene._fireEnemyProjectile(this.sprite.x, this.sprite.y, target, dmg);
      }
    } else {
      this._followPath(time, target.x, target.y);
    }

    this._drawHpBar();
  }

  _updateHeavy(time) {
    const target = this._findBuildingTarget();
    const isTc   = target === this.scene.townCenter;
    const dist   = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);
    const atkR   = isTc ? CONFIG.TOWN_CENTER.RADIUS + 20 : 32;

    if (dist < atkR) {
      if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
      if (time - this.lastAttack > this.attackRate) {
        this.lastAttack = time;
        const dmg = isTc
          ? this.damage
          : Math.round(CONFIG.ENEMIES.HEAVY.BUILDING_DAMAGE * CONFIG.BOSS.DAMAGE_MULT);
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
    let nearest = null, nearestDist = Infinity;
    const check = (list) => {
      for (const b of list) {
        if (b.dead) continue;
        const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, b.x, b.y);
        if (d < nearestDist) { nearestDist = d; nearest = b; }
      }
    };
    const bs = this.scene.buildingSystem;
    check(bs.walls);
    check(bs.towers);
    check(bs.smiths);
    check(bs.trainingGrounds);
    check(bs.cafeterias);
    check(bs.gatheringPosts);
    check(bs.repairWorkshops);
    return nearest || this.scene.townCenter;
  }

  _updateMage(time) {
    const tc     = this.scene.townCenter;
    const target = this._findNearestTarget();
    const isTc   = target === tc;
    const dist   = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, target.x, target.y);

    if (isTc) {
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
    } else if (dist < this.range) {
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

  _die() {
    if (this.dead) return;
    this.dead = true;

    // Notify GameScene to show upgrade choice
    EventBus.emit('boss_killed');

    // Drop resources
    const loot = CONFIG.BOSS.LOOT;
    for (const [res, amount] of Object.entries(loot)) {
      this.scene.economy.add(res, amount);
    }
    EventBus.emit('resources_updated', this.scene.economy.resources);

    // Floating loot text
    const lootStr = `木材+${loot.wood}  石材+${loot.stone}  金幣+${loot.gold}`;
    const t = this.scene.add.text(this.sprite.x, this.sprite.y - 20, lootStr, {
      fontSize: '16px', color: '#FFD700',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: t, y: this.sprite.y - 90, alpha: 0, duration: 2200,
      onComplete: () => t.destroy(),
    });

    if (this._nameTag) { this._nameTag.destroy(); this._nameTag = null; }

    if (this.sprite.active) {
      this.scene.tweens.add({
        targets: this.sprite, alpha: 0, duration: 350,
        onComplete: () => { if (this.sprite.active) this.sprite.destroy(); },
      });
    }
    if (this.hpBar) { this.hpBar.destroy(); this.hpBar = null; }
  }

  _drawHpBar() {
    if (!this.hpBar || !this.sprite.active) return;
    this.hpBar.clear();
    const w = 50, h = 7;
    const bx = this.sprite.x - w / 2;
    const by = this.sprite.y - 50;
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x222222, 0.8);
    this.hpBar.fillRect(bx, by, w, h);
    const color = pct > 0.5 ? 0xFF3300 : pct > 0.25 ? 0xFFAA00 : 0xFF0000;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }
}
