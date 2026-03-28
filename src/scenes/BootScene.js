export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    this._genGround();
    this._genPlayer();
    this._genEnemyBandit();
    this._genTownCenter();
    this._genResourceTree();
    this._genResourceStone();
    this._genProjectile();
    this._genBuildingWall();
    this._genBuildingTower();
    this._genEnemyArcher();
    this._genEnemyHeavy();
    this._genTerrainRock();
    this._genBlacksmith();
    this._genTrainingGround();
    this._genEnemyMage();
    this._genCafeteria();
    this._genGatheringPost();
    this._genRepairWorkshop();
    this._genBarracks();
    this._genMageTower();
    this._genSoldierMelee();
    this._genSoldierRanged();
    this._genAlliedMage();
    this._genFarm();
    this._genPlayerWarrior();
    this._genPlayerMage();
    this._genPlayerPrincess();
    this._genPlayerBanner();
    this._genChest();
    this._genGranary();
    this._genCastle();
    this.scene.start('MenuScene');
  }

  _genGround() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x4a7c59);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x3d6b4a, 0.6);
    g.fillRect(0, 0, 16, 16);
    g.fillRect(16, 16, 16, 16);
    g.lineStyle(1, 0x2d5a3a, 0.4);
    g.strokeRect(0, 0, 32, 32);
    g.generateTexture('ground', 32, 32);
    g.destroy();
  }

  _genPlayer() {
    const g = this.make.graphics({ add: false });
    // Body (blue tunic)
    g.fillStyle(0x1565C0);
    g.fillRect(8, 10, 16, 16);
    // Head
    g.fillStyle(0xFFCC80);
    g.fillRect(10, 3, 12, 10);
    // Helmet
    g.fillStyle(0x0D47A1);
    g.fillRect(8, 2, 16, 6);
    // Sword
    g.fillStyle(0xCCCCCC);
    g.fillRect(24, 8, 3, 14);
    g.fillStyle(0xAA8800);
    g.fillRect(22, 12, 7, 3);
    // Legs
    g.fillStyle(0x0D47A1);
    g.fillRect(8, 26, 6, 6);
    g.fillRect(18, 26, 6, 6);
    g.generateTexture('player', 32, 32);
    g.destroy();
  }

  _genEnemyBandit() {
    const g = this.make.graphics({ add: false });
    // Body
    g.fillStyle(0x6B1A1A);
    g.fillRect(8, 10, 16, 16);
    // Head
    g.fillStyle(0xD2691E);
    g.fillRect(10, 3, 12, 10);
    // Hood
    g.fillStyle(0x3d0000);
    g.fillRect(8, 2, 16, 8);
    // Weapon (dagger)
    g.fillStyle(0xAAAAAA);
    g.fillRect(24, 10, 3, 10);
    // Legs
    g.fillStyle(0x3d0000);
    g.fillRect(8, 26, 6, 6);
    g.fillRect(18, 26, 6, 6);
    g.generateTexture('enemy_bandit', 32, 32);
    g.destroy();
  }

  _genTownCenter() {
    const g = this.make.graphics({ add: false });
    // Foundation
    g.fillStyle(0x6B4C11);
    g.fillRect(2, 2, 60, 60);
    // Main walls
    g.fillStyle(0xC8A832);
    g.fillRect(6, 6, 52, 52);
    // Inner courtyard hint
    g.fillStyle(0xB8941E);
    g.fillRect(12, 12, 40, 40);
    // Tower top
    g.fillStyle(0xE0B840);
    g.fillRect(22, 2, 20, 22);
    // Battlements on tower
    g.fillStyle(0xC8A832);
    g.fillRect(22, 0, 5, 5);
    g.fillRect(30, 0, 5, 5);
    g.fillRect(38, 0, 5, 5);
    // Gate door
    g.fillStyle(0x3B1F00);
    g.fillRect(26, 40, 12, 18);
    // Flag pole
    g.fillStyle(0x888888);
    g.fillRect(31, -10, 2, 16);
    // Flag
    g.fillStyle(0xDD0000);
    g.fillRect(33, -10, 10, 7);
    g.generateTexture('town_center', 64, 64);
    g.destroy();
  }

  _genResourceTree() {
    const g = this.make.graphics({ add: false });
    // Trunk
    g.fillStyle(0x5C3310);
    g.fillRect(13, 20, 6, 12);
    // Canopy layers
    g.fillStyle(0x1B5E20);
    g.fillCircle(16, 16, 13);
    g.fillStyle(0x2E7D32);
    g.fillCircle(13, 13, 9);
    g.fillStyle(0x43A047);
    g.fillCircle(19, 11, 7);
    g.fillStyle(0x66BB6A, 0.5);
    g.fillCircle(15, 9, 5);
    g.generateTexture('resource_tree', 32, 32);
    g.destroy();
  }

  _genResourceStone() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0x424242);
    g.fillCircle(16, 19, 13);
    g.fillStyle(0x616161);
    g.fillCircle(13, 16, 10);
    g.fillStyle(0x757575);
    g.fillCircle(10, 13, 7);
    g.fillStyle(0x9E9E9E, 0.4);
    g.fillCircle(9, 11, 4);
    g.generateTexture('resource_stone', 32, 32);
    g.destroy();
  }

  _genProjectile() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xFFEB3B);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xFFFFFF, 0.6);
    g.fillCircle(3, 3, 2);
    g.generateTexture('projectile', 8, 8);
    g.destroy();
  }

  _genEnemyArcher() {
    const g = this.make.graphics({ add: false });
    // Body (green cloak)
    g.fillStyle(0x2d6a2d);
    g.fillRect(8, 10, 14, 16);
    // Head
    g.fillStyle(0xFFCC80);
    g.fillRect(10, 3, 11, 10);
    // Hood
    g.fillStyle(0x1a4a1a);
    g.fillRect(8, 1, 15, 7);
    // Bow (right side)
    g.lineStyle(2, 0x8B5E3C);
    g.beginPath();
    g.moveTo(24, 4); g.lineTo(26, 16); g.strokePath();
    g.lineStyle(1, 0xCCCCCC);
    g.beginPath();
    g.moveTo(24, 4); g.lineTo(24, 16); g.strokePath();
    // Arrow
    g.fillStyle(0xCCCCCC);
    g.fillRect(24, 9, 8, 1);
    g.fillStyle(0xCC3300);
    g.fillRect(31, 8, 3, 3);
    // Legs
    g.fillStyle(0x1a4a1a);
    g.fillRect(8, 26, 6, 6);
    g.fillRect(16, 26, 6, 6);
    g.generateTexture('enemy_archer', 32, 32);
    g.destroy();
  }

  _genEnemyHeavy() {
    const g = this.make.graphics({ add: false });
    // Heavy armour body (dark metal)
    g.fillStyle(0x3a3a3a);
    g.fillRect(5, 8, 22, 20);
    // Chest plate highlight
    g.fillStyle(0x555555);
    g.fillRect(7, 10, 18, 14);
    // Helmet
    g.fillStyle(0x2a2a2a);
    g.fillRect(6, 0, 20, 12);
    // Visor slit
    g.fillStyle(0xFF4400, 0.8);
    g.fillRect(9, 5, 14, 3);
    // Shield (left)
    g.fillStyle(0x4a1a00);
    g.fillRect(0, 8, 6, 18);
    g.fillStyle(0xAA8800);
    g.fillRect(1, 9, 4, 16);
    // Weapon (right, big axe)
    g.fillStyle(0x777777);
    g.fillRect(27, 2, 4, 22);
    g.fillStyle(0x999999);
    g.fillRect(26, 2, 6, 7);
    // Legs (heavy greaves)
    g.fillStyle(0x2a2a2a);
    g.fillRect(5, 28, 9, 6);
    g.fillRect(18, 28, 9, 6);
    g.generateTexture('enemy_heavy', 32, 34);
    g.destroy();
  }

  _genTerrainRock() {
    const g = this.make.graphics({ add: false });
    // Dark rocky base
    g.fillStyle(0x3a3a3a);
    g.fillRect(0, 0, 40, 40);
    // Rock face
    g.fillStyle(0x4a4a4a);
    g.fillRect(3, 3, 34, 34);
    // Cracks
    g.fillStyle(0x2a2a2a);
    g.fillRect(10, 3, 2, 15);
    g.fillRect(10, 18, 10, 2);
    g.fillRect(25, 10, 2, 20);
    // Light face highlight
    g.fillStyle(0x666666, 0.5);
    g.fillRect(4, 4, 12, 12);
    g.fillRect(22, 5, 8, 8);
    // Border shadow
    g.fillStyle(0x1a1a1a);
    g.fillRect(0, 37, 40, 3);
    g.fillRect(37, 0, 3, 40);
    g.generateTexture('terrain_rock', 40, 40);
    g.destroy();
  }

  _genBlacksmith() {
    const g = this.make.graphics({ add: false });
    // Base (stone floor)
    g.fillStyle(0x555555);
    g.fillRect(0, 0, 40, 40);
    // Anvil base
    g.fillStyle(0x333333);
    g.fillRect(8, 24, 24, 10);
    // Anvil top
    g.fillStyle(0x222222);
    g.fillRect(6, 18, 28, 9);
    // Anvil horn
    g.fillStyle(0x333333);
    g.fillRect(28, 20, 8, 5);
    // Fire glow
    g.fillStyle(0xFF6600, 0.7);
    g.fillRect(4, 10, 14, 10);
    g.fillStyle(0xFF9900, 0.5);
    g.fillRect(6, 8, 10, 6);
    // Hammer
    g.fillStyle(0x888888);
    g.fillRect(24, 6, 4, 14);
    g.fillStyle(0xAAAAAA);
    g.fillRect(21, 4, 10, 6);
    // Shield icon top-right
    g.fillStyle(0x4488FF, 0.8);
    g.fillRect(28, 2, 10, 8);
    g.generateTexture('building_smith', 40, 40);
    g.destroy();
  }

  _genTrainingGround() {
    const g = this.make.graphics({ add: false });
    // Base (dirt/sand floor)
    g.fillStyle(0x8B6914);
    g.fillRect(0, 0, 40, 40);
    // Ground detail
    g.fillStyle(0x7A5C0F, 0.5);
    g.fillRect(4, 4, 32, 32);
    // Training dummy pole
    g.fillStyle(0x5C3310);
    g.fillRect(18, 8, 4, 26);
    // Dummy body
    g.fillStyle(0xCC4444);
    g.fillRect(12, 10, 16, 14);
    // Dummy head
    g.fillStyle(0xCC6633);
    g.fillCircle(20, 8, 5);
    // Crossed swords icon
    g.fillStyle(0xCCCCCC);
    g.fillRect(4, 28, 14, 3);
    g.fillRect(8, 25, 3, 9);
    // Sword 2
    g.fillStyle(0xBBBBBB);
    g.fillRect(22, 28, 14, 3);
    g.fillRect(29, 25, 3, 9);
    // Attack icon (star/burst) top-right
    g.fillStyle(0xFFAA00, 0.9);
    g.fillRect(28, 2, 10, 4);
    g.fillRect(30, 0, 6, 8);
    g.generateTexture('building_training', 40, 40);
    g.destroy();
  }

  _genEnemyMage() {
    const g = this.make.graphics({ add: false });
    // Robe (deep purple)
    g.fillStyle(0x5a0078);
    g.fillRect(8, 14, 16, 18);
    // Head
    g.fillStyle(0xFFD0A0);
    g.fillRect(10, 6, 12, 10);
    // Hat brim
    g.fillStyle(0x3a0050);
    g.fillRect(7, 8, 18, 4);
    // Hat cone
    g.fillStyle(0x3a0050);
    g.fillTriangle(10, 8, 22, 8, 16, 0);
    // Staff
    g.fillStyle(0x8B6914);
    g.fillRect(25, 6, 3, 22);
    // Magic orb on staff
    g.fillStyle(0x88AAFF, 0.9);
    g.fillCircle(26, 5, 4);
    g.fillStyle(0xFFFFFF, 0.5);
    g.fillCircle(25, 4, 2);
    // Legs
    g.fillStyle(0x3a0050);
    g.fillRect(8, 32, 6, 4);
    g.fillRect(18, 32, 6, 4);
    g.generateTexture('enemy_mage', 32, 36);
    g.destroy();
  }

  _genCafeteria() {
    const g = this.make.graphics({ add: false });
    // Base (warm brown wood)
    g.fillStyle(0x8B4513);
    g.fillRect(0, 0, 40, 40);
    // Inner floor
    g.fillStyle(0xA0602A);
    g.fillRect(2, 2, 36, 36);
    // Table top
    g.fillStyle(0x7B4A20);
    g.fillRect(8, 12, 24, 4);
    // Table body
    g.fillStyle(0x5C3310);
    g.fillRect(8, 16, 24, 12);
    // Food bowls (red and gold)
    g.fillStyle(0xCC4444);
    g.fillCircle(16, 17, 4);
    g.fillStyle(0xEEAA00);
    g.fillCircle(26, 17, 4);
    // Steam wisps
    g.fillStyle(0xDDDDDD, 0.5);
    g.fillRect(14, 5, 2, 6);
    g.fillRect(23, 4, 2, 7);
    // Red cross (heal symbol) top-right
    g.fillStyle(0xFF3355);
    g.fillRect(30, 3, 8, 3);
    g.fillRect(33, 1, 3, 7);
    g.generateTexture('building_cafeteria', 40, 40);
    g.destroy();
  }

  _genGatheringPost() {
    const g = this.make.graphics({ add: false });
    // Base (earthy brown)
    g.fillStyle(0x7B5D35);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x9A7248);
    g.fillRect(2, 2, 36, 36);
    // Barn roof
    g.fillStyle(0x8B2020);
    g.fillTriangle(0, 18, 40, 18, 20, 4);
    // Walls
    g.fillStyle(0xD2A679);
    g.fillRect(4, 18, 32, 18);
    // Door
    g.fillStyle(0x5C3310);
    g.fillRect(16, 26, 8, 10);
    // Wood icon top-left
    g.fillStyle(0x5C3310);
    g.fillRect(3, 3, 10, 3);
    g.fillRect(3, 8, 10, 3);
    // Stone icon top-right
    g.fillStyle(0x777777);
    g.fillCircle(34, 7, 4);
    g.generateTexture('building_gathering', 40, 40);
    g.destroy();
  }

  _genRepairWorkshop() {
    const g = this.make.graphics({ add: false });
    // Base
    g.fillStyle(0x4A4A4A);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x666666);
    g.fillRect(2, 2, 36, 36);
    // Workbench
    g.fillStyle(0x8B4513);
    g.fillRect(6, 22, 28, 10);
    g.fillStyle(0xA0522D);
    g.fillRect(6, 20, 28, 4);
    // Wrench handle
    g.fillStyle(0xAAAAAA);
    g.fillRect(11, 6, 4, 16);
    // Wrench head
    g.fillStyle(0xCCCCCC);
    g.fillRect(8, 4, 10, 5);
    g.fillRect(8, 4, 3, 10);
    g.fillRect(15, 4, 3, 10);
    // Hammer
    g.fillStyle(0x888888);
    g.fillRect(23, 8, 3, 14);
    g.fillStyle(0xAAAAAA);
    g.fillRect(20, 6, 9, 5);
    // Green cross (repair symbol)
    g.fillStyle(0x44FF88);
    g.fillRect(3, 3, 6, 2);
    g.fillRect(5, 1, 2, 6);
    g.generateTexture('building_repair', 40, 40);
    g.destroy();
  }

  _genBarracks() {
    const g = this.make.graphics({ add: false });
    // Base (stone + earth)
    g.fillStyle(0x5a4a2a);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x7a6a3a);
    g.fillRect(2, 2, 36, 36);
    // Main building (darker stone walls)
    g.fillStyle(0x555555);
    g.fillRect(4, 12, 32, 24);
    g.fillStyle(0x666666);
    g.fillRect(5, 13, 30, 22);
    // Roof / crenellations
    g.fillStyle(0x444444);
    g.fillRect(4, 6, 7, 10);
    g.fillRect(14, 6, 7, 10);
    g.fillRect(24, 6, 7, 10);
    // Flag pole
    g.fillStyle(0x888888);
    g.fillRect(19, 2, 2, 12);
    // Flag (blue = friendly)
    g.fillStyle(0x2266CC);
    g.fillRect(21, 2, 8, 6);
    // Door
    g.fillStyle(0x3a2a0a);
    g.fillRect(16, 26, 8, 10);
    // Soldier icon (silhouette)
    g.fillStyle(0x1565C0, 0.9);
    g.fillRect(8, 15, 4, 9);
    g.fillRect(28, 15, 4, 9);
    g.generateTexture('building_barracks', 40, 40);
    g.destroy();
  }

  _genSoldierMelee() {
    const g = this.make.graphics({ add: false });
    // Body (teal/dark blue tunic — distinct from player blue)
    g.fillStyle(0x0B6B6B);
    g.fillRect(8, 10, 16, 16);
    // Head
    g.fillStyle(0xFFCC80);
    g.fillRect(10, 3, 12, 10);
    // Helmet (teal)
    g.fillStyle(0x095555);
    g.fillRect(8, 2, 16, 6);
    // Shield (left, small)
    g.fillStyle(0x4a2a00);
    g.fillRect(3, 10, 5, 12);
    g.fillStyle(0x886600);
    g.fillRect(4, 11, 3, 10);
    // Sword
    g.fillStyle(0xCCCCCC);
    g.fillRect(24, 8, 3, 14);
    g.fillStyle(0xAA8800);
    g.fillRect(22, 12, 7, 3);
    // Legs
    g.fillStyle(0x095555);
    g.fillRect(8, 26, 6, 6);
    g.fillRect(18, 26, 6, 6);
    g.generateTexture('soldier_melee', 32, 32);
    g.destroy();
  }

  _genSoldierRanged() {
    const g = this.make.graphics({ add: false });
    // Body (teal light cloak)
    g.fillStyle(0x1a7a7a);
    g.fillRect(8, 10, 14, 16);
    // Head
    g.fillStyle(0xFFCC80);
    g.fillRect(10, 3, 11, 10);
    // Hood (teal)
    g.fillStyle(0x0a5555);
    g.fillRect(8, 1, 15, 7);
    // Bow (right side)
    g.lineStyle(2, 0x8B5E3C);
    g.beginPath();
    g.moveTo(24, 4); g.lineTo(26, 16); g.strokePath();
    g.lineStyle(1, 0xCCCCCC);
    g.beginPath();
    g.moveTo(24, 4); g.lineTo(24, 16); g.strokePath();
    // Arrow
    g.fillStyle(0xCCCCCC);
    g.fillRect(24, 9, 8, 1);
    g.fillStyle(0x0066CC);
    g.fillRect(31, 8, 3, 3);
    // Legs
    g.fillStyle(0x0a5555);
    g.fillRect(8, 26, 6, 6);
    g.fillRect(16, 26, 6, 6);
    g.generateTexture('soldier_ranged', 32, 32);
    g.destroy();
  }

  _genMageTower() {
    const g = this.make.graphics({ add: false });
    // Base (dark stone)
    g.fillStyle(0x2a1a3a);
    g.fillRect(0, 0, 40, 40);
    g.fillStyle(0x3a2a4a);
    g.fillRect(2, 2, 36, 36);
    // Tower body (tall)
    g.fillStyle(0x4a3a5a);
    g.fillRect(8, 8, 24, 28);
    // Tower top (crenellations)
    g.fillStyle(0x3a2a4a);
    g.fillRect(6, 4, 7, 8);
    g.fillRect(16, 4, 7, 8);
    g.fillRect(27, 4, 7, 8);
    // Magic orb at top (glowing purple)
    g.fillStyle(0xCC44FF, 0.9);
    g.fillCircle(20, 6, 5);
    g.fillStyle(0xFFAAFF, 0.7);
    g.fillCircle(19, 5, 2);
    // Window slits (glowing)
    g.fillStyle(0x8800CC, 0.8);
    g.fillRect(16, 14, 8, 5);
    g.fillRect(16, 24, 8, 5);
    // Flag pole
    g.fillStyle(0x888888);
    g.fillRect(19, 0, 2, 8);
    // Purple flag
    g.fillStyle(0x8800AA);
    g.fillRect(21, 0, 7, 5);
    g.generateTexture('building_mage_tower', 40, 40);
    g.destroy();
  }

  _genAlliedMage() {
    const g = this.make.graphics({ add: false });
    // Robe (lighter purple/teal — distinct from enemy mage which is deep purple)
    g.fillStyle(0x3a5a7a);
    g.fillRect(8, 14, 16, 18);
    // Head
    g.fillStyle(0xFFD0A0);
    g.fillRect(10, 6, 12, 10);
    // Hat brim (teal)
    g.fillStyle(0x1a4a5a);
    g.fillRect(7, 8, 18, 4);
    // Hat cone
    g.fillStyle(0x1a4a5a);
    g.fillTriangle(10, 8, 22, 8, 16, 0);
    // Staff (lighter)
    g.fillStyle(0x7a8a14);
    g.fillRect(25, 6, 3, 22);
    // Magic orb — teal/green (friendly) instead of enemy blue
    g.fillStyle(0x00FFAA, 0.9);
    g.fillCircle(26, 5, 4);
    g.fillStyle(0xAAFFFF, 0.5);
    g.fillCircle(25, 4, 2);
    // Legs
    g.fillStyle(0x1a4a5a);
    g.fillRect(8, 32, 6, 4);
    g.fillRect(18, 32, 6, 4);
    g.generateTexture('allied_mage', 32, 36);
    g.destroy();
  }

  _genFarm() {
    const g = this.make.graphics({ add: false });
    // Soil background
    g.fillStyle(0x8B5E3C);
    g.fillRect(0, 0, 40, 40);
    // Light soil fill
    g.fillStyle(0xA0724A);
    g.fillRect(2, 2, 36, 36);
    // Crop rows (3 rows of wheat stalks)
    g.fillStyle(0x4a7a1a);
    for (let row = 0; row < 3; row++) {
      const ry = 7 + row * 11;
      for (let col = 0; col < 5; col++) {
        const cx = 5 + col * 7;
        g.fillRect(cx, ry + 3, 2, 6);   // stalk
        g.fillStyle(0xDDB830);
        g.fillRect(cx - 1, ry, 4, 4);   // grain head
        g.fillStyle(0x4a7a1a);
      }
    }
    // Fence border
    g.lineStyle(2, 0x7B4A1A, 1);
    g.strokeRect(1, 1, 38, 38);
    g.generateTexture('building_farm', 40, 40);
    g.destroy();
  }

  _genChest() {
    const g = this.make.graphics({ add: false });
    // Body — dark brown wood
    g.fillStyle(0x5C3A1E);
    g.fillRect(3, 6, 26, 20);
    // Lid — lighter brown
    g.fillStyle(0x7A4F2A);
    g.fillRect(3, 3, 26, 10);
    // Gold rim border
    g.lineStyle(2, 0xFFCC00, 1);
    g.strokeRect(3, 3, 26, 23);
    // Gold latch
    g.fillStyle(0xFFCC00);
    g.fillRect(12, 11, 8, 6);
    g.fillStyle(0xFFEE44);
    g.fillRect(14, 12, 4, 4);
    // Corner bolts
    g.fillStyle(0xFFCC00);
    g.fillRect(4, 4, 4, 4);
    g.fillRect(24, 4, 4, 4);
    g.fillRect(4, 22, 4, 4);
    g.fillRect(24, 22, 4, 4);
    g.generateTexture('chest', 32, 32);
    g.destroy();
  }

  _genPlayerWarrior() {
    const g = this.make.graphics({ add: false });
    // Body — dark red armor
    g.fillStyle(0x8B2200);
    g.fillRect(7, 10, 18, 16);
    // Chest highlight
    g.fillStyle(0xCC4422);
    g.fillRect(10, 12, 8, 8);
    // Head — skin
    g.fillStyle(0xFFCC80);
    g.fillRect(10, 3, 12, 9);
    // Helmet — silver
    g.fillStyle(0xCCCCCC);
    g.fillRect(8, 1, 16, 7);
    // Helmet plume — red
    g.fillStyle(0xFF2200);
    g.fillRect(13, 0, 4, 3);
    // Shield — left side
    g.fillStyle(0x8B2200);
    g.fillRect(2, 11, 6, 12);
    g.fillStyle(0xCCCCCC);
    g.fillRect(3, 14, 4, 6);
    // Sword — right
    g.fillStyle(0xCCCCCC);
    g.fillRect(25, 8, 3, 14);
    g.fillStyle(0xAA8800);
    g.fillRect(23, 12, 7, 3);
    // Legs
    g.fillStyle(0x5A1500);
    g.fillRect(7, 26, 7, 6);
    g.fillRect(18, 26, 7, 6);
    g.generateTexture('player_warrior', 32, 32);
    g.destroy();
  }

  _genPlayerMage() {
    const g = this.make.graphics({ add: false });
    // Robes — purple
    g.fillStyle(0x5511AA);
    g.fillRect(7, 12, 18, 16);
    // Robe highlight
    g.fillStyle(0x7733CC);
    g.fillRect(12, 14, 6, 10);
    // Head — skin
    g.fillStyle(0xFFCC80);
    g.fillRect(10, 5, 12, 9);
    // Pointed hat — dark purple
    g.fillStyle(0x220055);
    g.fillRect(8, 0, 16, 7);
    g.fillStyle(0x330077);
    g.fillRect(11, 0, 10, 5);
    // Hat tip
    g.fillStyle(0x220055);
    g.fillRect(13, 0, 6, 3);
    // Staff — brown
    g.fillStyle(0x7A4A1E);
    g.fillRect(25, 6, 3, 22);
    // Orb on staff — glowing purple
    g.fillStyle(0xCC44FF);
    g.fillRect(23, 4, 7, 7);
    g.fillStyle(0xFF88FF);
    g.fillRect(25, 5, 3, 3);
    // Legs
    g.fillStyle(0x330088);
    g.fillRect(8, 28, 6, 4);
    g.fillRect(18, 28, 6, 4);
    g.generateTexture('player_mage', 32, 32);
    g.destroy();
  }

  _genPlayerPrincess() {
    const g = this.make.graphics({ add: false });
    // Dress — rose pink
    g.fillStyle(0xFF88CC);
    g.fillRect(6, 14, 20, 14);
    // Dress skirt — wider at bottom
    g.fillStyle(0xFF66BB);
    g.fillRect(4, 22, 24, 8);
    // Dress highlight
    g.fillStyle(0xFFAADD);
    g.fillRect(11, 16, 5, 8);
    // Head — skin
    g.fillStyle(0xFFCC80);
    g.fillRect(10, 5, 12, 10);
    // Hair — golden blonde
    g.fillStyle(0xFFDD44);
    g.fillRect(9, 4, 14, 5);
    g.fillRect(9, 9, 3, 6);   // left side hair
    g.fillRect(20, 9, 3, 6);  // right side hair
    // Crown — gold
    g.fillStyle(0xFFCC00);
    g.fillRect(10, 1, 12, 5);
    // Crown points
    g.fillStyle(0xFFDD44);
    g.fillRect(10, 0, 3, 4);
    g.fillRect(14, 0, 4, 3);
    g.fillRect(19, 0, 3, 4);
    // Crown gem — ruby
    g.fillStyle(0xFF2244);
    g.fillRect(15, 1, 2, 2);
    // Scepter — gold
    g.fillStyle(0xCCAA00);
    g.fillRect(25, 8, 3, 20);
    // Scepter orb — pink glowing
    g.fillStyle(0xFF44AA);
    g.fillRect(23, 5, 7, 7);
    g.fillStyle(0xFF88DD);
    g.fillRect(25, 6, 3, 3);
    // Shoes
    g.fillStyle(0x884466);
    g.fillRect(8, 30, 5, 2);
    g.fillRect(19, 30, 5, 2);
    g.generateTexture('player_princess', 32, 32);
    g.destroy();
  }

  _genPlayerBanner() {
    const g = this.make.graphics({ add: false });
    // Body — dark military gold uniform
    g.fillStyle(0xAA8800);
    g.fillRect(8, 13, 16, 13);
    // Uniform accent stripe
    g.fillStyle(0xCCAA00);
    g.fillRect(11, 15, 3, 8);
    g.fillRect(18, 15, 3, 8);
    // Head — skin
    g.fillStyle(0xFFCC80);
    g.fillRect(10, 4, 12, 10);
    // Helmet — dark gold
    g.fillStyle(0x886600);
    g.fillRect(9, 2, 14, 5);
    g.fillStyle(0xAA8800);
    g.fillRect(8, 6, 16, 3);
    // Helmet plume — red
    g.fillStyle(0xCC2200);
    g.fillRect(14, 0, 4, 5);
    // Banner pole — brown
    g.fillStyle(0x6B3A1E);
    g.fillRect(25, 0, 3, 30);
    // Banner flag — red background
    g.fillStyle(0xBB1100);
    g.fillRect(25, 0, 7, 10);
    // Banner flag — gold cross/emblem
    g.fillStyle(0xFFCC00);
    g.fillRect(26, 2, 5, 2);
    g.fillRect(28, 1, 2, 5);
    // Legs — dark gold trousers
    g.fillStyle(0x775500);
    g.fillRect(8, 26, 7, 6);
    g.fillRect(17, 26, 7, 6);
    g.generateTexture('player_banner', 32, 32);
    g.destroy();
  }

  _genGranary() {
    const g = this.make.graphics({ add: false });
    // Golden-brown wooden silo
    g.fillStyle(0x8B5E3C);
    g.fillRect(6, 8, 20, 22);   // main body
    g.fillStyle(0x6B3F1F);
    g.fillRect(6, 8, 20, 4);    // dark roof band
    g.fillStyle(0xA0723A);
    g.fillRect(4, 6, 24, 4);    // roof
    g.fillStyle(0xC8A464);
    g.fillRect(10, 12, 4, 18);  // vertical plank
    g.fillRect(18, 12, 4, 18);  // vertical plank
    g.fillStyle(0xFFCC44);
    g.fillRect(11, 20, 10, 6);  // door (golden)
    g.fillStyle(0x4A2A0A);
    g.fillRect(6, 28, 20, 2);   // base shadow
    g.generateTexture('building_granary', 32, 32);
    g.destroy();
  }

  _genCastle() {
    const g = this.make.graphics({ add: false });
    // Stone castle — 48x48 so it's visibly larger
    g.fillStyle(0x888888);
    g.fillRect(0, 8, 48, 40);    // main walls
    g.fillStyle(0x666666);
    g.fillRect(0, 8, 48, 6);     // battlement base
    // Battlements (merlons)
    for (let i = 0; i < 5; i++) {
      g.fillRect(i * 10, 0, 6, 10);
    }
    g.fillStyle(0x555555);
    g.fillRect(12, 20, 24, 28);  // inner keep
    g.fillStyle(0x222222);
    g.fillRect(18, 30, 12, 18);  // gate
    g.fillStyle(0xAA8833);
    g.fillRect(19, 31, 10, 17);  // gate interior
    // Tower corners
    g.fillStyle(0x777777);
    g.fillRect(0, 8, 10, 40);
    g.fillRect(38, 8, 10, 40);
    g.fillStyle(0x999999, 0.4);
    g.fillRect(2, 14, 6, 4);     // arrow slit left
    g.fillRect(40, 14, 6, 4);    // arrow slit right
    g.generateTexture('building_castle', 48, 48);
    g.destroy();
  }

  _genBuildingWall() {
    const g = this.make.graphics({ add: false });
    // Stone wall base
    g.fillStyle(0x888888);
    g.fillRect(0, 0, 40, 40);
    // Stone block pattern
    g.fillStyle(0x666666);
    g.fillRect(1, 1, 18, 18);
    g.fillRect(21, 1, 18, 18);
    g.fillRect(1, 21, 18, 18);
    g.fillRect(21, 21, 18, 18);
    // Mortar lines
    g.fillStyle(0xAAAAAA, 0.5);
    g.fillRect(0, 19, 40, 2);
    g.fillRect(19, 0, 2, 40);
    // Top edge highlight
    g.fillStyle(0x999999);
    g.fillRect(0, 0, 40, 3);
    g.fillRect(0, 0, 3, 40);
    // Dark edge shadow
    g.fillStyle(0x444444);
    g.fillRect(37, 0, 3, 40);
    g.fillRect(0, 37, 40, 3);
    g.generateTexture('building_wall', 40, 40);
    g.destroy();
  }

  _genBuildingTower() {
    const g = this.make.graphics({ add: false });
    // Tower base
    g.fillStyle(0x777777);
    g.fillRect(4, 20, 24, 28);
    // Tower top
    g.fillStyle(0x888888);
    g.fillRect(0, 8, 32, 16);
    // Battlements
    g.fillStyle(0x666666);
    g.fillRect(0, 0, 7, 12);
    g.fillRect(9, 0, 7, 12);
    g.fillRect(18, 0, 7, 12);
    g.fillRect(27, 0, 5, 12);
    // Arrow slit
    g.fillStyle(0x222222);
    g.fillRect(13, 12, 6, 10);
    // Base highlight
    g.fillStyle(0xAAAAAA, 0.4);
    g.fillRect(4, 20, 3, 28);
    g.fillRect(4, 20, 24, 3);
    // Dark shadow
    g.fillStyle(0x444444);
    g.fillRect(25, 20, 3, 28);
    g.generateTexture('building_tower', 32, 48);
    g.destroy();
  }
}
