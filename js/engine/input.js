// Pointer input: converts a tap to world coordinates and hands it to the screen,
// which does the hit-testing (it knows the current build/selection state).
//
// iOS Safari can lose or mis-fire a tap if the finger slides a little between
// down and up, so we capture the pointer on `pointerdown`, fire the tap, and
// release cleanly on `pointerup`/`pointercancel` (no double-fire).

export function attachInput(view, canvas, onTap) {
  const onDown = (ev) => {
    ev.preventDefault();
    try { canvas.setPointerCapture(ev.pointerId); } catch (_) { /* unsupported */ }
    const w = view.toWorld(ev.clientX, ev.clientY);
    onTap(w, ev);
  };
  const release = (ev) => {
    try { if (canvas.hasPointerCapture(ev.pointerId)) canvas.releasePointerCapture(ev.pointerId); } catch (_) {}
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', release);
    canvas.removeEventListener('pointercancel', release);
  };
}
