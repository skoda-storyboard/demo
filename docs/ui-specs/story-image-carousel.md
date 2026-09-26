# Story in-body image carousel (`skoda-carousel-widget`)

Status: **CAPTURED on two stories** (Chrome DevTools, 2026-09-24). Delivery: **SKODA-819** (#122),
which supersedes SKODA-219 (#116, closed; review §15). This is neither the
story-teaser rail (SKODA-212) nor the lead-image/thumb `.sb-gallery`.

Source pages:
- `/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/`: three widgets
  with 5, 8, and 4 slides; no visible slide descriptions.
- `/en/skoda-world/how-the-skoda-octavia-reached-365-km-h/`: five widgets; the first
  slide has a visible 64px description below the image.

## Measured geometry

| Viewport | Article column | Image area (both pages) | Octavia visible description |
|---|---:|---:|---:|
| 1440 | 819px | 839 x 472px | 64px below the image (viewport 839 x 536px) |
| 768 | 499px | 519 x 292px | present; height varies with text |
| 500 | 480px | 500 x 281px | 64px below the image (viewport 500 x 345px) |

The **image area is 16:9** (`.image-holder.ratio-16x9` uses 56.25% bottom padding),
with the slider bleeding 10px beyond each side of the text column. The source
images can have a 3:2 natural ratio; that is not the displayed frame's ratio.
Use `object-fit: cover` without a radius. The slide description comes from
`.search-results-item-description`, **not** `img[data-caption]`: on Octavia the
description is visible even though `data-caption` is empty, while Epiq has no
description. Preserve non-empty descriptions; do not render the image alt as a
fallback caption.

The source uses one image per view, drag/swipe, wrap-around, two 32px transparent
chevron buttons inset 10px, and 10px dots below the image (selected `#333`,
others `rgb(51 51 51 / 25%)`). Its Flickity config autoplays every 3000ms.
For EDS, provide a **visible pause/resume control** if autoplay is enabled
(WCAG 2.2.2), stop on hover/focus, and disable autoplay under reduced motion.
Native scroll-snap and labelled buttons should remain keyboard operable.

## EDS target

Use an authored `Gallery (slider)` variant: one optimized image per slide,
optional visible description, no thumbnail grid or generated "Images" heading.
The importer should keep image order, alt text, and source descriptions, emitting
this variant for link-free `skoda-carousel-widget` widgets; link-bearing widgets
remain Cards. Keep the media-cart image hook for later integration. The shared
gallery's current lead-image + thumbs layout is **not** the slider layout.
