// Canvas setup: device-pixel-ratio scaling + letterbox fit of a fixed virtual
// world (e.g. 1280x720) into whatever the screen is. Provides world<->screen
// coordinate conversion so input and rendering agree.

export class CanvasView {
  constructor(canvas, worldW, worldH) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.worldW = worldW;
    this.worldH = worldH;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.scale = 1; this.offX = 0; this.offY = 0;
    this.cssW = 0; this.cssH = 0;
    this.resize();
  }
  resize() {
    const c = this.canvas;
    const cssW = c.clientWidth || window.innerWidth;
    const cssH = c.clientHeight || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cssW = cssW; this.cssH = cssH;
    c.width = Math.round(cssW * this.dpr);
    c.height = Math.round(cssH * this.dpr);
    // letterbox: cover would crop; we contain so the whole field is visible
    this.scale = Math.min(cssW / this.worldW, cssH / this.worldH);
    this.offX = (cssW - this.worldW * this.scale) / 2;
    this.offY = (cssH - this.worldH * this.scale) / 2;
  }
  toWorld(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left - this.offX) / this.scale,
      y: (clientY - r.top - this.offY) / this.scale,
    };
  }
  // Begin drawing in world coordinates; call end() after.
  begin() {
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.cssW, this.cssH);
    ctx.save();
    ctx.translate(this.offX, this.offY);
    ctx.scale(this.scale, this.scale);
    // clip to world rect so letterbox bands stay empty
    ctx.beginPath();
    ctx.rect(0, 0, this.worldW, this.worldH);
    ctx.clip();
  }
  end() { this.ctx.restore(); }
}
