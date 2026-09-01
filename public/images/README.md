# Photography drop-in

Empty on purpose. Every image slot currently renders a designed SVG fallback at exactly the geometry
a photograph will occupy, so adding real images changes no layout.

## How to add an image

1. Export the file (WebP or AVIF preferred, JPEG acceptable) and drop it in this folder.
2. Open `src/content/images.ts` and set `src` on the matching slot — e.g.
   `src: '/images/hero.webp'`.
3. Optionally set `srcSet`, `width` and `height` on the same slot for responsive delivery and to
   reserve layout space.
4. Update `alt` if the supplied text no longer describes the actual photo.

`ImageFrame` handles the rest: it lazy-loads the image and drops the fallback treatment
automatically.

## Slots

| Slot key | Suggested filename | Orientation | Subject |
| --- | --- | --- | --- |
| `hero` | `hero.webp` | Landscape, wide | Sydney open space, drone in flight or being launched |
| `session-first-flight` | `session-first-flight.webp` | Landscape 3:2 | Beginner holding a controller, calm and unposed |
| `session-fly-with-confidence` | `session-fly-with-confidence.webp` | Landscape 3:2 | Confident flying in an open reserve |
| `session-photo-video` | `session-photo-video.webp` | Landscape 3:2 | Framing a shot, screen visible |
| `location-south` | `location-south.webp` | Landscape 3:2 | Open grass and sky near Taren Point |
| `location-north` | `location-north.webp` | Landscape 3:2 | Open reserve near North Ryde |
| `about-tom` | `about-tom.webp` | Portrait 4:5 | Tom outdoors, natural, drone in hand or nearby |

## What not to use

- Stock photography of unrelated drone hardware
- AI-generated drones or landscapes
- Anything implying a location, approval or partnership that doesn't exist
- Images of identifiable people without their permission

Real photography of real sessions in the real training areas only. Aim for roughly 1600–2400px on the
long edge and keep files under about 300 KB after compression.
