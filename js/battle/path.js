// The enemy path: a polyline of waypoints in world coordinates. Enemies store a
// single scalar `dist` (distance travelled); posAt maps it to {x,y,angle}.

export class Path {
  constructor(points) {
    this.pts = points;
    this.cum = [0];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      this.cum.push(total);
    }
    this.length = total;
  }
  posAt(d) {
    const pts = this.pts;
    if (d <= 0) {
      const a = pts[0], b = pts[1] || a;
      return { x: a.x, y: a.y, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    if (d >= this.length) {
      const a = pts[pts.length - 2] || pts[0], b = pts[pts.length - 1];
      return { x: b.x, y: b.y, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    let i = 1;
    while (i < this.cum.length && this.cum[i] < d) i++;
    const segStart = this.cum[i - 1], segLen = this.cum[i] - segStart;
    const t = segLen > 0 ? (d - segStart) / segLen : 0;
    const a = pts[i - 1], b = pts[i];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
  }
}
