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
