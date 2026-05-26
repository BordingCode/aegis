// Wave scheduler. Flattens the level's wave list into a time-sorted queue of
// individual enemy spawns; emits them as world.elapsed passes their timestamp.

export function createSpawner(level) {
  const queue = [];
  for (const wave of level.waves) {
    for (const s of wave.spawns) {
      const delay = s.delay || 0;
      const gap = s.gap || 0.8;
      for (let k = 0; k < s.count; k++) queue.push({ t: wave.at + delay + k * gap, enemy: s.enemy });
    }
  }
  queue.sort((a, b) => a.t - b.t);
  return {
    queue, i: 0,
    get done() { return this.i >= this.queue.length; },
    get total() { return this.queue.length; },
  };
}

export function stepSpawner(world, step) {
  const sp = world.spawner;
  while (sp.i < sp.queue.length && sp.queue[sp.i].t <= world.elapsed) {
    world.spawnEnemy(sp.queue[sp.i++].enemy);
  }
}
