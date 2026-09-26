import photos from './data/photos.json';
import { SYMBOLS } from './symbols.js';

export const OUT_W = 1080;
export const OUT_H = 1350; // Instagram portrait
const BLUE = '#0B4AFF';

export function findPhoto(id) {
  return photos.find((p) => p.id === id);
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Draws the chosen photo on the poster blue with the chosen symbol centered on the photo.
export async function drawComposite(canvas, photoId, symbolKey) {
  const photo = findPhoto(photoId);
  const sym = SYMBOLS[symbolKey];
  if (!photo || !sym) throw new Error('Unknown photo or symbol');
  const [img] = await Promise.all([
    loadImage(`/photos/${photo.id}.webp`),
    document.fonts.load('700 48px Oswald'),
    document.fonts.load('300 30px Oswald'),
  ]);

  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BLUE;
  ctx.fillRect(0, 0, OUT_W, OUT_H);

  // photo box
  const boxX = 70, boxY = 70, boxW = OUT_W - 140, boxH = 1030;
  const s = Math.min(boxW / img.width, boxH / img.height);
  const w = img.width * s, h = img.height * s;
  const x = boxX + (boxW - w) / 2, y = boxY + (boxH - h) / 2;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x, y, w, h);

  // symbol in the center of the photo
  const target = Math.max(150, Math.min(w, h) * 0.34);
  const k = target / Math.max(sym.w, sym.h);
  ctx.save();
  ctx.translate(x + w / 2 - (sym.w * k) / 2, y + h / 2 - (sym.h * k) / 2);
  ctx.scale(k, k);
  ctx.fillStyle = '#fff';
  ctx.fill(new Path2D(sym.d));
  ctx.restore();

  // footer
  ctx.fillStyle = '#fff';
  ctx.fillRect(70, 1150, OUT_W - 140, 4);
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 64px Oswald, sans-serif';
  ctx.fillText(sym.name.toUpperCase(), 70, 1240);
  ctx.font = '300 34px Oswald, sans-serif';
  ctx.fillText(sym.blurb.toUpperCase(), 70, 1290);
  ctx.textAlign = 'right';
  ctx.font = '700 30px Oswald, sans-serif';
  ctx.fillText('NOT ONLY FOR', OUT_W - 70, 1240);
  ctx.fillText('BODEGA CATS', OUT_W - 70, 1278);
  ctx.textAlign = 'left';
  return canvas;
}

export function canvasToBlob(canvas, type = 'image/png') {
  return new Promise((res) => canvas.toBlob(res, type, 0.92));
}

// The address the QR code points to. A phone cannot open "localhost", so:
//  1. VITE_SITE_URL (set it when you deploy, e.g. https://notonlybodegacats.com) wins if present,
//  2. while developing on localhost we swap in this computer's network address (phone on the same Wi-Fi),
//  3. otherwise we use the address the page was opened at (the real site).
export function siteOrigin() {
  const fixed = import.meta.env.VITE_SITE_URL;
  if (fixed) return fixed.replace(/\/$/, '');
  const { protocol, hostname, port, origin } = window.location;
  const isLocal = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
  if (isLocal && typeof __LAN_HOST__ === 'string' && __LAN_HOST__) return `${protocol}//${__LAN_HOST__}${port ? `:${port}` : ''}`;
  return origin;
}

export function shareUrl(photoId, symbolKey) {
  const u = new URL('/share', siteOrigin());
  u.searchParams.set('photo', photoId);
  u.searchParams.set('symbol', symbolKey);
  return u.toString();
}

export function fileName(photoId, symbolKey) {
  return `not-only-for-bodega-cats-${photoId}-${symbolKey}.png`;
}

export async function downloadCanvas(canvas, photoId, symbolKey) {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName(photoId, symbolKey);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function nativeShare(canvas, photoId, symbolKey) {
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], fileName(photoId, symbolKey), { type: 'image/png' });
  const data = {
    title: 'Not Only for Bodega Cats',
    text: `My pick: ${SYMBOLS[symbolKey].name}`,
    url: shareUrl(photoId, symbolKey),
  };
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ ...data, files: [file] });
  } else {
    await navigator.share(data);
  }
}

export const canNativeShare = () => typeof navigator !== 'undefined' && typeof navigator.share === 'function';
