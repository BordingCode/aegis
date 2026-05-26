// Hand-drawn cartoon-Greek figures for the battlefield, drawn on canvas so they
// look intentional on every device (no emoji-font dependency). Each creature is
// anchored at its FEET (x,y = ground contact) and drawn facing right; the renderer
// flips enemies. When AI art exists for an entity, the renderer draws that instead
// — these are the always-available fallback.

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
}
function shadow(ctx, r) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.32, 0, 0, Math.PI * 2); ctx.fill(); }
const LEG = '#3b3450', SKIN = '#e8c79c';

// humanoid base: legs + torso + head. Returns head-centre y for adding gear.
function humanoid(ctx, h, body) {
  ctx.fillStyle = LEG; rrect(ctx, -0.16 * h, -0.34 * h, 0.11 * h, 0.34 * h, 0.03 * h);
  ctx.fillStyle = LEG; rrect(ctx, 0.05 * h, -0.34 * h, 0.11 * h, 0.34 * h, 0.03 * h);
  ctx.fillStyle = body; rrect(ctx, -0.2 * h, -0.72 * h, 0.4 * h, 0.42 * h, 0.1 * h);
  const hy = -0.84 * h;
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, hy, 0.15 * h, 0, Math.PI * 2); ctx.fill();
  return hy;
}

function hoplite(ctx, h, color) {
  const hy = humanoid(ctx, h, color || '#6f86b8');
  // bronze helmet + red crest
  ctx.fillStyle = '#caa24a'; ctx.beginPath(); ctx.arc(0, hy, 0.16 * h, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#c0392b'; rrect(ctx, -0.05 * h, hy - 0.34 * h, 0.1 * h, 0.2 * h, 0.04 * h);
  // spear (held back, over shoulder, pointing up-forward)
  ctx.strokeStyle = '#7a531a'; ctx.lineWidth = 0.05 * h; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-0.1 * h, -0.2 * h); ctx.lineTo(0.16 * h, -0.95 * h); ctx.stroke();
  ctx.fillStyle = '#d9d2c2'; ctx.beginPath(); ctx.moveTo(0.16 * h, -0.95 * h); ctx.lineTo(0.1 * h, -0.86 * h); ctx.lineTo(0.22 * h, -0.86 * h); ctx.closePath(); ctx.fill();
  // round shield (front)
  ctx.fillStyle = '#e8c25c'; ctx.beginPath(); ctx.arc(0.16 * h, -0.5 * h, 0.2 * h, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#9a7322'; ctx.lineWidth = 0.04 * h; ctx.stroke();
  ctx.fillStyle = '#9a7322'; ctx.beginPath(); ctx.arc(0.16 * h, -0.5 * h, 0.06 * h, 0, Math.PI * 2); ctx.fill();
}

function toxotes(ctx, h, color) {
  const hy = humanoid(ctx, h, color || '#7bb05a');
  ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.arc(0, hy, 0.15 * h, Math.PI * 0.9, Math.PI * 2.1); ctx.fill(); // hair
  // bow + string (front)
  ctx.strokeStyle = '#7a531a'; ctx.lineWidth = 0.05 * h; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0.18 * h, -0.5 * h, 0.34 * h, -Math.PI * 0.45, Math.PI * 0.45); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 0.02 * h;
  ctx.beginPath(); ctx.moveTo(0.32 * h, -0.66 * h); ctx.lineTo(0.32 * h, -0.34 * h); ctx.stroke();
}

function oracle(ctx, h, color) {
  const c = color || '#b07bd0';
  // hooded robe (teardrop)
  ctx.fillStyle = c; ctx.beginPath();
  ctx.moveTo(0, -0.98 * h); ctx.quadraticCurveTo(0.34 * h, -0.5 * h, 0.22 * h, 0); ctx.lineTo(-0.22 * h, 0);
  ctx.quadraticCurveTo(-0.34 * h, -0.5 * h, 0, -0.98 * h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, -0.7 * h, 0.13 * h, 0.16 * h, 0, 0, Math.PI * 2); ctx.fill(); // hood shadow
  // glowing eye
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -0.46 * h, 0.12 * h, 0.08 * h, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -0.46 * h, 0.045 * h, 0, Math.PI * 2); ctx.fill();
}

function shrine(ctx, h) {
  ctx.fillStyle = 'rgba(240,210,122,.35)'; ctx.beginPath(); ctx.arc(0, -0.55 * h, 0.5 * h, 0, Math.PI * 2); ctx.fill(); // glow
  ctx.fillStyle = '#efe7d2'; rrect(ctx, -0.34 * h, -0.12 * h, 0.68 * h, 0.12 * h, 0.02 * h); // base
  ctx.fillStyle = '#f6efdd'; // columns
  rrect(ctx, -0.28 * h, -0.7 * h, 0.1 * h, 0.58 * h, 0.02 * h);
  rrect(ctx, 0.18 * h, -0.7 * h, 0.1 * h, 0.58 * h, 0.02 * h);
  ctx.fillStyle = '#efe7d2'; rrect(ctx, -0.32 * h, -0.78 * h, 0.64 * h, 0.1 * h, 0.02 * h); // architrave
  ctx.fillStyle = '#e8c25c'; ctx.beginPath(); ctx.moveTo(-0.36 * h, -0.78 * h); ctx.lineTo(0.36 * h, -0.78 * h); ctx.lineTo(0, -1.0 * h); ctx.closePath(); ctx.fill(); // pediment
}

function shade(ctx, h, color) {
  ctx.save(); ctx.globalAlpha = 0.82;
  ctx.fillStyle = color || '#9fb4cc'; ctx.beginPath();
  ctx.arc(0, -0.62 * h, 0.32 * h, Math.PI, 0); // round top
  const b = -0.3 * h; // wavy bottom
  ctx.lineTo(0.32 * h, b); ctx.quadraticCurveTo(0.21 * h, b + 0.12 * h, 0.1 * h, b);
  ctx.quadraticCurveTo(0, b + 0.12 * h, -0.1 * h, b); ctx.quadraticCurveTo(-0.21 * h, b + 0.12 * h, -0.32 * h, b);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(20,30,50,.85)';
  ctx.beginPath(); ctx.arc(-0.1 * h, -0.66 * h, 0.05 * h, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0.1 * h, -0.66 * h, 0.05 * h, 0, Math.PI * 2); ctx.fill();
}

function skeleton(ctx, h) {
  ctx.fillStyle = LEG; rrect(ctx, -0.13 * h, -0.3 * h, 0.07 * h, 0.3 * h, 0.02 * h);
  ctx.fillStyle = LEG; rrect(ctx, 0.06 * h, -0.3 * h, 0.07 * h, 0.3 * h, 0.02 * h);
  // ribcage
  ctx.fillStyle = '#e8e2cf'; rrect(ctx, -0.16 * h, -0.66 * h, 0.32 * h, 0.36 * h, 0.06 * h);
  ctx.strokeStyle = 'rgba(60,52,40,.5)'; ctx.lineWidth = 0.03 * h;
  for (let i = 0; i < 3; i++) { const ry = -0.58 * h + i * 0.1 * h; ctx.beginPath(); ctx.moveTo(-0.13 * h, ry); ctx.lineTo(0.13 * h, ry); ctx.stroke(); }
  // skull
  ctx.fillStyle = '#f2eede'; ctx.beginPath(); ctx.arc(0, -0.82 * h, 0.16 * h, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2330'; ctx.beginPath(); ctx.arc(-0.06 * h, -0.83 * h, 0.045 * h, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0.06 * h, -0.83 * h, 0.045 * h, 0, Math.PI * 2); ctx.fill();
}

function harpy(ctx, h, color) {
  const c = color || '#cf9b63';
  // airborne — lift the whole figure
  ctx.save(); ctx.translate(0, -0.2 * h);
  ctx.fillStyle = '#8a6a3f'; // wings
  ctx.beginPath(); ctx.moveTo(0, -0.45 * h); ctx.lineTo(-0.5 * h, -0.62 * h); ctx.lineTo(-0.12 * h, -0.3 * h); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -0.45 * h); ctx.lineTo(0.5 * h, -0.62 * h); ctx.lineTo(0.12 * h, -0.3 * h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -0.4 * h, 0.16 * h, 0.22 * h, 0, 0, Math.PI * 2); ctx.fill(); // body
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0.08 * h, -0.6 * h, 0.11 * h, 0, Math.PI * 2); ctx.fill(); // head
  ctx.fillStyle = '#e0a83c'; ctx.beginPath(); ctx.moveTo(0.18 * h, -0.6 * h); ctx.lineTo(0.3 * h, -0.57 * h); ctx.lineTo(0.18 * h, -0.54 * h); ctx.closePath(); ctx.fill(); // beak
  ctx.restore();
}

function minotaur(ctx, h, color) {
  const c = color || '#c0563f';
  ctx.fillStyle = '#5a3a2a'; rrect(ctx, -0.2 * h, -0.36 * h, 0.14 * h, 0.36 * h, 0.03 * h); // legs
  rrect(ctx, 0.06 * h, -0.36 * h, 0.14 * h, 0.36 * h, 0.03 * h);
  ctx.fillStyle = c; rrect(ctx, -0.28 * h, -0.78 * h, 0.56 * h, 0.5 * h, 0.12 * h); // big torso
  ctx.fillStyle = '#7a3022'; rrect(ctx, -0.2 * h, -1.02 * h, 0.4 * h, 0.28 * h, 0.1 * h); // head
  ctx.fillStyle = '#f2eee0'; // horns
  ctx.beginPath(); ctx.moveTo(-0.2 * h, -0.98 * h); ctx.quadraticCurveTo(-0.42 * h, -1.06 * h, -0.36 * h, -1.2 * h); ctx.lineTo(-0.28 * h, -1.04 * h); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0.2 * h, -0.98 * h); ctx.quadraticCurveTo(0.42 * h, -1.06 * h, 0.36 * h, -1.2 * h); ctx.lineTo(0.28 * h, -1.04 * h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4d03f'; ctx.beginPath(); ctx.arc(-0.08 * h, -0.9 * h, 0.04 * h, 0, Math.PI * 2); ctx.fill(); // eyes
  ctx.beginPath(); ctx.arc(0.08 * h, -0.9 * h, 0.04 * h, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8c9b0'; ctx.beginPath(); ctx.arc(0, -0.78 * h, 0.05 * h, 0, Math.PI * 2); ctx.fill(); // snout ring
}

function genericToken(ctx, h, color) {
  ctx.fillStyle = color || '#9aa7b5'; ctx.beginPath(); ctx.arc(0, -0.4 * h, 0.34 * h, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 0.05 * h; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.stroke();
}

export function drawCreature(ctx, id, x, y, h, faceLeft, color) {
  ctx.save(); ctx.translate(x, y); if (faceLeft) ctx.scale(-1, 1);
  shadow(ctx, h * 0.34);
  ({ hoplite, toxotes, oracle, shrine, shade, skeleton, harpy, minotaur }[id] || genericToken)(ctx, h, color);
  ctx.restore();
}

// ---- fort + Zeus ---------------------------------------------------------
export function drawFort(ctx, fortX, H) {
  // stone body with block courses
  const g = ctx.createLinearGradient(0, 0, fortX, 0);
  g.addColorStop(0, '#b9ac8a'); g.addColorStop(1, '#d6cbac');
  ctx.fillStyle = g; ctx.fillRect(0, 0, fortX, H);
  ctx.strokeStyle = 'rgba(90,75,45,.35)'; ctx.lineWidth = 2;
  for (let y = 0; y < H; y += 38) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(fortX, y); ctx.stroke(); }
  for (let y = 0; y < H; y += 38) { const off = (Math.floor(y / 38) % 2) * 40; for (let x = off; x < fortX; x += 80) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 38); ctx.stroke(); } }
  // battlements along the right edge
  ctx.fillStyle = '#9b8a63'; for (let y = 0; y < H; y += 44) ctx.fillRect(fortX - 18, y + 6, 18, 24);
  ctx.fillStyle = '#8a7a55'; ctx.fillRect(fortX - 6, 0, 6, H);
  // gate arch (centre)
  const gy = H * 0.5;
  ctx.fillStyle = '#6b5836'; ctx.beginPath();
  ctx.moveTo(fortX * 0.28, gy + 90); ctx.lineTo(fortX * 0.28, gy - 30);
  ctx.arc(fortX * 0.5, gy - 30, fortX * 0.22, Math.PI, 0); ctx.lineTo(fortX * 0.72, gy + 90); ctx.closePath(); ctx.fill();
  // hanging banners
  for (const bx of [fortX * 0.16, fortX * 0.84]) {
    ctx.fillStyle = '#9a2f24'; ctx.beginPath(); ctx.moveTo(bx - 9, 30); ctx.lineTo(bx + 9, 30); ctx.lineTo(bx + 9, 96); ctx.lineTo(bx, 86); ctx.lineTo(bx - 9, 96); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8c25c'; ctx.beginPath(); ctx.arc(bx, 56, 5, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawZeus(ctx, x, baseY, flash) {
  const h = 96;
  ctx.save(); ctx.translate(x, baseY);
  if (flash > 0) { ctx.fillStyle = `rgba(245,230,150,${flash * 2})`; ctx.beginPath(); ctx.arc(0, -h * 0.55, h * 0.7, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // robe
  ctx.fillStyle = '#f4eede'; ctx.beginPath();
  ctx.moveTo(-0.2 * h, 0); ctx.lineTo(0.2 * h, 0); ctx.lineTo(0.12 * h, -0.62 * h); ctx.lineTo(-0.12 * h, -0.62 * h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d9c27a'; ctx.fillRect(-0.2 * h, -0.08 * h, 0.4 * h, 0.05 * h); // gold hem
  // arms: one raised holding a bolt
  ctx.strokeStyle = '#f4eede'; ctx.lineWidth = 0.09 * h; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0.06 * h, -0.5 * h); ctx.lineTo(0.26 * h, -0.74 * h); ctx.stroke();
  // head + beard
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(0, -0.72 * h, 0.13 * h, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e9e3d2'; ctx.beginPath(); ctx.arc(0, -0.68 * h, 0.15 * h, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill(); // beard
  ctx.fillStyle = '#e9e3d2'; ctx.beginPath(); ctx.arc(0, -0.78 * h, 0.14 * h, Math.PI, 0); ctx.fill(); // hair
  // lightning bolt in raised hand
  ctx.strokeStyle = '#f4d03f'; ctx.lineWidth = 0.05 * h; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(0.26 * h, -0.78 * h); ctx.lineTo(0.34 * h, -0.66 * h); ctx.lineTo(0.28 * h, -0.62 * h); ctx.lineTo(0.4 * h, -0.46 * h); ctx.stroke();
  ctx.restore();
}
