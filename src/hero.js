import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const D = THREE.MathUtils.degToRad;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (v) => { v = clamp01(v); return v * v * (3 - 2 * v); };
const easeInOut = (v) => { v = clamp01(v); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };

const CAN_D = 2.0;     // world units across a can
const CAN_H = 0.784;   // world units tall
const FOV = 28;
// The label is one wrap-around strip. This turns each can so the COLLAGE side faces the viewer at load
// (the strip's collage starts about 60% of the way around; -72 degrees centers it on the camera).
const COLLAGE_FRONT = D(-72);

export async function initHero(heroEl) {
  const stage = heroEl.querySelector('.hero__stage');
  const canvas = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping; // no highlight compression: tone mappers wash saturated blues toward white
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap; // soft edges

  const scene = new THREE.Scene();

  // ---- HDRI: a studio map (big softbox on one side, cool strips behind, blue floor bounce) the metal reflects
  const pmrem = new THREE.PMREMGenerator(renderer);
  const hdr = await new RGBELoader().loadAsync('/env/studio.hdr');
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = pmrem.fromEquirectangular(hdr).texture;
  scene.environmentIntensity = 1.0;
  scene.environmentRotation.y = D(90);
  hdr.dispose(); pmrem.dispose();

  // ---- direct lights
  // strong key from the viewer's left: bold highlights and the only light that casts shadows
  const key = new THREE.DirectionalLight(0xfff3e4, 2.8);
  key.position.set(-3.2, 8, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 9;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 22 });
  scene.add(key);
  // rim lights behind, both sides, cool white: edges glow against the blue
  const rimL = new THREE.DirectionalLight(0xa9c8ff, 3.2); rimL.position.set(-6, 2.5, -6); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xa9c8ff, 3.2); rimR.position.set(6, 2.5, -6); scene.add(rimR);
  // a little fill so the shadow side never goes black
  scene.add(new THREE.AmbientLight(0xffffff, 0.22));

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

  // ---- soft shadow on an invisible floor under the stack
  const shadowMat = new THREE.ShadowMaterial({ color: 0x00104f, opacity: 0.36 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), shadowMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -CAN_H * 1.5 - 0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  const draco = new DRACOLoader().setDecoderPath('/draco/gltf/');
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const names = ['top', 'middle', 'bottom'];
  const gltfs = await Promise.all(names.map((n) => loader.loadAsync(`/models/can-${n}.glb`)));

  const cans = gltfs.map((g, i) => {
    const model = g.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      o.castShadow = true;
      o.receiveShadow = true;
      const m = o.material;
      const n = (m.name || '').toLowerCase();
      if (n.includes('label')) {
        // printed label: satin, not mirror
        m.metalness = 0.0; m.roughness = 1.0; m.envMapIntensity = 0.0; // no white reflections on the print: it keeps the blue pure
        // Bright and vivid: the label is mostly self-lit from its own art (so the whole design reads clearly),
        // with light and shade on top. A small saturation boost makes the blue and the photos pop.
        if (m.map) {
          m.emissiveMap = m.map; m.emissive.set(0xffffff); m.emissiveIntensity = 0.95; m.color.setScalar(0.16);
          m.onBeforeCompile = (sh) => {
            sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>',
              `#include <emissivemap_fragment>
               float lum = dot(totalEmissiveRadiance, vec3(0.2126, 0.7152, 0.0722));
               totalEmissiveRadiance = max(mix(vec3(lum), totalEmissiveRadiance, 1.4), 0.0);`);
          };
        }
        if (m.map) m.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      } else {
        // aluminum: fully metal, low roughness so the HDRI reads sharp
        m.metalness = 1.0; m.roughness = n.includes('tab') ? 0.22 : 0.16; m.envMapIntensity = 1.35;
      }
      m.needsUpdate = true;
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = CAN_D / Math.max(size.x, size.z);
    model.position.copy(center).multiplyScalar(-1);
    const inner = new THREE.Group(); inner.add(model); inner.scale.setScalar(s);
    const pivot = new THREE.Group(); pivot.add(inner);
    scene.add(pivot);
    return { pivot, baseY: (1 - i) * CAN_H };
  });
  const [top, mid, bot] = cans;

  let view = { exitX: 6, halfH: 3, zMax: 5 };
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = Math.tan(D(FOV / 2));
    const frac = w < 700 ? 0.74 : 0.4;                       // how much of the width a can fills
    const distW = (CAN_D / frac) / (2 * t * camera.aspect);
    const distH = (CAN_H * 3 / 0.6) / (2 * t);              // stack is at most 60% of the height
    const dist = Math.max(distW, distH);
    camera.position.set(0, dist * 0.1, dist);               // a touch above, so lids and the floor shadow show
    camera.lookAt(0, -0.05, 0);
    camera.updateProjectionMatrix();
    const halfH = t * dist, halfW = halfH * camera.aspect;
    view = { exitX: halfW + CAN_D * 0.7, halfH, zMax: dist * 0.62 };
    apply(progress);
  }

  // ---- scroll-driven motion: p goes 0 -> 1 across the hero, scrubbed (scroll back = reverse)
  let progress = 0;
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const TILT0 = D(6); // every can starts with its lid tipped a touch toward the camera

  // Each can flies past the viewer: it moves toward the camera (z) and grows (scale) as it leaves.
  const flyBy = (can, e) => {
    const f = e * e;                       // slow start, fast finish
    can.pivot.position.z = view.zMax * f;
    can.pivot.scale.setScalar(1 + 0.8 * f);
  };

  function apply(p) {
    const { exitX, halfH } = view;

    // TOP: 360 spin, tilts forward ~20deg, curves up and exits right
    {
      const t = seg(p, 0.10, 0.92), e = easeInOut(t);
      const spin = smooth(t / 0.72);
      top.pivot.rotation.set(TILT0 + (D(20) - TILT0) * smooth(t), COLLAGE_FRONT + spin * Math.PI * 2, -D(8) * smooth(t), 'YXZ');
      top.pivot.position.set(exitX * Math.pow(e, 1.9), top.baseY + halfH * 0.7 * Math.sin(e * Math.PI / 2), 0);
      flyBy(top, e);
    }
    // MIDDLE: 360 spin, rocks -15..+15deg back and forth, straight out to the left
    {
      const t = seg(p, 0.14, 0.94), e = easeInOut(t);
      const spin = smooth(t / 0.72);
      mid.pivot.rotation.set(TILT0 + D(15) * Math.sin(t * Math.PI * 3.2), COLLAGE_FRONT + spin * Math.PI * 2, 0, 'YXZ');
      mid.pivot.position.set(-exitX * e, mid.baseY, 0);
      flyBy(mid, e);
    }
    // BOTTOM: 360 spin, tilts back ~35deg, curves down and exits left
    {
      const t = seg(p, 0.18, 0.96), e = easeInOut(t);
      const spin = smooth(t / 0.72);
      bot.pivot.rotation.set(TILT0 + (-D(35) - TILT0) * smooth(t), COLLAGE_FRONT + spin * Math.PI * 2, D(8) * smooth(t), 'YXZ');
      bot.pivot.position.set(-exitX * Math.pow(e, 1.9), bot.baseY - halfH * 0.7 * Math.sin(e * Math.PI / 2), 0);
      flyBy(bot, e);
    }
    shadowMat.opacity = 0.36 * (1 - smooth(p / 0.3));
    renderer.render(scene, camera);

    // words on the stage
    const c = (id, a, b) => { const el = heroEl.querySelector(`[data-caption="${id}"]`); if (el) el.style.opacity = String(Math.min(smooth((p - a) / 0.06), 1 - smooth((p - b) / 0.06))); };
    const title = heroEl.querySelector('[data-hero-title]');
    if (title) { title.style.opacity = String(1 - smooth(p / 0.14)); title.style.transform = `translateY(${-p * 60}px)`; }
    const capA = heroEl.querySelector('[data-caption="a"]');
    if (capA) capA.style.opacity = String(1 - smooth(p / 0.1));
    c('b', 0.26, 0.56);
    c('c', 0.66, 0.99);
  }

  resize();
  if (import.meta.env.DEV) window.__hero = { set: (p) => { progress = p; apply(p); } }; // dev only: lets me scrub from the console
  heroEl.classList.add('is-3d');
  new ResizeObserver(resize).observe(stage);
  // the stage sticks just under the nav bar, so scrolling starts when the hero reaches it
  const navH = () => document.querySelector('.nav')?.offsetHeight || 0;
  ScrollTrigger.create({
    trigger: heroEl,
    start: () => `top ${navH()}px`,
    end: () => `+=${heroEl.offsetHeight - stage.offsetHeight}`,
    invalidateOnRefresh: true,
    onUpdate: (self) => { progress = self.progress; apply(progress); },
  });
  ScrollTrigger.refresh();
}
