// Battle screen (lane backbone). Mounts canvas + HUD, builds a World, runs the
// loop. Tap a card to see its info + arm it: stationary -> tap a glowing cell;
// troop -> tap a lane. Tap the power -> tap a target. Win/lose returns to the hub.

import { Game, syncDebug } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { RNG } from '../rng.js';
import { CanvasView } from '../engine/canvas.js';
import { GameLoop } from '../engine/loop.js';
import { attachInput } from '../engine/input.js';
import { renderWorld } from '../engine/render.js';
import { createWorld } from '../battle/world.js';
import { metaMods } from '../run/meta.js';
import { LEVELS, LEVEL_BY_ID, laneAtY } from '../data/levels.js';
import { DEFENDERS, DEFENDER_BY_ID } from '../data/defenders.js';
import { POWER_BY_ID } from '../data/powers.js';
import { saveMeta } from '../save.js';
import { icon } from '../icons.js';
import { go } from '../main.js';

function statLine(def) {
  if (def.kind === 'favor') return `+${def.gen} Favor/sec · ${def.hp} HP`;
  if (def.kind === 'ranged') return `${def.dmg} dmg · ${Math.round(def.range)} range · ${(1 / def.cooldown).toFixed(1)}/s · ${def.hp} HP`;
  if (def.kind === 'aura') return `+${Math.round((def.auraMult - 1) * 100)}% attack speed nearby · ${def.hp} HP`;
  if (def.kind === 'melee_unit') return `${def.dmg} dmg · ${def.hp} HP · marches & blocks`;
  return '';
}

export function renderBattle(opts = {}) {
  const level = opts.level || LEVEL_BY_ID[opts.levelId] || LEVELS[0];

  // ---------- DOM ----------
  const s = screen('battle');
  const canvas = el('canvas#battlefield');

  const favorVal = el('span', {}, '0');
  const gateBar = el('i');
  const gateVal = el('span', {}, '');
  const slainVal = el('span', {}, '0/0');
  const favorStat = el('div.hud-stat.favor', { title: 'Favor' }, [icon('coin', { size: 16 }), favorVal]);
  const gateStat = el('div.hud-stat.gate', { title: 'Fort HP' }, [icon('gate', { size: 16 }), el('span.bar', {}, [gateBar]), gateVal]);
  const slainStat = el('div.hud-stat', { title: 'Slain / total' }, [icon('skull', { size: 16 }), slainVal]);
  const speedBtn = el('button.hud-btn', { title: 'Speed', dataset: { testid: 'btn-speed' }, onclick: toggleSpeed }, '1×');
  const pauseBtn = el('button.hud-btn', { title: 'Pause', dataset: { testid: 'btn-pause' }, onclick: togglePause }, [icon('pause', { size: 18 })]);
  const hudTop = el('div.hud-top', {}, [favorStat, gateStat, slainStat, el('div.hud-spacer'), speedBtn, pauseBtn]);

  // power rail
  const powerDef = POWER_BY_ID['zeus_bolt'];
  const powerCd = el('span.cd');
  const powerBtn = el('button.power-btn', { dataset: { testid: 'btn-power' }, title: powerDef.name, onclick: armPower }, [icon('bolt', { size: 26 }), powerCd]);
  const powerRail = el('div.power-rail', {}, [powerBtn]);

  // info strip
  const infoEl = el('div.info-strip', { style: { display: 'none' } });

  // build tray
  const tray = el('div.build-tray');
  const trayCards = {};
  const unlocked = (Game.meta && Game.meta.unlockedDefenders) || DEFENDERS.map((d) => d.id);
  for (const id of unlocked) {
    const def = DEFENDER_BY_ID[id]; if (!def) continue;
    const card = el('div.build-card', { dataset: { testid: 'build-' + id }, onclick: () => selectCard(id) }, [
      el('span.glyph', { style: { color: def.color || '#f0d27a' } }, [icon(def.icon || 'laurel', { size: 28 })]),
      el('span.name', {}, def.name),
      el('span.cost', {}, [icon('coin', { size: 12 }), ' ' + def.cost]),
      el('span.tag', {}, def.deploy === 'lane' ? 'sortie' : 'wall'),
    ]);
    trayCards[id] = card;
    tray.append(card);
  }

  s.append(canvas, hudTop, powerRail, infoEl, tray);
  mount(s);

  // ---------- engine ----------
  const view = new CanvasView(canvas, level.world.w, level.world.h);
  const seed = (Game.run && Game.run.seed) || (Date.now() >>> 0);
  Game.rng = new RNG(seed);
  let fx = []; let floats = [];
  const world = createWorld(level, { rng: Game.rng, onEvent, mods: metaMods(Game.meta) });
  Game.battle = world; Game.screen = 'battle';
  window.__battle = world;

  let mode = 'idle';            // idle | placeCell | placeLane | target
  let selectedBuild = null;
  let selectedDefender = null;
  let menuEl = null, overlay = null;
  let paused = false, ended = false;
  let speed = (Game.meta && Game.meta.settings && Game.meta.settings.speed) || 1;

  const loop = new GameLoop({
    update: (dt) => world.step(dt),
    render: () => { stepFx(); renderWorld(view, world, { mode, fx, floats }); updateHud(); },
  });
  loop.setSpeed(speed); speedBtn.textContent = speed + '×';

  function onEvent(type, data) {
    if (type === 'favorFloat') floats.push({ x: data.x, y: data.y, text: '+' + data.amt, t: 0.9, life: 0.9 });
    else if (type === 'bolt') fx.push({ type: 'bolt', x: data.x, y: data.y, r: data.radius, t: 0.4, life: 0.4 });
    else if (type === 'godbolt') fx.push({ type: 'godbolt', x: data.x, y: data.y, t: 0.25, life: 0.25 });
    else if (type === 'impact') fx.push({ type: 'ring', x: data.x, y: data.y, r: data.splash || 12, t: 0.3, life: 0.3 });
    else if (type === 'win') endBattle('win');
    else if (type === 'lose') endBattle('lose');
  }
  function stepFx() {
    if (fx.length) { for (const f of fx) f.t -= 1 / 60; fx = fx.filter((f) => f.t > 0); }
    if (floats.length) { for (const f of floats) f.t -= 1 / 60; floats = floats.filter((f) => f.t > 0); }
  }

  // ---------- selection / info ----------
  function showInfo(def) {
    infoEl.style.display = 'flex';
    infoEl.replaceChildren(
      el('span.glyph', { style: { color: def.color } }, [icon(def.icon || 'laurel', { size: 22 })]),
      el('div.info-text', {}, [el('b', {}, `${def.name} — ${def.deploy === 'lane' ? 'tap a lane to send out' : 'tap a lane to post on the wall'}`), el('span', {}, def.blurb), el('span.stats', {}, statLine(def))]),
    );
  }
  function hideInfo() { infoEl.style.display = 'none'; }

  function selectCard(id) {
    closeMenu(); selectedDefender = null;
    if (selectedBuild === id) { clearSelection(); return; }
    selectedBuild = id;
    const def = DEFENDER_BY_ID[id];
    mode = def.deploy === 'lane' ? 'placeLane' : 'placeFort';
    showInfo(def); refreshTray(); refreshPower();
  }
  function clearSelection() { selectedBuild = null; mode = 'idle'; hideInfo(); refreshTray(); refreshPower(); }

  function refreshTray() {
    for (const id in trayCards) {
      const def = DEFENDER_BY_ID[id];
      trayCards[id].classList.toggle('selected', selectedBuild === id);
      trayCards[id].classList.toggle('unaffordable', world.favor.value < def.cost && selectedBuild !== id);
    }
  }

  function armPower() {
    if (ended || !world.powerReady()) return;
    closeMenu(); selectedDefender = null; selectedBuild = null;
    mode = mode === 'target' ? 'idle' : 'target';
    if (mode === 'target') { infoEl.style.display = 'flex'; infoEl.replaceChildren(el('div.info-text', {}, [el('b', {}, `${powerDef.name} — tap a target`), el('span', {}, powerDef.blurb)])); }
    else hideInfo();
    refreshTray(); refreshPower();
  }
  function refreshPower() {
    powerBtn.classList.toggle('armed', mode === 'target');
    powerBtn.classList.toggle('ready', world.powerReady() && mode !== 'target');
  }

  // ---------- tap ----------
  function onTap(w) {
    if (ended || paused) return;
    if (mode === 'target') { world.castPowerAt(w.x, w.y); mode = 'idle'; hideInfo(); refreshPower(); return; }
    if (selectedBuild) {
      const def = DEFENDER_BY_ID[selectedBuild];
      const lane = laneAtY(level, w.y);
      if (def.deploy === 'fort') world.recruitFort(selectedBuild, lane);
      else world.deployLane(selectedBuild, lane);
      refreshTray();
      return;
    }
    const occ = world.defenderAt(w.x, w.y);
    if (occ) { openMenu(occ); return; }
    closeMenu(); selectedDefender = null;
  }

  function worldToScreen(x, y) { const r = canvas.getBoundingClientRect(); return { left: r.left + view.offX + x * view.scale, top: r.top + view.offY + y * view.scale }; }

  function openMenu(d) {
    closeMenu(); selectedDefender = d;
    const upCost = world.upgradeCost(d);
    const refund = Math.round((d.def.cost + (d.tier > 1 ? d.def.upgrade.cost : 0)) * (d.def.sellRefund || 0.5));
    const items = [];
    if (upCost > 0) items.push(el('button.btn.btn-primary', { onclick: () => { if (world.upgrade(d)) openMenu(d); } }, `▲ ${upCost}`));
    else items.push(el('div.menu-max', {}, 'MAX'));
    items.push(el('button.btn.btn-ghost', { onclick: () => { world.sell(d); closeMenu(); selectedDefender = null; } }, `Sell +${refund}`));
    items.push(el('button.btn.btn-ghost', { onclick: () => { closeMenu(); selectedDefender = null; } }, '✕'));
    menuEl = el('div.def-menu', {}, items);
    document.getElementById('fx-layer').append(menuEl);
    const p = worldToScreen(d.x, d.y - 56); menuEl.style.left = p.left + 'px'; menuEl.style.top = p.top + 'px';
  }
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }

  // ---------- HUD ----------
  let affClock = 0;
  function updateHud() {
    favorVal.textContent = Math.floor(world.favor.value);
    const gr = world.gateHp / world.gateHpMax;
    gateBar.style.width = Math.max(0, gr * 100) + '%';
    gateBar.style.background = gr > 0.5 ? '#6fbf52' : gr > 0.25 ? '#e8c25c' : '#d6483b';
    gateVal.textContent = ' ' + Math.ceil(world.gateHp);
    slainVal.textContent = `${world.killed}/${world.spawner.total}`;
    const pcd = world.power.cooldown > 0 ? world.power.cdT / world.power.cooldown : 0;
    powerCd.style.setProperty('--cd', (pcd * 360) + 'deg');
    if (++affClock % 6 === 0) { refreshTray(); refreshPower(); }
    if (menuEl && selectedDefender) { const p = worldToScreen(selectedDefender.x, selectedDefender.y - 56); menuEl.style.left = p.left + 'px'; menuEl.style.top = p.top + 'px'; }
    syncDebug({ favor: Math.floor(world.favor.value), gateHp: world.gateHp, enemies: world.enemies.length, units: world.units.length, defenders: world.defenders.length, killed: world.killed, status: world.status, powerReady: world.powerReady() });
  }

  function toggleSpeed() { speed = speed === 1 ? 2 : 1; loop.setSpeed(speed); speedBtn.textContent = speed + '×'; if (Game.meta) Game.meta.settings.speed = speed; }
  function togglePause() { if (ended) return; paused = !paused; if (paused) { loop.pause(); showPause(); } else { loop.resume(); hideOverlay(); } pauseBtn.replaceChildren(icon(paused ? 'play' : 'pause', { size: 18 })); }

  // ---------- overlays ----------
  function hideOverlay() { if (overlay) { overlay.remove(); overlay = null; } }
  function showPause() {
    hideOverlay();
    overlay = el('div.overlay', {}, [el('div.panel', {}, [
      el('h2', {}, 'Paused'),
      el('button.btn.btn-primary', { onclick: togglePause }, 'Resume'),
      el('button.btn.btn-ghost', { onclick: () => { cleanup(); go('hub'); } }, 'Quit to hub'),
    ])]);
    document.getElementById('fx-layer').append(overlay);
  }
  function endBattle(kind) {
    if (ended) return; ended = true; loop.pause(); closeMenu(); selectedDefender = null; hideInfo();
    const win = kind === 'win';
    const base = win ? (level.reward && level.reward.meta) || 0 : 0;
    const earned = base + Math.floor(world.killed / 3); // Drachma always accrues, scaled by foes slain
    if (Game.meta) {
      Game.meta.currency += earned;
      if (win) Game.meta.progress.wins++;
      Game.meta.progress.runs++;
      saveMeta(Game.meta);
    }
    hideOverlay();
    overlay = el('div.overlay', {}, [el('div.panel' + (win ? '.win' : '.lose'), {}, [
      el('h2', {}, win ? 'Victory!' : 'The fort has fallen'),
      el('p', {}, win ? `The dead are turned back. +${earned} Drachma earned.` : `${world.killed} of the dead felled. +${earned} Drachma. The demigod returns to the Styx…`),
      el('div.row', {}, [
        el('button.btn.btn-primary', { dataset: { testid: 'btn-tohub' }, onclick: () => { cleanup(); go('hub'); } }, 'To the Hub'),
        el('button.btn.btn-ghost', { dataset: { testid: 'btn-retry' }, onclick: () => { cleanup(); renderBattle({ level }); } }, 'Retry'),
      ]),
    ])]);
    document.getElementById('fx-layer').append(overlay);
    syncDebug({ status: world.status });
  }

  // ---------- lifecycle ----------
  const detachInput = attachInput(view, canvas, onTap);
  const onResize = () => view.resize();
  const onVis = () => { if (ended || paused) return; if (document.hidden) loop.pause(); else loop.resume(); };
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);
  function cleanup() { loop.stop(); detachInput(); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); hideOverlay(); closeMenu(); Game.battle = null; }
  s._cleanup = cleanup;

  view.resize(); refreshTray(); refreshPower(); loop.start();
  syncDebug({ status: 'playing', favor: Math.floor(world.favor.value), gateHp: world.gateHp });
  return s;
}
