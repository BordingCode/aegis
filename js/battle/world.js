// The live battle World: owns all entities and orchestrates one fixed sim step.
// Build/upgrade/sell mutate it; the renderer reads it; nothing here touches the DOM.

import { Path } from './path.js';
import { Favor } from './favor.js';
import { makeEnemy, stepEnemies } from './enemies.js';
import { makeDefender, stepDefenders } from './defenders.js';
import { createProjectilePool, stepProjectiles } from './projectiles.js';
import { createSpawner, stepSpawner } from './spawner.js';
import { ENEMY_BY_ID } from '../data/enemies.js';
import { DEFENDER_BY_ID } from '../data/defenders.js';
import { dist2 } from '../engine/vec.js';

export function createWorld(level, { rng, onEvent } = {}) {
  const world = {
    level,
    path: new Path(level.path),
    favor: new Favor(level.favor),
    gateHp: level.gate.hp, gateHpMax: level.gate.hp,
    enemies: [],
    defenders: [],
    projectiles: createProjectilePool(),
    plots: level.plots.map((p) => ({ ...p, occupant: null })),
    spawner: createSpawner(level),
    elapsed: 0, killed: 0, leaked: 0,
    status: 'playing',           // playing | won | lost
    rng,
    _onEvent: onEvent || null,

    emit(type, data) { if (this._onEvent) this._onEvent(type, data); },

    spawnEnemy(id) { const def = ENEMY_BY_ID[id]; if (def) this.enemies.push(makeEnemy(def)); },
    spawnProjectile(d, target) { this.projectiles.spawn(d, target); },

    damageEnemy(e, dmg) {
      if (e.dead) return;
      const real = Math.max(1, Math.round(dmg - e.armor));
      e.hp -= real; e.hitFlash = 0.12;
      if (e.hp <= 0 && !e.dead) {
        e.dead = true; this.favor.add(e.bounty); this.killed++;
        this.emit('kill', { e });
      }
    },

    step(dt) {
      if (this.status !== 'playing') return;
      const before = this.gateHp;
      this.elapsed += dt;
      stepSpawner(this, dt);
      this.favor.update(dt);
      stepEnemies(this, dt);
      stepDefenders(this, dt);
      stepProjectiles(this, dt);
      if (this.gateHp < before) this.leaked += (before - this.gateHp);
      if (this.gateHp <= 0) { this.status = 'lost'; this.emit('lose', {}); }
      else if (this.spawner.done && this.enemies.length === 0) { this.status = 'won'; this.emit('win', {}); }
    },

    plotAt(wx, wy, r = 48) {
      let best = null, bd = r * r;
      for (const p of this.plots) { const d = dist2(wx, wy, p.x, p.y); if (d <= bd) { bd = d; best = p; } }
      return best;
    },

    build(plotId, defId) {
      const plot = this.plots.find((p) => p.id === plotId);
      if (!plot || plot.occupant) return false;
      const def = DEFENDER_BY_ID[defId];
      if (!def || !this.favor.spend(def.cost)) return false;
      const d = makeDefender(def, plot);
      plot.occupant = d; this.defenders.push(d);
      if (d.kind === 'favor') this.favor.bonusRate += d.gen;
      this.emit('build', { d });
      return true;
    },

    upgradeCost(d) { return d.def.upgrade && d.tier < 2 ? d.def.upgrade.cost : 0; },

    upgrade(d) {
      const up = d.def.upgrade;
      if (!up || d.tier >= 2 || !this.favor.spend(up.cost)) return false;
      d.tier = 2;
      if (up.dmg) d.dmg += up.dmg;
      if (up.range) d.range += up.range;
      if (up.gen) { d.gen += up.gen; this.favor.bonusRate += up.gen; }
      if (up.auraRange) d.auraRange += up.auraRange;
      if (up.auraMult) d.auraMult += up.auraMult;
      this.emit('upgrade', { d });
      return true;
    },

    sell(d) {
      const spent = d.def.cost + (d.tier > 1 ? d.def.upgrade.cost : 0);
      const refund = Math.round(spent * (d.def.sellRefund || 0.5));
      this.favor.add(refund);
      if (d.kind === 'favor') this.favor.bonusRate -= d.gen;
      const plot = this.plots.find((p) => p.occupant === d);
      if (plot) plot.occupant = null;
      this.defenders = this.defenders.filter((x) => x !== d);
      this.emit('sell', { d, refund });
      return refund;
    },
  };
  return world;
}
