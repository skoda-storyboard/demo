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
 *    of 404ing on the demo (link policy D-3 default (b), SKODA-609). Pages known only from
 *    the live index (LIVE_ONLY_PATHS, SKODA-801a) take plain links; a listing-filter link
 *    to them stays live, since each demo listing reads only its own authored facets.
 * 2. Root-relative `/direct-download/…` hrefs (press-release image downloads) point at the
 *    live source; they 404 on EDS.
 * 3. `#s_aid=` / `#s_cid=` analytics fragments are stripped (SKODA-602 idempotency), for
 *    the importers that do not run skoda-page-cleanup.
 * 4. A single-tag news filter (`/en/news/?filter[<tax>][]=<slug>`, the press-release tag
 *    chips, SKODA-607) becomes the demo tag page for that term: `/en/tag/<tax>/<slug>`, or
 *    the one demo tag page with that slug (the source files some terms under another
 *    taxonomy, e.g. technology `electromobility` → `/en/tag/crew/electromobility`). No
 *    unique demo page → the link stays as it is (rule 1). A Story Rail's `viewall` link is
 *    not a tag chip: it keeps the filtered listing, as the source's rail "All" (#284).
 * 5. A scheme-less source link (`skoda-storyboard.com/en/…`, authored without `https://`;
 *    the Classic Days 2026 hub's Octavia banner) is the source page WordPress redirects it
 *    to, also once the DOM has resolved it against the page path
 *    (`…/<page>/skoda-storyboard.com/en/…`). It is normalised first, then rules 1–4 apply.
 * 6. A trailing space (raw or `%20`) is trimmed from every href first.
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
  "/en/emobility/a-true-czech-from-spain",
  "/en/emobility/an-electric-car-approaching-says-the-license-plate-but-only-in-some-countries",
  "/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq",
  "/en/emobility/camouflage-to-get-you-hooked",
  "/en/emobility/coffee-on-electric-wheels-elroq-and-enyaq-serving-coffee",
  "/en/emobility/come-and-play-skoda-is-heading-to-milan",
  "/en/emobility/designers-on-the-peaq-its-modern-durable-and-practical",
  "/en/emobility/elroq-rs-in-a-robe-unveiling-the-secret-of-matte-paint",
  "/en/emobility/enyaq-and-elroq-now-double-as-gaming-consoles-and-thats-not-all",
  "/en/emobility/even-opening-the-door-is-an-experience-says-the-designer-of-the-peaq-suv",
  "/en/emobility/how-the-versatile-skoda-peaq-conquered-a-mountain-peak",
  "/en/emobility/how-was-the-elroq-made-not-in-the-usual-way",
  "/en/emobility/make-use-of-the-frunk-unlock-with-your-phone-new-enhancements-for-elroq-and-enyaq",
  "/en/emobility/meet-peaq-safe-and-comfortable",
  "/en/emobility/meet-the-peaq-a-large-suv-with-outstanding-aerodynamics",
  "/en/emobility/meet-the-peaq-comfort-just-like-at-home",
  "/en/emobility/meet-the-peaq-spacious-inside-and-out",
  "/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan",
  "/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia",
  "/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging",
  "/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq",
  "/en/emobility/skoda-elroq-and-a-happy-family",
  "/en/emobility/skoda-elroq-premiere-light-cube-camera-action",
  "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
  "/en/emobility/skoda-peaq-unparalleled-space-and-comfort",
  "/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq",
  "/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq",
  "/en/emobility/teaser",
  "/en/emobility/the-skoda-peaq-will-win-you-over-fast",
  "/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere",
  "/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live",
  "/en/emobility/whats-behind-epiq-design",
  "/en/images",
  "/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague",
  "/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving",
  "/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans",
  "/en/lifestyle/feeling-the-heat-skoda-cars-keep-both-passengers-and-their-snacks-cool",
  "/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling",
  "/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como",
  "/en/lifestyle/ouninpohja-finlands-roller-coaster-stage",
  "/en/lifestyle/rs-four-ways-which-one-will-you-choose",
  "/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones",
  "/en/lifestyle/what-you-learn-on-the-circuit-can-save-you-on-the-road",
  "/en/media-cart",
  "/en/media-room",
  "/en/models/skoda-elroq-through-designers-eyes",
  "/en/news",
  "/en/press-kits",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/images",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/laurin-klement-fc-from-1908-the-first-major-motor-racing-successes-of-automobiles-from-mlada-boleslav",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/laurin-klement-rk-m-1921-racing-driver-count-sascha-kolowrat-krakowskys-favourite-model",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/motorsport-versions-of-the-skoda-favorit-1989-all-different-and-yet-familiar",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-1000-mb-1964-and-1100-mb-b5-1966-a-family-saloon-in-rally",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-1100-ohc-1957-the-beautiful-dream-of-le-mans",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-130-lr-1984-last-motorsport-model-from-mlada-boleslav-with-rear-mounted-engine",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-130-rs-1975-a-star-on-both-sides-of-the-iron-curtain",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-180-rs-and-200-rs-1974-rally-cars-from-another-league",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-f3-type-992-1964-european-class-formula-racing-car",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-motorsport-edition-limited-edition-celebrates-the-125th-anniversary-of-skoda-motorsport",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-r5-rally2-rally2-evo-successful-in-the-hands-of-factory-drivers-and-privateers-alike",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-rs-rally2-celebrates-125-years-of-skoda-motorsport-success",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-super-2000-2008-successful-motorsport-comeback-for-the-works-team",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-fabia-wrc-2003-paving-the-way-for-future-success",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-felicia-kit-car-1995-the-next-chapter-in-an-international-success-story",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-octavia-touring-sport-1960-successful-return-to-international-rally-courses",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-octavia-wrc-1999-entering-the-highest-class-of-international-rallying",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-popular-sport-1936-outstanding-success-at-the-monte-carlo-rally",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-spider-b5-1972-and-skoda-spider-ii-1975-prototypes-for-the-racetrack",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/skoda-sport-1949-the-long-distance-runner-from-the-other-side-of-the-iron-curtain",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/texts",
  "/en/press-kits/125-years-of-skoda-motorsport-press-kit/videos",
  "/en/press-kits/4x4-winter-experience-press-kit",
  "/en/press-kits/classic-days-2026-press-kit",
  "/en/press-kits/classic-days-2026-press-kit/125-years-of-skoda-motorsport",
  "/en/press-kits/classic-days-2026-press-kit/1955-skoda-440-on-the-international-stage",
  "/en/press-kits/classic-days-2026-press-kit/60-years-of-the-trekka-an-suv-from-new-zealand",
  "/en/press-kits/classic-days-2026-press-kit/images",
  "/en/press-kits/classic-days-2026-press-kit/laurin-klement-bz-1902-1904",
  "/en/press-kits/classic-days-2026-press-kit/laurin-klement-slavia-type-b-1899-1904",
  "/en/press-kits/classic-days-2026-press-kit/laurin-klement-voiturette-a-1905-1907",
  "/en/press-kits/classic-days-2026-press-kit/skoda-110-r-coupe-1970-1980",
  "/en/press-kits/classic-days-2026-press-kit/skoda-1100-mbx-1967-1969",
  "/en/press-kits/classic-days-2026-press-kit/skoda-120-gls-1976-1990",
  "/en/press-kits/classic-days-2026-press-kit/skoda-120-s-rallye-1972-1975",
  "/en/press-kits/classic-days-2026-press-kit/skoda-130-rs-1975-a-star-on-both-sides-of-the-iron-curtain",
  "/en/press-kits/classic-days-2026-press-kit/skoda-645-1929-1934",
  "/en/press-kits/classic-days-2026-press-kit/skoda-auto-celebrates-more-than-130-years-of-craftsmanship-and-innovation",
  "/en/press-kits/classic-days-2026-press-kit/skoda-fabia-rs-rally2-celebrates-125-years-of-skoda-motorsportsuccess",
  "/en/press-kits/classic-days-2026-press-kit/skoda-favorit-136-l-1988-1994",
  "/en/press-kits/classic-days-2026-press-kit/skoda-felicia-1959-1964",
  "/en/press-kits/classic-days-2026-press-kit/skoda-museum",
  "/en/press-kits/classic-days-2026-press-kit/skoda-museum-presents-only-surviving-laurin-klement-bscsports-car-from-1908",
  "/en/press-kits/classic-days-2026-press-kit/skoda-octavia-1959-1964",
  "/en/press-kits/classic-days-2026-press-kit/skoda-octavia-turns-30-three-decades-of-a-brand-icon",
  "/en/press-kits/classic-days-2026-press-kit/skoda-popular-monte-carlo-1936-1939",
  "/en/press-kits/classic-days-2026-press-kit/skoda-popular-sport-1936-outstanding-success-at-the-monte-carlo-rally",
  "/en/press-kits/classic-days-2026-press-kit/skoda-rapid-135-1987-1990",
  "/en/press-kits/classic-days-2026-press-kit/skoda-rapid-ldd-1984",
  "/en/press-kits/classic-days-2026-press-kit/skoda-sport-1949-the-long-distance-runner-from-the-other-side-of-the-iron-curtain",
  "/en/press-kits/classic-days-2026-press-kit/skoda-superb-3000-ohv-1938-1949",
  "/en/press-kits/classic-days-2026-press-kit/texts",
  "/en/press-kits/classic-days-2026-press-kit/the-skoda-1101-tudor-celebrates-its-80th-anniversary",
  "/en/press-kits/classic-days-2026-press-kit/videos",
  "/en/press-kits/lets-explore-albania-press-kit",
  "/en/press-kits/new-skoda-enyaq-press-kit-2",
  "/en/press-kits/press-kit-skoda-at-the-iaa-2019",
  "/en/press-kits/skoda-elroq-press-kit",
  "/en/press-kits/skoda-elroq-press-kit-2",
  "/en/press-kits/skoda-epiq-city-suv-crossover-preview-of-skodas-most-affordable-all-electric-car",
  "/en/press-kits/skoda-epiq-press-kit-2",
  "/en/press-kits/skoda-epiq-press-kit-2/battery-and-powertrain-variants-front-wheel-drive-architectureand-efficient-electric-performance",
  "/en/press-kits/skoda-epiq-press-kit-2/connectivity-intuitive-digital-services-and-seamless-vehicle-access",
  "/en/press-kits/skoda-epiq-press-kit-2/exterior-the-first-skoda-production-model-to-fully-incorporatethe-modern-solid-design-language",
  "/en/press-kits/skoda-epiq-press-kit-2/first-edition-launch-version-with-exclusive-design-details",
  "/en/press-kits/skoda-epiq-press-kit-2/frequently-asked-questions",
  "/en/press-kits/skoda-epiq-press-kit-2/images",
  "/en/press-kits/skoda-epiq-press-kit-2/infographics",
  "/en/press-kits/skoda-epiq-press-kit-2/interior-designed-for-space-intuitive-use-and-everyday-convenience",
  "/en/press-kits/skoda-epiq-press-kit-2/safety-and-assistance-systems-comprehensive-predictiveand-reassuring-driver-support",
  "/en/press-kits/skoda-epiq-press-kit-2/skoda-epiq-the-new-all-electric-entry-model-combining-accessibilitycompact-dimensions-and-everyday-practicality",
  "/en/press-kits/skoda-epiq-press-kit-2/technical-data",
  "/en/press-kits/skoda-epiq-press-kit-2/texts",
  "/en/press-kits/skoda-epiq-press-kit-2/videos",
  "/en/press-kits/skoda-fabia-130-special-edition-celebrates-skoda-autos-anniversary-and-motorsport-heritage",
  "/en/press-kits/skoda-octavia-media-launch-press-kit",
  "/en/press-kits/skoda-octavia-press-kit",
  "/en/press-kits/skoda-octavia-press-kit-2",
  "/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps",
  "/en/press-kits/skoda-octavia-rs-and-octavia-scout-press-kit",
  "/en/press-kits/skoda-peaq-first-glimpse-of-skodas-new-electric-flagship",
  "/en/press-kits/skoda-peaq-press-kit",
  "/en/press-kits/skoda-peaq-press-kit-2",
  "/en/press-kits/skoda-peaq-press-kit-2/battery-and-powertrain-variants-the-longest-rangeof-any-skoda-electric-model",
  "/en/press-kits/skoda-peaq-press-kit-2/connectivity-vertical-infotainment-display-and-sonos-premiumsound-system-set-the-peaq-apart",
  "/en/press-kits/skoda-peaq-press-kit-2/exterior-skodas-largest-suv-with-the-modern-solid-design",
  "/en/press-kits/skoda-peaq-press-kit-2/frequently-asked-questions",
  "/en/press-kits/skoda-peaq-press-kit-2/images",
  "/en/press-kits/skoda-peaq-press-kit-2/infographics",
  "/en/press-kits/skoda-peaq-press-kit-2/interior-a-relaxing-lounge-with-seven-seats-and-the-largest-boot",
  "/en/press-kits/skoda-peaq-press-kit-2/safety-a-comprehensive-suite-of-active-and-passive-safety-systems",
  "/en/press-kits/skoda-peaq-press-kit-2/technical-data",
  "/en/press-kits/skoda-peaq-press-kit-2/texts",
  "/en/press-kits/skoda-peaq-press-kit-2/the-peaq-sportline-dynamic-inside-and-out",
  "/en/press-kits/skoda-peaq-press-kit-2/the-skoda-peaq-skodas-new-flagship-expands-the-brands-electric-portfolio",
  "/en/press-kits/skoda-peaq-press-kit-2/videos",
  "/en/press-kits/skoda-rs-driving-experience-press-kit",
  "/en/press-kits/skoda-rs-experience-press-kit",
  "/en/press-kits/skoda-vision-o-press-kit",
  "/en/press-kits/the-all-electric-skoda-elroq-breaking-new-ground-in-the-compactsuv-segment-with-a-covered-design",
  "/en/press-kits/the-all-new-skoda-kodiaq-press-kit",
  "/en/press-kits/the-all-new-skoda-superb-press-kit",
  "/en/press-kits/the-enyaq-rs-race-a-new-motorsport-concept-with-sustainable-ideas-for-production-models",
  "/en/press-releases/2026-iihf-ice-hockey-world-championship-roman-josi-wins-most-valuable-player-trophy-created-by-skoda-design",
  "/en/press-releases/30-years-since-the-foundation-stone-was-laid-m13-a-key-pillar-of-skodas-production",
  "/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs",
  "/en/press-releases/camp-mode-in-the-myskoda-app-comfortable-overnight-stays-in-electric-vehicles",
  "/en/press-releases/lorena-wiebes-receives-skoda-design-trophy-after-winning-tour-de-france-femmes-avec-zwift-points-classification",
  "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-3-2026",
  "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-3-2026",
  "/en/press-releases/preparations-begin-for-the-11th-skoda-student-car-celebrating-100-years-of-vocational-education",
  "/en/press-releases/production-milestone-skoda-auto-builds-its-one-millionth-karoq",
  "/en/press-releases/simply-clever-for-summer-smart-skoda-features-that-make-every-trip-easier",
  "/en/press-releases/skoda-auto-achieves-strong-financial-results-record-ev-deliveries-and-second-place-in-europe-in-h1-2026",
  "/en/press-releases/skoda-auto-and-national-theatre-extend-partnership-until-at-least-2029",
  "/en/press-releases/skoda-auto-announces-changes-to-its-board-of-management",
  "/en/press-releases/skoda-auto-appoints-world-renowned-road-cyclist-chris-froome-as-brand-cycling-ambassador",
  "/en/press-releases/skoda-auto-celebrates-33-years-as-official-main-sponsor-of-the-iihf-ice-hockey-world-championship-and-unveils-the-epiq",
  "/en/press-releases/skoda-auto-celebrates-successful-milan-design-week-with-strong-visitor-interest-and-fuorisalone-award-recognition-as-highest-rated-installation",
  "/en/press-releases/skoda-auto-enters-saudi-arabian-market-strengthening-its-presence-in-the-middle-east",
  "/en/press-releases/skoda-auto-klaus-zellmer-to-leave-the-company",
  "/en/press-releases/skoda-auto-launches-production-of-the-new-peaq-in-mlada-boleslav",
  "/en/press-releases/skoda-auto-marks-23-years-as-tour-de-france-main-partner-new-skoda-peaq-to-serve-as-red-car",
  "/en/press-releases/skoda-auto-produces-first-units-of-updated-octavia-in-kvasiny",
  "/en/press-releases/skoda-auto-ranks-as-europes-second-best-selling-car-brand-after-a-strong-first-quarter",
  "/en/press-releases/skoda-auto-supports-tour-de-france-femmes-avec-zwift-as-official-main-partner-for-the-fifth-year",
  "/en/press-releases/skoda-auto-supports-uci-mountain-bike-world-championshipsas-official-partner-for-second-year-running",
  "/en/press-releases/skoda-auto-teams-up-with-hasbros-play-doh-brand",
  "/en/press-releases/skoda-auto-unveils-updated-slavia-in-india",
  "/en/press-releases/skoda-epiq-sportline-debuts-at-the-paris-motor-show",
  "/en/press-releases/skoda-fabia-motorsport-edition-limited-edition-celebrates-the-125th-anniversary-of-skoda-motorsport",
  "/en/press-releases/skoda-kvasiny-newsletter-2-2026",
  "/en/press-releases/skoda-launches-production-of-the-new-epiq-in-pamplona-spain",
  "/en/press-releases/skoda-octavia-combi-rs-wins-prestigious-2024-golden-steering-wheel-award-in-the-mid-sized-car-category",
  "/en/press-releases/skoda-octavia-is-the-brands-first-model-with-a-full-hybrid-powertrain",
  "/en/press-releases/skoda-octavia-turns-30-three-decades-of-a-brand-icon",
  "/en/press-releases/skoda-offers-a-first-glimpse-of-the-interior-concept-of-its-electric-seven-seater-peaq",
  "/en/press-releases/skoda-peaq-comprehensive-testing-in-extreme-conditions",
  "/en/press-releases/skoda-presents-exterior-sketches-of-its-all-new-electric-seven-seater-peaq",
  "/en/press-releases/skoda-presents-first-interior-sketches-and-announces-world-premiere-date-of-electric-epiq",
  "/en/press-releases/skoda-receives-red-dot-award-for-its-vision-app-concept",
  "/en/press-releases/skoda-superb-25-years-of-comfort-space-and-technical-excellence",
  "/en/press-releases/skoda-vrchlabi-newsletter-2-2026",
  "/en/press-releases/skodas-electric-bestsellers-elroq-and-enyaq-receive-model-year-updates",
  "/en/press-releases/skodas-voice-assistant-laura-now-enhanced-with-chatgpt-capabilities",
  "/en/press-releases/tadej-pogacar-winner-of-the-113th-tour-de-france-receives-crystal-trophy-created-by-skoda-design",
  "/en/press-releases/the-skoda-4x4-model-range-safe-driving-in-all-weather-and-challenging-terrain",
  "/en/press-releases/the-skoda-elroq-earns-5-star-euro-ncap-safety-rating-with-the-enyaq-and-octavia-retaining-their-top-scores",
  "/en/press-releases/the-updated-octavia-now-with-all-wheel-drive",
  "/en/press-releases/when-driving-fun-meets-comfort-rally-ace-oliver-solberg-tests-the-skoda-octavia-rs",
  "/en/press-releases/world-premiere-of-the-all-new-skoda-elroq-press-materials-and-highlight-video-available",
  "/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-livestream-from-zurich",
  "/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-pictures-on-the-skoda-storyboard",
  "/en/press-releases/world-premiere-of-the-all-new-skoda-peaq-livestream-from-france",
  "/en/search",
  "/en/series-2",
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
  "/en/simply-clever/park-your-skoda-using-your-mobile-phone-well-show-you-how-how",
  "/en/skoda-model/elroq",
  "/en/skoda-model/elroq/elroq-rs",
  "/en/skoda-model/elroq/elroq-sportline",
  "/en/skoda-model/enyaq-iv-2",
  "/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv",
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
  "/en/skoda-world/125-years-of-racing-history-in-one-place-come-visit-the-museum",
  "/en/skoda-world/2024-a-year-of-new-electric-cars-and-innovated-favourites",
  "/en/skoda-world/a-kodiaq-made-of-paper-the-modeler-spent-700-hours-developing-and-building-it",
  "/en/skoda-world/a-record-year-for-skoda-electrified-models-also-contribute",
  "/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car",
  "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality",
  "/en/skoda-world/get-your-car-ready-for-summer-with-skoda-accessories",
  "/en/skoda-world/how-the-skoda-octavia-reached-365-km-h",
  "/en/skoda-world/king-of-space-and-long-distance-travel-skoda-superb-celebrates-25-years",
  "/en/skoda-world/legend-chris-froome-takes-you-behind-the-scenes-of-the-tour-de-france",
  "/en/skoda-world/making-driving-easier-how-cruise-control-works",
  "/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain",
  "/en/skoda-world/oliver-solberg-behind-the-wheel-of-the-new-octavia-rs",
  "/en/skoda-world/peaq-inside-a-designblok",
  "/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details",
  "/en/skoda-world/rally-champion-and-the-unique-skoda-fabia-motorsport-edition",
  "/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator",
  "/en/skoda-world/sportline-models-dynamic-elegance-for-every-day",
  "/en/skoda-world/the-immortal-octavia-see-what-it-looks-like-after-one-million-kilometres",
  "/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour",
  "/en/skoda-world/the-versatile-octavia-do-you-know-these-ones-too",
  "/en/skoda-world/what-was-racing-like-half-a-century-ago-skoda-120-s-rallye-delights-a-champion",
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
  "/en/videos"
];
const DEMO_ALIASES = {
  "/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality": "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality"
};
const LIVE_ONLY_PATHS = [
  "/en/emobility/a-true-czech-from-spain",
  "/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq",
  "/en/emobility/come-and-play-skoda-is-heading-to-milan",
  "/en/emobility/meet-peaq-safe-and-comfortable",
  "/en/emobility/meet-the-peaq-a-large-suv-with-outstanding-aerodynamics",
  "/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan",
  "/en/emobility/teaser",
  "/en/emobility/the-skoda-peaq-will-win-you-over-fast",
  "/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere",
  "/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live",
  "/en/emobility/whats-behind-epiq-design",
  "/en/lifestyle/feeling-the-heat-skoda-cars-keep-both-passengers-and-their-snacks-cool",
  "/en/media-cart",
  "/en/media-room",
  "/en/news",
  "/en/press-kits",
  "/en/press-releases/2026-iihf-ice-hockey-world-championship-roman-josi-wins-most-valuable-player-trophy-created-by-skoda-design",
  "/en/press-releases/camp-mode-in-the-myskoda-app-comfortable-overnight-stays-in-electric-vehicles",
  "/en/press-releases/lorena-wiebes-receives-skoda-design-trophy-after-winning-tour-de-france-femmes-avec-zwift-points-classification",
  "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-3-2026",
  "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-3-2026",
  "/en/press-releases/preparations-begin-for-the-11th-skoda-student-car-celebrating-100-years-of-vocational-education",
  "/en/press-releases/simply-clever-for-summer-smart-skoda-features-that-make-every-trip-easier",
  "/en/press-releases/skoda-auto-appoints-world-renowned-road-cyclist-chris-froome-as-brand-cycling-ambassador",
  "/en/press-releases/skoda-auto-celebrates-33-years-as-official-main-sponsor-of-the-iihf-ice-hockey-world-championship-and-unveils-the-epiq",
  "/en/press-releases/skoda-auto-celebrates-successful-milan-design-week-with-strong-visitor-interest-and-fuorisalone-award-recognition-as-highest-rated-installation",
  "/en/press-releases/skoda-auto-ranks-as-europes-second-best-selling-car-brand-after-a-strong-first-quarter",
  "/en/press-releases/skoda-auto-supports-tour-de-france-femmes-avec-zwift-as-official-main-partner-for-the-fifth-year",
  "/en/press-releases/skoda-auto-supports-uci-mountain-bike-world-championshipsas-official-partner-for-second-year-running",
  "/en/press-releases/skoda-auto-teams-up-with-hasbros-play-doh-brand",
  "/en/press-releases/skoda-auto-unveils-updated-slavia-in-india",
  "/en/press-releases/skoda-epiq-sportline-debuts-at-the-paris-motor-show",
  "/en/press-releases/skoda-fabia-motorsport-edition-limited-edition-celebrates-the-125th-anniversary-of-skoda-motorsport",
  "/en/press-releases/skoda-kvasiny-newsletter-2-2026",
  "/en/press-releases/skoda-launches-production-of-the-new-epiq-in-pamplona-spain",
  "/en/press-releases/skoda-octavia-is-the-brands-first-model-with-a-full-hybrid-powertrain",
  "/en/press-releases/skoda-offers-a-first-glimpse-of-the-interior-concept-of-its-electric-seven-seater-peaq",
  "/en/press-releases/skoda-presents-exterior-sketches-of-its-all-new-electric-seven-seater-peaq",
  "/en/press-releases/skoda-presents-first-interior-sketches-and-announces-world-premiere-date-of-electric-epiq",
  "/en/press-releases/skoda-receives-red-dot-award-for-its-vision-app-concept",
  "/en/press-releases/skoda-vrchlabi-newsletter-2-2026",
  "/en/press-releases/tadej-pogacar-winner-of-the-113th-tour-de-france-receives-crystal-trophy-created-by-skoda-design",
  "/en/press-releases/world-premiere-of-the-all-new-skoda-epiq-pictures-on-the-skoda-storyboard",
  "/en/search",
  "/en/series-2",
  "/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv",
  "/en/skoda-world/125-years-of-racing-history-in-one-place-come-visit-the-museum",
  "/en/skoda-world/get-your-car-ready-for-summer-with-skoda-accessories",
  "/en/skoda-world/king-of-space-and-long-distance-travel-skoda-superb-celebrates-25-years",
  "/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain",
  "/en/skoda-world/peaq-inside-a-designblok",
  "/en/skoda-world/rally-champion-and-the-unique-skoda-fabia-motorsport-edition",
  "/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator",
  "/en/skoda-world/what-was-racing-like-half-a-century-ago-skoda-120-s-rallye-delights-a-champion"
];
// END GENERATED ALLOWLIST

const ALLOWED = new Set(DEMO_PATHS);
const LIVE_ONLY = new Set(LIVE_ONLY_PATHS);

/** EDS page path for a source path (same rule as push/m1-status-lib.mjs edsPath). */
function edsPath(sourcePath) {
  let p = sourcePath || '/';
  try { p = decodeURIComponent(p); } catch (e) { /* malformed → keep raw */ }
  p = p.replace(/\.html?$/i, '').replace(/\/+$/, '');
  if (!p) return '/';
  return p.split('/').map((seg) => seg.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-')).join('/');
}

// rule 5: a bare `[www.]skoda-storyboard.com/` (raw, or nested in a resolved source URL)
const SCHEMELESS_SOURCE = /^(?:(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com\/(?:[^?#]*\/)?)?(?:www\.)?skoda-storyboard\.com(?=\/)/i;

/** The source URL a scheme-less source-host href means, or the href unchanged (rule 5). */
function schemelessSource(href) {
  const m = href.match(SCHEMELESS_SOURCE);
  return m ? `${SOURCE_ORIGIN}${href.slice(m[0].length)}` : href;
}

/** Site-relative href for a demo-page source link, or null to leave it as-is. */
function rewriteHref(href) {
  const m = href.match(SOURCE_HOST);
  if (!m) return null;
  const rest = href.slice(m[0].length);
  const cut = rest.search(/[?#]/);
  const tail = cut === -1 ? '' : rest.slice(cut);
  // WordPress post-id shortlinks (`/en/?p=<id>`) address a post, not the path (SKODA-207):
  // rewriting them would point at the demo home page.
  if (/^\?(?:[^#]*&)?(?:p|page_id)=\d/.test(tail)) return null;
  let target = edsPath(cut === -1 ? rest : rest.slice(0, cut));
  target = DEMO_ALIASES[target] || target;
  // A page known only from the live index (SKODA-801a) takes plain links: each demo listing
  // reads only its own authored facets, so a listing-filter link (`?filter[<taxonomy>]…`)
  // to it keeps the live filtered listing. Search's `filter[search]` is always read.
  if (LIVE_ONLY.has(target) && /[?&]filter(?:\[|%5B)(?!search(?:\]|%5D))/i.test(tail.split('#')[0])) {
    return null;
  }
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

// the "All" keys story-rail reads (blocks/story-rail/story-rail.js settings)
const RAIL_VIEWALL_KEYS = ['viewall', 'view-all', 'all'];

/** The link sits in a Story Rail block table's "All" row (`viewall`, `view-all` or `all`). */
function isRailViewAll(a) {
  const row = a.closest('tr');
  const table = row && row.closest('table');
  if (!table || row.cells.length < 2
    || !RAIL_VIEWALL_KEYS.includes(row.cells[0].textContent.trim().toLowerCase())) return false;
  const head = table.rows[0] && table.rows[0].cells[0];
  return !!head && /^story rail\b/i.test(head.textContent.trim());
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  element.querySelectorAll('a[href]').forEach((a) => {
    // rule 6: a trailing (encoded) space is authoring noise, and 403s on the cdn (Classic Days
    // 2026 Texts: `…_469d33ab.pdf `); it also hid the PDF from the binary rewrite
    let href = a.getAttribute('href').replace(/(?:\s|%20)+$/i, '');
    if (/#s_[ac]id=/.test(href)) href = href.split('#s_aid=')[0].split('#s_cid=')[0];
    href = schemelessSource(href);
    if (href.startsWith('/direct-download/')) href = `${SOURCE_ORIGIN}${href}`;
    else href = (!isRailViewAll(a) && tagPageHref(href)) || rewriteHref(href) || href;
    if (href !== a.getAttribute('href')) a.setAttribute('href', href);
  });
}
