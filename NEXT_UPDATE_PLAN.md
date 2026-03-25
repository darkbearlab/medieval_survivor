# Next Update Plan — Phase 5：採集所 + 維修工

> ⚠️ **範圍說明**：本次更新（Phase 5）僅實作 **採集所** 與 **維修工** 兩棟建築。
> 兵營 + 士兵系統因實作複雜度過高，已移至 **Phase 6（獨立規劃）**，
> 完整設計保留在本文件末尾的 Appendix。

---

## Codebase Quick Reference

| Pattern | Where to look |
|---|---|
| Building template | `src/entities/buildings/Blacksmith.js` |
| Building with update loop | `src/entities/buildings/Tower.js` |
| Auto-collect loop | `GameScene._updateAutoCollect()` |
| Resource node | `src/entities/ResourceNode.js` — `collect(economy)` |
| Physics groups setup | `GameScene.create()` lines 33-44 |
| Collision setup | `GameScene.create()` lines 104-144 |
| Building placement | `BuildingSystem.tryPlace()` |
| Build menu entries | `src/ui/BuildMenu.js` defs array |
| Upgrade panel | `src/ui/UpgradePanel.js` — `_refresh()`, nameMap |

---

## Feature 1 — 採集所 (Gathering Post)

### Behaviour
Automatically collects any respawned resource node within its range, as if the player
were standing there. Frees the player from manual gathering near the post.

### Config to add (`config.js` → `BUILDINGS`)
```js
GATHERING_POST: {
  COST: { wood: 12, stone: 8 },
  HP: 80,
  RANGE: 130,          // collect radius (RESOURCES.COLLECT_RANGE = 90; give a bit extra)
  COLLECT_RATE: 800,   // ms per node (same as AUTO_COLLECT.TIME)
}
```

### New file: `src/entities/buildings/GatheringPost.js`
- Standard building skeleton (copy Blacksmith.js, remove player bonus logic)
- `type = 'gathering'`
- Fields: `range`, `collectRate`, `collectProgress = new Map()` (ResourceNode → ms accumulated)
- Add `update(delta, economy, resourceNodes)` method:
  ```js
  update(delta, economy, resourceNodes) {
    let collected = false;
    for (const node of resourceNodes) {
      if (node.depleted) { this.collectProgress.delete(node); continue; }
      const dist = Phaser.Math.Distance.Between(this.x, this.y, node.x, node.y);
      if (dist > this.range) { this.collectProgress.delete(node); continue; }
      const prev = this.collectProgress.get(node) || 0;
      const next = prev + delta;
      if (next >= this.collectRate) {
        this.collectProgress.delete(node);
        node.collect(economy);
        collected = true;
      } else {
        this.collectProgress.set(node, next);
      }
    }
    return collected;  // caller emits resources_updated if true
  }
  ```
- `_destroy()`: standard pattern, remove from `scene.gatheringGroup` and `buildingSystem.gatheringPosts`
- HP bar: green colour scheme

### Changes to `GameScene.js`
1. Add `this.gatheringGroup = this.physics.add.staticGroup()` in `create()`
2. Enemy collider: `this.physics.add.collider(this.enemies, this.gatheringGroup, this._onEnemyHitSmithOrTraining, null, this)`
3. Player collider: `this.physics.add.collider(this.player.sprite, this.gatheringGroup)`
4. Archer proj overlap: `this.physics.add.overlap(this.enemyProjectiles, this.gatheringGroup, this._onEnemyProjHitBuilding, null, this)`
5. Mage proj overlap: `this.physics.add.overlap(this.mageProjectiles, this.gatheringGroup, this._onMageProjHitBuilding, null, this)`
6. Add `gatheringPost` to `_tryClickBuilding` check list
7. In `update(time, delta)` — add gathering post update loop:
   ```js
   let gpCollected = false;
   for (const gp of this.buildingSystem.gatheringPosts) {
     if (!gp.dead) {
       if (gp.update(delta, this.economy, this.resourceNodes)) gpCollected = true;
     }
   }
   if (gpCollected) EventBus.emit('resources_updated', this.economy.resources);
   ```

### Changes to `BuildingSystem.js`
- Import `GatheringPost`
- Add `this.gatheringPosts = []`
- Add `'gathering': 'GATHERING_POST'` to typeKeyMap
- Add `'gathering': 'building_gathering'` to texMap
- Add placement branch:
  ```js
  } else if (this.placingType === 'gathering') {
    const gp = new GatheringPost(this.scene, worldX, worldY);
    this.gatheringPosts.push(gp);
    this.scene.gatheringGroup.add(gp.sprite);
    gp.sprite.refreshBody();
  }
  ```

### Texture: `_genGatheringPost()` in `BootScene.js`
```js
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
```

### BuildMenu entry
```js
{
  type: 'gathering',
  name: '採集所',
  desc: '自動收集範圍內資源',
  costText: '木材×12  石材×8',
  cost: CONFIG.BUILDINGS.GATHERING_POST.COST,
}
```
Also increase `panelH` from 460 → 540 to fit the 6th button.

### UpgradePanel
- `nameMap`: add `gathering: '採集所'`
- `statsText` branch: `採集範圍 ${b.range}  速率 ${b.collectRate}ms`
- `typeKeyMap`/`typeKeyMap2`: add `gathering: 'GATHERING_POST'`

---

## Feature 2 — 維修工 (Repair Workshop)

### Behaviour
Periodically scans all buildings (excluding TownCenter) for the one with the lowest
HP percentage. Slowly restores its HP and shows a floating repair indicator above it.

### Config to add (`config.js` → `BUILDINGS`)
```js
REPAIR_WORKSHOP: {
  COST: { wood: 14, stone: 10 },
  HP: 85,
  SCAN_RATE: 3000,    // ms between target re-scans
  REPAIR_RATE: 8,     // HP restored per second
}
```

### New file: `src/entities/buildings/RepairWorkshop.js`
- Standard building skeleton (`type = 'repair'`)
- Fields: `repairRate`, `scanRate`, `lastScan = 0`, `target = null`, `_lastParticle = 0`
- Add `update(time, delta, buildingSystem)` method:
  ```js
  update(time, delta, buildingSystem) {
    // Re-scan periodically
    if (time - this.lastScan > this.scanRate) {
      this.lastScan = time;
      this.target = this._findLowestHpBuilding(buildingSystem);
    }
    if (this.target && !this.target.dead && this.target.hp < this.target.maxHp) {
      this.target.hp = Math.min(this.target.maxHp, this.target.hp + this.repairRate * delta / 1000);
      this.target._drawHpBar();
      this._showRepairParticle(time);
    } else {
      this.target = null;
    }
  }

  _findLowestHpBuilding(bs) {
    let best = null, bestPct = 1;
    const lists = [bs.walls, bs.towers, bs.smiths, bs.trainingGrounds,
                   bs.cafeterias, bs.gatheringPosts, bs.repairWorkshops];
    for (const list of lists) {
      for (const b of list) {
        if (b.dead || b === this) continue;
        const pct = b.hp / b.maxHp;
        if (pct < bestPct) { best = b; bestPct = pct; }
      }
    }
    return best;
  }

  _showRepairParticle(time) {
    if (time - this._lastParticle < 1000 || !this.target) return;
    this._lastParticle = time;
    const t = this.scene.add.text(this.target.x, this.target.y - 30,
      `+${this.repairRate}`, {
        fontSize: '14px', color: '#44FF88',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: t, y: this.target.y - 60, alpha: 0,
      duration: 900, onComplete: () => t.destroy(),
    });
  }
  ```
- `_destroy()`: standard pattern (repairGroup, buildingSystem.repairWorkshops)

### Changes to `GameScene.js`
1. Add `this.repairGroup = this.physics.add.staticGroup()` in `create()`
2. Standard enemy collider, player collider, archer/mage proj overlaps (same pattern as others)
3. Add `repairWorkshop` to `_tryClickBuilding`
4. In `update(time, delta)`:
   ```js
   for (const rw of this.buildingSystem.repairWorkshops) {
     if (!rw.dead) rw.update(time, delta, this.buildingSystem);
   }
   ```

### Changes to `BuildingSystem.js`
- Import `RepairWorkshop`
- Add `this.repairWorkshops = []`
- Add `'repair': 'REPAIR_WORKSHOP'` to typeKeyMap
- Add `'repair': 'building_repair'` to texMap
- Add placement branch for `'repair'`

### Texture: `_genRepairWorkshop()` in `BootScene.js`
```js
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
```

### BuildMenu entry
```js
{
  type: 'repair',
  name: '維修工',
  desc: '自動修復最低耐久建築',
  costText: '木材×14  石材×10',
  cost: CONFIG.BUILDINGS.REPAIR_WORKSHOP.COST,
}
```
`panelH` needs to reach 540 (7th button at i=6: py+80+6×72 = py+512, within 540).

### UpgradePanel
- `nameMap`: add `repair: '維修工'`
- `statsText` branch: `修復速度 ${b.repairRate}HP/s`
- `typeKeyMap`/`typeKeyMap2`: add `repair: 'REPAIR_WORKSHOP'`

---

## Implementation Order

1. **採集所 GatheringPost** — least complex; no new entity type, just extends resource loop
2. **維修工 RepairWorkshop** — scans existing building arrays; medium complexity

---

## Files Changed Summary (Phase 5 Only)

| File | Change |
|---|---|
| `config.js` | Add GATHERING_POST, REPAIR_WORKSHOP |
| `BootScene.js` | Add `_genGatheringPost()`, `_genRepairWorkshop()` |
| `entities/buildings/GatheringPost.js` | **NEW** |
| `entities/buildings/RepairWorkshop.js` | **NEW** |
| `systems/BuildingSystem.js` | Import + arrays + placement for 2 new types |
| `scenes/GameScene.js` | 2 new static groups, colliders, update hooks, _tryClickBuilding |
| `ui/BuildMenu.js` | 2 new entries, panelH 460 → 540 |
| `ui/UpgradePanel.js` | nameMap + statsText + typeKeyMap for 2 new types |

---

## Notes & Gotchas

- **BuildMenu panel height**: Currently 460 (5 items × 72px + 80 base). With 7 items: `80 + 6×72 = 512`; panelH needs **540** to fit hint text at bottom.
- **GatheringPost resources_updated**: Only emit after a collect happens (use the return value), not every frame.
- **RepairWorkshop target scan**: Reset `this.target = null` when target fully healed or dead; let the next scan pick a new target.
- **RepairWorkshop in its own list**: `_findLowestHpBuilding` must search `bs.repairWorkshops` too (so a damaged repair workshop can be repaired by a second one), but skip `b === this`.
- **No new physics patterns needed**: Both features use staticGroup (same as all other buildings). No dynamic sprites.

---
---

# Appendix — Phase 6：兵營 + 士兵系統 (Barracks + Soldiers)

> ⛔ **本 Phase 不在 Phase 5 範圍內。** 規劃保留於此供下次開發接手。
> 兵營功能複雜度高：全新 Soldier 實體 AI（idle/following/leash 狀態機）、
> Barracks 定時生成邏輯、UpgradePanel 新增部署按鈕，建議獨立一個 Phase 實作。

## Overview
- Barracks accumulates soldiers over time (up to a level-based cap).
- Soldiers sit idle near the barracks until the player "deploys" them (pays gold).
- Deployed soldiers follow the player, fight nearby enemies, and die permanently.
- Each soldier randomly decides its combat style at spawn: **melee** or **ranged**.
- Soldiers leash back to the player if they drift too far.

---

## Config (`config.js`)

```js
// In BUILDINGS:
BARRACKS: {
  COST: { wood: 18, stone: 12 },
  HP: 110,
  SPAWN_RATE: 15000,      // ms between new soldier spawns
  UPGRADE: {
    2: { COST: { wood: 15, stone: 18, gold: 30 }, SPAWN_RATE: 10000 },
  },
},

// Top-level:
SOLDIERS: {
  LEVEL: {
    1: { MAX: 2,  DEPLOY_COST: 20, HP: 60,  DAMAGE: 12, SPEED: 110, ATTACK_RATE: 1400, RANGE: 240, AGGRO: 160 },
    2: { MAX: 4,  DEPLOY_COST: 35, HP: 90,  DAMAGE: 18, SPEED: 120, ATTACK_RATE: 1200, RANGE: 280, AGGRO: 200 },
  },
  LEASH_RANGE: 260,    // if following and dist to player > this → retreat to player
  LEASH_RESUME: 140,   // resume combat once back within this distance
  IDLE_RADIUS:  50,    // wander radius around barracks when idle
},
```

---

## New file: `src/entities/buildings/Barracks.js`

```
type = 'barracks', level = 1
soldiers = []         // all soldiers owned by this barracks (alive)
idleSoldiers = []     // subset: idle, not yet deployed
spawnRate from CONFIG.BUILDINGS.BARRACKS.SPAWN_RATE
lastSpawn = 0

update(time):
  const stats = CONFIG.SOLDIERS.LEVEL[this.level]
  const alive = soldiers.filter(s => !s.dead).length
  if (alive < stats.MAX && time - lastSpawn > spawnRate):
    const s = new Soldier(scene, this.x + randomOffset, this.y + randomOffset, this.level, this)
    soldiers.push(s); idleSoldiers.push(s)
    lastSpawn = time

deploy():
  // Called from UpgradePanel after paying DEPLOY_COST gold
  idleSoldiers.forEach(s => s.setFollowing())
  idleSoldiers = []

upgrade():
  if level >= 2 return false
  level = 2
  spawnRate = CONFIG.BUILDINGS.BARRACKS.UPGRADE[2].SPAWN_RATE
  return true

_destroy():
  this.dead = true
  soldiers.forEach(s => s._die())  // remove all soldiers on destroy
  // standard building destroy pattern
```

---

## New file: `src/entities/Soldier.js`

Modelled on `Enemy.js`. Key differences:

```
state = 'idle'     // 'idle' | 'following'
combatType = Math.random() < 0.5 ? 'melee' : 'ranged'
stats = CONFIG.SOLDIERS.LEVEL[barracksLevel]
sprite texture: combatType === 'melee' ? 'soldier_melee' : 'soldier_ranged'
sprite.setDepth(9)
barracks reference stored (for idle wander + removal on death)

setFollowing(): state = 'following'

update(time):
  if dead return
  const distToPlayer = Distance(sprite, player)

  // Leash — if following and too far, retreat unconditionally
  if state === 'following' && distToPlayer > LEASH_RANGE:
    _moveDirectTo(player.x, player.y)
    _drawHpBar()
    return

  // Combat
  const target = find nearest enemy sprite within aggroRange
  if target:
    if combatType === 'melee':
      if dist < 28: stop; attack if cooldown ok
      else: _moveDirectTo(target.x, target.y)
    else:
      if dist < range: stop; fire via scene._fireProjectile() if cooldown ok
      else if dist > range * 0.8: _moveDirectTo(target.x, target.y)
  else:
    // No enemies
    if state === 'idle':
      if distToBarracks > IDLE_RADIUS: _moveDirectTo(barracks.x, barracks.y)
      else: body.setVelocity(0, 0)
    else:
      if distToPlayer > 80: _moveDirectTo(player.x, player.y)
      else: body.setVelocity(0, 0)

  _drawHpBar()

_moveDirectTo(tx, ty):
  if !sprite.body return
  const angle = Angle.Between(sprite.x, sprite.y, tx, ty)
  sprite.body.setVelocity(cos*speed, sin*speed)
  sprite.setFlipX(cos < 0)

_die():
  dead = true
  barracks.soldiers = barracks.soldiers.filter(s => s !== this)
  barracks.idleSoldiers = barracks.idleSoldiers.filter(s => s !== this)
  hpBar?.destroy()
  tweens.add({ targets: sprite, alpha: 0, duration: 200, onComplete: () => sprite.destroy() })
```

---

## GameScene.js Changes (Phase 6)

1. `this.soldiersGroup = this.physics.add.group()` + `this.barracksGroup = this.physics.add.staticGroup()`
2. Enemy/player/proj colliders for barracksGroup (same pattern as smithGroup)
3. Soldier projectiles reuse `this.projectiles` (already overlaps enemies — no extra wiring)
4. `update()`: call `buildingSystem.barracks.forEach(b => b.update(time))`
5. `update()`: iterate all soldiers across all barracks for their update
6. Add barracks to `_tryClickBuilding`

## UpgradePanel Changes (Phase 6)

The biggest challenge. Need to add a **Deploy button** alongside the standard Upgrade button.

Easiest approach: add `this.deployBtn` + `this.deployBtnText` to the panel. Show Deploy button only when `b.type === 'barracks'`; show Upgrade button only for upgradeable types. Adjust `panelH` of UpgradePanel if needed.

Deploy button logic:
```js
const stats = CONFIG.SOLDIERS.LEVEL[b.level];
if (b.idleSoldiers.length > 0 && gameScene.economy.canAfford({ gold: stats.DEPLOY_COST })) {
  gameScene.economy.spend({ gold: stats.DEPLOY_COST });
  b.deploy();
  EventBus.emit('resources_updated', gameScene.economy.resources);
  this._refresh();
}
```

## Textures Needed (Phase 6)

- `soldier_melee` (32×32) — small knight, blue/green to distinguish from red enemies
- `soldier_ranged` (32×32) — small archer, blue/green
- `building_barracks` (40×40) — barracks with flag (blue flag to show allegiance)

## Files Changed (Phase 6)

| File | Change |
|---|---|
| `config.js` | Add BARRACKS, SOLDIERS |
| `BootScene.js` | Add `_genBarracks`, `_genSoldierMelee`, `_genSoldierRanged` |
| `entities/buildings/Barracks.js` | **NEW** |
| `entities/Soldier.js` | **NEW** |
| `systems/BuildingSystem.js` | Import + array + placement for barracks |
| `scenes/GameScene.js` | 2 new groups, colliders, update hooks, _tryClickBuilding |
| `ui/BuildMenu.js` | 1 new entry, increase panelH further |
| `ui/UpgradePanel.js` | nameMap + deployBtn + statsText for barracks |
