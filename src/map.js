import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SYMBOLS } from './symbols.js';
import { url } from './base.js';

maplibregl.setWorkerUrl(url('maplibre/maplibre-gl-worker.mjs'));

const BLUE = '#0B4AFF';
const DEEP = '#0836D6';
const NYC = [-73.9911, 40.7359];
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const w = (...stops) => ['interpolate', ['exponential', 1.55], ['zoom'], ...stops];

// The look of the poster path: solid blue ground, thick white rounded corridors, Oswald type.
function posterStyle() {
  const road = (id, classes, widths, min = 0, extra = {}) => ({
    id, type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: min,
    filter: ['all', ['in', ['get', 'class'], ['literal', classes]], ['!=', ['get', 'brunnel'], 'tunnel']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#fff', 'line-width': widths, ...extra },
  });
  return {
    version: 8,
    glyphs: `${location.origin}${url('fonts/{fontstack}/{range}.pbf')}`,
    sources: { omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': BLUE } },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': '#1156FF' } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': DEEP } },
      { id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway', paint: { 'line-color': DEEP, 'line-width': w(8, 0.5, 16, 5, 18, 8) } },
      { id: 'building', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 14, paint: { 'fill-color': '#0A40E6', 'fill-opacity': 0.9 } },
      road('paths', ['path', 'pedestrian', 'track'], w(14, 0.5, 18, 2.5), 14, { 'line-opacity': 0.55, 'line-dasharray': [1.5, 1.5] }),
      road('minor', ['minor', 'service', 'residential', 'living_street'], w(12, 0.5, 14, 2.2, 18, 15), 12),
      road('mid', ['tertiary', 'secondary'], w(9, 0.8, 14, 4.5, 18, 22), 9),
      road('major', ['primary', 'trunk', 'motorway'], w(6, 0.8, 14, 7.5, 18, 28), 5),
      {
        id: 'road-names', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14.3,
        layout: {
          'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']],
          'text-font': ['Oswald Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 14, 10, 18, 15],
          'text-transform': 'uppercase', 'text-letter-spacing': 0.08, 'text-max-angle': 35,
        },
        paint: { 'text-color': BLUE },
      },
      {
        id: 'place-small', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 11,
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'quarter']]],
        layout: { 'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']], 'text-font': ['Oswald Light'], 'text-size': 13, 'text-transform': 'uppercase', 'text-letter-spacing': 0.14, 'text-max-width': 8 },
        paint: { 'text-color': '#fff' },
      },
      {
        id: 'place-big', type: 'symbol', source: 'omt', 'source-layer': 'place', maxzoom: 14,
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town', 'village', 'state']]],
        layout: { 'text-field': ['coalesce', ['get', 'name:latin'], ['get', 'name']], 'text-font': ['Oswald Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 4, 12, 12, 26], 'text-transform': 'uppercase', 'text-letter-spacing': 0.06, 'text-max-width': 8 },
        paint: { 'text-color': '#fff', 'text-halo-color': BLUE, 'text-halo-width': 2 },
      },
    ],
  };
}

const pinSVG = `<svg viewBox="-6 -6 152 152" aria-hidden="true"><circle cx="70" cy="70" r="66" fill="${BLUE}" stroke="#fff" stroke-width="10"/><g transform="translate(70 70) scale(.6) translate(-70 -70)"><path fill="#fff" d="${SYMBOLS.stop.d}"/></g></svg>`;
const meSVG = `<svg viewBox="-6 -6 152 152" aria-hidden="true"><circle cx="70" cy="70" r="66" fill="#fff" stroke="${BLUE}" stroke-width="10"/><circle cx="70" cy="70" r="34" fill="${BLUE}"/></svg>`;

const dist = (a, b) => {
  const R = 6371e3, r = Math.PI / 180;
  const dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
const fmt = (m) => (m < 950 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`) + ' away';
const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
const directions = (s) => isApple
  ? `https://maps.apple.com/?daddr=${s.lat},${s.lon}&q=${encodeURIComponent(s.name)}`
  : `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`;
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function address(t) {
  const line1 = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  const line2 = [t['addr:city'], t['addr:state'] || t['addr:postcode']].filter(Boolean).join(', ');
  return [line1, line2].filter(Boolean).join(', ') || 'Address not listed';
}

export function initMap() {
  const status = document.getElementById('map-status');
  const list = document.getElementById('store-list');
  const say = (t) => { status.textContent = t; };

  const map = new maplibregl.Map({
    container: 'map', style: posterStyle(), center: NYC, zoom: 13.5, minZoom: 3, maxZoom: 19,
    attributionControl: { compact: true, customAttribution: '© OpenStreetMap contributors, OpenFreeMap' },
    cooperativeGestures: true,
  });
  map.on('error', (e) => console.warn('map:', e.error?.message || e));
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

  let markers = [];
  let meMarker = null;
  let popup = null;

  function clear() { markers.forEach((m) => m.remove()); markers = []; list.innerHTML = ''; }

  async function tileStores(origin) {
    await new Promise((res) => { if (map.loaded() && map.getZoom() >= 13.5 && !map.isMoving()) res(); else { const t = setTimeout(res, 6000); map.once('idle', () => { clearTimeout(t); res(); }); } });
    const feats = map.querySourceFeatures('omt', { sourceLayer: 'poi', filter: ['==', ['get', 'subclass'], 'convenience'] });
    const seen = new Set();
    return feats.map((f) => {
      const [lo, la] = f.geometry.type === 'Point' ? f.geometry.coordinates : [null, null];
      if (lo == null) return null;
      const key = `${f.properties.name || ''}${lo.toFixed(5)}${la.toFixed(5)}`;
      if (seen.has(key)) return null; seen.add(key);
      return { id: key, lat: la, lon: lo, name: f.properties.name || 'Corner store', addr: 'Address not listed', d: dist(origin, [lo, la]) };
    }).filter((x) => x && x.d < 2500);
  }

  let runId = 0;
  const cache = new Map();
  // Public Overpass servers are sometimes busy, so ask all mirrors at once, take the first good answer, and retry once.
  async function overpass(lat, lon) {
    const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (cache.has(key)) return cache.get(key);
    const q = `[out:json][timeout:15];nwr["shop"="convenience"](around:1800,${lat},${lon});out center 60;`;
    const ask = async (url) => {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 13000);
      try {
        const r = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctl.signal });
        if (!r.ok) throw new Error(r.status);
        return JSON.parse(await r.text()).elements;
      } finally { clearTimeout(timer); }
    };
    let lastErr;
    for (let round = 0; round < 2; round++) {
      try {
        const els = await Promise.any(OVERPASS.map(ask));
        cache.set(key, els);
        return els;
      } catch (e) { lastErr = e; await new Promise((r) => setTimeout(r, 1200)); }
    }
    throw lastErr;
  }

  async function loadStores(lat, lon, note = '') {
    const me = ++runId;
    const pre = note ? note + ' ' : '';
    say(pre + 'Finding corner stores near you...');
    clear();
    const origin = [lon, lat];
    let stores;
    try {
      const els = await overpass(lat, lon);
      stores = els.map((e) => {
        const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
        if (la == null) return null;
        const t = e.tags || {};
        return { id: e.id, lat: la, lon: lo, name: t.name || 'Corner store', addr: address(t), d: dist(origin, [lo, la]) };
      }).filter(Boolean);
    } catch {
      // Overpass is busy: fall back to the convenience-store points already inside the OSM map tiles.
      stores = await tileStores(origin);
      if (!stores.length) { if (me === runId) say(pre + 'The store finder is taking a nap. Try again in a moment!'); return; }
    }
    if (me !== runId) return;
    stores.sort((a, b) => a.d - b.d);
    if (!stores.length) { say(pre + 'No corner stores mapped here yet. Try zooming out or searching another spot!'); return; }
    say(`${pre}Found ${stores.length} corner store${stores.length > 1 ? 's' : ''} nearby. Tap a pin!`);

    stores.forEach((s) => {
      const el = document.createElement('button');
      el.className = 'pin'; el.type = 'button'; el.innerHTML = pinSVG;
      el.setAttribute('aria-label', `${s.name}, ${s.addr}`);
      const m = new maplibregl.Marker({ element: el }).setLngLat([s.lon, s.lat]).addTo(map);
      el.addEventListener('click', (ev) => { ev.stopPropagation(); show(s); });
      markers.push(m);
    });
    list.innerHTML = stores.slice(0, 8).map((s) => `<li><div><strong>${esc(s.name)}</strong><span>${esc(s.addr)} · ${fmt(s.d)}</span></div><a href="${directions(s)}" target="_blank" rel="noopener">Directions</a></li>`).join('');
  }

  function show(s) {
    popup?.remove();
    popup = new maplibregl.Popup({ offset: 20, closeButton: true, maxWidth: '260px' })
      .setLngLat([s.lon, s.lat])
      .setHTML(`<div class="popup"><h4>${esc(s.name)}</h4><p>${esc(s.addr)}</p><a href="${directions(s)}" target="_blank" rel="noopener">Get directions</a></div>`)
      .addTo(map);
  }

  function place(lat, lon, zoom = 15) {
    map.flyTo({ center: [lon, lat], zoom, essential: true });
    loadStores(lat, lon);
  }

  function setMe(lat, lon) {
    meMarker?.remove();
    const el = document.createElement('div'); el.className = 'pin pin--me'; el.innerHTML = meSVG; el.setAttribute('aria-label', 'You are here');
    meMarker = new maplibregl.Marker({ element: el }).setLngLat([lon, lat]).addTo(map);
  }

  function locate() {
    if (!('geolocation' in navigator)) { loadStores(NYC[1], NYC[0], "Your browser can't share a location. No worries, search a city or address!"); return; }
    say('Asking for your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => { const { latitude: la, longitude: lo } = pos.coords; setMe(la, lo); place(la, lo); },
      () => { loadStores(NYC[1], NYC[0], "No worries! Search a city or address instead. Here's New York for now."); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  async function search(q) {
    if (!q.trim()) return;
    say('Searching...');
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': navigator.language || 'en' } });
      const j = await r.json();
      if (!j.length) { say("Hmm, we couldn't find that place. Try a nearby city!"); return; }
      const la = +j[0].lat, lo = +j[0].lon;
      meMarker?.remove(); meMarker = null;
      place(la, lo, 14.5);
    } catch { say('Search is taking a nap. Please try again!'); }
  }

  document.getElementById('locate-btn').addEventListener('click', locate);
  document.getElementById('finder').addEventListener('submit', (e) => { e.preventDefault(); search(document.getElementById('place-input').value); });

  map.once('load', () => {
    // first visit: ask nicely, fall back to search
    map.resize();
    locate();
  });
}
