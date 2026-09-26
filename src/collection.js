import photos from './data/photos.json';
import QRCode from 'qrcode';
import { SYMBOLS, SYMBOL_KEYS, CONFIRMATIONS, symbolSVG } from './symbols.js';
import { drawComposite, downloadCanvas, nativeShare, canNativeShare, shareUrl } from './composite.js';

export function initCollection() {
  const grid = document.getElementById('grid');
  const modal = document.getElementById('photo-modal');
  const img = document.getElementById('modal-img');
  const stepChoose = document.getElementById('step-choose');
  const stepShare = document.getElementById('step-share');
  const choices = document.getElementById('choices');
  const confirmMsg = document.getElementById('confirm-msg');
  const preview = document.getElementById('share-preview');
  const qr = document.getElementById('qr-canvas');
  const btnDownload = document.getElementById('btn-download');
  const btnShare = document.getElementById('btn-share');
  const btnCopy = document.getElementById('btn-copy');
  const btnAgain = document.getElementById('btn-again');
  let current = null;
  let opener = null;

  // tiles
  const frag = document.createDocumentFragment();
  photos.forEach((p) => {
    const b = document.createElement('button');
    b.className = 'tile';
    b.type = 'button';
    b.dataset.id = p.id;
    b.setAttribute('aria-label', `Open photo: ${p.alt}`);
    b.innerHTML = `<img src="/photos/${p.id}-t.webp" width="${p.tw}" height="${p.th}" alt="${p.alt}" loading="lazy" decoding="async" />`;
    frag.appendChild(b);
  });
  grid.appendChild(frag);

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('tile--in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    grid.querySelectorAll('.tile').forEach((t) => io.observe(t));
  }

  choices.innerHTML = SYMBOL_KEYS.map((k) => `<button class="choice" type="button" data-symbol="${k}">${symbolSVG(k)}<span><b>${SYMBOLS[k].name}</b><small>${SYMBOLS[k].blurb}</small></span></button>`).join('');

  function showChoose() {
    stepShare.hidden = true;
    stepChoose.hidden = false;
    modal.classList.remove('is-shared');
  }

  function openPhoto(id, trigger) {
    const p = photos.find((x) => x.id === id);
    current = { id, symbol: null };
    opener = trigger;
    img.src = `/photos/${p.id}.webp`;
    img.alt = p.alt;
    showChoose();
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
  }

  async function choose(symbol) {
    current.symbol = symbol;
    stepChoose.hidden = true;
    stepShare.hidden = false;
    modal.classList.add('is-shared');
    modal.scrollTop = 0;
    confirmMsg.textContent = CONFIRMATIONS[symbol];
    confirmMsg.focus({ preventScroll: true });
    const url = shareUrl(current.id, symbol);
    QRCode.toCanvas(qr, url, { width: 176, margin: 1, color: { dark: '#0B4AFF', light: '#FFFFFF' } });
    document.getElementById('qr-url').textContent = url;
    btnShare.hidden = !canNativeShare();
    try { await drawComposite(preview, current.id, symbol); } catch { confirmMsg.textContent = 'Oops, something went wrong. Try again!'; }
  }

  grid.addEventListener('click', (e) => {
    const t = e.target.closest('button.tile');
    if (t) openPhoto(t.dataset.id, t);
  });
  choices.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-symbol]');
    if (b) choose(b.dataset.symbol);
  });
  document.getElementById('modal-close').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  modal.addEventListener('close', () => { opener?.focus?.({ preventScroll: true }); });
  btnAgain.addEventListener('click', showChoose);
  btnDownload.addEventListener('click', () => downloadCanvas(preview, current.id, current.symbol));
  btnShare.addEventListener('click', () => nativeShare(preview, current.id, current.symbol).catch(() => {}));
  btnCopy.addEventListener('click', async () => {
    const url = shareUrl(current.id, current.symbol);
    try { await navigator.clipboard.writeText(url); btnCopy.textContent = 'Copied!'; } catch { btnCopy.textContent = 'Press and hold to copy'; }
    setTimeout(() => (btnCopy.textContent = 'Copy link'), 2200);
  });
}
