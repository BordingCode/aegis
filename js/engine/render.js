// Battlefield renderer. Pure draw from world state — no mutation. Side view:
// sprites (when art exists) are flipped horizontally by travel direction; until
// then we draw emoji. Background/path are drawn each frame (cheap at this size).

import { sprite } from '../art.js';

function drawEntity(ctx, x, y, size, art, emoji, faceLeft, color) {
  const img = art ? sprite(art) : null;
  if (img && img.complete && img.naturalWidth > 0) {
    const h = size * 1.7, w = h * (img.naturalWidth / img.naturalHeight);
    ctx.save();
    ctx.translate(x, y);
    if (faceLeft) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -h, w, h); // anchored at feet
    ctx.restore();
    return;
  }
  // Fallback token: a coloured disc so the unit reads even without emoji fonts,
  // with the emoji drawn on top where the platform supports it.
  const cy = y - size * 0.38, r = size * 0.5;
  ctx.beginPath(); ctx.arc(x, cy + 3, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = color || '#9aa7b5'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
  ctx.font = `${Math.round(size * 0.66)}px "Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillText(emoji || '•', x, cy + 1);
}

function drawHpBar(ctx, x, y, w, ratio) {
  const h = 5;
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(x - w / 2 - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = ratio > 0.5 ? '#6fbf52' : ratio > 0.25 ? '#e8c25c' : '#d6483b';
  ctx.fillRect(x - w / 2, y, w * ratio, h);
}

export function renderWorld(view, world, opts = {}) {
  const ctx = view.ctx;
  const W = world.level.world.w, H = world.level.world.h;
  const now = performance.now() / 1000;
  view.begin();

  // background — sprite if generated, else a sunny Act-1 gradient
  const bg = sprite(world.level.bg);
  if (bg && bg.complete && bg.naturalWidth > 0) {
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#9ecbe6'); g.addColorStop(0.52, '#cfe3a8'); g.addColorStop(1, '#b39a64');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  // path
  const pts = world.path.pts;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = '#7a6038'; ctx.lineWidth = 58; ctx.stroke();
  ctx.strokeStyle = '#d8c08f'; ctx.lineWidth = 44; ctx.stroke();

  // gate
  const gp = world.level.gatePos;
  if (gp) {
    ctx.fillStyle = '#d9cdb0'; ctx.fillRect(gp.x + 10, gp.y - 96, 26, 150);
    ctx.fillRect(gp.x + 78, gp.y - 96, 26, 150);
    ctx.fillStyle = '#b9892f'; ctx.fillRect(gp.x + 2, gp.y - 110, 112, 22);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(gp.x + 36, gp.y - 88, 42, 142);
  }

  // plots
  for (const p of world.plots) {
    if (p.occupant) continue;
    if (opts.buildMode) {
      const pulse = 0.5 + 0.5 * Math.sin(now * 4);
      ctx.beginPath(); ctx.arc(p.x, p.y, 30 + pulse * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(240,210,122,${0.5 + pulse * 0.4})`; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = 'rgba(240,210,122,.16)'; ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, 26, 12, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  // selected defender range ring
  if (opts.selectedDefender) {
    const d = opts.selectedDefender;
    const r = d.range || d.auraRange || 0;
    if (r > 0) {
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(47,143,206,.14)'; ctx.fill();
      ctx.strokeStyle = 'rgba(47,143,206,.7)'; ctx.lineWidth = 3; ctx.stroke();
    }
  }

  // defenders
  for (const d of world.defenders) {
    if (d.fireFlash > 0) { ctx.beginPath(); ctx.arc(d.x, d.y - 30, 30, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,210,.35)'; ctx.fill(); }
    drawEntity(ctx, d.x, d.y, d.kind === 'favor' ? 44 : 46, d.art, d.emoji, false, d.color);
    if (d.tier > 1) { ctx.fillStyle = '#f0d27a'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('★', d.x + 18, d.y - 52); }
  }

  // enemies
  for (const e of world.enemies) {
    const faceLeft = Math.cos(e.angle) < -0.2;
    const size = e.maxHp > 200 ? 70 : 40;
    if (e.hitFlash > 0) {
      ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(e.x, e.y - size * 0.3, size * 0.5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
    }
    drawEntity(ctx, e.x, e.y, size, e.art, e.emoji, faceLeft, e.color);
    drawHpBar(ctx, e.x, e.y - size - 6, e.maxHp > 200 ? 60 : 34, Math.max(0, e.hp / e.maxHp));
  }

  // projectiles
  ctx.fillStyle = '#5a4326';
  for (const p of world.projectiles.active) {
    if (p._dead) continue;
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
  }

  // transient impact FX
  if (opts.fx) {
    for (const f of opts.fx) {
      const a = Math.max(0, f.t / f.life);
      ctx.beginPath(); ctx.arc(f.x, f.y, (1 - a) * (f.r + 10) + 6, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,238,180,${a})`; ctx.lineWidth = 3; ctx.stroke();
    }
  }

  view.end();
}
