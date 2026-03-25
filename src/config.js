export const CONFIG = { // mutable — runtime balance tweaks modify this directly
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
    SPAWN_MULT: 1.0,    // multiplies total enemy count per wave
  },

  EXCHANGE: {
    WOOD_PER_GOLD:  2,  // wood units bought per 1 gold
    STONE_PER_GOLD: 1,  // stone units bought per 1 gold
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
    MAGE: {
      HP: 45, SPEED: 65, DAMAGE: 18, ATTACK_RATE: 2800, GOLD_REWARD: 14,
      TEXTURE: 'enemy_mage',
      RANGE: 280,
      KEEP_MIN: 140,
      EXPLOSION_RADIUS: 65,
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
    CAFETERIA: {
      COST: { wood: 10, stone: 5 },
      HP: 90,
      HEAL_RANGE: 100,
      HEAL_RATE: 3,   // HP per second
    },
    GATHERING_POST: {
      COST: { wood: 12, stone: 8 },
      HP: 80,
      RANGE: 130,         // collect radius
      COLLECT_RATE: 800,  // ms per node
    },
    REPAIR_WORKSHOP: {
      COST: { wood: 14, stone: 10 },
      HP: 85,
      SCAN_RATE: 3000,  // ms between target re-scans
      REPAIR_RATE: 8,   // HP restored per second
    },
  },
};

// ── Runtime balance tuning ────────────────────────────────────────────────────

// fmt(v): optional display formatter; if omitted, String(v) is used
export const BALANCE_SETTINGS = [
  // ── 玩家 ──────────────────────────────────────────────────────────────────
  { label: '玩家 HP',       path: ['PLAYER',   'HP'],                  min: 50,   max: 300,   step: 10,   def: 100   },
  { label: '玩家速度',      path: ['PLAYER',   'SPEED'],               min: 80,   max: 300,   step: 10,   def: 180   },
  { label: '玩家攻擊力',    path: ['PROJECTILE','DAMAGE'],             min: 5,    max: 100,   step: 5,    def: 25    },
  { label: '玩家攻擊射程',  path: ['PLAYER',   'ATTACK_RANGE'],        min: 100,  max: 500,   step: 20,   def: 260   },
  { label: '攻擊間隔ms',   path: ['PLAYER',   'ATTACK_RATE'],          min: 200,  max: 2000,  step: 100,  def: 800   },
  // ── 敵人 ──────────────────────────────────────────────────────────────────
  { label: '強盜 HP',       path: ['ENEMIES',  'BANDIT', 'HP'],        min: 20,   max: 200,   step: 10,   def: 60    },
  { label: '強盜速度',      path: ['ENEMIES',  'BANDIT', 'SPEED'],     min: 30,   max: 150,   step: 10,   def: 70    },
  { label: '弓箭手 HP',     path: ['ENEMIES',  'ARCHER', 'HP'],        min: 10,   max: 100,   step: 5,    def: 30    },
  { label: '弓箭手射程',    path: ['ENEMIES',  'ARCHER', 'RANGE'],     min: 100,  max: 500,   step: 20,   def: 300   },
  { label: '重甲 HP',       path: ['ENEMIES',  'HEAVY',  'HP'],        min: 50,   max: 500,   step: 25,   def: 220   },
  // ── (敵人 cont.) ──────────────────────────────────────────────────────────
  { label: '法師 HP',       path: ['ENEMIES',  'MAGE',   'HP'],        min: 10,   max: 100,   step: 5,    def: 45    },
  { label: '法師射程',      path: ['ENEMIES',  'MAGE',   'RANGE'],     min: 100,  max: 500,   step: 20,   def: 280   },
  // ── 波次 ──────────────────────────────────────────────────────────────────
  { label: '準備時間s',     path: ['WAVES',    'PREP_TIME'],            min: 10,   max: 60,    step: 5,    def: 30    },
  { label: '波次間隔s',     path: ['WAVES',    'BETWEEN_TIME'],         min: 5,    max: 30,    step: 5,    def: 15    },
  { label: '生成倍率',      path: ['WAVES',    'SPAWN_MULT'],           min: 0.5,  max: 3.0,   step: 0.1,  def: 1.0,  fmt: v => v.toFixed(1) + '×' },
  // ── 資源 ──────────────────────────────────────────────────────────────────
  { label: '資源重生ms',    path: ['RESOURCES','RESPAWN_TIME'],         min: 5000, max: 60000, step: 5000, def: 20000 },
  { label: '木材獲取量',    path: ['RESOURCES','TREE_YIELD'],           min: 1,    max: 20,    step: 1,    def: 5     },
  { label: '石材獲取量',    path: ['RESOURCES','STONE_YIELD'],          min: 1,    max: 20,    step: 1,    def: 3     },
  // ── 金幣匯率 ──────────────────────────────────────────────────────────────
  { label: '1金=N木材',     path: ['EXCHANGE', 'WOOD_PER_GOLD'],        min: 0.5,  max: 10,    step: 0.5,  def: 2,    fmt: v => v.toFixed(1) },
  { label: '1金=N石材',     path: ['EXCHANGE', 'STONE_PER_GOLD'],       min: 0.5,  max: 10,    step: 0.5,  def: 1,    fmt: v => v.toFixed(1) },
];

export function getConfigValue(path) {
  let obj = CONFIG;
  for (const key of path) obj = obj[key];
  return obj;
}

export function setConfigValue(path, value) {
  let obj = CONFIG;
  for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
  obj[path[path.length - 1]] = value;
}

export function resetConfig() {
  for (const s of BALANCE_SETTINGS) setConfigValue(s.path, s.def);
}
