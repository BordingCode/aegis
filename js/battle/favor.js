// Favor economy: a slow passive trickle plus any Shrine bonus (set by world when
// shrines are built/sold). Spent to build and upgrade defenders.

export class Favor {
  constructor({ start, rate, max }) {
    this.value = start;
    this.baseRate = rate;
    this.bonusRate = 0;   // from Shrines
    this.rateMult = 1;    // from boons/meta later
    this.max = max;
  }
  get rate() { return (this.baseRate + this.bonusRate) * this.rateMult; }
  update(step) { this.value = Math.min(this.max, this.value + this.rate * step); }
  can(cost) { return this.value >= cost; }
  spend(cost) { if (this.value >= cost) { this.value -= cost; return true; } return false; }
  add(n) { this.value = Math.min(this.max, this.value + n); }
}
