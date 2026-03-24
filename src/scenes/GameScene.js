import { CONFIG }        from '../config.js';
import { EventBus }      from '../utils/EventBus.js';
import { Player }        from '../entities/Player.js';
import { ResourceNode }  from '../entities/ResourceNode.js';
import { TownCenter }    from '../entities/buildings/TownCenter.js';
import { WaveSystem }    from '../systems/WaveSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { WORLD_WIDTH, WORLD_HEIGHT, TOWN_CENTER } = CONFIG;

    this.isGameOver = false;

    // Physics world bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // --- Background ---
    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'ground').setOrigin(0, 0).setDepth(0);

    // --- Systems ---
    this.economy    = new EconomySystem();
    this.waveSystem = new WaveSystem(this);

    // --- Physics groups ---
    this.enemies     = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    // --- Entities ---
    this.townCenter    = new TownCenter(this, TOWN_CENTER.X, TOWN_CENTER.Y);
    this.resourceNodes = this._createResourceNodes();
    this.player        = new Player(this, TOWN_CENTER.X + 120, TOWN_CENTER.Y + 120);

    // --- Camera ---
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

    // --- Input ---
    this.cursors = this.input.keyboard.addKeys({
      up:         Phaser.Input.Keyboard.KeyCodes.W,
      down:       Phaser.Input.Keyboard.KeyCodes.S,
      left:       Phaser.Input.Keyboard.KeyCodes.A,
      right:      Phaser.Input.Keyboard.KeyCodes.D,
      upArrow:    Phaser.Input.Keyboard.KeyCodes.UP,
      downArrow:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      leftArrow:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    });

    // --- Collisions ---
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this._onProjectileHitEnemy,
      null,
      this
    );

    // --- Click to collect ---
    this.input.on('pointerdown', (pointer) => {
      if (!this.isGameOver) this._tryCollect(pointer);
    });

    // --- Attack timing ---
    this.nextAttackTime = 0;

    // --- Launch HUD scene ---
    this.scene.launch('UIScene');

    // --- Initial HUD values ---
    EventBus.emit('resources_updated', this.economy.resources);
    EventBus.emit('town_hp_changed', this.townCenter.hp, this.townCenter.maxHp);

    // --- Map border (visual) ---
    const border = this.add.graphics().setDepth(1);
    border.lineStyle(4, 0x000000, 0.5);
    border.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // --- Mini compass (decorative) ---
    this._drawMapEdgeMarkers();
  }

  // ─────────────────────────────────────────────
  //  Resource nodes
  // ─────────────────────────────────────────────

  _createResourceNodes() {
    const { WORLD_WIDTH, WORLD_HEIGHT, TOWN_CENTER, RESOURCES } = CONFIG;
    const nodes  = [];
    const margin = 200;
    const avoid  = 180; // stay away from town center

    const place = (type, count) => {
      let placed = 0;
      let attempts = 0;
      while (placed < count && attempts < count * 20) {
        attempts++;
        const x = Phaser.Math.Between(margin, WORLD_WIDTH - margin);
        const y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin);
        if (Phaser.Math.Distance.Between(x, y, TOWN_CENTER.X, TOWN_CENTER.Y) < avoid) continue;
        nodes.push(new ResourceNode(this, x, y, type));
        placed++;
      }
    };

    place('tree',  RESOURCES.TREE_COUNT);
    place('stone', RESOURCES.STONE_COUNT);

    return nodes;
  }

  _tryCollect(pointer) {
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    for (const node of this.resourceNodes) {
      if (node.depleted) continue;

      const clickDist  = Phaser.Math.Distance.Between(world.x, world.y, node.x, node.y);
      const playerDist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, node.x, node.y
      );

      if (clickDist < 28 && playerDist < CONFIG.RESOURCES.COLLECT_RANGE) {
        node.collect(this.economy);
        EventBus.emit('resources_updated', this.economy.resources);
        break;
      }
    }
  }

  // ─────────────────────────────────────────────
  //  Combat
  // ─────────────────────────────────────────────

  _onProjectileHitEnemy(projectile, enemySprite) {
    if (!projectile.active || !enemySprite.active) return;
    const entity = enemySprite.getData('entity');
    if (entity) entity.takeDamage(CONFIG.PROJECTILE.DAMAGE);
    projectile.destroy();
  }

  _fireProjectile(x, y, targetSprite) {
    const proj = this.physics.add.image(x, y, 'projectile');
    proj.setDepth(12);
    proj.setData('isProjectile', true);
    this.projectiles.add(proj);

    const angle = Phaser.Math.Angle.Between(x, y, targetSprite.x, targetSprite.y);
    proj.setVelocity(
      Math.cos(angle) * CONFIG.PROJECTILE.SPEED,
      Math.sin(angle) * CONFIG.PROJECTILE.SPEED
    );

    this.time.delayedCall(CONFIG.PROJECTILE.LIFESPAN, () => {
      if (proj.active) proj.destroy();
    });
  }

  _findNearestEnemy(x, y, maxRange) {
    let nearest     = null;
    let nearestDist = maxRange;

    this.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const dist = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest     = sprite;
      }
    });

    return nearest;
  }

  // ─────────────────────────────────────────────
  //  Game Over
  // ─────────────────────────────────────────────

  gameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Screen flash red
    this.cameras.main.flash(400, 200, 0, 0);

    this.time.delayedCall(700, () => {
      this.scene.stop('UIScene');
      this.scene.start('GameOverScene', { wave: this.waveSystem.currentWave });
    });
  }

  // ─────────────────────────────────────────────
  //  Map decoration
  // ─────────────────────────────────────────────

  _drawMapEdgeMarkers() {
    const { WORLD_WIDTH, WORLD_HEIGHT } = CONFIG;
    const g = this.add.graphics().setDepth(1);

    // Subtle path lines from edges toward center
    g.lineStyle(3, 0x2a4a2a, 0.3);
    g.beginPath();
    g.moveTo(0, WORLD_HEIGHT / 2);
    g.lineTo(WORLD_WIDTH, WORLD_HEIGHT / 2);
    g.moveTo(WORLD_WIDTH / 2, 0);
    g.lineTo(WORLD_WIDTH / 2, WORLD_HEIGHT);
    g.strokePath();
  }

  // ─────────────────────────────────────────────
  //  Update loop
  // ─────────────────────────────────────────────

  update(time, delta) {
    if (this.isGameOver) return;

    // Player movement
    this.player.update(this.cursors);

    // Auto-attack nearest enemy
    if (time > this.nextAttackTime) {
      const target = this._findNearestEnemy(
        this.player.x,
        this.player.y,
        CONFIG.PLAYER.ATTACK_RANGE
      );
      if (target) {
        this._fireProjectile(this.player.x, this.player.y, target);
        this.nextAttackTime = time + CONFIG.PLAYER.ATTACK_RATE;
      }
    }

    // Enemy AI
    this.enemies.getChildren().forEach(sprite => {
      const entity = sprite.getData('entity');
      if (entity && !entity.dead) entity.update(time);
    });

    // Wave system
    this.waveSystem.update(delta);
  }

  shutdown() {
    EventBus.removeAllListeners();
  }
}
