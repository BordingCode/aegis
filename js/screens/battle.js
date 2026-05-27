// Battle screen (lane backbone). Mounts canvas + HUD, builds a World, runs the
// loop. Tap a card to see its info + arm it: wall unit -> tap a lane; troop -> tap
// a lane. Tap a god power -> tap a target / lane (or it fires at once). Win advances
// the run to the next map; death restarts the run. The active run is saved so you
// can leave the page and Continue from the current map.

import { Game, syncDebug } from '../state.js';
import { mount, screen, el } from '../ui.js';
import { RNG } from '../rng.js';
import { CanvasView } from '../engine/canvas.js';
import { GameLoop } from '../engine/loop.js';
import { attachInput } from '../engine/input.js';
import { renderWorld } from '../engine/render.js';
import { Sfx } from '../engine/audio.js';
import { createWorld } from '../battle/world.js';
import { metaMods } from '../run/meta.js';
import { LEVELS, LEVEL_BY_ID, RUN_LENGTH, ACTS, ROMAN, laneAtY } from '../data/levels.js';
import { DEFENDERS, DEFENDER_BY_ID } from '../data/defenders.js';
import { rollBoons, BOON_BY_ID } from '../data/boons.js';
import { saveMeta, saveRun, clearRun } from '../save.js';
import { icon } from '../icons.js';
import { go } from '../main.js';

function statLine(def) {
  if (def.kind === 'favor') return `+${def.gen} Favor/sec · ${def.hp} HP`;
  if (def.kind === 'heal') return `+${def.heal} HP/s to nearby allies · ${def.hp} HP`;
  if (def.kind === 'ranged') return `${def.dmg} dmg${def.splash ? ' splash' : ''} · ${Math.round(def.range)} range · ${(1 / def.cooldown).toFixed(1)}/s · ${def.hp} HP`;
  if (def.kind === 'aura') return `+${Math.round((def.auraMult - 1) * 100)}% attack speed nearby · ${def.hp} HP`;
  if (def.kind === 'melee_unit') return `${def.dmg} dmg · ${def.hp} HP · marches & blocks`;
  return '';
}

export function renderBattle(opts = {}) {
  const mapIndex = (Game.run && Game.run.mapIndex) || 0;
  const level = opts.level || LEVEL_BY_ID[opts.levelId] || LEVELS[mapIndex] || LEVELS[0];
  const act = ACTS[(level.act || 1) - 1];
  const mapLabel = `Act ${ROMAN[level.act || 1]} · ${level.name}`;

  // ---------- engine + world (built first; the HUD reads from it) ----------
  const s = screen('battle');
  const canvas = el('canvas#battlefield');
  const view = new CanvasView(canvas, level.world.w, level.world.h);
  const seed = ((Game.run && Game.run.seed) || (Date.now() >>> 0)) + mapIndex * 1013;
  Game.rng = new RNG(seed);
  let fx = []; let floats = [];

  const loadoutGods = (Game.run && Game.run.gods && Game.run.gods.length) ? Game.run.gods : null;
  const world = createWorld(level, { rng: Game.rng, onEvent, mods: metaMods(Game.meta), loadout: { gods: loadoutGods } });
  // Carry the run's boons into this map: re-apply each blessing to the fresh world
  // (no units exist yet, so HP/attack mods land on everything spawned here).
  if (Game.run && Array.isArray(Game.run.boons)) {
    for (const id of Game.run.boons) { const b = BOON_BY_ID[id]; if (b) { b.apply(world); world.boons.push(id); } }
  }
  Game.battle = world; Game.screen = 'battle';
  window.__battle = world;
  if (Game.run) { if (Game.run.earned == null) Game.run.earned = 0; saveRun(Game.run); } // resumable point = start of this map

  let mode = 'idle';            // idle | placeFort | placeLane | target
  let selectedBuild = null;
  let selectedDefender = null;
  let armedPower = null;
  let menuEl = null, overlay = null;
  let paused = false, ended = false, breather = false;
  let speed = (Game.meta && Game.meta.settings && Game.meta.settings.speed) || 1;

  // ---------- DOM / HUD ----------
  const favorVal = el('span', {}, '0');
  const gateBar = el('i');
  const gateVal = el('span', {}, '');
  const slainVal = el('span', {}, '0/0');
  const waveVal = el('span', {}, '1/7');
  const favorStat = el('div.hud-stat.favor', { title: 'Favor' }, [icon('coin', { size: 16 }), favorVal]);
  const gateStat = el('div.hud-stat.gate', { title: 'Fort HP' }, [icon('gate', { size: 16 }), el('span.bar', {}, [gateBar]), gateVal]);
  const waveStat = el('div.hud-stat', { title: 'Wave' }, [icon('laurel', { size: 16 }), waveVal]);
  const slainStat = el('div.hud-stat', { title: 'Slain / total' }, [icon('skull', { size: 16 }), slainVal]);
  const speedBtn = el('button.hud-btn', { title: 'Speed', dataset: { testid: 'btn-speed' }, onclick: toggleSpeed }, '1×');
  const muteBtn = el('button.hud-btn', { title: 'Sound', dataset: { testid: 'btn-mute' }, onclick: toggleMute }, [icon(Sfx.isMuted() ? 'mute' : 'sound', { size: 18 })]);
  const pauseBtn = el('button.hud-btn', { title: 'Pause', dataset: { testid: 'btn-pause' }, onclick: togglePause }, [icon('pause', { size: 18 })]);
  const hudTop = el('div.hud-top', {}, [favorStat, gateStat, waveStat, slainStat, el('div.hud-spacer'), muteBtn, speedBtn, pauseBtn]);
  const sendNextBtn = el('button.btn.btn-primary.send-next', { dataset: { testid: 'btn-send-wave' }, style: { display: 'none' }, onclick: () => sendNext() }, 'Send next wave  ▶');

  // power rail — one button per god in the loadout, each its own cooldown
  const powerBtns = world.powers.map((p) => {
    const cd = el('span.cd');
    const btn = el('button.power-btn', { dataset: { testid: 'btn-power-' + p.god }, title: `${p.name} · ${p.god}`, onclick: () => armPower(p) }, [icon(p.icon, { size: 24 }), cd]);
    return { p, btn, cd };
  });
  const powerRail = el('div.power-rail', {}, powerBtns.map((x) => x.btn));

  // info strip
  const infoEl = el('div.info-strip', { style: { display: 'none' } });

  // build tray — Shrine is always in the base; the rest is the run's loadout
  const trayIds = (Game.run && Game.run.units && Game.run.units.length)
    ? ['shrine', ...Game.run.units.filter((id) => id !== 'shrine')]
    : ((Game.meta && Game.meta.unlockedDefenders) || DEFENDERS.map((d) => d.id));
  const tray = el('div.build-tray');
  const trayCards = {};
  for (const id of trayIds) {
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

  // brief "Act I · The Dipylon Gate — Map 1/9" banner that fades on map start
  const banner = el('div.map-banner', {}, [
    el('b', {}, mapLabel),
    el('span', {}, `Map ${mapIndex + 1} / ${RUN_LENGTH}`),
  ]);

  s.append(canvas, hudTop, powerRail, infoEl, tray, sendNextBtn, banner);
  mount(s);
  setTimeout(() => banner.classList.add('gone'), 2600);
  setTimeout(() => banner.remove(), 3400);

  // ---------- loop ----------
  const loop = new GameLoop({
    update: (dt) => world.step(dt),
    render: () => { stepFx(); renderWorld(view, world, { mode, fx, floats }); updateHud(); },
  });
  loop.setSpeed(speed); speedBtn.textContent = speed + '×';

  function onEvent(type, data) {
    if (type === 'favorFloat') floats.push({ x: data.x, y: data.y, text: '+' + data.amt, t: 0.9, life: 0.9 });
    else if (type === 'bolt') { fx.push({ type: 'bolt', x: data.x, y: data.y, r: data.radius, t: 0.4, life: 0.4 }); Sfx.zap(); }
    else if (type === 'godbolt') { fx.push({ type: 'godbolt', x: data.x, y: data.y, t: 0.25, life: 0.25 }); Sfx.godzap(); }
    else if (type === 'impact') fx.push({ type: 'ring', x: data.x, y: data.y, r: data.splash || 12, t: 0.3, life: 0.3 });
    else if (type === 'sunlance') { for (let i = 0; i < 5; i++) fx.push({ type: 'bolt', x: level.fort.x + 130 + i * 200, y: data.y, r: 52, t: 0.45, life: 0.45 }); Sfx.zap(); }
    else if (type === 'warcry') { fx.push({ type: 'ring', x: level.fort.x + 40, y: level.world.h / 2, r: 60, t: 0.5, life: 0.5 }); Sfx.boon(); }
    else if (type === 'heal') floats.push({ x: data.x, y: data.y, text: '✚', t: 0.7, life: 0.7 });
    else if (type === 'spawn') markSeen(data.id);
    else if (type === 'kill') Sfx.kill();
    else if (type === 'gate') Sfx.gate();
    else if (type === 'deploy') Sfx.deploy();
    else if (type === 'build') Sfx.build();
    else if (type === 'sell') Sfx.sell();
    else if (type === 'boon') Sfx.boon();
    else if (type === 'waveclear') { Sfx.waveclear(); showBoonPicker(data.wave); }
    else if (type === 'win') { Sfx.win(); endBattle('win'); }
    else if (type === 'lose') { Sfx.lose(); endBattle('lose'); }
  }
  function stepFx() {
    if (fx.length) { for (const f of fx) f.t -= 1 / 60; fx = fx.filter((f) => f.t > 0); }
    if (floats.length) { for (const f of floats) f.t -= 1 / 60; floats = floats.filter((f) => f.t > 0); }
  }
  // record a foe in the bestiary the first time it is sighted
  function markSeen(id) {
    const seen = Game.meta && Game.meta.codex && Game.meta.codex.enemiesSeen;
    if (seen && !seen.includes(id)) { seen.push(id); saveMeta(Game.meta); }
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
    Sfx.resume(); Sfx.click();
    closeMenu(); selectedDefender = null; armedPower = null;
    if (selectedBuild === id) { clearSelection(); return; }
    selectedBuild = id;
    const def = DEFENDER_BY_ID[id];
    mode = def.deploy === 'lane' ? 'placeLane' : 'placeFort';
    showInfo(def); refreshTray(); refreshPowers();
  }
  function clearSelection() { selectedBuild = null; mode = 'idle'; hideInfo(); refreshTray(); refreshPowers(); }

  function refreshTray() {
    for (const id in trayCards) {
      const def = DEFENDER_BY_ID[id];
      trayCards[id].classList.toggle('selected', selectedBuild === id);
      trayCards[id].classList.toggle('unaffordable', world.favor.value < def.cost && selectedBuild !== id);
    }
  }

  function armPower(p) {
    if (ended || !world.powerReady(p)) return;
    closeMenu(); selectedDefender = null; selectedBuild = null;
    if (p.cast === 'self') {            // War Cry — fires immediately, no target
      world.castPower(p); armedPower = null; mode = 'idle'; hideInfo(); refreshTray(); refreshPowers(); return;
    }
    armedPower = (armedPower === p) ? null : p;
    mode = armedPower ? 'target' : 'idle';
    if (armedPower) {
      infoEl.style.display = 'flex';
      infoEl.replaceChildren(el('div.info-text', {}, [el('b', {}, `${p.name} — ${p.cast === 'lane' ? 'tap a lane' : 'tap a target'}`), el('span', {}, p.def.blurb)]));
    } else hideInfo();
    refreshTray(); refreshPowers();
  }
  function refreshPowers() {
    for (const { p, btn } of powerBtns) {
      btn.classList.toggle('armed', armedPower === p);
      btn.classList.toggle('ready', world.powerReady(p) && armedPower !== p);
    }
  }

  // ---------- tap ----------
  function onTap(w) {
    Sfx.resume(); // first gesture unlocks WebAudio (autoplay policy)
    if (ended || paused) return;
    if (mode === 'target' && armedPower) { world.castPower(armedPower, w.x, w.y); armedPower = null; mode = 'idle'; hideInfo(); refreshPowers(); return; }
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
    const lvlCost = world.levelCost(d);
    const refund = world.sellValue(d);
    const items = [el('div.menu-lvl', {}, 'Lv ' + d.level)];
    if (lvlCost > 0) items.push(el('button.btn.btn-primary', { onclick: () => { if (world.recruitFort(d.defId, d.lane)) openMenu(d); } }, `▲ ${lvlCost}`));
    else items.push(el('div.menu-max', {}, 'MAX'));
    items.push(el('button.btn.btn-ghost', { onclick: () => { world.sell(d); closeMenu(); selectedDefender = null; } }, `Sell +${refund}`));
    items.push(el('button.btn.btn-ghost', { onclick: () => { closeMenu(); selectedDefender = null; } }, '✕'));
    menuEl = el('div.def-menu', {}, items);
    s.append(menuEl);
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
    waveVal.textContent = `${world.spawner.current + 1}/${world.spawner.waveCount}`;
    for (const { p, cd } of powerBtns) { const f = p.cooldown > 0 ? p.cdT / p.cooldown : 0; cd.style.setProperty('--cd', (f * 360) + 'deg'); }
    if (++affClock % 6 === 0) { refreshTray(); refreshPowers(); }
    if (menuEl && selectedDefender) { const p = worldToScreen(selectedDefender.x, selectedDefender.y - 56); menuEl.style.left = p.left + 'px'; menuEl.style.top = p.top + 'px'; }
    syncDebug({ favor: Math.floor(world.favor.value), gateHp: world.gateHp, enemies: world.enemies.length, units: world.units.length, defenders: world.defenders.length, killed: world.killed, status: world.status });
  }

  function toggleSpeed() { speed = speed === 1 ? 2 : 1; loop.setSpeed(speed); speedBtn.textContent = speed + '×'; if (Game.meta) Game.meta.settings.speed = speed; }
  function toggleMute() { const m = Sfx.toggleMute(); muteBtn.replaceChildren(icon(m ? 'mute' : 'sound', { size: 18 })); }
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
    s.append(overlay);
  }
  function startFreshRun() {
    cleanup(); clearRun();
    go('prepare');
  }
  function endBattle(kind) {
    if (ended) return; ended = true; loop.pause(); closeMenu(); selectedDefender = null; hideInfo();
    sendNextBtn.style.display = 'none';
    const win = kind === 'win';
    const lastMap = mapIndex >= RUN_LENGTH - 1;

    // Drachma: per-map reward on a win, a clear bonus for finishing the run, and a
    // smaller consolation scaled by foes slain on a loss — it always accrues.
    let earned = Math.floor(world.killed / (win ? 4 : 3));
    if (win) earned += (level.reward && level.reward.meta) || 0;
    if (win && lastMap) earned += 60; // run-clear bonus

    // accomplishment tracking: how far this run got + the whole run's Drachma
    const priorBest = (Game.meta && Game.meta.progress.bestLevel) || 0;
    const reached = mapIndex + 1;
    const newBest = reached > priorBest;
    if (Game.run) Game.run.earned = (Game.run.earned || 0) + earned;
    const runTotal = (Game.run && Game.run.earned) || earned;

    if (Game.meta) {
      Game.meta.currency += earned;
      Game.meta.progress.bestLevel = Math.max(priorBest, reached);
      if (win && lastMap) Game.meta.progress.wins++;
      if (!win || lastMap) Game.meta.progress.runs++; // a run ends on death or on the final clear
      saveMeta(Game.meta);
    }
    hideOverlay();

    let title, body, actions;
    if (win && !lastMap) {
      // advance to the next map, carrying every boon + loadout (run stays saved)
      title = 'The line holds!';
      body = `${mapLabel} cleared. +${earned} Drachma. ${Game.run.boons.length} blessing${Game.run.boons.length === 1 ? '' : 's'} carry onward.`;
      actions = [
        el('button.btn.btn-primary', { dataset: { testid: 'btn-advance' }, onclick: () => { cleanup(); Game.run.mapIndex = mapIndex + 1; renderBattle({ level: LEVELS[Game.run.mapIndex] }); } }, 'March on  ▶'),
        el('button.btn.btn-ghost', { dataset: { testid: 'btn-tohub' }, onclick: () => { Game.run = null; clearRun(); cleanup(); go('hub'); } }, 'Abandon run'),
      ];
    } else if (win && lastMap) {
      Game.run = null; clearRun();
      title = 'The gates are sealed!';
      body = `The dead are turned back and Hades' seals hold. You have conquered the full gauntlet — ${runTotal} Drachma earned across the whole run. Glory to the demigod!`;
      actions = [
        el('button.btn.btn-primary', { dataset: { testid: 'btn-tohub' }, onclick: () => { cleanup(); go('hub'); } }, 'Return to the Hub'),
      ];
    } else {
      Game.run = null; clearRun();
      title = 'The fort has fallen';
      const far = `You held to ${mapLabel} — map ${reached} of ${RUN_LENGTH}` + (newBest ? ', your deepest run yet!' : '.');
      body = `${far} ${world.killed} of the dead felled here. This run earned ${runTotal} Drachma in all — spend it in the Hall of the Gods to come back stronger.`;
      actions = [
        el('button.btn.btn-primary', { dataset: { testid: 'btn-restart' }, onclick: startFreshRun }, 'Begin a new run'),
        el('button.btn.btn-ghost', { dataset: { testid: 'btn-tohub' }, onclick: () => { cleanup(); go('hub'); } }, 'To the Hub'),
      ];
    }

    overlay = el('div.overlay', {}, [el('div.panel' + (win ? '.win' : '.lose'), {}, [
      el('h2', {}, title),
      el('p', {}, body),
      el('div.row', {}, actions),
    ])]);
    s.append(overlay);
    syncDebug({ status: world.status });
  }

  // ---------- boons between waves ----------
  function showBoonPicker(waveNum) {
    loop.pause(); breather = true;
    clearSelection(); closeMenu(); selectedDefender = null; armedPower = null;
    if (mode === 'target') { mode = 'idle'; hideInfo(); refreshPowers(); }
    const offered = rollBoons(world.rng, world.boons, 3);
    const cards = offered.map((b) => el('button.boon-card', { dataset: { testid: 'boon-' + b.id }, onclick: () => { world.pickBoon(b); if (Game.run) { (Game.run.boons || (Game.run.boons = [])).push(b.id); saveRun(Game.run); } hideOverlay(); showBreather(); } }, [
      el('span.boon-glyph', {}, [icon(b.icon || 'laurel', { size: 30 })]),
      el('span.boon-god', {}, b.god),
      el('b', {}, b.name),
      el('span.boon-desc', {}, b.desc),
    ]));
    hideOverlay();
    overlay = el('div.overlay', {}, [el('div.panel.boon-panel', {}, [
      el('h2', {}, `Wave ${waveNum} held`),
      el('p', {}, 'Choose a blessing of the gods'),
      el('div.boon-grid', {}, cards),
    ])]);
    s.append(overlay);
  }
  function showBreather() { sendNextBtn.style.display = ''; } // paused; build/level freely, then send
  function sendNext() { sendNextBtn.style.display = 'none'; breather = false; world.nextWave(); loop.resume(); }

  // ---------- lifecycle ----------
  const detachInput = attachInput(view, canvas, onTap);
  const onResize = () => view.resize();
  const onVis = () => { if (ended || paused || breather) return; if (document.hidden) loop.pause(); else loop.resume(); };
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);
  function cleanup() { loop.stop(); detachInput(); window.removeEventListener('resize', onResize); document.removeEventListener('visibilitychange', onVis); hideOverlay(); closeMenu(); Game.battle = null; }
  s._cleanup = cleanup;

  view.resize(); refreshTray(); refreshPowers(); loop.start();
  syncDebug({ status: 'playing', favor: Math.floor(world.favor.value), gateHp: world.gateHp });
  return s;
}
