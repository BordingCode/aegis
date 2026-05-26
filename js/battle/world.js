// The live battle World for the lane backbone. Owns enemies, mobile troops,
// stationary defenders, the fort + god, projectiles and the power. Orchestrates
// one fixed sim step. No DOM here.

import { Favor } from './favor.js';
import { makeEnemy, stepEnemies } from './enemies.js';
import { makeUnit, stepUnits } from './units.js';
import { makeDefender, stepDefenders } from './defenders.js';
import { createProjectilePool, stepProjectiles } from './projectiles.js';
import { createSpawner, stepSpawner } from './spawner.js';
import { ENEMY_BY_ID } from '../data/enemies.js';
import { DEFENDER_BY_ID } from '../data/defenders.js';
import { POWER_BY_ID } from '../data/powers.js';
import { laneCenterY } from '../data/levels.js';
import { dist2 } from '../engine/vec.js';

function applyMod(mods, target, stat, base) {
  let v = base;
  for (const m of mods) if (m.target === target && m.stat === stat) v = m.op === 'mul' ? v * m.value : v + m.value;
  return v;
}

export function createWorld(level, { rng, onEvent, mods = [] } = {}) {
  const power = POWER_BY_ID['zeus_bolt'];
  const world = {
    level, rng, mods,
    fortX: level.fort.x,
    laneCenterY: (lane) => laneCenterY(level, lane),

    favor: new Favor({
      start: applyMod(mods, 'favor', 'start', level.favor.start),
      rate: applyMod(mods, 'favor', 'rate', level.favor.rate),
      max: level.favor.max,
    }),
    gateHp: applyMod(mods, 'fort', 'hp', level.fort.hp),
    gateHpMax: applyMod(mods, 'fort', 'hp', level.fort.hp),
    hopliteDmgMult: applyMod(mods, 'hoplite', 'dmg', 1),

    enemies: [], units: [], defenders: [],
    projectiles: createProjectilePool(),
    spawner: createSpawner(level),
    elapsed: 0, killed: 0, status: 'playing',

    god: { x: level.fort.x - 14, range: level.god.range, cooldown: level.god.cooldown, dmg: level.god.dmg, cdT: 0, flash: 0, boltTo: null },
    power: {
      def: power, radius: power.radius, stun: power.stun,
      cooldown: applyMod(mods, 'zeus', 'cooldown', power.cooldown),
      dmg: applyMod(mods, 'zeus', 'dmg', power.dmg),
      cdT: 0,
    },

    _onEvent: onEvent || null,
    emit(t, d) { if (this._onEvent) this._onEvent(t, d); },

    // ---- spawning / placement ----
    spawnEnemy(id, lane) {
      const def = ENEMY_BY_ID[id]; if (!def) return;
      const e = makeEnemy(def, lane); e.x = level.spawnX; e.y = laneCenterY(level, lane);
      this.enemies.push(e);
    },
    // Post a non-melee unit to a lane on the fort; it stacks along the wall.
    recruitFort(defId, lane) {
      const def = DEFENDER_BY_ID[defId];
      if (!def || def.deploy !== 'fort' || !this.favor.spend(def.cost)) return false;
      const slot = this.defenders.filter((d) => d.lane === lane).length;
      const x = this.fortX + 30 + Math.min(slot, 6) * 28;
      const d = makeDefender(def, lane, x, laneCenterY(level, lane));
      d.slot = slot;
      this.defenders.push(d);
      if (d.kind === 'favor') this.favor.bonusRate += d.gen;
      this.emit('build', { d });
      return true;
    },
    // nearest living fort unit to a point (for the tap-to-upgrade menu).
    defenderAt(x, y, r = 38) {
      let best = null, bd = r * r;
      for (const d of this.defenders) { if (d.dead) continue; const dd = dist2(x, y, d.x, d.y); if (dd <= bd) { bd = dd; best = d; } }
      return best;
    },
    deployLane(defId, lane) {
      const def = DEFENDER_BY_ID[defId];
      if (!def || def.deploy !== 'lane' || !this.favor.spend(def.cost)) return false;
      const u = makeUnit(def, lane, this.hopliteDmgMult);
      u.x = level.deployX; u.y = laneCenterY(level, lane);
      this.units.push(u);
      this.emit('deploy', { u });
      return true;
    },

    // ---- power ----
    powerReady() { return this.power.cdT <= 0; },
    castPowerAt(x, y) {
      if (this.power.cdT > 0) return false;
      const r2 = this.power.radius * this.power.radius;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dx = e.x - x, dy = e.y - y;
        if (dx * dx + dy * dy <= r2) { this.damageEnemy(e, this.power.dmg); e.stunT = Math.max(e.stunT, this.power.stun); }
      }
      this.power.cdT = this.power.cooldown;
      this.emit('bolt', { x, y, radius: this.power.radius });
      return true;
    },

    // ---- damage ----
    damageEnemy(e, dmg) {
      if (e.dead) return;
      const real = Math.max(1, Math.round(dmg - e.armor));
      e.hp -= real; e.hitFlash = 0.12;
      if (e.hp <= 0 && !e.dead) { e.dead = true; this.favor.add(e.bounty); this.killed++; this.emit('kill', { e }); }
    },
    damageAlly(a, dmg) {
      if (a.dead) return;
      a.hp -= dmg; a.hitFlash = 0.12;
      if (a.hp <= 0 && !a.dead) {
        a.dead = true;
        if (a.kind === 'favor') this.favor.bonusRate -= a.gen; // a destroyed Shrine
        this.emit('allyDown', { a });
      }
    },
    hitGate(e) { this.gateHp = Math.max(0, this.gateHp - e.gateDmg); this.emit('gate', { e }); },

    spawnProjectile(d, target) { this.projectiles.spawn(d, target); },

    // ---- upgrade / sell (stationary only) ----
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
      d.dead = true;
      this.defenders = this.defenders.filter((x) => x !== d);
      this.emit('sell', { d, refund });
      return refund;
    },

    // ---- the god on the fort ----
    _stepGod(dt) {
      const g = this.god;
      if (g.flash > 0) g.flash -= dt;
      g.cdT -= dt;
      if (g.cdT > 0) return;
      let best = null, bestX = Infinity;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (e.x <= this.fortX + g.range && e.x < bestX) { best = e; bestX = e.x; }
      }
      if (best) {
        this.damageEnemy(best, g.dmg);
        g.cdT = g.cooldown; g.flash = 0.18; g.boltTo = { x: best.x, y: best.y };
        this.emit('godbolt', { x: best.x, y: best.y });
      }
    },

    step(dt) {
      if (this.status !== 'playing') return;
      this.elapsed += dt;
      stepSpawner(this);
      this.favor.update(dt);
      stepDefenders(this, dt);
      stepUnits(this, dt);
      stepEnemies(this, dt);
      stepProjectiles(this, dt);
      this._stepGod(dt);
      if (this.power.cdT > 0) this.power.cdT = Math.max(0, this.power.cdT - dt);
      if (this.gateHp <= 0) { this.status = 'lost'; this.emit('lose', {}); }
      else if (this.spawner.done && this.enemies.length === 0) { this.status = 'won'; this.emit('win', {}); }
    },
  };
  return world;
}
