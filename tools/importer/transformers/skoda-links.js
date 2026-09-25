/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: source-host link rewriting (SKODA-605). Shared by every importer and
 * registered LAST in afterTransform, so it also sees links the parsers and later
 * transformers (skoda-story-aside) build.
 *
 * 1. `http(s)://` / `//` + `[www.]skoda-storyboard.com` hrefs whose target is a demo page
 *    (DEMO_PATHS below = M1 URL set + rail-feed corpus) become site-relative EDS paths:
 *    lowercase, no trailing slash (`/en/` → `/en`; EDS 404s on a trailing slash), query +
 *    hash kept byte-for-byte. The mixed-reality ALIAS goes straight to its canonical.
 *    Every other source-host link stays absolute, so it still opens the live site instead
 *    of 404ing on the demo (link policy D-3 default (b), SKODA-609).
 * 2. Root-relative `/direct-download/…` hrefs (press-release image downloads) point at the
 *    live source; they 404 on EDS.
 * 3. `#s_aid=` / `#s_cid=` analytics fragments are stripped (SKODA-602 idempotency), for
 *    the importers that do not run skoda-page-cleanup.
 *
 * `cdn.skoda-storyboard.com` assets, external hosts, mailto/tel, `#…` and relative links
 * are untouched. Idempotent: a second run changes nothing.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const SOURCE_ORIGIN = 'https://www.skoda-storyboard.com';
const SOURCE_HOST = /^(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com(?=[/?#]|$)/i;

// BEGIN GENERATED ALLOWLIST (npm run import:allowlist → build-link-allowlist.mjs; do not edit by hand)
const DEMO_PATHS = [
  "/en",
  "/en/06a-115-1x",
  "/en/07-s-37a-992-junior",
  "/en/09-728s-exponat",
  "/en/10-724a",
  "/en/11-733",
  "/en/22-781-sport",
  "/en/emobility/a-custom-made-sunroof-walkie-talkies-and-champagne-the-skoda-peaq-at-the-tour-de-france",
  "/en/emobility/a-stunning-drive-to-the-northernmost-tip-of-mallorca",
  "/en/emobility/an-electric-car-approaching-says-the-license-plate-but-only-in-some-countries",
  "/en/emobility/camouflage-to-get-you-hooked",
  "/en/emobility/coffee-on-electric-wheels-elroq-and-enyaq-serving-coffee",
  "/en/emobility/designers-on-the-peaq-its-modern-durable-and-practical",
  "/en/emobility/elroq-rs-in-a-robe-unveiling-the-secret-of-matte-paint",
  "/en/emobility/enyaq-and-elroq-now-double-as-gaming-consoles-and-thats-not-all",
  "/en/emobility/even-opening-the-door-is-an-experience-says-the-designer-of-the-peaq-suv",
  "/en/emobility/how-the-versatile-skoda-peaq-conquered-a-mountain-peak",
  "/en/emobility/how-was-the-elroq-made-not-in-the-usual-way",
  "/en/emobility/make-use-of-the-frunk-unlock-with-your-phone-new-enhancements-for-elroq-and-enyaq",
  "/en/emobility/meet-the-peaq-comfort-just-like-at-home",
  "/en/emobility/meet-the-peaq-spacious-inside-and-out",
  "/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia",
  "/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging",
  "/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq",
  "/en/emobility/skoda-elroq-and-a-happy-family",
  "/en/emobility/skoda-elroq-premiere-light-cube-camera-action",
  "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
  "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/attachment/050-skoda-epiq-a13b0a2b-bf605016",
  "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/attachment/092-skoda-epiq-3b448906-cb578496",
  "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds/attachment/093-skoda-epiq-88fc035a-e098c289",
  "/en/emobility/skoda-peaq-unparalleled-space-and-comfort",
  "/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq",
  "/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq",
  "/en/feature-maxova-5",
  "/en/images",
  "/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague",
  "/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving",
  "/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans",
  "/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling",
  "/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como",
  "/en/lifestyle/ouninpohja-finlands-roller-coaster-stage",
  "/en/lifestyle/rs-four-ways-which-one-will-you-choose",
  "/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones",
  "/en/models/skoda-elroq-through-designers-eyes",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit",
  "/en/press-kits/new-skoda-enyaq-press-kit-2",
  "/en/press-kits/skoda-elroq-press-kit",
  "/en/press-kits/skoda-elroq-press-kit-2",
  "/en/press-kits/skoda-epiq-city-suv-crossover-preview-of-skodas-most-affordable-all-electric-car",
  "/en/press-kits/skoda-epiq-press-kit-2",
  "/en/press-kits/skoda-epiq-press-kit-2/videos/attachment/footage-innsbruck-epiq-uhd-d6cfe9d1",
  "/en/press-kits/skoda-fabia-130-special-edition-celebrates-skoda-autos-anniversary-and-motorsport-heritage",
  "/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship",
  "/en/press-kits/skoda-peaq-press-kit",
  "/en/press-kits/skoda-peaq-press-kit-2",
  "/en/press-kits/skoda-vision-o-press-kit",
  "/en/press-kits/the-all-electric-skoda-elroq-breaking-new-ground-in-the-compactsuv-segment-with-a-covered-design",
  "/en/press-kits/the-all-new-skoda-kodiaq-press-kit",
  "/en/press-kits/the-all-new-skoda-superb-press-kit",
  "/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs",
  "/en/press-releases/production-milestone-skoda-auto-builds-its-one-millionth-karoq",
  "/en/press-releases/skoda-auto-achieves-strong-financial-results-record-ev-deliveries-and-second-place-in-europe-in-h1-2026",
  "/en/press-releases/skoda-auto-and-national-theatre-extend-partnership-until-at-least-2029",
  "/en/press-releases/skoda-auto-announces-changes-to-its-board-of-management",
  "/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company",
  "/en/press-releases/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav",
  "/en/press-releases/skoda-auto-marks-23-years-as-tour-de-france-main-partner-new-skoda-peaq-to-serve-as-red-car",
  "/en/press-releases/skoda-octavia-turns-30-three-decades-of-a-brand-icon",
  "/en/press-releases/skoda-peaq-comprehensive-testing-in-extreme-conditions",
  "/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence",
  "/en/press-releases/skodas-electric-bestsellers-elroq-and-enyaq-receive-model-year-updates",
  "/en/press-releases/world-premiere-of-the-all-new-skoda-elroq-press-materials-and-highlight-video-available",
  "/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-livestream-from-zurich",
  "/en/press-releases/world-premiere-of-the-all-new-skoda-peaq-livestream-from-france",
  "/en/series/125-years-of-motorsport",
  "/en/series/130-years",
  "/en/series/60-seconds-walkaround",
  "/en/series/back-to-the-past",
  "/en/series/czech-footprint",
  "/en/series/evolution-of-parts",
  "/en/series/hidden-helpers",
  "/en/series/minutes-from-car-production",
  "/en/series/my-life-my-car",
  "/en/series/road-trip",
  "/en/series/roads-places",
  "/en/series/sustainable-mobility",
  "/en/series/unexpected-jobs",
  "/en/series/unknown-parts",
  "/en/series/winter-tips",
  "/en/skoda-geneva-strube-interview-mp4",
  "/en/skoda-model/elroq",
  "/en/skoda-model/enyaq-iv-2",
  "/en/skoda-model/epiq",
  "/en/skoda-model/kamiq",
  "/en/skoda-model/karoq-6",
  "/en/skoda-model/new-fabia",
  "/en/skoda-model/new-kodiaq",
  "/en/skoda-model/new-superb",
  "/en/skoda-model/octavia",
  "/en/skoda-model/peaq",
  "/en/skoda-model/scala",
  "/en/skoda-octavia-combi-rs-4x4-2",
  "/en/skoda-octavia-rs230-mpeg-4-1080p-2",
  "/en/skoda-peaq-simply-clever-part-1-1080p-1-a3e05a13",
  "/en/skoda-peaq-simply-clever-part-2-1080p-1-583a6637",
  "/en/skoda-peaq-simply-clever-part-2-with-subtitles-1080p-1-529affa6",
  "/en/skoda-world/a-kodiaq-made-of-paper-the-modeler-spent-700-hours-developing-and-building-it",
  "/en/skoda-world/a-record-year-for-skoda-electrified-models-also-contribute",
  "/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car",
  "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality",
  "/en/skoda-world/how-the-skoda-octavia-reached-365-km-h",
  "/en/skoda-world/legend-chris-froome-takes-you-behind-the-scenes-of-the-tour-de-france",
  "/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details",
  "/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour",
  "/en/skoda-world/the-skoda-elroq-reveals-its-sustainable-interior",
  "/en/skoda-world/the-versatile-octavia-do-you-know-these-ones-too",
  "/en/tiger-on-ice-test",
  "/en/videos",
  "/en/wrc-rally-test"
];
const DEMO_ALIASES = {
  "/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality": "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality"
};
// END GENERATED ALLOWLIST

const ALLOWED = new Set(DEMO_PATHS);

/** EDS page path for a source path (same rule as push/m1-status-lib.mjs edsPath). */
function edsPath(sourcePath) {
  let p = sourcePath || '/';
  try { p = decodeURIComponent(p); } catch (e) { /* malformed → keep raw */ }
  p = p.replace(/\.html?$/i, '').replace(/\/+$/, '');
  if (!p) return '/';
  return p.split('/').map((seg) => seg.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-')).join('/');
}

/** Site-relative href for a demo-page source link, or null to leave it as-is. */
function rewriteHref(href) {
  const m = href.match(SOURCE_HOST);
  if (!m) return null;
  const rest = href.slice(m[0].length);
  const cut = rest.search(/[?#]/);
  const tail = cut === -1 ? '' : rest.slice(cut);
  let target = edsPath(cut === -1 ? rest : rest.slice(0, cut));
  target = DEMO_ALIASES[target] || target;
  return ALLOWED.has(target) ? `${target}${tail}` : null;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  element.querySelectorAll('a[href]').forEach((a) => {
    let href = a.getAttribute('href');
    if (/#s_[ac]id=/.test(href)) href = href.split('#s_aid=')[0].split('#s_cid=')[0];
    if (href.startsWith('/direct-download/')) href = `${SOURCE_ORIGIN}${href}`;
    else href = rewriteHref(href) || href;
    if (href !== a.getAttribute('href')) a.setAttribute('href', href);
  });
}
