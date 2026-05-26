// Wave scheduler for DISCRETE waves. Each wave has its own time-sorted queue of
// spawns (times relative to when that wave starts). The world advances waves via
// startWave() after the player picks a boon between waves.

export function createSpawner(level) {
  const waveQueues = level.waves.map((wave) => {
    const q = [];
    for (const g of wave) {
      const delay = g.delay || 0, gap = g.gap || 0.8;
      for (let k = 0; k < g.count; k++) q.push({ t: delay + k * gap, enemy: g.enemy, lane: g.lane });
    }
    q.sort((a, b) => a.t - b.t);
    return q;
  });
  return {
    waveQueues,
    waveCount: waveQueues.length,
    current: 0,    // active wave index
    i: 0,          // next spawn index within the active wave
    waveStart: 0,  // world.elapsed when the active wave began
    get total() { return waveQueues.reduce((n, q) => n + q.length, 0); },
    get isLastWave() { return this.current >= this.waveCount - 1; },
    spawnsDone() { return this.i >= this.waveQueues[this.current].length; },
  };
}

export function startWave(world, idx) {
  const sp = world.spawner;
  sp.current = idx; sp.i = 0; sp.waveStart = world.elapsed;
}

export function stepSpawner(world) {
  const sp = world.spawner;
  const q = sp.waveQueues[sp.current];
  const t = world.elapsed - sp.waveStart;
  while (sp.i < q.length && q[sp.i].t <= t) { const item = q[sp.i++]; world.spawnEnemy(item.enemy, item.lane); }
}
