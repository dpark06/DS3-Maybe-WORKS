import './common.js';
import { drawComposite, downloadCanvas, nativeShare, canNativeShare, findPhoto } from './composite.js';
import { SYMBOLS } from './symbols.js';

const params = new URLSearchParams(location.search);
const photoId = (params.get('photo') || '').padStart(2, '0');
const symbolKey = params.get('symbol') || '';
const canvas = document.getElementById('share-canvas');
const status = document.getElementById('share-status');
const dl = document.getElementById('btn-download');
const sh = document.getElementById('btn-share');

if (!findPhoto(photoId) || !SYMBOLS[symbolKey]) {
  document.getElementById('share-title').textContent = "Hmm, we couldn't find that one.";
  canvas.hidden = true; dl.hidden = true;
  status.textContent = 'Head back to the collection and pick a fresh photo!';
} else {
  status.textContent = 'Getting your image ready...';
  drawComposite(canvas, photoId, symbolKey)
    .then(() => { status.textContent = 'Save it or send it to a friend. 1080 x 1350, made for social.'; })
    .catch(() => { status.textContent = 'Something went wrong. Please try again.'; });
  dl.addEventListener('click', () => downloadCanvas(canvas, photoId, symbolKey));
  if (canNativeShare()) {
    sh.hidden = false;
    sh.addEventListener('click', () => nativeShare(canvas, photoId, symbolKey).catch(() => {}));
  }
}
