// Pointer input: converts a tap to world coordinates and hands it to the screen,
// which does the hit-testing (it knows the current build/selection state).

export function attachInput(view, canvas, onTap) {
  const handler = (ev) => {
    ev.preventDefault();
    const w = view.toWorld(ev.clientX, ev.clientY);
    onTap(w, ev);
  };
  canvas.addEventListener('pointerdown', handler);
  return () => canvas.removeEventListener('pointerdown', handler);
}
