# Image prompts for Section 3 (lifestyle photos)

I can't generate images inside this project, so Section 3 has two labeled slots. Run these in the image generator you like,
then drop the finished files here:

- `public/img/lifestyle-shop.webp`  (feeding a bodega cat inside a convenience store)
- `public/img/lifestyle-home.webp`  (feeding a cat at home)

Both slots are 4:5 portrait, so export at **1600 x 2000 px** (or any 4:5 size). WebP or JPG renamed to .webp both work; WebP is best.

## Keep the can accurate (very important)

Use `public/img/hero-fallback.webp` (a render of the real cans) as a **reference image** in any tool that allows it
(image-to-image, "style/subject reference", or ChatGPT/Gemini image upload). Then add this packaging description to every prompt:

> The can is a short, wide, flat cat-food tin, about three inches across and just over an inch tall, with rolled silver-champagne metal rims
> and a peel-off lid with a gold pull tab and a scored ring just inside the rim. A wrap-around label in solid electric blue (#0B4AFF) covers the sides.
> The label has white sans-serif nutrition-style text panels, a white barcode, and one side is a busy collage of convenience-store photos with a
> white winding path graphic. No other brand names. No extra logos.

Ask for a **clean, uncluttered label area**, because image models scramble small text. The label details do not need to be readable in the photo.
If the label comes out wrong, generate the scene with a plain blue-and-silver tin and composite the real label render on top in an editor.

## Prompt 1: the bodega cat at the shop

> Warm, candid documentary-style photo inside a small neighborhood convenience store (bodega) at golden hour. A relaxed tabby cat sits on the
> checkout counter next to a register, happily eating from a plate of wet cat food, with an open flat blue-labeled tin beside it
> (packaging description above). Shelves of snacks and drinks softly blurred behind, a hand-lettered sign, a lottery display, a few fluorescent
> and warm lights. A shop worker's hand is just visible setting the plate down, face out of frame. Cheerful, cozy, slightly nostalgic mood.
> Shot on a 35mm lens, shallow depth of field, natural film grain, vertical 4:5 composition, cat in the lower third with space above.

Negative / avoid: text overlays, watermarks, extra logos, human faces, distorted paws, more than one cat, floating objects.

## Prompt 2: the cat at home

> Sunny, cozy living-room photo. A fluffy, contented cat sits on a warm wooden floor beside a low ceramic plate of wet cat food, with an open
> flat blue-labeled tin next to it (packaging description above). Soft window light, a corner of a sofa and a plant in the background, gentle bokeh.
> An owner's hand and sleeve are visible holding a spoon, face out of frame, to show the food being served with care. Happy, warm, bright mood.
> Shot on an 50mm lens, shallow depth of field, vertical 4:5 composition, clean and uncluttered.

Negative / avoid: text overlays, watermarks, extra logos, human faces, extra cats, distorted paws, cluttered background.

## Tips

- Generate 4 to 6 options and pick the one where the tin looks most like the real one.
- Keep the blue close to #0B4AFF. If the image comes out too teal or navy, nudge the hue in an editor.
- Add descriptive alt text in `index.html` if the scene changes (search for `lifestyle-shop` and `lifestyle-home`).
