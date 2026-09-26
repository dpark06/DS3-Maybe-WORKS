import './common.js';
import { initKeys } from './common.js';

initKeys();

// Tabs: In the Store / At Home / On the Shelf. Arrow keys, Home and End work, and the link can point at one tab (#at-home).
const tabs = [...document.querySelectorAll('.tab')];
function select(tab, focus = false) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) tab.focus();
  history.replaceState(null, '', `#${tab.dataset.hash}`);
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => select(t));
  t.addEventListener('keydown', (e) => {
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length], true);
  });
});
const fromHash = tabs.find((t) => `#${t.dataset.hash}` === location.hash);
if (fromHash) select(fromHash);
