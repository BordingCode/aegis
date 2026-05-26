// Deterministic, seedable RNG (mulberry32). Same seed => same sequence, so any
// bug found in a run reproduces exactly. Inject this everywhere randomness is used.

export class RNG {
  constructor(seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0) {
    this.seed = seed >>> 0;
    this.state = this.seed;
  }
  // float in [0,1)
  next() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  // int in [min, max] inclusive
  int(min, max) { return min + Math.floor(this.next() * (max - min + 1)); }
  // float in [min, max)
  range(min, max) { return min + this.next() * (max - min); }
  // pick one element
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  // Fisher–Yates shuffle (returns a new array)
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  // chance: true with probability p
  chance(p) { return this.next() < p; }

  save() { return { seed: this.seed, state: this.state }; }
  load(s) { this.seed = s.seed >>> 0; this.state = s.state >>> 0; return this; }
}

// Turn a string seed (shareable) into a uint32.
export function seedFromString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
