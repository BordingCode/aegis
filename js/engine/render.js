// Battlefield renderer for the lane backbone. Pure draw from world state.
// Entities are drawn as hand-built cartoon-Greek figures (engine/sprites.js); when
// AI art exists for an entity its image is drawn instead. Fort + Zeus, stone build
// sockets, arrow projectiles, and light terrain decoration round out the scene.

import { sprite } from '../art.js';
import { laneHeight, laneCenterY } from '../data/levels.js';
import { drawCreature, drawFort, drawZeus } from './sprites.js';

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// Entity = AI sprite if present, else a drawn figure. Anchored at feet (x,y).
function drawEntity(ctx, id, x, y, h, art, faceLeft, color) {
  const img = art ? sprite(art) : null;
  if (img && img.complete && img.naturalWidth > 0) {
    const ih = h * 1.8, iw = ih * (img.naturalWidth / img.naturalHeight);
    ctx.save(); ctx.translate(x, y); if (faceLeft) ctx.scale(-1, 1);
    ctx.drawImage(img, -iw / 2, -ih, iw, ih); ctx.restore();
    return;
  }
  drawCreature(ctx, id, x, y, h, faceLeft, color);
}

function drawHpBar(ctx, x, y, w, ratio, friendly) {
  const h = 5;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = friendly ? (ratio > 0.5 ? '#6fbf52' : ratio > 0.25 ? '#e8c25c' : '#d6483b')
    : (ratio > 0.5 ? '#d6483b' : '#e8c25c');
  ctx.fillRect(x - w / 2, y, w * ratio, h);
}

// ---- terrain decoration (deterministic per level) ------------------------
const decoCache = new Map();
function hash(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function decorations(level) {
  if (decoCache.has(level.id)) return decoCache.get(level.id);
  let s = hash(level.id); const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const W = level.world.w, H = level.world.h, x0 = level.grid.x0 - 30;
  const tufts = [], stones = [], cols = [];
  for (let i = 0; i < 22; i++) tufts.push({ x: x0 + rnd() * (W - x0), y: 30 + rnd() * (H - 40), s: 0.7 + rnd() * 0.8 });
  for (let i = 0; i < 9; i++) stones.push({ x: x0 + rnd() * (W - x0), y: 40 + rnd() * (H - 60), s: 0.6 + rnd() * 1 });
  for (let i = 0; i < 5; i++) cols.push({ x: x0 + 60 + rnd() * (W - x0 - 120), y: 30 + rnd() * 60, h: 50 + rnd() * 40 });
  const d = { tufts, stones, cols }; decoCache.set(level.id, d); return d;
}

export function renderWorld(view, world, opts = {}) {
  const ctx = view.ctx;
  const level = world.level;
  const W = level.world.w, H = level.world.h;
  const lh = laneHeight(level);
  const now = performance.now() / 1000;
  view.begin();

  // background
  const bg = sprite(level.bg);
  if (bg && bg.complete && bg.naturalWidth > 0) ctx.drawImage(bg, 0, 0, W, H);
  else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#acd6ea'); g.addColorStop(0.42, '#cfe3a6'); g.addColorStop(1, '#b89a62');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // distant ruined columns
    const d = decorations(level);
    for (const c of d.cols) { ctx.fillStyle = 'rgba(246,239,221,.28)'; ctx.fillRect(c.x, c.y, 12, c.h); ctx.fillRect(c.x - 3, c.y, 18, 5); }
    // ground stones + grass tufts
    for (const st of d.stones) { ctx.fillStyle = 'rgba(120,110,90,.25)'; ctx.beginPath(); ctx.ellipse(st.x, st.y, 9 * st.s, 5 * st.s, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(90,120,50,.35)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    for (const t of d.tufts) { for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(t.x + k * 4 * t.s, t.y); ctx.lineTo(t.x + k * 6 * t.s, t.y - 9 * t.s); ctx.stroke(); } }
  }

  // lane bands + separators
  for (let i = 0; i < level.lanes; i++) { ctx.fillStyle = i % 2 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.05)'; ctx.fillRect(0, i * lh, W, lh); }
  ctx.strokeStyle = 'rgba(60,50,20,.10)'; ctx.lineWidth = 2;
  for (let i = 1; i < level.lanes; i++) { ctx.beginPath(); ctx.moveTo(0, i * lh); ctx.lineTo(W, i * lh); ctx.stroke(); }

  // placement highlight — choose a lane (wall units post at the fort; troops sortie)
  if (opts.mode === 'placeLane' || opts.mode === 'placeFort') {
    const fort = opts.mode === 'placeFort';
    const rgb = fort ? '240,210,122' : '111,134,184';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '28px sans-serif';
    for (let i = 0; i < level.lanes; i++) {
      const pulse = 0.5 + 0.5 * Math.sin(now * 4 + i);
      ctx.fillStyle = `rgba(${rgb},${0.08 + pulse * 0.1})`;
      ctx.fillRect(world.fortX, i * lh + 6, W - world.fortX, lh - 12);
      ctx.fillStyle = `rgba(${rgb},${0.45 + pulse * 0.4})`;
      if (fort) ctx.fillRect(world.fortX, i * lh + 12, 16, lh - 24);
      else ctx.fillText('▶', world.fortX + 54, laneCenterY(level, i));
    }
  }

  // fort + Zeus on the left
  drawFort(ctx, world.fortX, H);
  drawZeus(ctx, world.fortX - 34, H * 0.5 + 36, world.god.flash);

  // oracle auras (persistent so support reads)
  for (const d of world.defenders) {
    if (d.dead || d.kind !== 'aura') continue;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.auraRange, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(176,123,208,.10)'; ctx.fill();
    ctx.strokeStyle = 'rgba(176,123,208,.4)'; ctx.lineWidth = 2; ctx.stroke();
  }

  // collect drawables and sort by y so lower (closer) ones overlap higher ones
  const foot = (e) => e.y + 16;
  // defenders
  for (const d of world.defenders) {
    if (d.dead) continue;
    const fy = foot(d);
    if (d.fireFlash > 0) { ctx.beginPath(); ctx.arc(d.x, fy - 30, 26, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,210,.35)'; ctx.fill(); }
    drawEntity(ctx, d.defId, d.x, fy, 56, d.art, false, d.color);
    if (d.maxHp) drawHpBar(ctx, d.x, fy - 64, 36, Math.max(0, d.hp / d.maxHp), true);
    if (d.level > 1) {
      ctx.fillStyle = '#1b1206'; ctx.beginPath(); ctx.arc(d.x + 20, fy - 58, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f0d27a'; ctx.beginPath(); ctx.arc(d.x + 20, fy - 58, 11, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = '#f0d27a'; ctx.stroke();
      ctx.fillStyle = '#f0d27a'; ctx.font = 'bold 13px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.level, d.x + 20, fy - 57);
    }
  }
  // troops
  for (const u of world.units) {
    if (u.dead) continue; const fy = foot(u);
    drawEntity(ctx, u.defId, u.x, fy, 54, u.art, false, u.color);
    drawHpBar(ctx, u.x, fy - 62, 34, Math.max(0, u.hp / u.maxHp), true);
  }
  // enemies (face left)
  for (const e of world.enemies) {
    if (e.dead) continue; const fy = foot(e);
    const size = e.boss ? 94 : 50;
    if (e.hitFlash > 0) { ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(e.x, fy - size * 0.4, size * 0.4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore(); }
    drawEntity(ctx, e.defId, e.x, fy, size, e.art, true, e.color);
    drawHpBar(ctx, e.x, fy - size - 6, e.boss ? 62 : 34, Math.max(0, e.hp / e.maxHp), false);
    if (e.stunT > 0) { ctx.fillStyle = '#f0d27a'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✦', e.x, fy - size - 16); }
  }

  // projectiles — drawn as little arrows pointing at their target
  for (const p of world.projectiles.active) {
    if (p._dead) continue;
    const a = Math.atan2(p.ty - p.y, p.tx - p.x);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(a);
    ctx.strokeStyle = '#5a4326'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(6, 0); ctx.stroke();
    ctx.fillStyle = '#d9d2c2'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(4, -4); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // transient FX
  if (opts.fx) {
    for (const f of opts.fx) {
      const a = Math.max(0, f.t / f.life);
      if (f.type === 'godbolt') lightning(ctx, world.fortX - 30, H * 0.5 - 24, f.x, f.y, 3, `rgba(245,230,150,${a})`);
      else if (f.type === 'bolt') {
        lightning(ctx, f.x, 0, f.x, f.y, 5, `rgba(245,235,170,${a})`);
        ctx.beginPath(); ctx.arc(f.x, f.y, (1 - a) * f.r + 8, 0, Math.PI * 2); ctx.strokeStyle = `rgba(245,235,170,${a})`; ctx.lineWidth = 4; ctx.stroke();
      } else { ctx.beginPath(); ctx.arc(f.x, f.y, (1 - a) * (f.r + 10) + 6, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255,238,180,${a})`; ctx.lineWidth = 3; ctx.stroke(); }
    }
  }
  if (opts.floats) {
    ctx.textAlign = 'center'; ctx.font = 'bold 22px Nunito, sans-serif';
    for (const f of opts.floats) { const a = Math.max(0, f.t / f.life); ctx.fillStyle = `rgba(240,210,122,${a})`; ctx.fillText(f.text, f.x, f.y - (1 - a) * 26); }
  }
  if (opts.mode === 'target') { ctx.fillStyle = 'rgba(20,40,70,.28)'; ctx.fillRect(0, 0, W, H); }

  view.end();
}

function lightning(ctx, x1, y1, x2, y2, w, color) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1);
  for (let i = 1; i < 5; i++) { const t = i / 5; ctx.lineTo(x1 + (x2 - x1) * t + (Math.random() - 0.5) * 26, y1 + (y2 - y1) * t + (Math.random() - 0.5) * 14); }
  ctx.lineTo(x2, y2); ctx.stroke();
}
