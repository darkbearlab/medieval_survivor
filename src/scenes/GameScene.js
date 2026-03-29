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
import { SoundManager }     from '../utils/SoundManager.js';
import { Soldier }          from '../entities/Soldier.js';

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
    this.economy       = new EconomySystem();
    this.waveSystem    = new WaveSystem(this);
    this.soundManager  = new SoundManager();
    this._smokeCooldown = 0;

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
    this.granaryGroup         = this.physics.add.staticGroup();
    this.castleGroup          = this.physics.add.staticGroup();

    // --- Pathfinder (64×64 grid, 40px cells) ---
    const gridCells = CONFIG.WORLD_WIDTH / CONFIG.BUILDING_GRID;
    this.pathFinder = new PathFinder(CONFIG.BUILDING_GRID, gridCells, gridCells);

    // --- Building System ---
    this.buildingSystem = new BuildingSystem(this);

    // --- Entities ---
    this.townCenter    = new TownCenter(this, TOWN_CENTER.X, TOWN_CENTER.Y);
    this.resourceNodes = this._createResourceNodes();
    this.player        = new Player(this, TOWN_CENTER.X + 120, TOWN_CENTER.Y + 120, this.characterKey);

    // --- Upgrade level tracking (new rarity system) ---
    // _upgradeLevels[key] = number of times this upgrade has been picked (0–10)
    // Starting weapon counts as level 1 so it can be upgraded further
    this.player._upgradeLevels = {};
    const _startWeapon = (CONFIG.CHARACTERS[this.characterKey] || {}).STARTING_WEAPON;
    if (_startWeapon) this.player._upgradeLevels[_startWeapon] = 1;

    // --- Terrain (impassable rocks) ---
    // Disabled: terrain caused enemies to get stuck. Class/method preserved for future use.
    // this._createTerrain();

    // --- Day/Night system ---
    this.dayNightSystem = new DayNightSystem(this);

    // --- Auto-collect state ---
    this._collectProgress = new Map();   // node -> ms held
    this._collectGraphics = this.add.graphics().setDepth(18);

    // --- Range indicator (hover + placement preview) ---
    this._rangeCircle = this.add.graphics().setDepth(19);

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
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.buildingSystem.isPlacing()) {
        this.buildingSystem.updatePreview(world.x, world.y);
      }
      if (!this.isGameOver) this._updateRangeIndicator(world);
      else this._rangeCircle.clear();
    });

    this.input.on('pointerdown', (pointer) => {
      if (this.isGameOver || this.isPaused) return;
      // Right-click cancels placement (or deselects hotbar)
      if (pointer.rightButtonDown()) {
        EventBus.emit('close_upgrade_panel');
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
        const world  = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const placed = this.buildingSystem.tryPlace(world.x, world.y);
        if (placed && this._pendingFreeItem) {
          // Free building placed — consume it and exit placement mode
          this._pendingFreeItem = null;
          this.buildingSystem.cancelPlacing();
          EventBus.emit('build_cancelled');
        }
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
    this.physics.add.collider(this.enemies, this.granaryGroup,    this._onEnemyHitSmithOrTraining, null, this);
    this.physics.add.collider(this.enemies, this.castleGroup,     this._onEnemyHitSmithOrTraining, null, this);
    // Heavy-type enemies (isHeavy flag) pass through soldiers/mages — only player-type blocking skipped.
    // Walls/towers still block heavies normally via their own colliders.
    const _notHeavy = (enemySprite) => {
      const e = enemySprite.getData('entity');
      return !(e && e.isHeavy);
    };
    this.physics.add.collider(this.enemies, this.soldiersGroup,   null, _notHeavy, this);
    this.physics.add.collider(this.enemies, this.alliedMagesGroup, null, _notHeavy, this);

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
    this.physics.add.collider(this.player.sprite, this.granaryGroup);
    this.physics.add.collider(this.player.sprite, this.castleGroup);

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
    this.physics.add.overlap(this.enemyProjectiles, this.granaryGroup,     this._onEnemyProjHitBuilding, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.castleGroup,      this._onEnemyProjHitBuilding, null, this);
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
    this.physics.add.overlap(this.mageProjectiles, this.granaryGroup,     this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.castleGroup,      this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.soldiersGroup,    this._onMageProjHitBuilding, null, this);
    this.physics.add.overlap(this.mageProjectiles, this.alliedMagesGroup, this._onMageProjHitBuilding, null, this);

    // --- Free building inventory (stash from chest/boss drops) ---
    this._freeBuildingInventory = [];
    this._pendingFreeItem       = null;

    // --- EventBus subscriptions ---
    this._onBuildSelect    = (type) => this.buildingSystem.startPlacing(type);
    this._onBuildCancelled = () => {
      this.buildingSystem.cancelPlacing();
      // Restore any free item that was in mid-placement
      if (this._pendingFreeItem) {
        this._freeBuildingInventory.push(this._pendingFreeItem);
        this._pendingFreeItem = null;
        EventBus.emit('free_buildings_updated', this._freeBuildingInventory);
      }
    };
    this._onFreeBuildUse = (idx) => {
      const item = this._freeBuildingInventory[idx];
      if (!item) return;
      this._freeBuildingInventory.splice(idx, 1);
      this._pendingFreeItem = item;
      EventBus.emit('free_buildings_updated', this._freeBuildingInventory);
      this.buildingSystem.startPlacing(item.type, true, item.upgradeLevel || 0);
    };
    this._onUnitBuffsDirty = () => this._recalcUnitBonuses();
    this._onEditorOpened   = () => {
      if (!this.isPaused) { this.physics.pause(); this.isPaused = true; this._editorPaused = true; }
      if (this.input?.keyboard) this.input.keyboard.enabled = false;
    };
    this._onEditorClosed   = () => {
      if (this._editorPaused) { this.physics.resume(); this.isPaused = false; this._editorPaused = false; }
      if (this.input?.keyboard) {
        this.input.keyboard.enabled = true;
        this.input.keyboard.resetKeys();
      }
    };
    EventBus.on('build_select',              this._onBuildSelect);
    EventBus.on('build_cancelled',           this._onBuildCancelled);
    EventBus.on('free_build_use',            this._onFreeBuildUse);
    EventBus.on('unit_buffs_dirty',          this._onUnitBuffsDirty);
    EventBus.on('offensive_editor_opened',   this._onEditorOpened);
    EventBus.on('offensive_editor_closed',   this._onEditorClosed);

    // Periodic safety recalc (handles edge cases like building destruction timing)
    this._bonusRecalcTimer = 0;

    // --- Attack timing ---
    this.nextAttackTime = 0;

    // --- Launch HUD scene ---
    this.scene.launch('UIScene');

    // --- Initial HUD values ---
    this._applyStartingBonus();
    EventBus.emit('resources_updated', this.economy.resources);
    EventBus.emit('town_hp_changed', this.townCenter.hp, this.townCenter.maxHp);
    EventBus.emit('player_hp_changed', this.player.hp, this.player.maxHp);
    if (this._freeBuildingInventory.length > 0)
      this.time.delayedCall(200, () => EventBus.emit('free_buildings_updated', this._freeBuildingInventory));

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

    // --- Soldier aura visual ---
    this._auraGraphics     = this.add.graphics().setDepth(9);
    this._buffDotGraphics  = this.add.graphics().setDepth(15);
    this._auraPulse        = 0;

    // --- Weapon mounts (boss kill upgrades) ---
    this._weaponMounts = [];
    this._onBossKilled = () => this._showUpgradeChoice();
    this._onUpgradeChosen = (data) => this._applyUpgrade(data);
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
        this.soundManager.play('collect');
        this._showCollectFloat(nearestNode);
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

    // Read all data BEFORE any destroy() call — destroy() clears the DataManager.
    const isPiercing  = projectile.getData('piercing');
    const isSplit     = projectile.getData('isSplit');
    const dmg         = projectile.getData('damage') || CONFIG.PROJECTILE.DAMAGE;
    const fp          = projectile.getData('fromPlayer');
    const projAngle   = projectile.getData('angle') ?? 0;

    // Piercing: skip already-hit enemies; don't destroy the projectile
    if (isPiercing) {
      const hitSet = projectile.getData('hitEnemies');
      if (hitSet) {
        if (hitSet.has(enemySprite)) return;
        hitSet.add(enemySprite);
      }
    }

    const entity = enemySprite.getData('entity');
    if (entity) entity.takeDamage(dmg);
    const px = projectile.x, py = projectile.y;

    if (!isPiercing) projectile.destroy();

    if (fp && this.player) {
      if (this.player.aoeOnHit)        this._triggerPlayerAoE(px, py, Math.round(dmg * 0.65));
      if (this.player._explosiveShots) this._triggerMountExplosion(px, py, Math.round(dmg * 0.5), this.player._explosiveShots);
      if (this.player._chainBolt && entity && !entity.dead) this._chainBoltHit(entity, dmg, this.player._chainBolt);
      if (this.player._frostBolt && entity && !entity.dead) this._applyFrost(entity, this.player._frostBolt);
      if (this.player.weaponKey === 'royal_scepter' && entity && !entity.dead && Math.random() < 0.20)
        this._applyFrost(entity, 1);

      // Split arrows (hunter_bow) — triggers on normal hit AND each piercing hit.
      // isSplit flag (read before destroy) prevents recursive split chains.
      const splitCount = this.player._bowSplitCount || 0;
      if (splitCount > 0 && !isSplit) {
        this._triggerBowSplit(px, py, Math.round(dmg * 0.7), splitCount, projAngle);
      }
    }
  }

  // Fire `count` sub-arrows fanning forward from the hit point.
  // Each arrow spreads randomly within ±SPREAD_HALF radians of the original direction.
  _triggerBowSplit(x, y, damage, count, baseAngle = 0) {
    const SPREAD_HALF = Math.PI * (40 / 180); // ±40°
    for (let i = 0; i < count; i++) {
      const offset = (Math.random() * 2 - 1) * SPREAD_HALF;
      const a = baseAngle + offset;
      const fakeTarget = {
        x: x + Math.cos(a) * 500,
        y: y + Math.sin(a) * 500,
      };
      this._fireProjectile(x, y, fakeTarget, damage, true, 0xAADDFF, { isSplit: true });
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
        this.soundManager.play('building_hit');
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
        this.soundManager.play('building_hit');
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
      this.buildingSystem.granaries,
      this.buildingSystem.castles,
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
    this.soundManager.play('explosion');
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
    this.soundManager.play('explosion');
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

  // opts.piercing  — if true, arrow passes through all enemies (Lv10 transform)
  // opts.isSplit   — if true, this is a split sub-arrow (won't trigger split again)
  _fireProjectile(x, y, targetSprite, damage = CONFIG.PROJECTILE.DAMAGE, fromPlayer = false, tint = null, opts = {}) {
    const proj = this.projectiles.create(x, y, 'projectile');
    if (!proj || !proj.body) return;
    proj.setDepth(12);
    // Tint: explicit tint (WeaponMount) takes priority; otherwise use character type
    if (tint !== null) {
      proj.setTint(tint);
    } else if (opts.piercing) {
      proj.setTint(0xFFEE44);   // piercing — golden
    } else if (fromPlayer && this.player && this.player.aoeOnHit) {
      proj.setTint(0xCC44FF);   // mage — purple
    } else if (fromPlayer && this.player && this.player.weaponKey === 'royal_scepter') {
      proj.setTint(0xFF88CC);   // princess — pink
    } else if (fromPlayer && this.player && this.player.weaponKey === 'iron_spear') {
      proj.setTint(0xCCDDEE);   // banner — silvery steel
    } else if (fromPlayer && this.player && this.player.defensePct > 0) {
      proj.setTint(0xFF6633);   // warrior — red
    }
    proj.setData('isProjectile', true);
    proj.setData('fromPlayer', fromPlayer);
    proj.setData('damage', damage);
    if (opts.piercing) {
      proj.setData('piercing', true);
      proj.setData('hitEnemies', new Set());
    }
    if (opts.isSplit) {
      proj.setData('isSplit', true);
    }
    const angle = Phaser.Math.Angle.Between(x, y, targetSprite.x, targetSprite.y);
    proj.setData('angle', angle);  // stored so split can fan in the same direction
    proj.body.setVelocity(
      Math.cos(angle) * CONFIG.PROJECTILE.SPEED,
      Math.sin(angle) * CONFIG.PROJECTILE.SPEED
    );
    const lifespan = opts.piercing
      ? CONFIG.PROJECTILE.PIERCING_LIFESPAN
      : CONFIG.PROJECTILE.LIFESPAN;
    this.time.delayedCall(lifespan, () => {
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
    for (const b of this.buildingSystem.granaries) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 22) { EventBus.emit('building_clicked', b); return; }
    }
    for (const b of this.buildingSystem.castles) {
      if (b.dead) continue;
      const dist = Phaser.Math.Distance.Between(worldX, worldY, b.x, b.y);
      if (dist < 28) { EventBus.emit('building_clicked', b); return; }
    }
  }

  // ─────────────────────────────────────────────
  //  Soldier rally
  // ─────────────────────────────────────────────

  _updateAuraVisual(delta) {
    const p = this.player;
    const hasAura = p && !p.isDead && (p._auraAtk || p._auraDef || p._auraSpd);

    this._auraGraphics.clear();
    this._buffDotGraphics.clear();

    if (!hasAura) return;

    // Pulsing aura ring around player
    this._auraPulse = (this._auraPulse + delta * 0.0025) % (Math.PI * 2);
    const baseAlpha  = 0.18 + 0.10 * Math.sin(this._auraPulse);
    const innerAlpha = 0.08 + 0.06 * Math.sin(this._auraPulse + 1);
    const AURA_R = 140;

    this._auraGraphics.lineStyle(3, 0xFFDD44, baseAlpha);
    this._auraGraphics.strokeCircle(p.x, p.y, AURA_R);
    this._auraGraphics.lineStyle(2, 0xFFEE88, innerAlpha);
    this._auraGraphics.strokeCircle(p.x, p.y, AURA_R - 10);
    this._auraGraphics.lineStyle(1, 0xFFDD44, innerAlpha * 0.5);
    this._auraGraphics.strokeCircle(p.x, p.y, AURA_R + 8);

    // Gold dot above each buffed soldier / mage
    for (const unit of [...this.buildingSystem.soldiers, ...this.buildingSystem.alliedMages]) {
      if (unit.dead || !unit.sprite?.active) continue;
      const pulse = 0.7 + 0.3 * Math.sin(this._auraPulse * 2);
      this._buffDotGraphics.fillStyle(0xFFDD44, pulse);
      this._buffDotGraphics.fillCircle(unit.sprite.x, unit.sprite.y - 18, 3);
    }
  }

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
    // Rally state change affects which buff tier units receive
    this._recalcUnitBonuses();
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

    // Soldier aura visual + buff dot indicators
    this._updateAuraVisual(delta);

    // Auto-attack nearest enemy — uses character-specific range, rate, damage
    if (!this.player.isDead && time > this.nextAttackTime) {
      const target = this._findNearestEnemy(
        this.player.x,
        this.player.y,
        this.player.attackRange
      );
      if (target) {
        const dmg       = Math.round((CONFIG.PROJECTILE.DAMAGE + this.player.attackBonus) * this.player.damageMult);
        const isPiercing = !!(this.player._piercingShot);
        this._fireProjectile(this.player.x, this.player.y, target, dmg, true, null, { piercing: isPiercing });
        this.soundManager.play('player_shoot');
        // dual_shot: fire extra projectiles at small angle offsets
        const extras = this.player._extraShots || 0;
        for (let s = 0; s < extras; s++) {
          const offsetAngle = ((s % 2 === 0 ? 1 : -1) * (Math.ceil((s + 1) / 2) * 18)) * (Math.PI / 180);
          const baseAngle   = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
          const fakeTarget  = {
            x: this.player.x + Math.cos(baseAngle + offsetAngle) * 400,
            y: this.player.y + Math.sin(baseAngle + offsetAngle) * 400,
          };
          this._fireProjectile(this.player.x, this.player.y, fakeTarget, Math.round(dmg * 0.8), true, null, { piercing: isPiercing });
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

    // Tavern healing — regen HP when player/soldiers/mages are near
    for (const c of this.buildingSystem.cafeterias) {
      if (c.dead) continue;
      const healAmt = c.healRate * delta / 1000;

      if (!this.player.isDead && this.player.hp < this.player.maxHp) {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
        if (dist < c.healRange) {
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
          EventBus.emit('player_hp_changed', this.player.hp, this.player.maxHp);
        }
      }

      for (const s of this.buildingSystem.soldiers) {
        if (s.dead) continue;
        if (s.hp >= s.maxHp) continue;
        const dist = Phaser.Math.Distance.Between(s.x, s.y, c.x, c.y);
        if (dist < c.healRange) s.hp = Math.min(s.maxHp, s.hp + healAmt);
      }

      for (const m of this.buildingSystem.alliedMages) {
        if (m.dead) continue;
        if (m.hp >= m.maxHp) continue;
        const dist = Phaser.Math.Distance.Between(m.x, m.y, c.x, c.y);
        if (dist < c.healRange) m.hp = Math.min(m.maxHp, m.hp + healAmt);
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

    // Periodic unit-buff recalculation (safety net, real recalc fires via event)
    this._bonusRecalcTimer += delta;
    if (this._bonusRecalcTimer >= 3000) {
      this._bonusRecalcTimer = 0;
      this._recalcUnitBonuses();
    }

    // Building damage smoke
    this._updateBuildingSmoke(delta);

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

  _showCoordinatedAssaultAlert(direction, themeName) {
    const { WIDTH, HEIGHT } = CONFIG;
    const msg   = `⚠ ${direction}${themeName}！`;
    const alert = this.add.text(WIDTH / 2, HEIGHT / 2 - 30, msg, {
      fontSize: '28px', fontFamily: 'Georgia, serif',
      color: '#FF4444', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(300).setScrollFactor(0).setAlpha(0);

    this.tweens.add({
      targets: alert,
      alpha: { from: 0, to: 1 },
      y: HEIGHT / 2 - 50,
      duration: 400,
      yoyo: true,
      hold: 1400,
      onComplete: () => alert.destroy(),
    });
  }

  // ─────────────────────────────────────────────
  //  Weapon upgrade system
  // ─────────────────────────────────────────────

  _showUpgradeChoice() {
    this.isPaused = true;
    const picks = this._pickUpgrades(3);
    this.scene.launch('UpgradeChoiceScene', { picks });
  }

  // Draw `count` upgrade cards: each card rolls its own rarity, then picks a
  // random eligible key from that rarity's pool.  The 3 cards are guaranteed
  // to have different weapon keys.  Falls back through other rarities if the
  // rolled rarity has no eligible entries left.
  //
  // Slot 0 bias: 40% chance to force the character's starting weapon so the
  // player sees their own weapon more consistently.
  _pickUpgrades(count) {
    const pool     = CONFIG.UPGRADE_POOL;
    const rarCfg   = CONFIG.UPGRADE_RARITIES;
    const levels   = this.player._upgradeLevels || {};
    const rarKeys  = Object.keys(rarCfg); // ['common','rare','epic','legendary']

    // Build eligible key lists per rarity
    const byRarity = { common: [], rare: [], epic: [], legendary: [] };
    for (const [key, cfg] of Object.entries(pool)) {
      const cur = levels[key] || 0;
      if (cur >= cfg.maxLevel) continue;  // already maxed — exclude
      const allowed = cfg.rarities || rarKeys;
      for (const r of allowed) {
        if (byRarity[r]) byRarity[r].push(key);
      }
    }

    // Roll a single rarity according to weights
    const rollRarity = () => {
      let r = Math.random() * 100;
      for (const rk of rarKeys) {
        if (r < rarCfg[rk].weight) return rk;
        r -= rarCfg[rk].weight;
      }
      return rarKeys[rarKeys.length - 1];
    };

    const picked      = [];
    const usedKeys    = new Set();
    const CLASS_BIAS  = 0.40; // probability slot 0 is forced to starting weapon
    const startWeapon = (CONFIG.CHARACTERS[this.characterKey] || {}).STARTING_WEAPON;

    for (let i = 0; i < count; i++) {
      // Slot 0: force starting weapon when test mode is on, or apply 40% bias normally
      let forcedKey = null;
      if (i === 0 && startWeapon && !usedKeys.has(startWeapon)) {
        const cfg = pool[startWeapon];
        const cur = levels[startWeapon] || 0;
        if (cfg && cur < cfg.maxLevel && (this._testMode || Math.random() < CLASS_BIAS)) {
          forcedKey = startWeapon;
        }
      }

      const rarity = rollRarity();

      if (forcedKey) {
        picked.push({ key: forcedKey, rarity });
        usedKeys.add(forcedKey);
        continue;
      }

      // Normal random pick: try preferred rarity first, then cycle as fallback
      const tryOrder = [rarity, ...rarKeys.filter(r => r !== rarity)];
      let found = false;
      for (const r of tryOrder) {
        const eligible = byRarity[r].filter(k => !usedKeys.has(k));
        if (eligible.length > 0) {
          const key = eligible[Math.floor(Math.random() * eligible.length)];
          picked.push({ key, rarity: r });
          usedKeys.add(key);
          found = true;
          break;
        }
      }
      if (!found) break; // fewer than `count` options remain — return what we have
    }

    return picked;
  }

  // Applies the STARTING_BONUS defined in the character's config.
  // Called once at game start, after player and economy are created.
  _applyStartingBonus() {
    const charCfg = CONFIG.CHARACTERS[this.characterKey] || {};
    const bonus   = charCfg.STARTING_BONUS || {};

    // ── Resources ────────────────────────────────────────────────────────────
    if (bonus.maxFood) this.economy.resources.maxFood += bonus.maxFood;
    if (bonus.gold)    this.economy.resources.gold    += bonus.gold;
    if (bonus.wood)    this.economy.resources.wood    += bonus.wood;
    if (bonus.stone)   this.economy.resources.stone   += bonus.stone;
    if (bonus.food) {
      this.economy.resources.food = Math.min(
        this.economy.resources.food + bonus.food,
        this.economy.resources.maxFood
      );
    }
    if (bonus.maxFood || bonus.gold || bonus.wood || bonus.stone || bonus.food) {
      EventBus.emit('resources_updated', this.economy.resources);
    }

    // ── Free buildings (e.g. { freeBuildings: ['castle', 'tower'] }) ─────────
    if (Array.isArray(bonus.freeBuildings)) {
      const META = {
        castle:    { name: '🏰 城堡',   desc: '射箭＋生兵＋召法師（免費放置）', texKey: 'building_castle', icon: '🏰' },
        tower:     { name: '箭塔',       desc: '免費放置箭塔',                    texKey: 'building_tower',  icon: '🏹' },
        barracks:  { name: '兵營',       desc: '免費放置兵營',                    texKey: 'building_barracks', icon: '⚔' },
        mage_tower:{ name: '法師塔',     desc: '免費放置法師塔',                  texKey: 'building_mage_tower', icon: '🔮' },
      };
      for (const bType of bonus.freeBuildings) {
        const m = META[bType] || { name: bType, desc: '免費放置', texKey: `building_${bType}`, icon: '🏗' };
        this._freeBuildingInventory.push({ type: bType, upgradeLevel: 0, ...m });
      }
      // Emission is deferred in create() after UIScene has started
    }

    // ── Pre-applied upgrades (e.g. { upgrades: ['dual_shot'] }) ─────────────
    // Uses _applyUpgradeEffect directly to skip UpgradeChoiceScene teardown.
    if (Array.isArray(bonus.upgrades)) {
      for (const upKey of bonus.upgrades) {
        this._applyUpgradeEffect(upKey);
      }
    }

    // ── Starting soldiers (e.g. { soldiers: 10 }) ────────────────────────────
    // Spawned as deployed (always follow player), no barracks anchor — won't respawn.
    if (bonus.soldiers) {
      const count = bonus.soldiers;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const sx = this.player.x + Math.cos(angle) * 90;
        const sy = this.player.y + Math.sin(angle) * 90;
        const type = i % 3 === 0 ? 'ranged' : 'melee';
        const soldier = new Soldier(this, sx, sy, type, null);
        soldier.deployed = true;
        this.soldiersGroup.add(soldier.sprite);
        this.buildingSystem.soldiers.push(soldier);
      }
    }
  }

  // data = { key, rarity } — sent by UpgradeChoiceScene via 'upgrade_chosen' event.
  _applyUpgrade(data) {
    this.isPaused = false;
    this.scene.stop('UpgradeChoiceScene');
    if (this.input?.keyboard) this.input.keyboard.resetKeys();

    const { key, rarity = 'common' } = (typeof data === 'object' && data !== null) ? data : { key: data };
    const wu = CONFIG.UPGRADE_POOL[key];
    if (!wu) return;

    this._applyUpgradeEffect(key, rarity);

    // Brief on-screen confirmation — colour matches rarity
    const { WIDTH, HEIGHT } = CONFIG;
    const rarCfg = CONFIG.UPGRADE_RARITIES[rarity] || {};
    const color  = rarCfg.color || '#FFD700';
    const level  = this.player._upgradeLevels[key] || 1;
    const label  = this.add.text(WIDTH / 2, HEIGHT / 2 - 40,
      `✦ ${wu.name}  Lv${level} ✦`, {
        fontSize: '28px', fontFamily: 'Georgia, serif',
        color, stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(300).setScrollFactor(0).setAlpha(0);
    this.tweens.add({
      targets: label, alpha: 1, y: HEIGHT / 2 - 60, duration: 350,
      yoyo: true, hold: 800,
      onComplete: () => label.destroy(),
    });
  }

  // Pure effect — no scene teardown.
  // rarity: 'common' | 'rare' | 'epic' | 'legendary'  (default 'common' for
  //         STARTING_BONUS / internal calls that pre-date the rarity system)
  _applyUpgradeEffect(key, rarity = 'common') {
    // ── Internal aura sub-effects (STARTING_BONUS only, not in UPGRADE_POOL) ──
    if (key === 'soldier_aura_atk') {
      this.player._auraAtk = (this.player._auraAtk || 0) + 6;
      this._recalcUnitBonuses(); return;
    }
    if (key === 'soldier_aura_def') {
      this.player._auraDef = (this.player._auraDef || 0) + 3;
      this._recalcUnitBonuses(); return;
    }
    if (key === 'soldier_aura_spd') {
      this.player._auraSpd = (this.player._auraSpd || 0) + 25;
      this._recalcUnitBonuses(); return;
    }

    const wu = CONFIG.UPGRADE_POOL[key];
    if (!wu) return;

    // ── Level tracking ───────────────────────────────────────────────────────
    if (!this.player._upgradeLevels) this.player._upgradeLevels = {};
    const prevLevel = this.player._upgradeLevels[key] || 0;
    const newLevel  = Math.min(prevLevel + 1, wu.maxLevel);
    this.player._upgradeLevels[key] = newLevel;

    // ── Weapons with per-level definitions ───────────────────────────────────
    // If the upgrade pool entry has a `levels` array, apply its specific effect
    // for this level and skip the generic rarityBonus block.
    if (wu.levels) {
      this._applyWeaponLevelEffect(key, wu.levels[newLevel - 1], rarity, newLevel);
      return;
    }

    // ── Generic rarityBonus (placeholder for upgrades not yet per-level) ─────
    const bonus = (wu.rarityBonus && wu.rarityBonus[rarity]) || 0;
    this.player.attackBonus = (this.player.attackBonus || 0) + bonus;

    if (newLevel === wu.maxLevel && wu.maxLevel === 10) {
      this.player.attackBonus += 20; // placeholder transform burst
    }

    // ── Mechanical effects (one trigger per stack, rarity-independent) ───────
    switch (key) {
      case 'dual_shot':
        this.player._extraShots = (this.player._extraShots || 0) + 1;
        break;
      case 'rapid_fire':
        this._weaponMounts.push(new WeaponMount(this, this.player, wu));
        break;
      case 'explosive':
        this.player._explosiveShots = (this.player._explosiveShots || 0) + 1;
        break;
      case 'chain_bolt':
        this.player._chainBolt = (this.player._chainBolt || 0) + 1;
        break;
      case 'frost_bolt':
        this.player._frostBolt = (this.player._frostBolt || 0) + 1;
        break;
      case 'guardian': {
        const g1 = new WeaponMount(this, this.player, { ...wu, initialAngle: 0 });
        const g2 = new WeaponMount(this, this.player, { ...wu, initialAngle: Math.PI });
        this._weaponMounts.push(g1, g2);
        break;
      }
      // Stat upgrades — rarity bonus already added above via attackBonus placeholder;
      // real per-stat amounts will be implemented during per-weapon design pass.
      case 'speed_up':
        this.player.speed += 15;
        break;
      case 'defense_up':
        this.player.defense += 3;
        break;
      case 'max_hp_up':
        this.player.maxHp += 30;
        this.player.hp = Math.min(this.player.hp + 30, this.player.maxHp);
        EventBus.emit('player_hp_changed', this.player.hp, this.player.maxHp);
        break;
      case 'heal':
        this.player.hp = Math.min(this.player.hp + 50, this.player.maxHp);
        EventBus.emit('player_hp_changed', this.player.hp, this.player.maxHp);
        break;
      case 'gold_bonus':
        this.economy.add('gold', 60);
        EventBus.emit('resources_updated', this.economy.resources);
        break;
      case 'free_tower_lv2':
        this._freeBuildingInventory.push({
          type: 'tower', upgradeLevel: 2,
          name: '★ 精英箭塔', desc: '升級版箭塔（免費放置）',
          texKey: 'building_tower', icon: '★',
        });
        EventBus.emit('free_buildings_updated', this._freeBuildingInventory);
        break;
      case 'free_castle':
        this._freeBuildingInventory.push({
          type: 'castle', upgradeLevel: 0,
          name: '🏰 城堡', desc: '射箭＋生兵＋召法師（免費放置）',
          texKey: 'building_castle', icon: '🏰',
        });
        EventBus.emit('free_buildings_updated', this._freeBuildingInventory);
        break;
      case 'soldier_aura': {
        const roll = Phaser.Math.Between(0, 2);
        if (roll === 0)      { this.player._auraAtk = (this.player._auraAtk || 0) + 6; }
        else if (roll === 1) { this.player._auraDef = (this.player._auraDef || 0) + 3; }
        else                 { this.player._auraSpd = (this.player._auraSpd || 0) + 25; }
        this._recalcUnitBonuses();
        break;
      }
    }
  }

  // Dispatch per-level effects for weapons that have a `levels` array in config.
  // lvCfg = wu.levels[newLevel - 1], rarity = drawn rarity string.
  _applyWeaponLevelEffect(key, lvCfg, rarity, newLevel) {
    if (!lvCfg) return;

    switch (key) {
      case 'hunter_bow':
        this._applyHunterBowLevel(lvCfg, rarity, newLevel);
        break;
      // Future weapons: add cases here as each weapon is designed.
    }
  }

  _applyHunterBowLevel(lvCfg, rarity, newLevel) {
    const val = (lvCfg.values && lvCfg.values[rarity]) || 0;
    switch (lvCfg.effect) {
      case 'atk':
        this.player.attackBonus = (this.player.attackBonus || 0) + val;
        break;
      case 'rate':
        // Reduce attack interval; floor at 200 ms to prevent absurdly fast shots
        this.player.attackRate = Math.max(200, this.player.attackRate - val);
        break;
      case 'split':
        // Accumulate split arrow count; each stack adds `val` sub-arrows on hit
        this.player._bowSplitCount = (this.player._bowSplitCount || 0) + val;
        break;
      case 'transform':
        // Lv10 蛻變：射程全地圖 + 穿透（保留所有已累積的攻擊力/攻速/分裂）
        this.player.attackRange   = 9999;
        this.player._piercingShot = true;
        // Flash the player sprite gold to signal the transform
        this.player.sprite.setTint(0xFFEE44);
        this.time.delayedCall(800, () => {
          if (this.player.sprite && this.player.sprite.active)
            this.player.sprite.clearTint();
        });
        break;
    }
  }

  _triggerMountExplosion(x, y, damage, stacks = 1) {
    // Each additional stack adds 25% radius and 30% damage
    const r = CONFIG.WEAPON_UPGRADES.explosive.AOE_RADIUS * (1 + 0.25 * (stacks - 1));
    damage   = Math.round(damage * (1 + 0.30 * (stacks - 1)));
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

  _chainBoltHit(hitEntity, dmg, chainsLeft = 1, visited = null) {
    if (chainsLeft <= 0) return;
    visited = visited || new Set([hitEntity]);

    // Find nearest enemy not yet visited
    let nearest = null, nearestDist = 300;
    this.enemies.getChildren().forEach(sprite => {
      if (!sprite.active) return;
      const e = sprite.getData('entity');
      if (!e || e.dead || visited.has(e)) return;
      const d = Phaser.Math.Distance.Between(hitEntity.sprite.x, hitEntity.sprite.y, sprite.x, sprite.y);
      if (d < nearestDist) { nearestDist = d; nearest = sprite; }
    });
    if (!nearest) return;

    // Draw a brief lightning line
    const g = this.add.graphics().setDepth(25);
    g.lineStyle(2, 0xAADDFF, 0.9);
    g.lineBetween(hitEntity.sprite.x, hitEntity.sprite.y, nearest.x, nearest.y);
    this.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });

    // Damage and recurse
    const chainEntity = nearest.getData('entity');
    if (chainEntity) {
      chainEntity.takeDamage(Math.round(dmg * 0.6));
      visited.add(chainEntity);
      this._chainBoltHit(chainEntity, Math.round(dmg * 0.6), chainsLeft - 1, visited);
    }
  }

  _applyFrost(entity, stacks = 1) {
    // Each additional stack: +1s duration, -5% more speed reduction (floor 30%)
    const slowPct  = Math.max(0.30, 0.70 - 0.05 * (stacks - 1));
    const duration = 2000 + 1000 * (stacks - 1);
    if (!entity._origSpeed) entity._origSpeed = entity.speed;
    entity.speed = Math.round(entity._origSpeed * slowPct);
    if (entity.sprite && entity.sprite.active) entity.sprite.setTint(0x88AAFF);
    if (entity._frostTimer) entity._frostTimer.remove();
    entity._frostTimer = this.time.delayedCall(duration, () => {
      if (!entity.dead) {
        entity.speed = entity._origSpeed;
        if (entity.sprite && entity.sprite.active) entity.sprite.clearTint();
      }
      entity._origSpeed  = null;
      entity._frostTimer = null;
    });
  }

  // ─────────────────────────────────────────────
  //  Visual feedback helpers (Phase 7)
  // ─────────────────────────────────────────────

  // ─────────────────────────────────────────────
  //  Range indicator — hover & placement preview
  // ─────────────────────────────────────────────

  /**
   * Called every pointermove.
   * Shows a translucent range circle for:
   *  • The building being placed (at the snapped preview position)
   *  • Any existing building the pointer is hovering over (within 34 px)
   */
  _updateRangeIndicator(world) {
    this._rangeCircle.clear();

    // Placement preview mode
    if (this.buildingSystem.isPlacing()) {
      const ri = this._getRangeForType(this.buildingSystem.placingType);
      const ps = this.buildingSystem.previewSprite;
      if (ri && ps) this._drawRangeCircle(ps.x, ps.y, ri.radius, ri.color);
      return;
    }

    // Hover mode — find nearest range-bearing building within 34 px
    const bs  = this.buildingSystem;
    const all = [
      ...bs.towers, ...bs.cafeterias, ...bs.gatheringPosts,
      ...bs.smiths, ...bs.trainingGrounds, ...bs.castles,
      ...bs.barracks, ...bs.mageTowers,
    ];
    let closest = null, closestDist = 34;
    for (const b of all) {
      if (b.dead) continue;
      const d = Phaser.Math.Distance.Between(world.x, world.y, b.x, b.y);
      if (d < closestDist) { closestDist = d; closest = b; }
    }
    if (closest) {
      const ri = this._getRangeForBuilding(closest);
      if (ri) this._drawRangeCircle(closest.x, closest.y, ri.radius, ri.color);
    }
  }

  /** Range data for each placeable type (uses base config values). */
  _getRangeForType(type) {
    const C = CONFIG.BUILDINGS;
    switch (type) {
      case 'tower':      return { radius: C.TOWER.RANGE,                   color: 0x4488FF };
      case 'cafeteria':  return { radius: C.CAFETERIA.HEAL_RANGE,          color: 0x44FF88 };
      case 'gathering':  return { radius: C.GATHERING_POST.RANGE,          color: 0xFFDD44 };
      case 'smith':      return { radius: C.BLACKSMITH.BUFF_RANGE,         color: 0x88AAFF };
      case 'training':   return { radius: C.TRAINING_GROUND.BUFF_RANGE,    color: 0xFFAA44 };
      case 'castle':     return { radius: C.CASTLE.RANGE,                  color: 0x4488FF };
      case 'barracks':   return { radius: CONFIG.SOLDIERS.DETECT_RANGE,    color: 0x44CCFF };
      case 'mage_tower': return { radius: CONFIG.ALLIED_MAGES.DETECT_RANGE, color: 0xCC88FF };
      default: return null;
    }
  }

  /** Range data for an existing building instance (uses live values so upgrades show correctly). */
  _getRangeForBuilding(b) {
    switch (b.type) {
      case 'tower':      return { radius: b.range,                              color: 0x4488FF };
      case 'cafeteria':  return { radius: b.healRange,                          color: 0x44FF88 };
      case 'gathering':  return { radius: b.range,                              color: 0xFFDD44 };
      case 'smith':      return { radius: CONFIG.BUILDINGS.BLACKSMITH.BUFF_RANGE,      color: 0x88AAFF };
      case 'training':   return { radius: CONFIG.BUILDINGS.TRAINING_GROUND.BUFF_RANGE, color: 0xFFAA44 };
      case 'castle':     return { radius: b.range,                              color: 0x4488FF };
      case 'barracks':   return { radius: CONFIG.SOLDIERS.DETECT_RANGE,         color: 0x44CCFF };
      case 'mage_tower': return { radius: CONFIG.ALLIED_MAGES.DETECT_RANGE,     color: 0xCC88FF };
      default: return null;
    }
  }

  /** Draw a translucent filled circle with a stroked border. */
  _drawRangeCircle(x, y, radius, color) {
    this._rangeCircle.fillStyle(color, 0.08);
    this._rangeCircle.fillCircle(x, y, radius);
    this._rangeCircle.lineStyle(1.5, color, 0.65);
    this._rangeCircle.strokeCircle(x, y, radius);
  }

  /**
   * Recalculate atkBonus / defBonus on all living soldiers and allied mages.
   *
   * Building-anchored units:
   *   Receive the full per-building bonus from every TrainingGround / Blacksmith
   *   whose distance to the unit's home building (barracks/magetower) is < BUFF_RANGE.
   *
   * Deployed / rally units (following player):
   *   Receive half the grand total from all alive TrainingGrounds / Blacksmiths,
   *   regardless of position.
   */
  _recalcUnitBonuses() {
    const bs         = this.buildingSystem;
    const BUFF_RANGE = CONFIG.BUILDINGS.BLACKSMITH.BUFF_RANGE;
    const player     = this.player;
    const inRally    = this.soldierRallyMode;

    // Aura bonuses from the banner character upgrade
    const auraAtk = player?._auraAtk || 0;
    const auraDef = player?._auraDef || 0;
    const auraSpd = player?._auraSpd || 0;

    // Total bonuses across all living buildings
    let totalAtk = 0, totalDef = 0;
    for (const tg of bs.trainingGrounds) { if (!tg.dead) totalAtk += tg.atkBonus; }
    for (const sm of bs.smiths)          { if (!sm.dead) totalDef += sm.defenseBonus; }
    const deployedAtk = Math.floor(totalAtk / 2);
    const deployedDef = Math.floor(totalDef / 2);

    for (const unit of [...bs.soldiers, ...bs.alliedMages]) {
      if (unit.dead) continue;
      const followPlayer = unit.deployed || (inRally && player && !player.isDead);

      if (followPlayer) {
        unit.atkBonus = deployedAtk + auraAtk;
        unit.defBonus = deployedDef + auraDef;
      } else {
        // Home building: soldiers anchor on barracks, mages on tower
        const anchor = unit.barracks || unit.tower;
        if (!anchor) { unit.atkBonus = auraAtk; unit.defBonus = auraDef; unit.spdBonus = auraSpd; continue; }
        let atk = 0, def = 0;
        for (const tg of bs.trainingGrounds) {
          if (!tg.dead && Phaser.Math.Distance.Between(anchor.x, anchor.y, tg.x, tg.y) < BUFF_RANGE) {
            atk += tg.atkBonus;
          }
        }
        for (const sm of bs.smiths) {
          if (!sm.dead && Phaser.Math.Distance.Between(anchor.x, anchor.y, sm.x, sm.y) < BUFF_RANGE) {
            def += sm.defenseBonus;
          }
        }
        unit.atkBonus = atk + auraAtk;
        unit.defBonus = def + auraDef;
      }
      unit.spdBonus = auraSpd;
    }
  }

  /** Floating "+木" / "+石" / "+食" text when player collects a node or farm. */
  _showCollectFloat(node) {
    const isFarm = node.type === 'farm';
    const label  = isFarm ? '+食' : (node.type === 'tree' ? '+木' : '+石');
    const color  = isFarm ? '#FFD700' : (node.type === 'tree' ? '#88EE88' : '#CCCCCC');
    const t = this.add.text(node.x, node.y - 10, label, {
      fontSize: '17px', color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(30);
    this.tweens.add({
      targets: t, y: t.y - 38, alpha: 0, duration: 850,
      onComplete: () => t.destroy(),
    });
  }

  /**
   * Emit a rising smoke puff from every building whose HP is below 30%.
   * Called each frame; internal cooldown limits puffs to one batch per 900 ms.
   */
  _updateBuildingSmoke(delta) {
    this._smokeCooldown += delta;
    if (this._smokeCooldown < 900) return;
    this._smokeCooldown = 0;

    const bs = this.buildingSystem;
    const lists = [
      bs.walls, bs.towers, bs.smiths, bs.trainingGrounds,
      bs.cafeterias, bs.gatheringPosts, bs.repairWorkshops,
      bs.barracks, bs.mageTowers, bs.granaries, bs.castles,
    ];
    for (const list of lists) {
      for (const b of list) {
        if (b.dead || !b.hp || !b.maxHp) continue;
        if (b.hp / b.maxHp > 0.30) continue;
        const ox = b.x + Phaser.Math.Between(-8, 8);
        const oy = b.y - 8;
        const smoke = this.add.circle(ox, oy, 5, 0x999999, 0.55).setDepth(7);
        this.tweens.add({
          targets: smoke,
          y: oy - 24, alpha: 0, scaleX: 2.2, scaleY: 2.2,
          duration: 1100,
          onComplete: () => smoke.destroy(),
        });
      }
    }
  }

  shutdown() {
    EventBus.off('build_select',            this._onBuildSelect);
    EventBus.off('build_cancelled',         this._onBuildCancelled);
    EventBus.off('free_build_use',          this._onFreeBuildUse);
    EventBus.off('unit_buffs_dirty',        this._onUnitBuffsDirty);
    EventBus.off('offensive_editor_opened', this._onEditorOpened);
    EventBus.off('offensive_editor_closed', this._onEditorClosed);
    if (this.dayNightSystem) this.dayNightSystem.destroy();
    EventBus.removeAllListeners();
  }
}
