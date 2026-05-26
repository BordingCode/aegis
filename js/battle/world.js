// The live battle World for the lane backbone. Owns enemies, mobile troops,
// stationary defenders, the fort + god, projectiles and the power. Orchestrates
// one fixed sim step. No DOM here.

import { Favor } from './favor.js';
import { makeEnemy, stepEnemies } from './enemies.js';
import { makeUnit, stepUnits } from './units.js';
import { makeDefender, stepDefenders } from './defenders.js';
import { createProjectilePool, stepProjectiles } from './projectiles.js';
import { createSpawner, stepSpawner, startWave } from './spawner.js';
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

export function createWorld(level, { rng, onEvent, mods: metaMods = [] } = {}) {
  const power = POWER_BY_ID['zeus_bolt'];
  const world = {
    level, rng,
    fortX: level.fort.x,
    laneCenterY: (lane) => laneCenterY(level, lane),

    // live run modifiers, mutated by boons picked between waves
    mods: { allyDmgMult: 1, fireRateMult: 1, bountyMult: 1, costMult: 1, hpMult: 1, powerDmgMult: 1, powerStunAdd: 0, powerChain: 0, godCdMult: 1, slowOnHit: 1, spawnSlow: 1 },
    boons: [],

    favor: new Favor({
      start: applyMod(metaMods, 'favor', 'start', level.favor.start),
      rate: applyMod(metaMods, 'favor', 'rate', level.favor.rate),
      max: level.favor.max,
    }),
    gateHp: applyMod(metaMods, 'fort', 'hp', level.fort.hp),
    gateHpMax: applyMod(metaMods, 'fort', 'hp', level.fort.hp),
    hopliteDmgMult: applyMod(metaMods, 'hoplite', 'dmg', 1),

    enemies: [], units: [], defenders: [],
    projectiles: createProjectilePool(),
    spawner: createSpawner(level),
    elapsed: 0, killed: 0, status: 'playing',

    god: { x: level.fort.x - 14, range: level.god.range, cooldown: level.god.cooldown, dmg: level.god.dmg, cdT: 0, flash: 0, boltTo: null },
    power: {
      def: power, radius: power.radius, stun: power.stun,
      cooldown: applyMod(metaMods, 'zeus', 'cooldown', power.cooldown),
      dmg: applyMod(metaMods, 'zeus', 'dmg', power.dmg),
      cdT: 0,
    },

    _onEvent: onEvent || null,
    emit(t, d) { if (this._onEvent) this._onEvent(t, d); },

    // ---- spawning / placement ----
    spawnEnemy(id, lane) {
      const def = ENEMY_BY_ID[id]; if (!def) return;
      const e = makeEnemy(def, lane); e.x = level.spawnX; e.y = laneCenterY(level, lane);
      if (this.mods.spawnSlow < 1) { e.slowMult = this.mods.spawnSlow; e.slowT = 3; }
      this.enemies.push(e);
    },
    cost(def) { return Math.max(1, Math.round(def.cost * this.mods.costMult)); },
    // Post a non-melee unit to a lane on the fort. If one of this type already
    // holds the lane, LEVEL it up instead of stacking a duplicate (fewer entities).
    recruitFort(defId, lane) {
      const def = DEFENDER_BY_ID[defId];
      if (!def || def.deploy !== 'fort') return false;
      const c = this.cost(def);
      const existing = this.defenders.find((d) => !d.dead && d.lane === lane && d.defId === defId);
      if (existing) {
        if (existing.level >= (def.maxLevel || 10) || !this.favor.spend(c)) return false;
        this.levelUp(existing);
        this.emit('build', { d: existing });
        return true;
      }
      if (!this.favor.spend(c)) return false;
      const slot = this.defenders.filter((d) => d.lane === lane).length;
      const x = this.fortX + 30 + Math.min(slot, 6) * 28;
      const d = makeDefender(def, lane, x, laneCenterY(level, lane));
      d.slot = slot;
      if (this.mods.hpMult !== 1) { d.maxHp = Math.round(d.maxHp * this.mods.hpMult); d.hp = d.maxHp; }
      this.defenders.push(d);
      if (d.kind === 'favor') this.favor.bonusRate += d.gen;
      this.emit('build', { d });
      return true;
    },
    levelUp(d) {
      const p = d.def.perLevel || {};
      d.level++;
      if (p.hp) { d.maxHp += p.hp; d.hp += p.hp; }
      if (p.dmg) d.dmg += p.dmg;
      if (p.range) d.range += p.range;
      if (p.gen) { d.gen += p.gen; this.favor.bonusRate += p.gen; }
      if (p.auraRange) d.auraRange += p.auraRange;
      if (p.auraMult) d.auraMult += p.auraMult;
    },
    levelCost(d) { return d.level < (d.def.maxLevel || 10) ? d.def.cost : 0; },
    sellValue(d) { return Math.round(d.def.cost * d.level * (d.def.sellRefund || 0.5)); },
    // nearest living fort unit to a point (for the tap-to-upgrade menu).
    defenderAt(x, y, r = 38) {
      let best = null, bd = r * r;
      for (const d of this.defenders) { if (d.dead) continue; const dd = dist2(x, y, d.x, d.y); if (dd <= bd) { bd = dd; best = d; } }
      return best;
    },
    deployLane(defId, lane) {
      const def = DEFENDER_BY_ID[defId];
      if (!def || def.deploy !== 'lane' || !this.favor.spend(this.cost(def))) return false;
      const u = makeUnit(def, lane, this.hopliteDmgMult);
      u.x = level.deployX; u.y = laneCenterY(level, lane);
      if (this.mods.hpMult !== 1) { u.maxHp = Math.round(u.maxHp * this.mods.hpMult); u.hp = u.maxHp; }
      this.units.push(u);
      this.emit('deploy', { u });
      return true;
    },

    // ---- power ----
    powerReady() { return this.power.cdT <= 0; },
    castPowerAt(x, y) {
      if (this.power.cdT > 0) return false;
      const dmg = this.power.dmg * this.mods.powerDmgMult;
      const stun = this.power.stun + this.mods.powerStunAdd;
      const r2 = this.power.radius * this.power.radius;
      const hit = [];
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dx = e.x - x, dy = e.y - y;
        if (dx * dx + dy * dy <= r2) { this.damageEnemy(e, dmg); e.stunT = Math.max(e.stunT, stun); hit.push(e); }
      }
      if (this.mods.powerChain > 0) {
        const rest = this.enemies.filter((e) => !e.dead && !hit.includes(e))
          .sort((a, b) => ((a.x - x) ** 2 + (a.y - y) ** 2) - ((b.x - x) ** 2 + (b.y - y) ** 2));
        for (const e of rest.slice(0, this.mods.powerChain)) { this.damageEnemy(e, dmg * 0.7); e.stunT = Math.max(e.stunT, stun); this.emit('bolt', { x: e.x, y: e.y, radius: 38 }); }
      }
      this.power.cdT = this.power.cooldown;
      this.emit('bolt', { x, y, radius: this.power.radius });
      return true;
    },

    // ---- damage ----
    damageEnemy(e, dmg) {
      if (e.dead) return;
      const real = Math.max(1, Math.round(dmg * this.mods.allyDmgMult - e.armor));
      e.hp -= real; e.hitFlash = 0.12;
      if (this.mods.slowOnHit < 1) { e.slowMult = Math.min(e.slowMult, this.mods.slowOnHit); e.slowT = Math.max(e.slowT, 1.2); }
      if (e.hp <= 0 && !e.dead) { e.dead = true; this.favor.add(Math.round(e.bounty * this.mods.bountyMult)); this.killed++; this.emit('kill', { e }); }
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

    // ---- sell (level-up is via recruitFort) ----
    sell(d) {
      const refund = this.sellValue(d);
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
        g.cdT = g.cooldown * this.mods.godCdMult; g.flash = 0.18; g.boltTo = { x: best.x, y: best.y };
        this.emit('godbolt', { x: best.x, y: best.y });
      }
    },
    // ---- boons (picked between waves) ----
    pickBoon(boon) { boon.apply(this); this.boons.push(boon.id); this.emit('boon', { boon }); },

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
      if (this.gateHp <= 0) { this.status = 'lost'; this.emit('lose', {}); return; }
      if (this.spawner.spawnsDone() && this.enemies.length === 0) {
        if (this.spawner.isLastWave) { this.status = 'won'; this.emit('win', {}); }
        else { this.status = 'waveclear'; this.emit('waveclear', { wave: this.spawner.current + 1 }); }
      }
    },
    // advance to the next wave after the player picks a boon and sends it
    nextWave() {
      if (this.spawner.isLastWave) return;
      startWave(this, this.spawner.current + 1);
      this.status = 'playing';
    },
  };
  return world;
}
