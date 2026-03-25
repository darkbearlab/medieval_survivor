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
