import './style.css';
import { SYMBOLS, SYMBOL_KEYS, symbolSVG } from './symbols.js';
import { initCursor } from './cursor.js';
import { url } from './base.js';

// Nav: mark the current page, and tell CSS how tall the bar is (the hero sticks under it).
export function initNav() {
  const page = document.body.dataset.page;
  const key = { home: 'home', food: 'food', find: 'find' }[page];
  document.querySelectorAll('.nav__links a').forEach((a) => {
    if (a.dataset.nav === key) a.setAttribute('aria-current', 'page');
  });
  const nav = document.querySelector('.nav');
  const set = () => document.documentElement.style.setProperty('--nav-h', `${nav.offsetHeight}px`);
  set();
  new ResizeObserver(set).observe(nav);
}

// The five symbols, listed the way the label lists them.
export function initKeys() {
  const li = SYMBOL_KEYS.map((k) => `<li>${symbolSVG(k)}<span>${SYMBOLS[k].name}</span></li>`).join('');
  document.getElementById('key-list')?.insertAdjacentHTML('beforeend', li);
  document.getElementById('legend-list')?.insertAdjacentHTML('beforeend', li);
}

// Images sometimes fail once on flaky mobile connections. Try each one again a single time before giving up.
export function retryBrokenImages(root = document) {
  root.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || img.dataset.retried || !img.src || img.src.startsWith('data:')) return;
    img.dataset.retried = '1';
    const u = new URL(img.src);
    u.searchParams.set('r', Date.now().toString(36));
    setTimeout(() => { img.src = u.toString(); }, 400);
  }, true);
}

initNav();
retryBrokenImages();
initCatWalk();
initCursor();

// Footer cat: an animated WebP (transparent, plays in every browser with no video codec or autoplay rules).
// This sets how fast it walks across, and swaps in a still picture when reduced motion is on.
export function initCatWalk() {
  const cat = document.querySelector('.catwalk__cat');
  if (!cat) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { cat.src = url('img/cat-run-poster.webp'); return; }
  const speed = () => {                                   // walking speed scales with the cat's size
    const r = cat.getBoundingClientRect();
    const travel = window.innerWidth + r.width * 0.48 + 40;
    cat.parentElement.style.setProperty('--dur', `${(travel / ((r.height || 200) * 0.42)).toFixed(1)}s`);
  };
  speed();
  addEventListener('resize', speed);
  addEventListener('load', speed);          // measure again once styles and fonts have settled
}
