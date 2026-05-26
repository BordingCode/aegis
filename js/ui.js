// Tiny DOM helpers + screen management. No framework.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** el('button.btn.primary', {onclick, dataset:{}, attrs}, [children|text]) */
export function el(tag, props = {}, children = []) {
  const parts = tag.split(/(?=[.#])/);
  const node = document.createElement(parts[0] || 'div');
  for (const p of parts.slice(1)) {
    if (p[0] === '.') node.classList.add(p.slice(1));
    else if (p[0] === '#') node.id = p.slice(1);
  }
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className += ' ' + v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v != null && v !== false) node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

const appRoot = () => document.getElementById('app');

/** Replace the current screen with `node` (a .screen element). */
export function mount(node) {
  const app = appRoot();
  app.replaceChildren(node);
  return node;
}

/** Build a standard .screen wrapper. Accepts space-separated extra classes. */
export function screen(className = '') {
  const cls = className.trim().split(/\s+/).filter(Boolean).map((c) => '.' + c).join('');
  return el('section.screen' + cls);
}

export function hideSplash() {
  const s = document.getElementById('splash');
  if (s) { s.classList.add('hide'); setTimeout(() => s.remove(), 600); }
}
