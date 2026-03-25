import { CONFIG } from '../config.js';

export class EconomySystem {
  constructor() {
    this.resources = {
      wood: 10,
      stone: 5,
      food: 0,
      gold: 0,
    };
  }

  add(type, amount) {
    if (this.resources[type] !== undefined) {
      this.resources[type] += amount;
    }
  }

  canAfford(costs) {
    return Object.entries(costs).every(([type, amount]) =>
      (this.resources[type] || 0) >= amount
    );
  }

  spend(costs) {
    if (!this.canAfford(costs)) return false;
    for (const [type, amount] of Object.entries(costs)) {
      this.resources[type] -= amount;
    }
    return true;
  }

  // ── Gold-exchange variants ──────────────────────────────────────────────

  /** How much gold is needed to cover any resource deficits in `costs`. */
  _goldNeeded(costs) {
    const rates = {
      wood:  CONFIG.EXCHANGE.WOOD_PER_GOLD,
      stone: CONFIG.EXCHANGE.STONE_PER_GOLD,
    };
    let gold = 0;
    for (const [type, amount] of Object.entries(costs)) {
      if (type === 'gold') { gold += amount; continue; }
      const deficit = Math.max(0, amount - (this.resources[type] || 0));
      if (deficit > 0) gold += Math.ceil(deficit / (rates[type] || 1));
    }
    return gold;
  }

  /** True if costs can be met using available resources + gold exchange. */
  canAffordWithGold(costs) {
    return (this.resources.gold || 0) >= this._goldNeeded(costs);
  }

  /**
   * Spends resources, using gold to cover any deficit.
   * Assumes canAffordWithGold(costs) is true.
   */
  spendWithGold(costs) {
    const rates = {
      wood:  CONFIG.EXCHANGE.WOOD_PER_GOLD,
      stone: CONFIG.EXCHANGE.STONE_PER_GOLD,
    };
    let goldUsed = 0;
    for (const [type, amount] of Object.entries(costs)) {
      if (type === 'gold') { goldUsed += amount; continue; }
      const have    = this.resources[type] || 0;
      const deficit = Math.max(0, amount - have);
      if (deficit > 0) {
        this.resources[type] = 0;
        goldUsed += Math.ceil(deficit / (rates[type] || 1));
      } else {
        this.resources[type] -= amount;
      }
    }
    this.resources.gold = (this.resources.gold || 0) - goldUsed;
    return true;
  }
}
