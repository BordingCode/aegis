// Procedural sound — a tiny WebAudio synth, zero asset files. Every SFX is a
// short oscillator / noise blip with a gain envelope, mixed through one master
// gain. Browser-only (the headless sim never imports this). Muteable + persisted,
// and gesture-unlocked to satisfy the autoplay policy (call resume() on a tap).

const KEY = 'aegis-muted';
const VOL = 0.32;
let ctx = null, master = null;
let muted = false;
try { muted = localStorage.getItem(KEY) === '1'; } catch (_) { /* private mode */ }

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOL;
    master.connect(ctx.destination);
  } catch (_) { ctx = null; }
  return ctx;
}

export function resume() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); }
export function isMuted() { return muted; }
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (_) { /* ignore */ }
  if (master) master.gain.value = muted ? 0 : VOL;
  if (!muted) resume();
  return muted;
}

// One tone: oscillator with optional frequency glide and an attack/decay envelope.
function tone({ freq = 440, to = freq, type = 'sine', dur = 0.12, vol = 0.5, delay = 0 }) {
  const c = ensure(); if (!c || muted) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

// One filtered noise burst (impacts, the lightning crack).
function noise({ dur = 0.18, vol = 0.5, type = 'highpass', freq = 1200, delay = 0 }) {
  const c = ensure(); if (!c || muted) return;
  const t0 = c.currentTime + delay;
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t0); src.stop(t0 + dur);
}

let lastKill = 0; // throttle: kills can fire many per frame

export const Sfx = {
  resume, isMuted, toggleMute,
  click()    { tone({ freq: 520, to: 680, type: 'triangle', dur: 0.05, vol: 0.22 }); },
  deploy()   { tone({ freq: 300, to: 470, type: 'square', dur: 0.11, vol: 0.28 }); },     // troop sorties out
  build()    { tone({ freq: 220, to: 150, type: 'sine', dur: 0.13, vol: 0.4 }); noise({ dur: 0.06, vol: 0.18, type: 'lowpass', freq: 400 }); }, // wall post / level-up
  sell()     { tone({ freq: 680, to: 480, type: 'triangle', dur: 0.12, vol: 0.3 }); },
  zap()      { noise({ dur: 0.2, vol: 0.45, type: 'highpass', freq: 2400 }); tone({ freq: 900, to: 110, type: 'sawtooth', dur: 0.2, vol: 0.3 }); }, // tap-cast lightning
  godzap()   { noise({ dur: 0.12, vol: 0.22, type: 'highpass', freq: 2600 }); tone({ freq: 760, to: 180, type: 'sawtooth', dur: 0.12, vol: 0.18 }); }, // fort-god auto-smite
  kill()     { const now = (ctx ? ctx.currentTime : 0); if (now - lastKill < 0.045) return; lastKill = now; noise({ dur: 0.09, vol: 0.22, type: 'bandpass', freq: 700 }); },
  gate()     { tone({ freq: 140, to: 90, type: 'square', dur: 0.16, vol: 0.42 }); },        // enemy strikes the fort
  boon()     { tone({ freq: 660, type: 'sine', dur: 0.16, vol: 0.32 }); tone({ freq: 990, type: 'sine', dur: 0.22, vol: 0.3, delay: 0.1 }); },
  waveclear(){ [466, 587, 698].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, vol: 0.3, delay: i * 0.09 })); },
  win()      { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.3, vol: 0.33, delay: i * 0.12 })); },
  lose()     { tone({ freq: 330, to: 150, type: 'sawtooth', dur: 0.7, vol: 0.34 }); },
};
