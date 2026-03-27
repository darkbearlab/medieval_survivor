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
import { Boss }              from '../entities/Boss.js';
import { WeaponMount }      from '../entities/WeaponMount.js';
import { Chest }            from '../entities/Chest.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.characterKey = (data && data.characterKey) || 'ranger';
    this.gameMode     = (data && data.gameMode)     || 'endless';
    this.timeLimit    = (data && data.timeLimit)    || CONFIG.GAME_MODES.TIMED.DURATION;
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
    this.smithGroup      = this.physics.add.staticGroup();
    this.trainingGroup   = this.physics.add.staticGroup();
    this.cafeteriaGroup  = this.physics.add.staticGroup();
    this.gatheringGroup  = this.physics.add.staticGroup();
    this.repairGroup     = this.physics.add.staticGroup();
    this.barracksGroup        = this.physics.add.staticGroup();
    this.soldiersGroup        = this.physics.add.group();
    this.mageTowerGroup       = this.physics.add.staticGroup();
    this.alliedMagesGroup     = this.physics.add.group();
    this.alliedMageProjectiles = this.physics.add.group();
    this.mageProjectiles      = this.physics.add.group();

    // --- Pathfinder (64×64 grid, 40px cells) ---
    const gridCells = CONFIG.WORLD_WIDTH / CONFIG.BUILDING_GRID;
    this.pathFinder = new PathFinder(CONFIG.BUILDING_GRID, gridCells, gridCells);

    // --- Building System ---
    this.buildingSystem = new BuildingSystem(this);

    // --- Entities ---
    this.townCenter    = new TownCenter(this, TOWN_CENTER.X, TOWN_CENTER.Y);
    this.resourceNodes = this._createResourceNodes();
    this.player        = new Player(this, TOWN_CENTER.X + 120, TOWN_CENTER.Y + 120, this.characterKey);

    // --- Terrain (impassable rocks) ---
    // Disabled: terrain caused enemies to get stuck. Class/method preserved for future use.
    // this._createTerrain();

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

    this.keyESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keyP   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyF   = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // Hotbar keys 1–9 and 0 (maps to building slots 0–9)
    this.hotbarKeys = this.input.keyboard.addKeys({
      k1: Phaser.Input.Keyboard.KeyCodes.ONE,
      k2: Phaser.Input.Keyboard.KeyCodes.TWO,
      k3: Phaser.Input.Keyboard.KeyCodes.THREE,
      k4: Phaser.Input.Keyboard.KeyCodes.FOUR,
      k5: Phaser.Input.Keyboard.KeyCodes.FIVE,
      k6: Phaser.Input.Keyboard.KeyCodes.SIX,
      k7: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      k8: Phaser.Input.Keyboard.KeyCodes.EIGHT,
      k9: Phaser.Input.Keyboard.KeyCodes.NINE,
      k0: Phaser.Input.Keyboard.KeyCodes.ZERO,
    });

    // Disable browser right-click context menu so right-click can be used in-game
    this.input.mouse.disableContextMenu();

    // --- Pointer events ---
    this.input.on('pointermove', (pointer) => {
      if (this.buildingSystem.isPlacing()) {
        const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.buildingSystem.updatePreview(world.x, world.y);
      }
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.isGameOver || this.isPaused) return;
      // Right-click cancels placement (or deselects hotbar)
      if (pointer.rightButtonDown()) {
        if (this.buildingSystem.isPlacing()) {
          this.buildingSystem.cancelPlacing();
          EventBus.emit('build_cancelled');
        } else {
          EventBus.emit('close_build_menu');
        }
        return;
      }
      // Left-click: place building or select
      if (this.buildingSystem.isPlacing()) {
        const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.buildingSystem.tryPlace(world.x, world.y);
      } else {
        // Try clicking on a building for upgrade panel
        const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this._tryClickBuilding(world.x, world.y);
      }
    });

    // --- Collisions ---
    this.physics.add.overlap(
      this.projectiles, this.enemies,
      this._onProjectileHitEnemy, null, this
    );

    // Enemy projectile vs player: handled manually in update() to avoid
    // Phaser group-vs-single-sprite overlap body lifecycle bugs.

    // Enemies blocked by + damage walls/towers/terrain
    this.physics.add.collider(this.enemies, this.wallsGroup,   this._onEnemyHitWall,   null, this);
    this.physics.add.collider(this.enemies, this.towersGroup,  this._onEnemyHitTower,  null, this);
    this.physics.add.collider(this.enemies, this.terrainGroup);
    this.physics.add.collider(this.enemies, this.smithGroup,    this._onEnemyHitSmithOrTraining, null, this);
    this.physics.add.collider(this.enemies, this.trainingGroup, this._onEnemyHitSmithOrTraining, null, this);
    this.physics.add.collider(this.enemies, this.cafeteriaGroup, this._onEnemyHitSmithOrTraining, null, this);
    this.physics.add.collider(this.enemies, this.gatheringGroup, this._onEnemyHitSmithOrTraining, null, this);
    this.physics.add.collider(this.enemies, this.repairGroup,    this._onEnemyHitSmithOrTraining, null, this);
    this.physics.add.collider(this.enemies, this.barracksGroup,   this._onEnemyHitSmithOrTraining, null, this);
    this.physics.add.collider(this.enemies, this.mageTowerGroup,  this._onEnemyHitSmithOrTraining, null, this);
    this.physics.add.collider(this.enemies, this.soldiersGroup);   // physical blocking; damage via Enemy.update()
    this.physics.add.collider(this.enemies, this.alliedMagesGroup); // physical blocking; damage via Enemy.update()

    // Player blocked by walls, towers, terrain, and town center
    this.physics.add.collider(this.player.sprite, this.wallsGroup);
    this.physics.add.collider(this.player.sprite, this.towersGroup);
    this.physics.add.collider(this.player.sprite, this.terrainGroup);
    this.physics.add.collider(this.player.sprite, this.townCenter.sprite);
    this.physics.add.collider(this.player.sprite, this.smithGroup);
    this.physics.add.collider(this.player.sprite, this.trainingGroup);
    this.physics.add.collider(this.player.sprite, this.cafeteriaGroup);
    this.physics.add.collider(this.player.sprite, this.gatheringGroup);
    this.physics.add.collider(this.player.sprite, this.repairGroup);
    this.physics.add.collider(this.player.sprite, this.barracksGroup);
    this.physics.add.collider(this.player.sprite, this.mageTowerGroup);

    // Enemy projectiles damage buildings
    this.physics.add.overlap(this.enemyProjectiles, this.wallsGroup,     this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.towersGroup,    this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.smithGroup,     this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.trainingGroup,  this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.cafeteriaGroup, this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.gatheringGroup, this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.repairGroup,    this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.barracksGroup,    this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.mageTowerGroup,   this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.soldiersGroup,    this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.alliedMagesGroup, this._onEnemyProjHitBuilding, null, this);
    // Allied mage projectiles damage enemies only (no friendly fire)
    this.physics.add.overlap(this.alliedMageProjectiles, this.enemies, this._onAlliedMageProjHitEnemy, null, this);

    // Mage projectiles explode on building contact
    this.physics.add.overlap(this.mageProjectiles, this.wallsGroup,     this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.towersGroup,    this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.smithGroup,     this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.trainingGroup,  this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.cafeteriaGroup, this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.gatheringGroup, this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.repairGroup,    this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.barracksGroup,    this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.mageTowerGroup,   this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.soldiersGroup,    this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.alliedMagesGroup, this._onMageProjHitBuilding, null, this);

    // --- EventBus subscriptions ---
    this._onBuildSelect    = (type) => this.buildingSystem.startPlacing(type);
    this._onBuildCancelled = ()     => this.buildingSystem.cancelPlacing();
    EventBus.on('build_select',    this._onBuildSelect);
    EventBus.on('build_cancelled', this._onBuildCancelled);

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

    // --- Soldier rally state ---
    this.soldierRallyMode = false;
    const { WIDTH, HEIGHT } = CONFIG;
    this._rallyIndicator = this.add.text(WIDTH / 2, 32, '', {
      fontSize: '14px', color: '#44CCFF',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(200).setScrollFactor(0).setVisible(false);

    // --- Boss timer ---
    this.bossTimer = CONFIG.BOSS.SPAWN_INTERVAL * 1000;

    // --- Game mode timer ---
    this.gameTimer = this.gameMode === 'timed' ? this.timeLimit * 1000 : null;

    // --- Chests (dropped by elites) ---
    this._chests         = [];
    this._chestProgress  = new Map();   // chest → ms held
    this._chestGraphics  = this.add.graphics().setDepth(18);

    // --- Weapon mounts (boss kill upgrades) ---
    this._weaponMounts = [];
    this._onBossKilled = () => this._showUpgradeChoice();
    this._onUpgradeChosen = (key) => this._applyUpgrade(key);
    EventBus.on('boss_killed',     this._onBossKilled);
    EventBus.on('upgrade_chosen',  this._onUpgradeChosen);

    // --- Pause state ---
    this.isPaused = false;
    this._pauseOverlay = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.65)
      .setDepth(500).setScrollFactor(0).setVisible(false);
    this._pauseTitle = this.add.text(WIDTH / 2, HEIGHT / 2 - 24, 'PAUSED', {
      fontSize: '60px', fontFamily: 'Georgia, serif',
      color: '#FFFFFF', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(501).setScrollFactor(0).setVisible(false);
    this._pauseHint = this.add.text(WIDTH / 2, HEIGHT / 2 + 46, '按 [P] 繼續遊戲', {
      fontSize: '20px', color: '#AAAAAA',
    }).setOrigin(0.5).setDepth(501).setScrollFactor(0).setVisible(false);
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

    // Find the single nearest non-depleted node/farm within range
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

    for (const farm of this.buildingSystem.farms) {
      if (farm.dead || farm.depleted) continue;
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, farm.x, farm.y
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestNode = farm;
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
    const entity    = enemySprite.getData('entity');
    const dmg       = projectile.getData('damage') || CONFIG.PROJECTILE.DAMAGE;
    const fp        = projectile.getData('fromPlayer');
    if (entity) entity.takeDamage(dmg);
    const px = projectile.x, py = projectile.y;
    projectile.destroy();

    if (fp && this.player) {
      if (this.player.aoeOnHit)      this._triggerPlayerAoE(px, py, Math.round(dmg * 0.65));
      if (this.player._explosiveShots) this._triggerMountExplosion(px, py, Math.round(dmg * 0.5));
      if (this.player._chainBolt && entity && !entity.dead) this._chainBoltHit(entity, dmg);
      if (this.player._frostBolt && entity && !entity.dead) this._applyFrost(entity);
    }
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

  _onEnemyHitSmithOrTraining(enemySprite, buildingSprite) {
    if (!enemySprite.active || !buildingSprite.active) return;
    const buildingEntity = buildingSprite.getData('entity');
    if (buildingEntity && !buildingEntity.dead) {
      const now = this.time.now;
      if (!enemySprite._lastBuildingDmgTime || now - enemySprite._lastBuildingDmgTime > 800) {
        enemySprite._lastBuildingDmgTime = now;
        const enemyEntity = enemySprite.getData('entity');
        const dmg = enemyEntity ? enemyEntity.damage : CONFIG.ENEMIES.BANDIT.DAMAGE;
        buildingEntity.takeDamage(dmg);
      }
    }
  }

  _onEnemyProjHitBuilding(proj, buildingSprite) {
    if (!proj.active || !buildingSprite.active) return;
    const entity = buildingSprite.getData('entity');
    const dmg = proj.getData('damage') || 10;
    if (entity && !entity.dead) entity.takeDamage(dmg);
    proj.destroy();
  }

  _onMageProjHitBuilding(proj, buildingSprite) {
    if (!proj.active || !buildingSprite.active) return;
    const dmg = proj.getData('damage') || CONFIG.ENEMIES.MAGE.DAMAGE;
    const px = proj.x, py = proj.y;
    proj.destroy();
    this._triggerExplosion(px, py, dmg);
  }

  _triggerExplosion(x, y, damage) {
    const radius = CONFIG.ENEMIES.MAGE.EXPLOSION_RADIUS;
    this._showExplosion(x, y, radius);

    // Damage player
    if (!this.player.isDead) {
      const d = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y);
      if (d < radius) this.player.takeDamage(damage);
    }

    // Damage all buildings in blast radius
    const lists = [
      this.buildingSystem.walls,
      this.buildingSystem.towers,
      this.buildingSystem.smiths,
      this.buildingSystem.trainingGrounds,
      this.buildingSystem.cafeterias,
      this.buildingSystem.gatheringPosts,
      this.buildingSystem.repairWorkshops,
      this.buildingSystem.barracks,
      this.buildingSystem.mageTowers,
    ];
    for (const list of lists) {
      for (const b of list) {
        if (b.dead) continue;
        const d = Phaser.Math.Distance.Between(x, y, b.x, b.y);
        if (d < radius) b.takeDamage(damage);
      }
    }

    // Damage mobile allied units in blast radius
    for (const u of [...this.buildingSystem.soldiers, ...this.buildingSystem.alliedMages]) {
      if (u.dead) continue;
      const d = Phaser.Math.Distance.Between(x, y, u.x, u.y);
      if (d < radius) u.takeDamage(damage);
    }
  }

  _showExplosion(x, y, radius) {
    const outer = this.add.circle(x, y, radius,        0xFF6600, 0.55).setDepth(20);
    const inner = this.add.circle(x, y, radius * 0.45, 0xFFEE00, 0.80).setDepth(21);
    this.tweens.add({
      targets: [outer, inner],
      alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: 380,
      onComplete: () => { outer.destroy(); inner.destroy(); },
    });
  }

  _fireAlliedMageProjectile(x, y, target, damage) {
    const proj = this.alliedMageProjectiles.create(x, y, 'projectile');
    if (!proj || !proj.body) return;
    proj.setDepth(12).setTint(0x00FFAA).setScale(1.5);
    proj.setData('damage', damage);
    const angle = Phaser.Math.Angle.Between(x, y, target.x, target.y);
    const speed = CONFIG.PROJECTILE.SPEED * 0.5;
    proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.time.delayedCall(CONFIG.PROJECTILE.LIFESPAN * 1.8, () => {
      if (proj.active) proj.destroy();
    });
  }

  _onAlliedMageProjHitEnemy(proj, enemySprite) {
    if (!proj.active || !enemySprite.active) return;
    const dmg = proj.getData('damage') || CONFIG.ALLIED_MAGES.DAMAGE;
    const px = proj.x, py = proj.y;
    proj.destroy();
    this._triggerAlliedExplosion(px, py, dmg);
  }

  _triggerAlliedExplosion(x, y, damage) {
    const radius = CONFIG.ALLIED_MAGES.EXPLOSION_RADIUS;
    // Teal/green explosion to distinguish from enemy mage (purple/orange)
    const outer = this.add.circle(x, y, radius,        0x00CCAA, 0.55).setDepth(20);
    const inner = this.add.circle(x, y, radius * 0.45, 0x00FFCC, 0.80).setDepth(21);
    this.tweens.add({
      targets: [outer, inner], alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 380,
      onComplete: () => { outer.destroy(); inner.destroy(); },
    });
    // Damage enemies only — no friendly fire
    this.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const entity = sprite.getData('entity');
      if (!entity || entity.dead) return;
      const d = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
      if (d < radius) entity.takeDamage(damage);
    });
  }

  _fireMageProjectile(x, y, target, damage) {
    const proj = this.mageProjectiles.create(x, y, 'projectile');
    if (!proj || !proj.body) return;
    proj.setDepth(12).setTint(0xAA00FF).setScale(1.5);
    proj.setData('damage', damage);
    const angle = Phaser.Math.Angle.Between(x, y, target.x, target.y);
    const speed = CONFIG.PROJECTILE.SPEED * 0.5;
    proj.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.time.delayedCall(CONFIG.PROJECTILE.LIFESPAN * 1.8, () => {
      if (proj.active) proj.destroy();
    });
  }

  _fireEnemyProjectile(x, y, targetSprite, damage) {
    const proj = this.enemyProjectiles.create(x, y, 'projectile');
    if (!proj || !proj.body) return;
    proj.setDepth(12).setTint(0xFF6600);
    proj.setData('damage', damage);
    const angle = Phaser.Math.Angle.Between(x, y, targetSprite.x, targetSprite.y);
    proj.body.setVelocity(
      Math.cos(angle) * CONFIG.PROJECTILE.SPEED * 0.75,
      Math.sin(angle) * CONFIG.PROJECTILE.SPEED * 0.75
    );
    this.time.delayedCall(CONFIG.PROJECTILE.LIFESPAN, () => { if (proj.active) proj.destroy(); });
  }

  _fireProjectile(x, y, targetSprite, damage = CONFIG.PROJECTILE.DAMAGE, fromPlayer = false, tint = null) {
    const proj = this.projectiles.create(x, y, 'projectile');
    if (!proj || !proj.body) return;
    proj.setDepth(12);
    // Tint: explicit tint (WeaponMount) takes priority; otherwise use character type
    if (tint !== null) {
      proj.setTint(tint);
    } else if (fromPlayer && this.player && this.player.aoeOnHit) {
      proj.setTint(0xCC44FF);   // mage — purple
    } else if (fromPlayer && this.player && this.player.defensePct > 0) {
      proj.setTint(0xFF6633);   // warrior — red
    }
    proj.setData('isProjectile', true);
    proj.setData('fromPlayer', fromPlayer);
    proj.setData('damage', damage);
    const angle = Phaser.Math.Angle.Between(x, y, targetSprite.x, targetSprite.y);
    proj.body.setVelocity(
      Math.cos(angle) * CONFIG.PROJECTILE.SPEED,
      Math.sin(angle) * CONFIG.PROJECTILE.SPEED
    );
    this.time.delayedCall(CONFIG.PROJECTILE.LIFESPAN, () => {
      if (proj.active) proj.destroy();
    });
  }

  _triggerPlayerAoE(x, y, damage) {
    const radius = this.player.aoeRadius || 80;
    // Violet explosion — distinct from enemy mage (purple/orange) and allied mage (teal)
    const outer = this.add.circle(x, y, radius,        0x6600CC, 0.40).setDepth(20);
    const inner = this.add.circle(x, y, radius * 0.45, 0xDD88FF, 0.75).setDepth(21);
    this.tweens.add({
      targets: [outer, inner], alpha: 0, scaleX: 1.5, scaleY: 1.5, duration: 400,
      onComplete: () => { outer.destroy(); inner.destroy(); },
    });
    this.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const entity = sprite.getData('entity');
      if (!entity || entity.dead) return;
      const d = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
      if (d < radius) entity.takeDamage(damage);
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
    for (const b of this.buildingSystem.smiths) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 22) { EventBus.emit('building_clicked', b); return; }
    }
    for (const b of this.buildingSystem.trainingGrounds) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 22) { EventBus.emit('building_clicked', b); return; }
    }
    for (const b of this.buildingSystem.cafeterias) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 22) { EventBus.emit('building_clicked', b); return; }
    }
    for (const b of this.buildingSystem.gatheringPosts) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 22) { EventBus.emit('building_clicked', b); return; }
    }
    for (const b of this.buildingSystem.repairWorkshops) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 22) { EventBus.emit('building_clicked', b); return; }
    }
    for (const b of this.buildingSystem.barracks) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 22) { EventBus.emit('building_clicked', b); return; }
    }
    for (const b of this.buildingSystem.mageTowers) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 22) { EventBus.emit('building_clicked', b); return; }
    }
    for (const b of this.buildingSystem.farms) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 22) { EventBus.emit('building_clicked', b); return; }
    }
  }

  // ─────────────────────────────────────────────
  //  Soldier rally
  // ─────────────────────────────────────────────

  _toggleSoldierRally() {
    this.soldierRallyMode = !this.soldierRallyMode;
    if (this._rallyIndicator) {
      if (this.soldierRallyMode) {
        this._rallyIndicator.setText('[F] 士兵集結模式 — 跟隨玩家').setVisible(true);
      } else {
        this._rallyIndicator.setText('[F] 士兵已解散 — 返回兵營').setVisible(true);
        // Hide hint after 2 seconds
        this.time.delayedCall(2000, () => {
          if (this._rallyIndicator) this._rallyIndicator.setVisible(false);
        });
      }
    }
  }

  // ─────────────────────────────────────────────
  //  Pause
  // ─────────────────────────────────────────────

  _togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this._pauseOverlay.setVisible(true);
      this._pauseTitle.setVisible(true);
      this._pauseHint.setVisible(true);
    } else {
      this.physics.resume();
      this._pauseOverlay.setVisible(false);
      this._pauseTitle.setVisible(false);
      this._pauseHint.setVisible(false);
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
      this.scene.start('GameOverScene', {
        wave:         this.waveSystem.currentWave,
        characterKey: this.characterKey,
        gameMode:     this.gameMode,
        timeLimit:    this.timeLimit,
      });
    });
  }

  _victory() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Golden flash
    this.cameras.main.flash(600, 255, 215, 0);

    this.time.delayedCall(900, () => {
      this.scene.stop('UIScene');
      this.scene.start('VictoryScene', {
        wave:         this.waveSystem.currentWave,
        timeLimit:    this.timeLimit,
        characterKey: this.characterKey,
        gameMode:     this.gameMode,
      });
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

    // P key: toggle pause (checked before pause guard so it always works)
    if (Phaser.Input.Keyboard.JustDown(this.keyP)) this._togglePause();
    if (this.isPaused) return;

    // F key: toggle soldier rally (follow player)
    if (Phaser.Input.Keyboard.JustDown(this.keyF)) this._toggleSoldierRally();

    // ESC key: cancel placement / deselect hotbar
    if (Phaser.Input.Keyboard.JustDown(this.keyESC)) {
      if (this.buildingSystem.isPlacing()) {
        this.buildingSystem.cancelPlacing();
        EventBus.emit('build_cancelled');
      } else {
        EventBus.emit('close_build_menu');
      }
    }

    // Hotbar keys 1–9 and 0
    const _hk = this.hotbarKeys;
    const _hkMap = [_hk.k1, _hk.k2, _hk.k3, _hk.k4, _hk.k5,
                    _hk.k6, _hk.k7, _hk.k8, _hk.k9, _hk.k0];
    const _uiScene = this.scene.get('UIScene');
    for (let i = 0; i < _hkMap.length; i++) {
      if (Phaser.Input.Keyboard.JustDown(_hkMap[i])) {
        if (_uiScene && _uiScene.buildMenu) _uiScene.buildMenu.selectByKey(i);
        break;
      }
    }

    // Player movement
    this.player.update(this.cursors);

    // Auto-attack nearest enemy — uses character-specific range, rate, damage
    if (!this.player.isDead && time > this.nextAttackTime) {
      const target = this._findNearestEnemy(
        this.player.x,
        this.player.y,
        this.player.attackRange
      );
      if (target) {
        const dmg = Math.round((CONFIG.PROJECTILE.DAMAGE + this.player.attackBonus) * this.player.damageMult);
        this._fireProjectile(this.player.x, this.player.y, target, dmg, true);
        // dual_shot: fire extra projectiles at small angle offsets
        const extras = this.player._extraShots || 0;
        for (let s = 0; s < extras; s++) {
          const offsetAngle = ((s % 2 === 0 ? 1 : -1) * (Math.ceil((s + 1) / 2) * 18)) * (Math.PI / 180);
          const baseAngle   = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
          const fakeTarget  = {
            x: this.player.x + Math.cos(baseAngle + offsetAngle) * 400,
            y: this.player.y + Math.sin(baseAngle + offsetAngle) * 400,
          };
          this._fireProjectile(this.player.x, this.player.y, fakeTarget, Math.round(dmg * 0.8), true);
        }
        this.nextAttackTime = time + this.player.attackRate;
      }
    }

    // Enemy projectiles vs player (manual distance check — avoids physics overlap bug)
    if (!this.player.isDead) {
      const toHit = [];
      this.enemyProjectiles.getChildren().forEach(proj => {
        if (!proj.active) return;
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
        if (dist < 16) toHit.push(proj);
      });
      for (const proj of toHit) {
        const dmg = proj.getData('damage') || 10;
        proj.destroy();
        this.player.takeDamage(dmg);
        if (this.player.isDead) break;
      }
    }

    // Mage projectiles vs player (manual check — triggers explosion)
    if (!this.player.isDead) {
      const toExplode = [];
      this.mageProjectiles.getChildren().forEach(proj => {
        if (!proj.active) return;
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
        if (dist < 20) toExplode.push(proj);
      });
      for (const proj of toExplode) {
        const dmg = proj.getData('damage') || CONFIG.ENEMIES.MAGE.DAMAGE;
        const ex = proj.x, ey = proj.y;
        proj.destroy();
        this._triggerExplosion(ex, ey, dmg);
        if (this.player.isDead) break;
      }
    }

    // Cafeteria healing — regen HP when player is near
    if (!this.player.isDead && this.player.hp < this.player.maxHp) {
      for (const c of this.buildingSystem.cafeterias) {
        if (c.dead) continue;
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
        if (dist < c.healRange) {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + c.healRate * delta / 1000);
          EventBus.emit('player_hp_changed', this.player.hp, this.player.maxHp);
          break;
        }
      }
    }

    // Enemy AI
    this.enemies.getChildren().forEach(sprite => {
      const entity = sprite.getData('entity');
      if (entity && !entity.dead) entity.update(time);
    });

    // Building system (tower auto-attack)
    this.buildingSystem.update(time);

    // Gathering post auto-collect
    let gpCollected = false;
    for (const gp of this.buildingSystem.gatheringPosts) {
      if (!gp.dead) {
        if (gp.update(delta, this.economy, this.resourceNodes, this.buildingSystem.farms)) gpCollected = true;
      }
    }
    if (gpCollected) EventBus.emit('resources_updated', this.economy.resources);

    // Repair workshop auto-repair
    for (const rw of this.buildingSystem.repairWorkshops) {
      if (!rw.dead) rw.update(time, delta, this.buildingSystem);
    }

    // Farm regen
    for (const farm of this.buildingSystem.farms) {
      if (!farm.dead) farm.update(delta);
    }

    // Auto-collect
    this._updateAutoCollect(delta);
    this._updateChestCollect(delta);

    // Game mode timer (timed mode only)
    if (this.gameTimer !== null) {
      this.gameTimer -= delta;
      if (this.gameTimer <= 0) {
        this.gameTimer = 0;
        this._victory();
        return;
      }
    }

    // Boss timer
    this.bossTimer -= delta;
    if (this.bossTimer <= 0) {
      this.bossTimer = CONFIG.BOSS.SPAWN_INTERVAL * 1000;
      this._spawnBoss();
    }

    // Weapon mounts
    for (const wm of this._weaponMounts) wm.update(time, delta);

    // Wave system
    this.waveSystem.update(delta);
  }

  // ─────────────────────────────────────────────
  //  Boss
  // ─────────────────────────────────────────────

  _spawnBoss() {
    const { WORLD_WIDTH, WORLD_HEIGHT } = CONFIG;
    const margin = 60;
    const edge   = Phaser.Math.Between(0, 3);
    let x, y;
    switch (edge) {
      case 0: x = Phaser.Math.Between(margin, WORLD_WIDTH - margin); y = margin;                break;
      case 1: x = Phaser.Math.Between(margin, WORLD_WIDTH - margin); y = WORLD_HEIGHT - margin; break;
      case 2: x = margin;                y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin); break;
      default: x = WORLD_WIDTH - margin; y = Phaser.Math.Between(margin, WORLD_HEIGHT - margin);
    }

    const types    = ['bandit', 'archer', 'heavy', 'mage'];
    const bossType = types[Phaser.Math.Between(0, types.length - 1)];
    const wave     = this.waveSystem.currentWave;
    const boss     = new Boss(this, x, y, bossType, wave);
    this.enemies.add(boss.sprite);
    this._showBossAlert(boss._nameTag ? boss._nameTag.text : '☠ Boss');
  }

  _showBossAlert(bossName) {
    const { WIDTH, HEIGHT } = CONFIG;
    const alert = this.add.text(WIDTH / 2, HEIGHT / 2 - 60, bossName, {
      fontSize: '36px', fontFamily: 'Georgia, serif',
      color: '#FF3300', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0).setAlpha(0);

    this.tweens.add({
      targets: alert,
      alpha: { from: 0, to: 1 },
      y: HEIGHT / 2 - 80,
      duration: 400,
      yoyo: true,
      hold: 1200,
      onComplete: () => alert.destroy(),
    });
  }

  // ─────────────────────────────────────────────
  //  Chest (elite drop)
  // ─────────────────────────────────────────────

  _spawnChest(x, y) {
    const chest = new Chest(this, x, y);
    this._chests.push(chest);
  }

  _updateChestCollect(delta) {
    this._chestGraphics.clear();
    if (this.player.isDead || this._chests.length === 0) return;

    const collectRange = CONFIG.RESOURCES.COLLECT_RANGE;
    const collectTime  = CONFIG.ELITE.CHEST_COLLECT_TIME;

    // Find nearest uncollected chest in range
    let nearest = null, nearestDist = collectRange;
    for (const chest of this._chests) {
      if (chest.collected) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, chest.x, chest.y);
      if (d < nearestDist) { nearestDist = d; nearest = chest; }
    }

    // Reset progress for chests that are no longer nearest
    for (const c of this._chestProgress.keys()) {
      if (c !== nearest) {
        c.hideLabel();
        this._chestProgress.delete(c);
      }
    }

    // Prune fully collected chests
    this._chests = this._chests.filter(c => !c.collected);

    if (!nearest) return;

    nearest.showLabel();
    const prev = this._chestProgress.get(nearest) || 0;
    const next = prev + delta;
    this._chestProgress.set(nearest, next);

    // Draw gold progress ring around chest
    const pct = Math.min(next / collectTime, 1);
    this._chestGraphics.lineStyle(3, 0xFFCC00, 0.85);
    this._chestGraphics.beginPath();
    this._chestGraphics.arc(nearest.x, nearest.y, 22, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2, false);
    this._chestGraphics.strokePath();

    if (next >= collectTime) {
      this._chestProgress.delete(nearest);
      nearest.collect();
      this._showUpgradeChoice();
    }
  }

  _showEliteAlert(eliteName) {
    const { WIDTH, HEIGHT } = CONFIG;
    const alert = this.add.text(WIDTH / 2, HEIGHT / 2 + 20, eliteName, {
      fontSize: '24px', fontFamily: 'Georgia, serif',
      color: '#FFAA00', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0).setAlpha(0);

    this.tweens.add({
      targets: alert,
      alpha: { from: 0, to: 1 },
      y: HEIGHT / 2 + 2,
      duration: 350,
      yoyo: true,
      hold: 1000,
      onComplete: () => alert.destroy(),
    });
  }

  // ─────────────────────────────────────────────
  //  Weapon upgrade system
  // ─────────────────────────────────────────────

  _showUpgradeChoice() {
    // Pause the wave countdown while choosing
    this.isPaused = true;
    // Pick 3 random upgrades from the pool (allow duplicates)
    const pool   = Object.keys(CONFIG.WEAPON_UPGRADES);
    const picks  = [];
    while (picks.length < 3) {
      picks.push(pool[Phaser.Math.Between(0, pool.length - 1)]);
    }
    this.scene.launch('UpgradeChoiceScene', { upgrades: picks });
  }

  _applyUpgrade(key) {
    this.isPaused = false;
    this.scene.stop('UpgradeChoiceScene');

    const wu = CONFIG.WEAPON_UPGRADES[key];
    if (!wu) return;

    switch (key) {
      case 'dual_shot':
        this.player._extraShots = (this.player._extraShots || 0) + 1;
        break;
      case 'rapid_fire':
        this._weaponMounts.push(new WeaponMount(this, this.player, wu));
        break;
      case 'explosive':
        this.player._explosiveShots = true;
        break;
      case 'chain_bolt':
        this.player._chainBolt = true;
        break;
      case 'frost_bolt':
        this.player._frostBolt = true;
        break;
      case 'guardian': {
        // Two guardian mounts, offset by π
        const g1 = new WeaponMount(this, this.player, { ...wu, initialAngle: 0 });
        const g2 = new WeaponMount(this, this.player, { ...wu, initialAngle: Math.PI });
        this._weaponMounts.push(g1, g2);
        break;
      }
      case 'speed_up':
        this.player.speed += wu.AMOUNT;
        break;
      case 'defense_up':
        this.player.defense += wu.AMOUNT;
        break;
      case 'attack_up':
        this.player.attackBonus += wu.AMOUNT;
        break;
      case 'max_hp_up':
        this.player.maxHp += wu.AMOUNT;
        this.player.hp = Math.min(this.player.hp + wu.AMOUNT, this.player.maxHp);
        EventBus.emit('player_hp_changed', this.player.hp, this.player.maxHp);
        break;
      case 'heal':
        this.player.hp = Math.min(this.player.hp + wu.AMOUNT, this.player.maxHp);
        EventBus.emit('player_hp_changed', this.player.hp, this.player.maxHp);
        break;
      case 'gold_bonus':
        this.economy.add('gold', wu.AMOUNT);
        EventBus.emit('resources_updated', this.economy.resources);
        break;
    }

    // Brief on-screen confirmation
    const { WIDTH, HEIGHT } = CONFIG;
    const label = this.add.text(WIDTH / 2, HEIGHT / 2 - 40, `✦ ${wu.name} ✦`, {
      fontSize: '28px', fontFamily: 'Georgia, serif',
      color: '#FFD700', stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0).setAlpha(0);
    this.tweens.add({
      targets: label, alpha: 1, y: HEIGHT / 2 - 60, duration: 350,
      yoyo: true, hold: 800,
      onComplete: () => label.destroy(),
    });
  }

  _triggerMountExplosion(x, y, damage) {
    const r = CONFIG.WEAPON_UPGRADES.explosive.AOE_RADIUS;
    const outer = this.add.circle(x, y, r,        0xFF6600, 0.50).setDepth(20);
    const inner = this.add.circle(x, y, r * 0.4,  0xFFCC00, 0.80).setDepth(21);
    this.tweens.add({
      targets: [outer, inner], alpha: 0, scaleX: 1.4, scaleY: 1.4, duration: 320,
      onComplete: () => { outer.destroy(); inner.destroy(); },
    });
    this.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const entity = sprite.getData('entity');
      if (!entity || entity.dead) return;
      if (Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y) < r) entity.takeDamage(damage);
    });
  }

  _chainBoltHit(hitEntity, dmg) {
    // Find nearest enemy that isn't the one we just hit
    let nearest = null, nearestDist = 300;
    this.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const e = sprite.getData('entity');
      if (!e || e.dead || e === hitEntity) return;
      const d = Phaser.Math.Distance.Between(hitEntity.sprite.x, hitEntity.sprite.y, sprite.x, sprite.y);
      if (d < nearestDist) { nearestDist = d; nearest = sprite; }
    });
    if (!nearest) return;
    // Draw a brief lightning line
    const g = this.add.graphics().setDepth(25);
    g.lineStyle(2, 0xAADDFF, 0.9);
    g.lineBetween(hitEntity.sprite.x, hitEntity.sprite.y, nearest.x, nearest.y);
    this.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
    // Damage the chained target
    const chainEntity = nearest.getData('entity');
    if (chainEntity) chainEntity.takeDamage(Math.round(dmg * 0.6));
  }

  _applyFrost(entity) {
    if (!entity._origSpeed) entity._origSpeed = entity.speed;
    entity.speed = Math.round(entity._origSpeed * 0.70);
    if (entity.sprite && entity.sprite.active) entity.sprite.setTint(0x88AAFF);
    // Clear any previous timer
    if (entity._frostTimer) entity._frostTimer.remove();
    entity._frostTimer = this.time.delayedCall(2000, () => {
      if (!entity.dead) {
        entity.speed = entity._origSpeed;
        if (entity.sprite && entity.sprite.active) entity.sprite.clearTint();
      }
      entity._origSpeed  = null;
      entity._frostTimer = null;
    });
  }

  shutdown() {
    EventBus.off('build_select',    this._onBuildSelect);
    EventBus.off('build_cancelled', this._onBuildCancelled);
    if (this.dayNightSystem) this.dayNightSystem.destroy();
    EventBus.removeAllListeners();
  }
}
