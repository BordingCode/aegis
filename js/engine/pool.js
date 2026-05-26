// Tiny array-backed object pool to avoid per-frame allocation/GC on phones.
// Used for projectiles and transient FX. Items are plain objects reset by `reset`.

export class Pool {
  constructor(factory, reset) {
    this.factory = factory;   // () => newObj
    this.reset = reset;       // (obj, ...args) => obj
    this.free = [];
    this.active = [];
  }
  spawn(...args) {
    const obj = this.free.pop() || this.factory();
    this.reset(obj, ...args);
    obj._dead = false;
    this.active.push(obj);
    return obj;
  }
  // Remove dead items (obj._dead === true), returning them to the free list.
  // swap-and-pop keeps the active array compact without reallocating.
  sweep() {
    const a = this.active;
    for (let i = a.length - 1; i >= 0; i--) {
      if (a[i]._dead) {
        const obj = a[i];
        a[i] = a[a.length - 1];
        a.pop();
        this.free.push(obj);
      }
    }
  }
  clear() { while (this.active.length) this.free.push(this.active.pop()); }
}
