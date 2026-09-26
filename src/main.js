import { initKeys } from './common.js';
import { initCollection } from './collection.js';

initKeys();
initCollection();

const hero = document.querySelector('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero: 3D cans tied to scroll. Reduced motion (or no WebGL) keeps the static render.
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}
if (reduce || !hasWebGL()) {
  hero.classList.add('hero--static');
} else {
  import('./hero.js').then((m) => m.initHero(hero)).catch((err) => {
    console.error('Hero 3D failed, using static image', err);
    hero.classList.add('hero--static');
  });
}
