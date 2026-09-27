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

// Footer cat: pick a video the browser can show WITH transparency, set the walking speed, respect reduced motion.
export function initCatWalk() {
  const v = document.querySelector('.catwalk__video');
  if (!v) return;
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent) || (/^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent));
  v.src = url(apple ? 'video/cat-run-safari.mov' : 'video/cat-run.webm'); // Safari/iOS play HEVC with alpha; the rest play WebM (VP9 with alpha)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const speed = () => {                                   // walking speed scales with the cat's size
    const h = v.getBoundingClientRect().height || 300;
    const travel = window.innerWidth + v.getBoundingClientRect().width * 0.48 + 40;
    v.parentElement.style.setProperty('--dur', `${(travel / (h * 0.42)).toFixed(1)}s`);
  };
  speed();
  addEventListener('resize', speed);
  addEventListener('load', speed);          // measure again once styles and fonts have settled
  if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
  const play = () => v.play().catch(() => {});
  v.addEventListener('canplay', play, { once: true });
  // only run while it is on screen
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? play() : v.pause()))).observe(v.parentElement);
}
