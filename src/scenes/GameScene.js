import { CONFIG }            from '../config.js';
import { EventBus }          from '../utils/EventBus.js';
import { Player }            from '../entities/Player.js';
import { ResourceNode }      from '../entities/ResourceNode.js';
import { TownCenter }        from '../entities/buildings/TownCenter.js';
import { WaveSystem }        from '../systems/WaveSystem.js';
import { EconomySystem }     from '../systems/EconomySystem.js';
import { BuildingSystem }    from '../systems/BuildingSystem.js';
import { DayNightSystem }    from '../systems/DayNightSystem.js';
import { PathFinder }        from '../utils/PathFinder.js';

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
    this.enemies         = this.physics.add.group();
    this.projectiles     = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.wallsGroup      = this.physics.add.staticGroup();
    this.towersGroup     = this.physics.add.staticGroup();
    this.terrainGroup    = this.physics.add.staticGroup();

    // --- Pathfinder (64×64 grid, 40px cells) ---
    const gridCells = CONFIG.WORLD_WIDTH / CONFIG.BUILDING_GRID;
    this.pathFinder = new PathFinder(CONFIG.BUILDING_GRID, gridCells, gridCells);

    // --- Building System ---
    this.buildingSystem = new BuildingSystem(this);

    // --- Entities ---
    this.townCenter    = new TownCenter(this, TOWN_CENTER.X, TOWN_CENTER.Y);
    this.resourceNodes = this._createResourceNodes();
    this.player        = new Player(this, TOWN_CENTER.X + 120, TOWN_CENTER.Y + 120);

    // --- Terrain (impassable rocks) ---
    this._createTerrain();

    // --- Day/Night system ---
    this.dayNightSystem = new DayNightSystem(this);

    // --- Auto-collect state ---
    this._collectProgress = new Map();   // node -> ms held
    this._collectGraphics = this.add.graphics().setDepth(18);

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

    this.keyB   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // --- Pointer events ---
    this.input.on('pointermove', (pointer) => {
      if (this.buildingSystem.isPlacing()) {
        const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.buildingSystem.updatePreview(world.x, world.y);
      }
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.isGameOver) return;
      // Ignore clicks on UI (UIScene handles its own input)
      if (this.buildingSystem.isPlacing()) {
        const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.buildingSystem.tryPlace(world.x, world.y);
      } else {
        // Try clicking on a tower for upgrade panel
        const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this._tryClickBuilding(world.x, world.y);
      }
    });

    // --- Collisions ---
    this.physics.add.overlap(
      this.projectiles, this.enemies,
      this._onProjectileHitEnemy, null, this
    );

    // Enemy projectiles hit player
    this.physics.add.overlap(
      this.enemyProjectiles, this.player.sprite,
      (proj) => {
        if (!proj.active || this.player.isDead) return;
        this.player.takeDamage(proj.getData('damage') || 10);
        proj.destroy();
      }, null, this
    );

    // Enemies blocked by + damage walls/towers/terrain
    this.physics.add.collider(this.enemies, this.wallsGroup,   this._onEnemyHitWall,   null, this);
    this.physics.add.collider(this.enemies, this.towersGroup,  this._onEnemyHitTower,  null, this);
    this.physics.add.collider(this.enemies, this.terrainGroup);

    // Player blocked by walls, towers, terrain, and town center
    this.physics.add.collider(this.player.sprite, this.wallsGroup);
    this.physics.add.collider(this.player.sprite, this.towersGroup);
    this.physics.add.collider(this.player.sprite, this.terrainGroup);
    this.physics.add.collider(this.player.sprite, this.townCenter.sprite);

    // --- EventBus subscriptions ---
    this._onBuildSelect = (type) => {
      this.buildingSystem.startPlacing(type);
    };
    EventBus.on('build_select', this._onBuildSelect);

    // --- Attack timing ---
    this.nextAttackTime = 0;

    // --- Launch HUD scene ---
    this.scene.launch('UIScene');

    // --- Initial HUD values ---
    EventBus.emit('resources_updated', this.economy.resources);
    EventBus.emit('town_hp_changed', this.townCenter.hp, this.townCenter.maxHp);
    EventBus.emit('player_hp_changed', this.player.hp, this.player.maxHp);

    // --- Map border (visual) ---
    const border = this.add.graphics().setDepth(1);
    border.lineStyle(4, 0x000000, 0.5);
    border.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // --- Mini compass (decorative) ---
    this._drawMapEdgeMarkers();
  }

  // ─────────────────────────────────────────────
  //  Terrain
  // ─────────────────────────────────────────────

  _createTerrain() {
    const G = CONFIG.BUILDING_GRID;
    // Each cluster: anchor (gx,gy) + 3 tiles in an L-shape
    for (const { gx, gy } of CONFIG.TERRAIN.ROCK_CLUSTERS) {
      const offsets = [[0,0],[1,0],[0,1]];
      for (const [dx, dy] of offsets) {
        const wx = (gx + dx) * G + G / 2;
        const wy = (gy + dy) * G + G / 2;
        const rock = this.terrainGroup.create(wx, wy, 'terrain_rock');
        rock.setDepth(2).setImmovable(true).refreshBody();
        this.pathFinder.setBlocked(wx, wy, true);
      }
    }
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

  // ─────────────────────────────────────────────
  //  Auto-collect
  // ─────────────────────────────────────────────

  _updateAutoCollect(delta) {
    this._collectGraphics.clear();

    if (this.player.isDead) {
      this._collectProgress.clear();
      return;
    }

    const collectRange = CONFIG.RESOURCES.COLLECT_RANGE;
    const collectTime  = CONFIG.AUTO_COLLECT.TIME;

    // Find the single nearest non-depleted node within range
    let nearestNode = null;
    let nearestDist = collectRange;

    for (const node of this.resourceNodes) {
      if (node.depleted) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, node.x, node.y
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestNode = node;
      }
    }

    // Reset progress for all nodes that are not the nearest
    for (const node of this._collectProgress.keys()) {
      if (node !== nearestNode) this._collectProgress.delete(node);
    }

    // Accumulate progress only for the nearest node
    if (nearestNode) {
      const prev = this._collectProgress.get(nearestNode) || 0;
      const next = prev + delta;
      this._collectProgress.set(nearestNode, next);

      this._drawCollectProgress(nearestNode, Math.min(next / collectTime, 1));

      if (next >= collectTime) {
        this._collectProgress.delete(nearestNode);
        nearestNode.collect(this.economy);
        EventBus.emit('resources_updated', this.economy.resources);
      }
    }
  }

  _drawCollectProgress(node, pct) {
    const w  = 36;
    const h  = 5;
    const bx = node.x - w / 2;
    const by = node.y - 28;

    // Background
    this._collectGraphics.fillStyle(0x222222, 0.8);
    this._collectGraphics.fillRect(bx, by, w, h);

    // Fill
    this._collectGraphics.fillStyle(0x44CCFF);
    this._collectGraphics.fillRect(bx, by, w * pct, h);

    // Border
    this._collectGraphics.lineStyle(1, 0x888888, 0.6);
    this._collectGraphics.strokeRect(bx, by, w, h);
  }

  // ─────────────────────────────────────────────
  //  Combat
  // ─────────────────────────────────────────────

  _onProjectileHitEnemy(projectile, enemySprite) {
    if (!projectile.active || !enemySprite.active) return;
    const entity = enemySprite.getData('entity');
    const dmg    = projectile.getData('damage') || CONFIG.PROJECTILE.DAMAGE;
    if (entity) entity.takeDamage(dmg);
    projectile.destroy();
  }

  _onEnemyHitTower(enemySprite, towerSprite) {
    if (!enemySprite.active || !towerSprite.active) return;
    const towerEntity = towerSprite.getData('entity');
    if (towerEntity && !towerEntity.dead) {
      const now = this.time.now;
      if (!enemySprite._lastTowerDmgTime || now - enemySprite._lastTowerDmgTime > 800) {
        enemySprite._lastTowerDmgTime = now;
        const enemyEntity = enemySprite.getData('entity');
        const dmg = enemyEntity ? enemyEntity.damage : CONFIG.ENEMIES.BANDIT.DAMAGE;
        towerEntity.takeDamage(dmg);
      }
    }
  }

  _onEnemyHitWall(enemySprite, wallSprite) {
    if (!enemySprite.active || !wallSprite.active) return;
    const wallEntity = wallSprite.getData('entity');
    if (wallEntity && !wallEntity.dead) {
      // Deal a small tick of damage to wall on contact (throttled via time)
      const now = this.time.now;
      if (!enemySprite._lastWallDmgTime || now - enemySprite._lastWallDmgTime > 800) {
        enemySprite._lastWallDmgTime = now;
        const enemyEntity = enemySprite.getData('entity');
        const dmg = enemyEntity ? enemyEntity.damage : CONFIG.ENEMIES.BANDIT.DAMAGE;
        wallEntity.takeDamage(dmg);
      }
    }
  }

  _fireEnemyProjectile(x, y, targetSprite, damage) {
    const proj = this.physics.add.image(x, y, 'projectile');
    proj.setDepth(12).setTint(0xFF6600);
    proj.setData('damage', damage);
    this.enemyProjectiles.add(proj);
    const angle = Phaser.Math.Angle.Between(x, y, targetSprite.x, targetSprite.y);
    proj.setVelocity(
      Math.cos(angle) * CONFIG.PROJECTILE.SPEED * 0.75,
      Math.sin(angle) * CONFIG.PROJECTILE.SPEED * 0.75
    );
    this.time.delayedCall(CONFIG.PROJECTILE.LIFESPAN, () => { if (proj.active) proj.destroy(); });
  }

  _fireProjectile(x, y, targetSprite, damage = CONFIG.PROJECTILE.DAMAGE) {
    const proj = this.physics.add.image(x, y, 'projectile');
    proj.setDepth(12);
    proj.setData('isProjectile', true);
    proj.setData('damage', damage);
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

  _tryClickBuilding(worldX, worldY) {
    // Check towers (they have interactive sprites)
    for (const tower of this.buildingSystem.towers) {
      if (tower.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, tower.x, tower.y);
      if (dist < 20) {
        EventBus.emit('building_clicked', tower);
        return;
      }
    }
    // Check walls
    for (const wall of this.buildingSystem.walls) {
      if (wall.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, wall.x, wall.y);
      if (dist < 22) {
        EventBus.emit('building_clicked', wall);
        return;
      }
    }
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

    // B key: toggle build menu
    if (Phaser.Input.Keyboard.JustDown(this.keyB)) {
      if (this.buildingSystem.isPlacing()) {
        this.buildingSystem.cancelPlacing();
      } else {
        EventBus.emit('toggle_build_menu');
      }
    }

    // ESC key: cancel placement or close menus
    if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
      if (this.buildingSystem.isPlacing()) {
        this.buildingSystem.cancelPlacing();
      } else {
        EventBus.emit('close_build_menu');
      }
    }

    // Player movement
    this.player.update(this.cursors);

    // Auto-attack nearest enemy
    if (!this.player.isDead && time > this.nextAttackTime) {
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

    // Building system (tower auto-attack)
    this.buildingSystem.update(time);

    // Auto-collect
    this._updateAutoCollect(delta);

    // Wave system
    this.waveSystem.update(delta);
  }

  shutdown() {
    EventBus.off('build_select', this._onBuildSelect);
    if (this.dayNightSystem) this.dayNightSystem.destroy();
    EventBus.removeAllListeners();
  }
}
