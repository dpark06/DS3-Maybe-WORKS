import { SYMBOLS, SYMBOL_KEYS } from './symbols.js';

// Mouse-only flourish: the cursor is the closed circle (the Entrance symbol), and the five symbols
// pop out behind it as you move, then fade away quickly. Touch screens and reduced motion skip the trail.
export function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const layer = document.createElement('div');
  layer.className = 'fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('div');
  dot.className = 'fx-dot';
  layer.appendChild(dot);
  document.body.appendChild(layer);
  document.documentElement.classList.add('has-cursor');

  // dialogs live in the browser's top layer, so the effect has to move inside an open dialog to stay visible
  const home = () => {
    const open = document.querySelector('dialog[open]');
    const target = open || document.body;
    if (layer.parentElement !== target) target.appendChild(layer);
  };
  new MutationObserver(home).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  document.addEventListener('close', home, true);

  let x = -100, y = -100, shown = false, lastX = -100, lastY = -100, lastT = 0, n = 0;
  const HOVER = 'a, button, input, select, textarea, summary, label, [role="tab"], .tile, .maplibregl-marker';

  const frame = () => {
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  function spawn(px, py) {
    const key = SYMBOL_KEYS[n++ % SYMBOL_KEYS.length];
    const s = SYMBOLS[key];
    const size = 22 + Math.random() * 16;                       // longest side, in px
    const k = size / Math.max(s.w, s.h);
    const el = document.createElement('div');
    el.className = 'fx-sym';
    el.style.cssText = `left:${px}px;top:${py}px;width:${s.w * k}px;height:${s.h * k}px;--r:${(Math.random() * 60 - 30).toFixed(0)}deg;--dx:${(Math.random() * 30 - 15).toFixed(0)}px;--dy:${(Math.random() * -26 - 6).toFixed(0)}px`;
    el.innerHTML = `<svg viewBox="0 0 ${s.w} ${s.h}" width="100%" height="100%"><path d="${s.d}" fill="#fff" stroke="#0B4AFF" stroke-width="7" paint-order="stroke" stroke-linejoin="round"/></svg>`;
    el.addEventListener('animationend', () => el.remove(), { once: true });
    layer.appendChild(el);
    while (layer.childElementCount > 40) layer.children[1]?.remove(); // never let them pile up
  }

  addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; layer.classList.add('is-on'); }
    dot.classList.toggle('is-hover', !!(e.target.closest && e.target.closest(HOVER)));
    if (reduce) return;
    const now = performance.now();
    if (now - lastT > 70 && Math.hypot(x - lastX, y - lastY) > 46) {
      spawn(x, y);
      lastX = x; lastY = y; lastT = now;
    }
  }, { passive: true });
  document.addEventListener('mouseleave', () => layer.classList.remove('is-on'));
  document.addEventListener('mouseenter', () => shown && layer.classList.add('is-on'));
  addEventListener('mousedown', () => dot.classList.add('is-down'));
  addEventListener('mouseup', () => dot.classList.remove('is-down'));
}
