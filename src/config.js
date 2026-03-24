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
  },

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
      HP: 60,
      SPEED: 70,
      DAMAGE: 8,
      ATTACK_RATE: 1500,
      GOLD_REWARD: 5,
    },
  },

  PROJECTILE: {
    SPEED: 420,
    DAMAGE: 25,
    LIFESPAN: 2200,
  },
};
