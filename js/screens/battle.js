// Battle screen: mounts the canvas + DOM HUD, builds a World, and runs the loop.
// Handles taps (build / select / upgrade / sell), pause, speed, and win/lose.

import { Game, syncDebug } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { RNG } from '../rng.js';
import { CanvasView } from '../engine/canvas.js';
import { GameLoop } from '../engine/loop.js';
import { attachInput } from '../engine/input.js';
import { renderWorld } from '../engine/render.js';
import { createWorld } from '../battle/world.js';
import { LEVELS, LEVEL_BY_ID } from '../data/levels.js';
import { DEFENDERS, DEFENDER_BY_ID } from '../data/defenders.js';
import { icon, EMOJI } from '../icons.js';
import { go } from '../main.js';

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
  const gateStat = el('div.hud-stat.gate', { title: 'Gate HP' }, [icon('gate', { size: 16 }), el('span.bar', {}, [gateBar]), gateVal]);
  const slainStat = el('div.hud-stat', { title: 'Slain / total' }, [icon('skull', { size: 16 }), slainVal]);
  const speedBtn = el('button.hud-btn', { title: 'Speed', dataset: { testid: 'btn-speed' }, onclick: toggleSpeed }, '1×');
  const pauseBtn = el('button.hud-btn', { title: 'Pause', dataset: { testid: 'btn-pause' }, onclick: togglePause }, [icon('pause', { size: 18 })]);
  const hudTop = el('div.hud-top', {}, [favorStat, gateStat, slainStat, el('div.hud-spacer'), speedBtn, pauseBtn]);

  const tray = el('div.build-tray');
  const trayCards = {};
  const unlocked = (Game.meta && Game.meta.unlockedDefenders) || DEFENDERS.map((d) => d.id);
  for (const id of unlocked) {
    const def = DEFENDER_BY_ID[id]; if (!def) continue;
    const card = el('div.build-card', { dataset: { testid: 'build-' + id }, onclick: () => selectBuild(id) }, [
      el('span.glyph', { style: { color: def.color || '#f0d27a' } }, [icon(def.icon || 'laurel', { size: 30 })]),
      el('span.name', {}, def.name),
      el('span.cost', {}, [icon('coin', { size: 13 }), ' ' + def.cost]),
    ]);
    trayCards[id] = card;
    tray.append(card);
  }

  s.append(canvas, hudTop, tray);
  mount(s);

  // ---------- engine ----------
  const view = new CanvasView(canvas, level.world.w, level.world.h);
  const seed = (Game.run && Game.run.seed) || (Date.now() >>> 0);
  Game.rng = new RNG(seed);
  let fx = [];
  const world = createWorld(level, { rng: Game.rng, onEvent });
  Game.battle = world; Game.screen = 'battle';
  window.__battle = world; // debug/test hook

  let selectedBuild = null;
  let selectedDefender = null;
  let menuEl = null;
  let overlay = null;
  let paused = false;
  let ended = false;
  let speed = (Game.meta && Game.meta.settings && Game.meta.settings.speed) || 1;

  const loop = new GameLoop({
    update: (dt) => world.step(dt),
    render: () => { stepFx(); renderWorld(view, world, { buildMode: !!selectedBuild, selectedDefender, fx }); updateHud(); },
  });
  loop.setSpeed(speed);
  speedBtn.textContent = speed + '×';

  function onEvent(type, data) {
    if (type === 'impact') fx.push({ x: data.x, y: data.y, r: data.splash || 14, t: 0.35, life: 0.35 });
    else if (type === 'melee') fx.push({ x: data.target.x, y: data.target.y, r: 10, t: 0.18, life: 0.18 });
    else if (type === 'win') endBattle('win');
    else if (type === 'lose') endBattle('lose');
  }
  function stepFx() { for (const f of fx) f.t -= 1 / 60; if (fx.length) fx = fx.filter((f) => f.t > 0); }

  // ---------- interaction ----------
  function selectBuild(id) {
    closeMenu(); selectedDefender = null;
    selectedBuild = selectedBuild === id ? null : id;
    refreshTray();
  }
  function refreshTray() {
    for (const id in trayCards) {
      const def = DEFENDER_BY_ID[id];
      trayCards[id].classList.toggle('selected', selectedBuild === id);
      trayCards[id].classList.toggle('unaffordable', world.favor.value < def.cost && selectedBuild !== id);
    }
  }

  function onTap(w) {
    if (ended || paused || world.status !== 'playing') return;
    const plot = world.plotAt(w.x, w.y);
    if (selectedBuild) {
      if (plot && !plot.occupant) { if (world.build(plot.id, selectedBuild)) selectedBuild = null; }
      else selectedBuild = null;
      refreshTray();
      return;
    }
    if (plot && plot.occupant) { openMenu(plot.occupant); return; }
    closeMenu(); selectedDefender = null;
  }

  function worldToScreen(x, y) {
    const r = canvas.getBoundingClientRect();
    return { left: r.left + view.offX + x * view.scale, top: r.top + view.offY + y * view.scale };
  }

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
    const p = worldToScreen(d.x, d.y - 64);
    menuEl.style.left = p.left + 'px'; menuEl.style.top = p.top + 'px';
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
    if (++affClock % 6 === 0) refreshTray();
    if (menuEl && selectedDefender) { const p = worldToScreen(selectedDefender.x, selectedDefender.y - 64); menuEl.style.left = p.left + 'px'; menuEl.style.top = p.top + 'px'; }
    syncDebug({ favor: Math.floor(world.favor.value), gateHp: world.gateHp, enemies: world.enemies.length, killed: world.killed, status: world.status });
  }

  function toggleSpeed() { speed = speed === 1 ? 2 : 1; loop.setSpeed(speed); speedBtn.textContent = speed + '×'; if (Game.meta) Game.meta.settings.speed = speed; }
  function togglePause() {
    if (ended) return;
    paused = !paused;
    if (paused) { loop.pause(); showPause(); } else { loop.resume(); hideOverlay(); }
    pauseBtn.replaceChildren(icon(paused ? 'play' : 'pause', { size: 18 }));
  }

  // ---------- overlays ----------
  function hideOverlay() { if (overlay) { overlay.remove(); overlay = null; } }
  function showPause() {
    hideOverlay();
    overlay = el('div.overlay', {}, [el('div.panel', {}, [
      el('h2', {}, 'Paused'),
      el('button.btn.btn-primary', { onclick: togglePause }, 'Resume'),
      el('button.btn.btn-ghost', { onclick: () => { cleanup(); go('title'); } }, 'Quit to title'),
    ])]);
    document.getElementById('fx-layer').append(overlay);
  }
  function endBattle(kind) {
    if (ended) return; ended = true; loop.pause(); closeMenu(); selectedDefender = null;
    const win = kind === 'win';
    if (win && Game.meta) Game.meta.currency += (level.reward && level.reward.meta) || 0;
    hideOverlay();
    overlay = el('div.overlay', {}, [el('div.panel' + (win ? '.win' : '.lose'), {}, [
      el('h2', {}, win ? 'Victory!' : 'The gate has fallen'),
      el('p', {}, win ? `The dead are turned back. +${(level.reward && level.reward.meta) || 0} Drachma.` : 'The dead pour through. The demigod returns…'),
      el('div.row', {}, [
        el('button.btn.btn-primary', { dataset: { testid: win ? 'btn-continue' : 'btn-retry' }, onclick: () => { cleanup(); renderBattle({ level }); } }, win ? 'Play again' : 'Retry'),
        el('button.btn.btn-ghost', { onclick: () => { cleanup(); go('title'); } }, 'Title'),
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

  function cleanup() {
    loop.stop(); detachInput();
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    hideOverlay(); closeMenu(); Game.battle = null;
  }
  s._cleanup = cleanup;

  view.resize();
  refreshTray();
  loop.start();
  syncDebug({ status: 'playing', favor: Math.floor(world.favor.value), gateHp: world.gateHp });
  return s;
}
