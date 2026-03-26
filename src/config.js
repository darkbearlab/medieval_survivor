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
      RANGE: 300,           // ranged attack radius
      KEEP_MIN: 150,        // minimum distance to player/soldier (backs away if closer)
      BUILDING_DAMAGE: 3,   // reduced damage when firing at buildings
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
    BARRACKS: {
      COST: { wood: 15, stone: 12 },
      HP: 120,
      UPGRADE: {
        2: { COST: { wood: 12, stone: 15 }, HP_BONUS: 60 },
      },
    },
    MAGE_TOWER: {
      COST: { wood: 20, stone: 15 },
      HP: 100,
      UPGRADE: {
        2: { COST: { wood: 15, stone: 20 }, HP_BONUS: 50 },
      },
    },
    FARM: {
      COST: { wood: 6 },
      FOOD_YIELD: 10,     // food added per harvest
      REGEN_TIME: 15000,  // ms to regenerate after harvest
    },
  },

  FOOD: {
    SOLDIER_COST: 5,  // food consumed per soldier spawn
    MAGE_COST:    8,  // food consumed per allied mage spawn
  },

  BOSS: {
    SPAWN_INTERVAL: 300, // seconds between boss spawns (5 minutes)
    HP_MULT:        5,
    DAMAGE_MULT:    2.5,
    SPEED_MULT:     0.85,
    SCALE:          2.0,
    LOOT: { wood: 20, stone: 15, gold: 25 },
  },

  GAME_MODES: {
    TIMED: {
      DURATION: 720,   // seconds (12 minutes) — adjust here to change timed mode length
    },
  },

  SOLDIERS: {
    LEASH_RANGE: 200,   // max distance from barracks before retreating
    SPAWN_RATE: 8000,   // ms between soldier spawns
    LEVEL: {
      1: { MAX: 2, TYPE: 'melee' },
      2: { MAX: 4, TYPE: 'mixed' },  // 2 melee + 2 ranged
    },
    MELEE: {
      HP: 80, SPEED: 70, DAMAGE: 12, ATTACK_RATE: 1500, RANGE: 75,
    },
    RANGED: {
      HP: 50, SPEED: 65, DAMAGE: 15, ATTACK_RATE: 2000,
      RANGE: 220, KEEP_MIN: 100,
    },
  },

  ALLIED_MAGES: {
    LEASH_RANGE: 200,
    SPAWN_RATE: 12000,   // slower than soldiers — mages are powerful
    LEVEL: {
      1: { MAX: 1 },
      2: { MAX: 2 },
    },
    HP: 40, SPEED: 60, DAMAGE: 15, ATTACK_RATE: 3000,
    RANGE: 260, KEEP_MIN: 120,
    EXPLOSION_RADIUS: 60,
  },

  CHARACTERS: {
    warrior: {
      name:        '戰士',
      tagline:     '鐵壁防禦・近距爆發',
      lore:        '重甲加身，以鋼鐵意志守護村莊',
      HP:          180,
      SPEED:       155,
      ATTACK_RANGE: 140,
      ATTACK_RATE:  950,
      DAMAGE_MULT:  1.5,
      DEFENSE_PCT:  0.30,
      AOE:          false,
      AOE_RADIUS:   0,
      TEXTURE:     'player_warrior',
      ACCENT:      0xCC3311,
    },
    ranger: {
      name:        '遊俠',
      tagline:     '均衡全能・靈活機動',
      lore:        '身手矯健，遊走於戰場每個角落',
      HP:          100,
      SPEED:       180,
      ATTACK_RANGE: 260,
      ATTACK_RATE:  800,
      DAMAGE_MULT:  1.0,
      DEFENSE_PCT:  0,
      AOE:          false,
      AOE_RADIUS:   0,
      TEXTURE:     'player',
      ACCENT:      0x229944,
    },
    mage: {
      name:        '法師',
      tagline:     '命中爆破・AoE 傷害',
      lore:        '每一記攻擊皆引發魔法爆破',
      HP:          75,
      SPEED:       130,
      ATTACK_RANGE: 240,
      ATTACK_RATE:  1300,
      DAMAGE_MULT:  0.9,
      DEFENSE_PCT:  0,
      AOE:          true,
      AOE_RADIUS:   80,
      TEXTURE:     'player_mage',
      ACCENT:      0x8822EE,
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
  // ── 糧食系統 ──────────────────────────────────────────────────────────────
  { label: '農田產糧量',    path: ['BUILDINGS', 'FARM', 'FOOD_YIELD'],  min: 2,    max: 30,    step: 2,    def: 10    },
  { label: '士兵糧食消耗',  path: ['FOOD', 'SOLDIER_COST'],             min: 0,    max: 30,    step: 1,    def: 5     },
  { label: '法師糧食消耗',  path: ['FOOD', 'MAGE_COST'],                min: 0,    max: 30,    step: 1,    def: 8     },
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
