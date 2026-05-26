// Battlefield renderer for the lane backbone. Pure draw from world state.
// Side view: fort + god on the left, 5 lanes, a grid of build cells, enemies
// marching left, troops marching right. Sprites (when art exists) flip by facing;
// until then we draw coloured tokens + emoji.

import { sprite } from '../art.js';
import { laneHeight, laneCenterY, cellCenterX } from '../data/levels.js';

function drawEntity(ctx, x, y, size, art, emoji, faceLeft, color) {
  const img = art ? sprite(art) : null;
  if (img && img.complete && img.naturalWidth > 0) {
    const h = size * 1.7, w = h * (img.naturalWidth / img.naturalHeight);
    ctx.save(); ctx.translate(x, y); if (faceLeft) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
    return;
  }
  const cy = y - size * 0.34, r = size * 0.5;
  ctx.beginPath(); ctx.arc(x, cy + 3, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fillStyle = color || '#9aa7b5'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
  ctx.font = `${Math.round(size * 0.62)}px "Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillText(emoji || '•', x, cy + 1);
}

function drawHpBar(ctx, x, y, w, ratio, friendly) {
  const h = 5;
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = friendly ? (ratio > 0.5 ? '#6fbf52' : ratio > 0.25 ? '#e8c25c' : '#d6483b')
    : (ratio > 0.5 ? '#d6483b' : '#e8c25c');
  ctx.fillRect(x - w / 2, y, w * ratio, h);
}

function drawGod(ctx, gx, top, flash) {
  // simple standing figure of Zeus on the fort: white robe, gold trim, a bolt
  ctx.save();
  ctx.translate(gx, top);
  if (flash > 0) { ctx.beginPath(); ctx.arc(0, -34, 46, 0, Math.PI * 2); ctx.fillStyle = `rgba(240,225,150,${flash * 2})`; ctx.fill(); }
  ctx.fillStyle = '#f4eede';                       // robe
  ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(16, 0); ctx.lineTo(11, -44); ctx.lineTo(-11, -44); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d9c27a'; ctx.fillRect(-16, -6, 32, 5);   // gold hem
  ctx.fillStyle = '#e8cfa0'; ctx.beginPath(); ctx.arc(0, -52, 10, 0, Math.PI * 2); ctx.fill(); // head
  ctx.fillStyle = '#e9e3d2'; ctx.beginPath(); ctx.arc(0, -56, 11, Math.PI, 0); ctx.fill();     // hair/beard hint
  ctx.strokeStyle = '#f0d27a'; ctx.lineWidth = 4; ctx.lineCap = 'round';                       // bolt in hand
  ctx.beginPath(); ctx.moveTo(18, -40); ctx.lineTo(26, -30); ctx.lineTo(20, -28); ctx.lineTo(30, -16); ctx.stroke();
  ctx.restore();
}

function lightning(ctx, x1, y1, x2, y2, w, color) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1);
  const segs = 5;
  for (let i = 1; i < segs; i++) {
    const t = i / segs; const jx = (Math.random() - 0.5) * 26;
    ctx.lineTo(x1 + (x2 - x1) * t + jx, y1 + (y2 - y1) * t + (Math.random() - 0.5) * 14);
  }
  ctx.lineTo(x2, y2); ctx.stroke();
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
    g.addColorStop(0, '#a9d3ea'); g.addColorStop(0.55, '#cfe1a6'); g.addColorStop(1, '#b59a63');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // lane bands + separators
  for (let i = 0; i < level.lanes; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.05)';
    ctx.fillRect(0, i * lh, W, lh);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2;
  for (let i = 1; i < level.lanes; i++) { ctx.beginPath(); ctx.moveTo(0, i * lh); ctx.lineTo(W, i * lh); ctx.stroke(); }

  // lane-deploy highlight (mobile troop selected)
  if (opts.mode === 'placeLane') {
    for (let i = 0; i < level.lanes; i++) {
      const pulse = 0.5 + 0.5 * Math.sin(now * 4 + i);
      ctx.fillStyle = `rgba(111,134,184,${0.1 + pulse * 0.12})`;
      ctx.fillRect(level.grid.x0 - 10, i * lh + 6, W - level.grid.x0, lh - 12);
      ctx.fillStyle = `rgba(111,134,184,${0.4 + pulse * 0.4})`; ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('▶', level.grid.x0 + 40, laneCenterY(level, i));
    }
  }

  // build grid cells
  const cols = level.grid.cols, cw = level.grid.cellW;
  for (let lane = 0; lane < level.lanes; lane++) {
    for (let col = 0; col < cols; col++) {
      const cx = cellCenterX(level, col), cy = laneCenterY(level, lane);
      const can = world.canPlace(lane, col);
      if (opts.mode === 'placeCell') {
        if (can) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 5);
          ctx.fillStyle = `rgba(240,210,122,${0.12 + pulse * 0.12})`;
          ctx.strokeStyle = `rgba(240,210,122,${0.6 + pulse * 0.3})`; ctx.lineWidth = 3;
          roundRect(ctx, cx - cw / 2 + 4, cy - lh / 2 + 6, cw - 8, lh - 12, 10); ctx.fill(); ctx.stroke();
        }
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1.5;
        roundRect(ctx, cx - cw / 2 + 5, cy - lh / 2 + 7, cw - 10, lh - 14, 8); ctx.stroke();
      }
    }
  }

  // fort wall on the left + god
  ctx.fillStyle = '#cdbf9c'; ctx.fillRect(0, 0, world.fortX, H);
  ctx.fillStyle = '#b6a37a'; ctx.fillRect(world.fortX - 16, 0, 16, H);
  for (let y = 0; y < H; y += 44) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, y, world.fortX, 4); }
  ctx.fillStyle = '#9b8a63'; for (let y = -6; y < H; y += 40) ctx.fillRect(world.fortX - 16, y, 16, 18); // crenellation
  drawGod(ctx, world.fortX - 40, H * 0.5, world.god.flash);

  // oracle auras (persistent so the support reads)
  for (const d of world.defenders) {
    if (d.kind !== 'aura') continue;
    ctx.beginPath(); ctx.arc(d.x, d.y, d.auraRange, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(176,123,208,.10)'; ctx.fill();
    ctx.strokeStyle = 'rgba(176,123,208,.4)'; ctx.lineWidth = 2; ctx.stroke();
  }

  // defenders
  for (const d of world.defenders) {
    if (d.dead) continue;
    if (d.fireFlash > 0) { ctx.beginPath(); ctx.arc(d.x, d.y - 24, 26, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,210,.35)'; ctx.fill(); }
    drawEntity(ctx, d.x, d.y, 50, d.art, d.emoji, false, d.color);
    if (d.maxHp) drawHpBar(ctx, d.x, d.y - 46, 36, Math.max(0, d.hp / d.maxHp), true);
    if (d.tier > 1) { ctx.fillStyle = '#f0d27a'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', d.x + 16, d.y - 50); }
  }

  // mobile troops (face right)
  for (const u of world.units) {
    if (u.dead) continue;
    drawEntity(ctx, u.x, u.y, 48, u.art, u.emoji, false, u.color);
    drawHpBar(ctx, u.x, u.y - 44, 34, Math.max(0, u.hp / u.maxHp), true);
  }

  // enemies (face left)
  for (const e of world.enemies) {
    if (e.dead) continue;
    const size = e.boss ? 74 : 42;
    if (e.hitFlash > 0) { ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(e.x, e.y - size * 0.34, size * 0.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore(); }
    drawEntity(ctx, e.x, e.y, size, e.art, e.emoji, true, e.color);
    drawHpBar(ctx, e.x, e.y - size - 4, e.boss ? 60 : 34, Math.max(0, e.hp / e.maxHp), false);
    if (e.stunT > 0) { ctx.fillStyle = '#f0d27a'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✦', e.x, e.y - size - 14); }
  }

  // projectiles
  ctx.fillStyle = '#5a4326';
  for (const p of world.projectiles.active) { if (!p._dead) { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); } }

  // transient FX
  if (opts.fx) {
    for (const f of opts.fx) {
      const a = Math.max(0, f.t / f.life);
      if (f.type === 'godbolt') lightning(ctx, world.fortX - 40, H * 0.5 - 50, f.x, f.y, 3, `rgba(245,230,150,${a})`);
      else if (f.type === 'bolt') {
        lightning(ctx, f.x, 0, f.x, f.y, 5, `rgba(245,235,170,${a})`);
        ctx.beginPath(); ctx.arc(f.x, f.y, (1 - a) * (f.r) + 8, 0, Math.PI * 2); ctx.strokeStyle = `rgba(245,235,170,${a})`; ctx.lineWidth = 4; ctx.stroke();
      } else { ctx.beginPath(); ctx.arc(f.x, f.y, (1 - a) * (f.r + 10) + 6, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255,238,180,${a})`; ctx.lineWidth = 3; ctx.stroke(); }
    }
  }
  // floating texts (+Favor)
  if (opts.floats) {
    ctx.textAlign = 'center'; ctx.font = 'bold 22px Nunito, sans-serif';
    for (const f of opts.floats) { const a = Math.max(0, f.t / f.life); ctx.fillStyle = `rgba(240,210,122,${a})`; ctx.fillText(f.text, f.x, f.y - (1 - a) * 26); }
  }

  // power targeting veil
  if (opts.mode === 'target') { ctx.fillStyle = 'rgba(20,40,70,.28)'; ctx.fillRect(0, 0, W, H); }

  view.end();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
