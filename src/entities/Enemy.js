import { CONFIG } from '../config.js';
import { EventBus } from '../utils/EventBus.js';

export class Enemy {
  constructor(scene, x, y) {
    this.scene = scene;

    const cfg      = CONFIG.ENEMIES.BANDIT;
    this.hp        = cfg.HP;
    this.maxHp     = cfg.HP;
    this.speed     = cfg.SPEED;
    this.damage    = cfg.DAMAGE;
    this.attackRate = cfg.ATTACK_RATE;
    this.lastAttack = 0;
    this.dead      = false;
    this.aggroRange = CONFIG.PLAYER.AGGRO_RANGE;

    this.sprite = scene.physics.add.sprite(x, y, 'enemy_bandit');
    this.sprite.setDepth(8);
    this.sprite.setData('entity', this);

    // HP bar (world-space Graphics)
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(15);
    this._drawHpBar();
  }

  update(time) {
    if (this.dead || !this.sprite.active) return;

    const player = this.scene.player;
    const tc     = this.scene.townCenter;

    // Check if player is alive and within aggro range
    const playerAlive = player && !player.isDead && player.sprite && player.sprite.active;
    const playerDist = playerAlive
      ? Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, player.x, player.y)
      : Infinity;

    if (playerAlive && playerDist < this.aggroRange) {
      // --- Target player ---
      const attackRange = 28;
      if (playerDist < attackRange) {
        // Stop and attack player
        this.sprite.setVelocity(0, 0);

        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          player.takeDamage(this.damage);
          this._showDamageNumber(player.x, player.y - 30);
        }
      } else {
        // Move toward player
        const angle = Phaser.Math.Angle.Between(
          this.sprite.x, this.sprite.y, player.x, player.y
        );
        this.sprite.setVelocity(
          Math.cos(angle) * this.speed,
          Math.sin(angle) * this.speed
        );
        if (Math.cos(angle) < 0) this.sprite.setFlipX(true);
        else                      this.sprite.setFlipX(false);
      }
    } else {
      // --- Target town center (original behavior) ---
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y, tc.x, tc.y
      );

      if (dist < CONFIG.TOWN_CENTER.RADIUS + 16) {
        // Stop and attack town center
        this.sprite.setVelocity(0, 0);

        if (time - this.lastAttack > this.attackRate) {
          this.lastAttack = time;
          tc.takeDamage(this.damage);
          EventBus.emit('town_hp_changed', tc.hp, tc.maxHp);
          this._showDamageNumber(tc.x, tc.y - 30);

          if (tc.hp <= 0 && !this.scene.isGameOver) {
            this.scene.gameOver();
          }
        }
      } else {
        // Move toward town center
        const angle = Phaser.Math.Angle.Between(
          this.sprite.x, this.sprite.y, tc.x, tc.y
        );
        this.sprite.setVelocity(
          Math.cos(angle) * this.speed,
          Math.sin(angle) * this.speed
        );
        if (Math.cos(angle) < 0) this.sprite.setFlipX(true);
        else                      this.sprite.setFlipX(false);
      }
    }

    this._drawHpBar();
  }

  takeDamage(amount) {
    if (this.dead) return;
    this.hp -= amount;
    if (this.hp <= 0) this._die();
  }

  _die() {
    if (this.dead) return;
    this.dead = true;

    this.scene.economy.add('gold', CONFIG.ENEMIES.BANDIT.GOLD_REWARD);
    EventBus.emit('resources_updated', this.scene.economy.resources);

    // Death flash
    if (this.sprite.active) {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          if (this.sprite.active) this.sprite.destroy();
        },
      });
    }

    if (this.hpBar) {
      this.hpBar.destroy();
      this.hpBar = null;
    }
  }

  _drawHpBar() {
    if (!this.hpBar || !this.sprite.active) return;
    this.hpBar.clear();

    const w  = 26;
    const h  = 4;
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
      fontSize: '16px',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50);

    this.scene.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 900,
      onComplete: () => t.destroy(),
    });
  }
}
