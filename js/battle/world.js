// The live battle World for the lane backbone. Owns enemies, mobile troops,
// stationary defenders, the fort + god, projectiles and the power. Orchestrates
// one fixed sim step. No DOM here.

import { Favor } from './favor.js';
import { makeEnemy, stepEnemies } from './enemies.js';
import { makeUnit, stepUnits } from './units.js';
import { makeDefender, stepDefenders } from './defenders.js';
import { createProjectilePool, stepProjectiles } from './projectiles.js';
import { createSpawner, stepSpawner, startWave } from './spawner.js';
import { stepBoss } from './bosses.js';
import { ENEMY_BY_ID } from '../data/enemies.js';
import { DEFENDER_BY_ID } from '../data/defenders.js';
import { POWERS, POWER_BY_GOD } from '../data/powers.js';
import { RELIC_BY_ID } from '../data/relics.js';
import { laneCenterY, laneAtY } from '../data/levels.js';
import { dist2 } from '../engine/vec.js';

function applyMod(mods, target, stat, base) {
  let v = base;
  for (const m of mods) if (m.target === target && m.stat === stat) v = m.op === 'mul' ? v * m.value : v + m.value;
  return v;
}

// One live power instance from its def. Zeus's dmg/cooldown pick up meta upgrades.
function makePower(def, metaMods) {
  const isZeus = def.god === 'zeus';
  return {
    def, id: def.id, god: def.god, icon: def.icon, name: def.name, cast: def.cast,
    cooldown: isZeus ? applyMod(metaMods, 'zeus', 'cooldown', def.cooldown) : def.cooldown,
    dmg: isZeus ? applyMod(metaMods, 'zeus', 'dmg', def.dmg) : (def.dmg || 0),
    radius: def.radius || 0, stun: def.stun || 0, slow: def.slow || 0, slowDur: def.slowDur || 0,
    dur: def.dur || 0, dmgMult: def.dmgMult || 1, frMult: def.frMult || 1, cdT: 0,
  };
}

// Offensive maps put a destructible target on the right: a stronghold to smash
// (resists arrows — bring melee/gods) or a living boss (handled in bosses.js).
function makeTarget(level) {
  const t = level.target; if (!t) return null;
  const y = level.world.h / 2;
  if (t.kind === 'boss') {
    const def = ENEMY_BY_ID[t.bossId] || {};
    return { kind: 'boss', bossId: t.bossId, def, art: def.art, color: def.color, name: def.name || 'Boss',
      x: level.spawnX - 70, y, hp: t.hp, hpMax: t.hp, hitFlash: 0, cdT: 4, phase: 1 };
  }
  return { kind: 'stronghold', name: t.name || 'Stronghold', x: level.spawnX - 20, y,
    hp: t.hp, hpMax: t.hp, hitFlash: 0, resist: { ranged: 0.5 } };
}

export function createWorld(level, { rng, onEvent, mods: metaMods = [], loadout, relics = [] } = {}) {
  // Loadout gods become the tap-powers; default to every god (sim / back-compat).
  const godIds = (loadout && loadout.gods && loadout.gods.length) ? loadout.gods : POWERS.map((p) => p.god);
  const world = {
    level, rng,
    mode: level.mode || 'defense',
    target: makeTarget(level),       // null for defense; stronghold/boss for offensive maps
    fortX: level.fort.x,
    laneCenterY: (lane) => laneCenterY(level, lane),

    // live run modifiers, mutated by boons picked between waves
    mods: { allyDmgMult: 1, fireRateMult: 1, bountyMult: 1, costMult: 1, hpMult: 1, powerDmgMult: 1, powerStunAdd: 0, powerChain: 0, godCdMult: 1, slowOnHit: 1, spawnSlow: 1 },
    boons: [],
    armyBuff: { dmgMult: 1, frMult: 1, t: 0 }, // Ares War Cry (timed)

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
    powers: godIds.map((g) => POWER_BY_GOD[g]).filter(Boolean).map((def) => makePower(def, metaMods)),

    _onEvent: onEvent || null,
    emit(t, d) { if (this._onEvent) this._onEvent(t, d); },

    // ---- spawning / placement ----
    spawnEnemy(id, lane) {
      const def = ENEMY_BY_ID[id]; if (!def) return;
      const e = makeEnemy(def, lane); e.x = level.spawnX; e.y = laneCenterY(level, lane);
      const s = level.enemyScale || 1;       // later maps toughen foes; the run snowballs via boons, so foes must too
      if (s !== 1) {
        e.hp = Math.round(e.hp * s); e.maxHp = e.hp;
        e.dmg = Math.round(e.dmg * s);
        e.gateDmg = Math.max(1, Math.round(e.gateDmg * Math.pow(s, 0.85))); // leaks hurt more deep in the run
        e.bounty = Math.max(1, Math.round(e.bounty * Math.pow(s, 0.55)));   // economy keeps partial pace, not full
      }
      if (this.mods.spawnSlow < 1) { e.slowMult = this.mods.spawnSlow; e.slowT = 3; }
      this.enemies.push(e);
      this.emit('spawn', { id });
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
      if (p.heal) d.heal += p.heal;
      if (p.healRange) d.healRange += p.healRange;
      if (p.splash) d.splash += p.splash;
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

    // ---- powers (one per loadout god) ----
    powerReady(p) { return p && p.cdT <= 0; },
    // combined ally attack-speed factor: Oracle aura is per-unit; this is the global part
    attackSpeedMult() { return this.mods.fireRateMult * (this.armyBuff.t > 0 ? this.armyBuff.frMult : 1); },
    castPower(p, x, y) {
      if (!p || p.cdT > 0) return false;
      const dmg = p.dmg * this.mods.powerDmgMult;
      if (p.cast === 'self') {                       // Ares — army-wide timed buff
        this.armyBuff = { dmgMult: p.dmgMult, frMult: p.frMult, t: p.dur };
        this.emit('warcry', {});
      } else if (p.cast === 'lane') {                // Apollo — scorch a whole lane
        const lane = laneAtY(level, y);
        for (const e of this.enemies) if (!e.dead && e.lane === lane) this.damageEnemy(e, dmg);
        if (this.target && this.target.hp > 0) this.damageTarget(dmg); // the beam reaches the back wall
        this.emit('sunlance', { lane, y: laneCenterY(level, lane) });
      } else {                                       // point — Zeus (stun) / Poseidon (slow)
        const stun = p.stun ? p.stun + this.mods.powerStunAdd : 0;
        const r2 = p.radius * p.radius;
        const hit = [];
        for (const e of this.enemies) {
          if (e.dead) continue;
          const dx = e.x - x, dy = e.y - y;
          if (dx * dx + dy * dy <= r2) {
            this.damageEnemy(e, dmg);
            if (stun) e.stunT = Math.max(e.stunT, stun);
            if (p.slow) { e.slowMult = Math.min(e.slowMult, p.slow); e.slowT = Math.max(e.slowT, p.slowDur); }
            hit.push(e);
          }
        }
        if (this.mods.powerChain > 0) {
          const rest = this.enemies.filter((e) => !e.dead && !hit.includes(e))
            .sort((a, b) => ((a.x - x) ** 2 + (a.y - y) ** 2) - ((b.x - x) ** 2 + (b.y - y) ** 2));
          for (const e of rest.slice(0, this.mods.powerChain)) { this.damageEnemy(e, dmg * 0.7); if (stun) e.stunT = Math.max(e.stunT, stun); this.emit('bolt', { x: e.x, y: e.y, radius: 38 }); }
        }
        if (this.target && this.target.hp > 0) { const dx = this.target.x - x, dy = this.target.y - y; if (dx * dx + dy * dy <= r2) this.damageTarget(dmg); }
        this.emit('bolt', { x, y, radius: p.radius });
      }
      p.cdT = p.cooldown;
      return true;
    },

    // ---- damage ----
    // type: 'ranged' | 'melee' (mortal attacks, can be resisted) | undefined (divine
    // — god powers + the fort guardian ignore armour and resistances).
    damageEnemy(e, dmg, type) {
      if (e.dead) return;
      const buffD = this.armyBuff.t > 0 ? this.armyBuff.dmgMult : 1;
      const resist = (type && e.resist && e.resist[type]) ? e.resist[type] : 1;
      const real = Math.max(1, Math.round(dmg * this.mods.allyDmgMult * buffD * resist - e.armor));
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

    // your forces chipping the offensive target (stronghold/boss). Divine (powers) ignores
    // its resist; ranged is resisted by a stronghold (bring melee/gods to siege it).
    damageTarget(dmg, type) {
      const t = this.target; if (!t || t.hp <= 0) return;
      const resist = (type && t.resist && t.resist[type]) ? t.resist[type] : 1;
      const buffD = this.armyBuff.t > 0 ? this.armyBuff.dmgMult : 1;
      t.hp = Math.max(0, t.hp - Math.max(1, Math.round(dmg * this.mods.allyDmgMult * buffD * resist)));
      t.hitFlash = 0.12;
    },

    spawnProjectile(d, target, struct) { this.projectiles.spawn(d, target, struct); },

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
      if (this.target && this.target.kind === 'boss') stepBoss(this, dt);
      for (const p of this.powers) if (p.cdT > 0) p.cdT = Math.max(0, p.cdT - dt);
      if (this.armyBuff.t > 0) this.armyBuff.t = Math.max(0, this.armyBuff.t - dt);
      if (this.gateHp <= 0) { this.status = 'lost'; this.emit('lose', {}); return; }
      // offensive maps: win by destroying the target (can happen any time)
      if (this.target && this.target.hp <= 0) { this.status = 'won'; this.emit('win', {}); return; }
      if (this.spawner.spawnsDone() && this.enemies.length === 0) {
        if (this.mode === 'defense') {
          if (this.spawner.isLastWave) { this.status = 'won'; this.emit('win', {}); }
          else { this.status = 'waveclear'; this.emit('waveclear', { wave: this.spawner.current + 1 }); }
        } else if (!this.spawner.isLastWave) {
          // assault/boss: a breather + boon between garrison/add waves…
          this.status = 'waveclear'; this.emit('waveclear', { wave: this.spawner.current + 1 });
        }
        // …on the last wave the garrison is spent — keep fighting until the target falls.
      }
    },
    // advance to the next wave after the player picks a boon and sends it
    nextWave() {
      if (this.spawner.isLastWave) return;
      startWave(this, this.spawner.current + 1);
      this.status = 'playing';
    },
  };
  // permanent mythic relics — applied once, up-front, every battle
  for (const id of relics) { const r = RELIC_BY_ID[id]; if (r) r.apply(world); }
  return world;
}
