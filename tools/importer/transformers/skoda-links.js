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
 * 4. A single-tag news filter (`/en/news/?filter[<tax>][]=<slug>`, the press-release tag
 *    chips, SKODA-607) becomes the demo tag page for that term: `/en/tag/<tax>/<slug>`, or
 *    the one demo tag page with that slug (the source files some terms under another
 *    taxonomy, e.g. technology `electromobility` → `/en/tag/crew/electromobility`). No
 *    unique demo page → the link stays as it is (rule 1).
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
  "/en/category/classic-cars",
  "/en/category/concepts",
  "/en/category/corporate-life",
  "/en/category/design-eng",
  "/en/category/emobility",
  "/en/category/lifestyle",
  "/en/category/lifestyle/adventures",
  "/en/category/lifestyle/people",
  "/en/category/lifestyle/sports",
  "/en/category/models",
  "/en/category/skoda-world",
  "/en/category/skoda-world/design",
  "/en/category/skoda-world/heritage",
  "/en/category/skoda-world/innovation-and-technology",
  "/en/category/skoda-world/responsibility",
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
  "/en/emobility/skoda-peaq-unparalleled-space-and-comfort",
  "/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq",
  "/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq",
  "/en/images",
  "/en/images/001-skoda-peaq-skoda-epiq-ce71e572",
  "/en/images/002-skoda-peaq-skoda-epiq-afbf699f",
  "/en/images/003-skoda-peaq-skoda-epiq-e9288512",
  "/en/images/004-skoda-peaq-skoda-epiq-978a59bd",
  "/en/images/005-skoda-peaq-skoda-epiq-7be8bc24",
  "/en/images/006-skoda-peaq-skoda-epiq-first-edition-35505792",
  "/en/images/007-skoda-peaq-skoda-epiq-first-edition-a52c80dc",
  "/en/images/008-skoda-peaq-skoda-epiq-first-edition-2b99ea44",
  "/en/images/009-skoda-epiq-54d53d81",
  "/en/images/009-skoda-peaq-skoda-epiq-first-edition-bceca70d",
  "/en/images/010-skoda-epiq-3f4514fe",
  "/en/images/010-skoda-peaq-sportline-skoda-epiq-126b736b",
  "/en/images/011-skoda-epiq-fe1b889d",
  "/en/images/011-skoda-peaq-sportline-skoda-epiq-188de9ce",
  "/en/images/012-skoda-epiq-ac7d025b",
  "/en/images/012-skoda-peaq-sportline-skoda-epiq-5e4f4341",
  "/en/images/013-skoda-epiq-947acd5a",
  "/en/images/013-skoda-peaq-sportline-skoda-epiq-d0017674",
  "/en/images/014-skoda-epiq-eaf7f0a3",
  "/en/images/014-skoda-peaq-sportline-skoda-epiq-5d903068",
  "/en/images/015-skoda-epiq-8737c4e2",
  "/en/images/015-skoda-peaq-sportline-skoda-epiq-74c1c602",
  "/en/images/016-skoda-epiq-7633ce16",
  "/en/images/016-skoda-peaq-sportline-skoda-epiq-9d349256",
  "/en/images/017-skoda-peaq-sportline-skoda-epiq-f48d5103",
  "/en/images/018-skoda-peaq-0a8b4ba5-1920x1280-ab2c1175-e1789983218794",
  "/en/images/018-skoda-peaq-sportline-skoda-epiq-b67d25e1",
  "/en/images/019-skoda-epiq-first-edition-skoda-epiq-skoda-peaq-sportline-skoda-peaq-929c1920",
  "/en/images/020-skoda-peaq-skoda-epiq-skoda-epiq-skoda-peaq-sportline-69456c39",
  "/en/images/021-skoda-epiq-skoda-epiq-first-edition-cb1d88fe",
  "/en/images/022-skoda-epiq-skoda-epiq-first-edition-b7a9f642",
  "/en/images/025-skoda-peaq-bc771dee-1920x1310-0fc2860d",
  "/en/images/028-skoda-peaq-0b0266a9",
  "/en/images/028-skoda-peaq-0b0266a9-f097b359",
  "/en/images/029-skoda-peaq-768fdd85",
  "/en/images/029-skoda-peaq-768fdd85-1920x1280-3e2c55ee",
  "/en/images/030-skoda-peaq-71710073",
  "/en/images/060-skoda-peaq-b07bf0f8",
  "/en/images/061-skoda-peaq-9262e91b",
  "/en/images/062-skoda-peaq-4814bbc4",
  "/en/images/063-skoda-peaq-1d2bf3e5",
  "/en/images/064-skoda-peaq-0ba0dc78",
  "/en/images/065-skoda-peaq-e35f34fe",
  "/en/images/066-skoda-peaq-333f018f",
  "/en/images/067-skoda-peaq-95ca7025",
  "/en/images/068-skoda-peaq-620906c5",
  "/en/images/069-skoda-peaq-1a211cc9",
  "/en/images/070-skoda-peaq-f16771ae",
  "/en/images/071-skoda-peaq-e55b535b",
  "/en/images/072-skoda-peaq-d74c3b12",
  "/en/images/073-skoda-peaq-e85fbace",
  "/en/images/074-skoda-peaq-57ae7dd5",
  "/en/images/075-skoda-peaq-46708799",
  "/en/images/076-skoda-peaq-3307cb16",
  "/en/images/103-skoda-peaq-81f5a394-e69b6c98",
  "/en/images/200227-skod-kamiq-interior-1-2",
  "/en/images/dsc-5386-6ec0ab1b",
  "/en/images/dsc-5419-d3320dc0",
  "/en/images/dsc-5425-0546d440",
  "/en/images/dsc-5432-a3ec66da",
  "/en/images/dsc-5437-7af55c3f",
  "/en/images/dsc-5441-557e0d6f",
  "/en/images/dsc-5457-00d5c8eb",
  "/en/images/dsc-5469-c9a23152",
  "/en/images/dsc-5496-e9a0ab0a",
  "/en/images/dsc-5642-f6fb00c0",
  "/en/images/dsc-5712-076cf78b",
  "/en/images/hudebni-leto-ee2dfc93",
  "/en/images/novym-vedoucim-zavodu-skoda-auto-ve-vrchlabi-bude-lars-burger-1-b294f830",
  "/en/images/skoda-peaq-150-3bdddd54",
  "/en/images/skoda-peaq-18-7fc256ec",
  "/en/images/skoda-peaq-5b339691",
  "/en/images/sosnova-classic-355-6869f94a",
  "/en/images/sosnova-classic-380-2ea9f2db",
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
  "/en/skoda-model/elroq",
  "/en/skoda-model/elroq/elroq-rs",
  "/en/skoda-model/elroq/elroq-sportline",
  "/en/skoda-model/enyaq-iv-2",
  "/en/skoda-model/enyaq-iv-2/enyaq-rs",
  "/en/skoda-model/enyaq-iv-2/enyaq-sportline-iv",
  "/en/skoda-model/epiq",
  "/en/skoda-model/kamiq",
  "/en/skoda-model/karoq-6",
  "/en/skoda-model/karoq-6/karoq-sportline",
  "/en/skoda-model/new-fabia",
  "/en/skoda-model/new-kodiaq",
  "/en/skoda-model/new-kodiaq/kodiaq-rs",
  "/en/skoda-model/new-kodiaq/new-kodiaq-iv",
  "/en/skoda-model/new-kodiaq/new-kodiaq-sportline",
  "/en/skoda-model/new-superb",
  "/en/skoda-model/new-superb/new-superb-iv",
  "/en/skoda-model/octavia",
  "/en/skoda-model/octavia/octavia-rs",
  "/en/skoda-model/octavia/octavia-sportline",
  "/en/skoda-model/peaq",
  "/en/skoda-model/scala",
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
  "/en/tag/company/design",
  "/en/tag/company/production",
  "/en/tag/crew/electro-vehicle",
  "/en/tag/crew/electromobility",
  "/en/tag/crew/emobility",
  "/en/tag/crew/technology",
  "/en/tag/derivative/sportline",
  "/en/tag/environment/greenfuture",
  "/en/tag/environment/sustainability",
  "/en/tag/model/elroq",
  "/en/tag/model/enyaq",
  "/en/tag/model/epiq",
  "/en/tag/model/fabia",
  "/en/tag/model/kamiq",
  "/en/tag/model/karoq",
  "/en/tag/model/kodiaq",
  "/en/tag/model/kylaq",
  "/en/tag/model/octavia",
  "/en/tag/model/peaq",
  "/en/tag/model/scala",
  "/en/tag/model/slavia",
  "/en/tag/model/superb",
  "/en/tag/people/stefani",
  "/en/tag/years/2024",
  "/en/tag/years/2025",
  "/en/tag/years/2026",
  "/en/videos",
  "/en/videos/936-km-without-recharging-skoda-peaq-sets-range-record-for-electric-seven-seater-suv-1080p-b9fcbb59",
  "/en/videos/epiq-colours-en-1d57bbaa",
  "/en/videos/epiq-reveal-hero-60s-16x9-clean-noepiq-h264-25mbit-331d5d10",
  "/en/videos/naming-story-hd-16x9-809a9c3f",
  "/en/videos/peaq-colours-en-ea6229cc",
  "/en/videos/skoda-appoints-world-renowned-cyclist-chris-froome-as-brand-cycling-ambassador-1080p-7f20f61e",
  "/en/videos/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav-1080p-1-9a67240d",
  "/en/videos/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav-1080p-d8e78f93",
  "/en/videos/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav-540p-ed39b17d",
  "/en/videos/skoda-epiq-footage-01-hd-68aa554d",
  "/en/videos/skoda-epiq-footage-02-hd-bcda4348",
  "/en/videos/skoda-epiq-footage-first-edition-01-hd-830e36e5",
  "/en/videos/skoda-epiq-footage-first-edition-02-uhd-58aec896",
  "/en/videos/skoda-octavia-turns-30-three-decades-of-a-brand-icon-1080p-b0e9968c",
  "/en/videos/skoda-peaq-footage-i-uhd-aa09ad60",
  "/en/videos/skoda-peaq-footage-ii-uhd-569780b0",
  "/en/videos/skoda-peaq-simply-clever-part-1-1080p-1-a3e05a13",
  "/en/videos/skoda-peaq-simply-clever-part-1-with-subtitles-1080p-1-526eb599",
  "/en/videos/skoda-peaq-simply-clever-part-2-1080p-1-583a6637",
  "/en/videos/skoda-peaq-simply-clever-part-2-with-subtitles-1080p-1-529affa6",
  "/en/videos/skoda-peaq-sportline-footage-i-uhd-166b2150",
  "/en/videos/skoda-receives-red-dot-award-for-its-vision-app-concept-720p-cd084254",
  "/en/videos/skoda-slavia-monte-carlo-mov-125225b2",
  "/en/videos/skoda-slavia-prestige-69ae887f",
  "/en/videos/tdffaz26-2-12956adf",
  "/en/videos/tdffaz26-mobile-e1b62f9c",
  "/en/videos/world-premiere-of-the-all-new-skoda-peaq-1080p-6cacbdd4"
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

const TAG_FILTER = /^(?:(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com)?\/en\/news\/?\?filter(?:\[|%5B)([a-z0-9-]+)(?:\]|%5D)(?:\[\]|%5B%5D)=([^&#]+)$/i;

/** Demo tag page for a single-tag news filter link, or null (rule 4). */
function tagPageHref(href) {
  const m = href.match(TAG_FILTER);
  if (!m) return null;
  const slug = edsPath(`/${m[2]}`).slice(1);
  const exact = `/en/tag/${m[1].toLowerCase()}/${slug}`;
  if (ALLOWED.has(exact)) return exact;
  const bySlug = DEMO_PATHS.filter((p) => p.startsWith('/en/tag/') && p.endsWith(`/${slug}`)
    && p.split('/').length === 5);
  return bySlug.length === 1 ? bySlug[0] : null;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  element.querySelectorAll('a[href]').forEach((a) => {
    let href = a.getAttribute('href');
    if (/#s_[ac]id=/.test(href)) href = href.split('#s_aid=')[0].split('#s_cid=')[0];
    if (href.startsWith('/direct-download/')) href = `${SOURCE_ORIGIN}${href}`;
    else href = tagPageHref(href) || rewriteHref(href) || href;
    if (href !== a.getAttribute('href')) a.setAttribute('href', href);
  });
}
