// Wave scheduler. Flattens the level's wave list into a time-sorted queue of
// individual enemy spawns (each carrying its lane); emits them as world.elapsed
// passes their timestamp.

export function createSpawner(level) {
  const queue = [];
  for (const g of level.waves) {
    const delay = g.delay || 0;
    const gap = g.gap || 0.8;
    for (let k = 0; k < g.count; k++) queue.push({ t: g.at + delay + k * gap, enemy: g.enemy, lane: g.lane });
  }
  queue.sort((a, b) => a.t - b.t);
  return {
    queue, i: 0,
    get done() { return this.i >= this.queue.length; },
    get total() { return this.queue.length; },
  };
}

export function stepSpawner(world) {
  const sp = world.spawner;
  while (sp.i < sp.queue.length && sp.queue[sp.i].t <= world.elapsed) {
    const item = sp.queue[sp.i++];
    world.spawnEnemy(item.enemy, item.lane);
  }
}
