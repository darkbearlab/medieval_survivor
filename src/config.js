export const CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  WORLD_WIDTH: 2560,
  WORLD_HEIGHT: 2560,

  PLAYER: {
    SPEED: 180,
    HP: 100,
    ATTACK_RANGE: 260,
    ATTACK_RATE: 800,   // ms between auto-attacks
    AGGRO_RANGE: 160,   // enemy targets player if within this range
  },

  AUTO_COLLECT: {
    TIME: 800,   // ms to auto-collect (single nearest node only)
  },

  BUILDING_GRID: 40,  // snap grid size for building placement

  TOWN_CENTER: {
    HP: 500,
    X: 1280,
    Y: 1280,
    RADIUS: 40,         // distance for enemy to stop and attack
  },

  RESOURCES: {
    COLLECT_RANGE: 90,
    TREE_COUNT: 28,
    STONE_COUNT: 18,
    TREE_YIELD: 5,
    STONE_YIELD: 3,
    RESPAWN_TIME: 20000,
  },

  WAVES: {
    PREP_TIME: 30,      // seconds before first wave
    BETWEEN_TIME: 15,   // seconds between waves
  },

  ENEMIES: {
    BANDIT: {
      HP: 60, SPEED: 70, DAMAGE: 8, ATTACK_RATE: 1500, GOLD_REWARD: 5,
      TEXTURE: 'enemy_bandit',
    },
    ARCHER: {
      HP: 30, SPEED: 90, DAMAGE: 10, ATTACK_RATE: 2000, GOLD_REWARD: 8,
      TEXTURE: 'enemy_archer',
      RANGE: 300,        // ranged attack radius
      KEEP_MIN: 150,     // minimum distance to player (backs away if closer)
    },
    HEAVY: {
      HP: 220, SPEED: 42, DAMAGE: 12, ATTACK_RATE: 2200, GOLD_REWARD: 15,
      TEXTURE: 'enemy_heavy',
      BUILDING_DAMAGE: 32,  // damage dealt to walls/towers
    },
  },

  TERRAIN: {
    ROCK_CLUSTERS: [
      { gx: 6,  gy: 6  }, { gx: 55, gy: 6  },
      { gx: 6,  gy: 55 }, { gx: 55, gy: 55 },
      { gx: 30, gy: 7  }, { gx: 30, gy: 54 },
      { gx: 7,  gy: 30 }, { gx: 54, gy: 30 },
    ],
  },

  PROJECTILE: {
    SPEED: 420,
    DAMAGE: 25,
    LIFESPAN: 2200,
  },

  BUILDINGS: {
    WALL: {
      COST: { wood: 8 },
      HP: 100,
      UPGRADE: {
        2: { COST: { wood: 5, stone: 8 }, HP_BONUS: 100 },
      },
    },
    TOWER: {
      COST: { wood: 10, stone: 5 },
      HP: 80,
      RANGE: 200,
      ATTACK_RATE: 1000,
      DAMAGE: 20,
      UPGRADE: {
        2: { COST: { wood: 8, stone: 10 }, RANGE: 280, ATTACK_RATE: 700 },
      },
    },
    BLACKSMITH: {
      COST: { wood: 15, stone: 10 },
      HP: 120,
      DEFENSE_BONUS: 5,
    },
    TRAINING_GROUND: {
      COST: { wood: 12, stone: 8 },
      HP: 100,
      ATTACK_BONUS: 10,
    },
  },
};
