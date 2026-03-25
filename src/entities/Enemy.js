import { CONFIG }   from '../config.js';
import { EventBus } from '../utils/EventBus.js';

/**
 * Enemy — Bandit (default) and base class for Archer / Heavy.
 * Subclasses override update() and optionally _die() for different gold rewards.
 */
export class Enemy {
  constructor(scene, x, y, cfg) {
    this.scene = scene;
    cfg = cfg || CONFIG.ENEMIES.BANDIT;

    this.hp         = cfg.HP;
    this.maxHp      = cfg.HP;
    this.speed      = cfg.SPEED;
    this.damage     = cfg.DAMAGE;
    this.attackRate = cfg.ATTACK_RATE;
    this.goldReward = cfg.GOLD_REWARD;
    this.aggroRange = CONFIG.PLAYER.AGGRO_RANGE;
    this.lastAttack = 0;
    this.dead       = false;

    // Pathfinding state
    this.path      = null;
    this.pathIdx   = 0;
    this.pathTimer = 0;

    this.sprite = scene.physics.add.sprite(x, y, cfg.TEXTURE || 'enemy_bandit');
    this.sprite.setDepth(8);
    this.sprite.setData('entity', this);

    this.hpBar = scene.add.graphics().setDepth(15);
    this._drawHpBar();
  }

  // ── Default (Bandit) behaviour ────────────────────────────────────────────

  update(time) {
    if (this.dead || !this.sprite.active) return;

    const player = this.scene.player;
    const tc     = this.scene.townCenter;

    const pAlive = player && !player.isDead && player.sprite && player.sprite.active;
    const pDist  = pAlive
      ? Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y)
      : Infinity;

    if (pAlive && pDist < this.aggroRange) {
      // ── Target player ──
      if (pDist < 28) {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          player.takeDamage(this.damage);
          this._showDamageNumber(player.x, player.y - 30);
        }
      } else {
        this._followPath(time, player.x, player.y);
      }
    } else {
      // ── Target town center ──
      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, tc.x, tc.y);
      if (dist < CONFIG.TOWN_CENTER.RADIUS + 16) {
        if (this.sprite.body) this.sprite.body.setVelocity(0, 0);
        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          tc.takeDamage(this.damage);
          EventBus.emit('town_hp_changed', tc.hp, tc.maxHp);
          this._showDamageNumber(tc.x, tc.y - 30);
          if (tc.hp <= 0 && !this.scene.isGameOver) this.scene.gameOver();
        }
      } else {
        this._followPath(time, tc.x, tc.y);
      }
    }

    this._drawHpBar();
  }

  // ── Shared helpers (used by subclasses) ───────────────────────────────────

  /**
   * Move toward (tx, ty) using A* if available.
   * Refreshes path every 800 ms or when pathfinder first available.
   */
  _followPath(time, tx, ty) {
    const pf   = this.scene.pathFinder;
    const CELL = CONFIG.BUILDING_GRID;

    if (!pf) {
      this._moveDirectTo(tx, ty);
      return;
    }

    if (!this.path || time - this.pathTimer > 800) {
      this.path      = pf.findPath(this.sprite.x, this.sprite.y, tx, ty);
      this.pathIdx   = 0;
      this.pathTimer = time;
    }

    if (!this.path || this.path.length === 0 || this.pathIdx >= this.path.length) {
      this._moveDirectTo(tx, ty);
      return;
    }

    const wp = this.path[this.pathIdx];
    if (Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, wp.x, wp.y) < CELL * 0.6) {
      this.pathIdx++;
      if (this.pathIdx >= this.path.length) { this.path = null; this._moveDirectTo(tx, ty); return; }
    }

    this._moveDirectTo(this.path[this.pathIdx].x, this.path[this.pathIdx].y);
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
  }

  _die() {
    if (this.dead) return;
    this.dead = true;

    this.scene.economy.add('gold', this.goldReward);
    EventBus.emit('resources_updated', this.scene.economy.resources);

    if (this.sprite.active) {
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
    const color = pct > 0.5 ? 0x44EE44 : pct > 0.25 ? 0xFFAA00 : 0xFF2222;
    this.hpBar.fillStyle(color);
    this.hpBar.fillRect(bx, by, w * pct, h);
  }

  _showDamageNumber(x, y) {
    const t = this.scene.add.text(x, y, `-${this.damage}`, {
      fontSize: '16px', color: '#FF4444',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}
