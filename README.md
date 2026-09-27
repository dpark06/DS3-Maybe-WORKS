# notonlybodegacats.com

A three-page site (Home, The Food, Find It Near You) for the cat food brand. Blue (#0B4AFF) base, all-white Oswald type (300, 400, 700 only),
three 3D cans in the hero, a photo collection with symbol picks and a shareable image, a product label, and a corner-store map.

## Run it

```bash
cd notonlybodegacats
npm install
npm run dev          # http://localhost:5173  (also on your phone at the "Network" address it prints)
```

```bash
npm run build        # production files land in dist/
npm run preview      # serve the built site locally
```

Node 20+ is needed (built on Node 24).

## GitHub Pages (what this repo uses)

GitHub Pages can only show finished files, not source code, so the finished site lives in the **`docs/`** folder.
To update it after you change something: `npm run build:pages`, then commit and push `docs/` along with your changes.
In the repository on GitHub go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, branch **main**, folder **/docs**, and Save.
The address is `https://dpark06.github.io/DS3-Maybe-WORKS/`. (`VITE_BASE` in `package.json` is the repo folder name; change it if the repo is renamed.)

## Put it online (your own domain)

`dist/` is a plain static site. Any static host works: Netlify, Vercel, Cloudflare Pages, GitHub Pages.
Point the domain at it and you are done. Requirements:

- **HTTPS** (needed for the location prompt, the share button, and camera-free clipboard copy on phones). All the hosts above give you this.
- `/share?photo=03&symbol=stop` must load the share page. This is already handled: `public/_redirects` covers Netlify and
  Cloudflare Pages, `vercel.json` covers Vercel. On other hosts, add a rewrite from `/share` to `/share/index.html`.
- The QR code uses whatever address the site is loaded from, so it works automatically once the site is live. **Test it on a real phone
  from the live URL**: a QR made on `localhost` only works on your own computer.

## Pages

| Page | Address | Files |
|---|---|---|
| Home: hero with the 3D cans, then the photo collection | `/` | `index.html`, `src/main.js` |
| The Food: tabs (In the Store, At Home, On the Shelf), label, how to enjoy | `/the-food` | `the-food/index.html`, `src/food.js` |
| Find It Near You: the poster-style map | `/find-it` | `find-it/index.html`, `src/find.js` |
| Share page (opened by the QR code) | `/share?photo=03&symbol=stop` | `share/index.html`, `src/share.js` |

The top bar and the footer are shared by every page: edit `partials/nav.html` and `partials/footer.html`.

## Testing the QR flow on your phone

1. Put the phone on the **same Wi-Fi** as this computer.
2. Run `npm run dev` and open the site on the computer (`http://localhost:5173` is fine).
3. Tap a photo, pick a symbol. The QR now points at this computer's network address (it is printed under the QR, for example
   `http://10.1.76.112:5173/share?photo=01&symbol=stop`), not at "localhost".
4. Scan it with the phone camera. The share page opens with the photo and symbol. Tap **Download**.
5. If the phone can't connect: check the Wi-Fi, and allow incoming connections for Node if the Mac firewall asks.

On the live site the QR uses the real domain automatically. To force one address (for example while previewing on a different host), set
`VITE_SITE_URL=https://notonlybodegacats.com` in a `.env` file before building. Native Share and copy-link need HTTPS, which the live site has;
over plain Wi-Fi the QR link and Download still work.

## How it is put together

| Part | File(s) |
|---|---|
| Page copy | the `index.html` files in each page folder |
| Look and layout | `src/style.css` |
| Hero: 3D cans tied to scroll | `src/hero.js` (Three.js + GSAP ScrollTrigger) |
| Collection grid, modal, QR, download and share | `src/collection.js` |
| Image with symbol drawn on it (1080 x 1350) | `src/composite.js` |
| Share page (`/share`) | `share/index.html`, `src/share.js` |
| Map | `src/map.js` (MapLibre GL, OpenFreeMap tiles, Overpass API) |
| Symbols and their words | `src/symbols.js` |

### Hero motion
Scroll progress (0 to 1 over the hero) drives every can. There is no autoplay, so scrolling back reverses it.

| Can | Spin | X tilt | Exit |
|---|---|---|---|
| Top | 360 degrees | forward to 20 degrees | curves up, exits right |
| Middle | 360 degrees | rocks between -15 and +15 degrees | straight out left |
| Bottom | 360 degrees | back to 35 degrees | curves down, exits left |

Each can also flies toward the camera and grows as it leaves (`flyBy()`), and every can starts with its collage side facing you (`COLLAGE_FRONT`).
Lighting lives at the top of `initHero()` in `src/hero.js`: the studio HDRI (`public/env/studio.hdr`, rebuilt with `scripts/make-hdri.py`),
a key light, two rim lights, soft shadows on an invisible floor, and the aluminum material settings (metalness 1, roughness 0.16).
Tweak the numbers in `apply()` in `src/hero.js`. Timing windows are the `seg(p, start, end)` lines. Hero scroll length is
`.hero { height: 440vh }` in `src/style.css`.

With **reduced motion** on, or if WebGL is unavailable, the hero shows the static render `public/img/hero-fallback.webp` and does not pin.

## Swap things

**Collage photos.** Put your transparent PNG cutouts in a folder and run:

```bash
pip install pillow
python3 scripts/make-photos.py /path/to/your/cutouts
```

This rewrites `public/photos/` and `src/data/photos.json` with web-sized WebP files (about 4.6 MB for 50 photos).
Photo ids (`01`, `02`, ...) are used in share links, so keep the order stable once the site is live.

**Cat photos.** Add them to your cutouts folder and run the same script; they join the grid like any other photo.

**Symbols and their words.** Everything is in `src/symbols.js`: the five shapes (paths exported from your Figma key), names,
the short line under each, and the friendly confirmation after a pick (`CONFIRMATIONS`).

**Label text.** The nutrition panel, ingredients, feeding guidelines and the rest are plain HTML in the `#product` section of
`index.html`. The words come straight from your can label. Edit them there. (The label on the 3D cans is an image. See below.)

**Site copy.** All headlines and paragraphs are in `index.html`.

**The Food tab photos.** They are `public/img/convenience-store-cat.jpg`, `home-cat.jpg` and `on-the-shelf.jpg`. Replace a file (keep the name, about 1600 px wide) to swap a photo. Captions are in `the-food/index.html`.

**Map look.** `posterStyle()` at the top of `src/map.js` holds every color, road width and label style. Store pins are drawn
in `pinSVG`. The map uses OpenFreeMap vector tiles (free, no key). Store data comes from OpenStreetMap through the Overpass API.

## The 3D cans

`public/models/can-top.glb`, `can-middle.glb`, `can-bottom.glb` (about 130 KB each, Draco-compressed, 2048 px label textures).
The Blender source is in `source/cat-food-cans.blend`, and the three label images are in `source/`.

To change a label: replace the texture in Blender (or export a new `.glb`) and drop the file into `public/models/`.
Blender export settings used: glTF Binary (.glb), +Y up, selected objects, JPEG textures at 88% quality, Draco mesh compression on.
Materials are kept simple (base color, metallic, roughness) because glTF cannot carry Blender's procedural nodes.
Lighting in the site comes from Three.js (`RoomEnvironment`), not from Blender.

## Fonts

Oswald 300, 400 and 700 load from Google Fonts in `index.html`. The map needs its own copy of Oswald as SDF glyph files:
they are in `public/fonts/` (generated by `scripts/make-glyphs.py` from the OFL-licensed Oswald variable font).

## Credits and notes

- Map data: (c) OpenStreetMap contributors. Tiles: OpenFreeMap. Address search: Nominatim.
- Store finder asks several public Overpass servers at once and retries once. If all of them are busy, it falls back to the
  convenience-store points inside the map tiles (names and locations, no street addresses).
- Wildly popular launch? Public Overpass and Nominatim servers have fair-use limits. If traffic grows, host your own or use a paid provider.

## The walking cat in the footer

Every page ends with the collage cat walking across the footer: it leaves on the left and comes back in from the right, forever.
The video has a **transparent background** (no MP4 can do that), so two files are used: `public/video/cat-run.webm` (Chrome, Edge, Firefox)
and `public/video/cat-run-safari.mov` (Safari and iPhone). `initCatWalk()` in `src/common.js` picks the right one, sets the walking speed
(the `0.42` in that function; raise it to walk faster) and pauses the video when it is off screen. With reduced motion on, the cat stands still in the middle.
Size and look are the `.catwalk` rules in `src/style.css`. The source frames and the Figma copy are described in `cat-run-transparent/` on the Desktop.
