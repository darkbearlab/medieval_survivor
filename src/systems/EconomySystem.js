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
}
