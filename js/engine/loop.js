// Fixed-timestep game loop. Sim advances in deterministic 1/60s slices; render
// runs once per frame and is passed `alpha` (0..1) for optional interpolation.
// Speed (1x/2x) multiplies how much sim time passes per real frame.

const STEP = 1 / 60;
const MAX_STEPS = 8; // clamp to avoid spiral-of-death after a stall

export class GameLoop {
  constructor({ update, render }) {
    this.update = update;       // (step:number) => void
    this.render = render;       // (alpha:number) => void
    this.running = false;
    this.paused = false;
    this.speed = 1;
    this.acc = 0;
    this.last = 0;
    this._raf = 0;
    this._tick = this._tick.bind(this);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    this._raf = requestAnimationFrame(this._tick);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
  }
  pause() { this.paused = true; }
  resume() { if (this.paused) { this.paused = false; this.last = performance.now(); } }
  setSpeed(n) { this.speed = n; }

  _tick(now) {
    if (!this.running) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1; // tab was backgrounded etc.
    if (!this.paused) {
      this.acc += dt * this.speed;
      let steps = 0;
      while (this.acc >= STEP && steps < MAX_STEPS * this.speed) {
        this.update(STEP);
        this.acc -= STEP;
        steps++;
      }
      if (steps >= MAX_STEPS * this.speed) this.acc = 0; // drop backlog
    }
    this.render(this.acc / STEP);
    this._raf = requestAnimationFrame(this._tick);
  }
}

export { STEP };
