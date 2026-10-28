/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-sustainability-nav.js
  var import_sustainability_nav_exports = {};
  __export(import_sustainability_nav_exports, {
    default: () => import_sustainability_nav_default
  });

  // tools/importer/locale-chrome.js
  var LIVE_HOST = /^(?:www\.)?skoda-storyboard\.com$/i;
  var text = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function authoredHref(href) {
    if (!href) return "";
    if (href.startsWith("#")) return href;
    try {
      const url = new URL(href, "https://www.skoda-storyboard.com");
      if (/^#s_[ac]id=/.test(url.hash)) url.hash = "";
      if (LIVE_HOST.test(url.hostname)) return `https://www.skoda-storyboard.com${url.pathname}${url.search}${url.hash}`;
      return url.href;
    } catch (e) {
      return href;
    }
  }
  function link(document, href, label, title) {
    const a = document.createElement("a");
    a.href = authoredHref(href);
    a.textContent = label;
    if (title) a.title = title;
    return a;
  }
  function para(document, ...children) {
    const p = document.createElement("p");
    children.forEach((c, i) => {
      if (i) p.append(" ");
      p.append(c);
    });
    return p;
  }
  function buildSectionNav(document, page) {
    const root = document.createElement("div");
    const pageHref = (href) => /[?&]page_id=/.test(href || "") ? page : href;
    const switcher = document.createElement("ul");
    document.querySelectorAll(".topbar .section-nav a").forEach((a) => {
      const li = document.createElement("li");
      li.append(link(document, pageHref(a.getAttribute("href")), text(a)));
      switcher.append(li);
    });
    if (!switcher.children.length) throw new Error("buildSectionNav: the source topbar has no section tabs");
    root.append(switcher);
    const lang = document.querySelector(".topbar .lang-links");
    if (lang) {
      const locales = document.createElement("p");
      if (![...lang.children].some((el) => !el.matches("a"))) {
        const strong = document.createElement("strong");
        strong.textContent = (page.split("/")[1] || "en").toUpperCase();
        locales.append(strong);
      }
      [...lang.children].forEach((el) => {
        if (locales.childNodes.length) locales.append(" ");
        if (el.matches("a")) {
          locales.append(link(document, el.getAttribute("href"), text(el).toUpperCase()));
        } else {
          const strong = document.createElement("strong");
          strong.textContent = text(el).toUpperCase();
          locales.append(strong);
        }
      });
      root.append(locales);
    }
    root.append(document.createElement("hr"));
    const logo = document.querySelector("header a.logo");
    root.append(para(document, link(document, pageHref(logo ? logo.getAttribute("href") : page), "\u0160koda Storyboard", (logo == null ? void 0 : logo.getAttribute("title")) || "\u0160koda Storyboard")));
    root.append(document.createElement("hr"));
    const form = document.querySelector(".search-bar form.search-form");
    const label = (document.querySelector('.search-bar input[type="search"]') || {}).placeholder || "Search";
    root.append(para(document, link(document, form ? form.getAttribute("action") : "/en/search", label, label)));
    return root;
  }

  // tools/importer/transformers/skoda-links.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SOURCE_ORIGIN = "https://www.skoda-storyboard.com";
  var SOURCE_HOST = /^(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com(?=[/?#]|$)/i;
  var DEMO_PATHS = [
    "/cs/category/e-mobilita-cs",
    "/cs/e-mobilita-cs/poznejte-peaq-snadne-a-pohodlne-ovladani",
    "/cs/e-mobilita-cs/skoda-epiq-nove-obleka-efektni-soupravu-sportline",
    "/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund",
    "/cs/e-mobilita-cs/skoda-peaq-si-vas-ziska-behem-chvilky",
    "/cs/tiskove-zpravy",
    "/de/emobilitat-de/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
    "/en",
    "/en/board-of-management",
    "/en/botas-x-skoda-guess-where-are-we-competition-terms-conditions",
    "/en/brand-group-core-bgc",
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
    "/en/company-logo",
    "/en/contacts",
    "/en/copyright",
    "/en/documents",
    "/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing",
    "/en/documents/cookies",
    "/en/emobility/a-custom-made-sunroof-walkie-talkies-and-champagne-the-skoda-peaq-at-the-tour-de-france",
    "/en/emobility/a-stunning-drive-to-the-northernmost-tip-of-mallorca",
    "/en/emobility/a-true-czech-from-spain",
    "/en/emobility/an-electric-car-approaching-says-the-license-plate-but-only-in-some-countries",
    "/en/emobility/before-an-electric-car-starts-up-for-the-first-time",
    "/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq",
    "/en/emobility/camouflage-to-get-you-hooked",
    "/en/emobility/coffee-on-electric-wheels-elroq-and-enyaq-serving-coffee",
    "/en/emobility/come-and-play-skoda-is-heading-to-milan",
    "/en/emobility/designers-on-the-peaq-its-modern-durable-and-practical",
    "/en/emobility/discover-the-countryside-around-zell-am-see",
    "/en/emobility/electrifying-the-bear-driving-the-skoda-kodiaq-iv",
    "/en/emobility/elroq-rs-in-a-robe-unveiling-the-secret-of-matte-paint",
    "/en/emobility/enyaq-and-elroq-now-double-as-gaming-consoles-and-thats-not-all",
    "/en/emobility/enyaq-coupe-respectline-a-celebration-of-uniqueness",
    "/en/emobility/enyaq-rs-race-rally-technology-plus-sustainability",
    "/en/emobility/even-opening-the-door-is-an-experience-says-the-designer-of-the-peaq-suv",
    "/en/emobility/how-the-versatile-skoda-peaq-conquered-a-mountain-peak",
    "/en/emobility/how-was-the-elroq-made-not-in-the-usual-way",
    "/en/emobility/make-use-of-the-frunk-unlock-with-your-phone-new-enhancements-for-elroq-and-enyaq",
    "/en/emobility/meet-peaq-safe-and-comfortable",
    "/en/emobility/meet-the-peaq-a-large-suv-with-outstanding-aerodynamics",
    "/en/emobility/meet-the-peaq-comfort-just-like-at-home",
    "/en/emobility/meet-the-peaq-intuitive-and-comfortable-controls",
    "/en/emobility/meet-the-peaq-spacious-inside-and-out",
    "/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan",
    "/en/emobility/peaq-enters-production-sharing-the-line-with-the-octavia",
    "/en/emobility/peaq-sets-a-record-from-the-heart-of-europe-to-the-sea-without-recharging",
    "/en/emobility/practical-fun-stylish-5-reasons-to-choose-the-epiq",
    "/en/emobility/skoda-elroq-and-a-happy-family",
    "/en/emobility/skoda-elroq-premiere-light-cube-camera-action",
    "/en/emobility/skoda-enyaq-coupe-iv-will-get-you-in-60-seconds",
    "/en/emobility/skoda-epiq-now-dresses-up-in-striking-sportline-trim",
    "/en/emobility/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
    "/en/emobility/skoda-peaq-unparalleled-space-and-comfort",
    "/en/emobility/spacious-comfortable-and-striking-five-reasons-to-want-the-skoda-peaq",
    "/en/emobility/sunset-over-the-mountains-the-story-behind-the-camouflage-for-the-skoda-peaq",
    "/en/emobility/teaser",
    "/en/emobility/the-little-prince-van-gogh-and-lavender-scent",
    "/en/emobility/the-skoda-peaq-will-win-you-over-fast",
    "/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere",
    "/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live",
    "/en/emobility/whats-behind-epiq-design",
    "/en/iihf/lv/picture-guidelines",
    "/en/iihf/lv/terms-and-conditions",
    "/en/iihf/picture-guidelines",
    "/en/iihf/ru/gdpr",
    "/en/iihf/ru/picture-guidelines",
    "/en/iihf/ru/terms-and-conditions",
    "/en/iihf/terms-and-conditions",
    "/en/images",
    "/en/impressum",
    "/en/lifestyle/13-countries-over-19000-kilometers-the-kylaq-traveled-from-pune-to-prague",
    "/en/lifestyle/a-journey-you-will-never-forget-the-monumental-route-napoleon",
    "/en/lifestyle/an-epic-start-to-the-tour-de-france-skoda-got-barcelona-moving",
    "/en/lifestyle/chainsaws-and-sparklers-discover-the-traditions-of-rally-fans",
    "/en/lifestyle/exploring-the-magnificent-alps-in-rs-models",
    "/en/lifestyle/feeling-the-heat-skoda-cars-keep-both-passengers-and-their-snacks-cool",
    "/en/lifestyle/from-unwanted-graffiti-to-bold-support-for-womens-cycling",
    "/en/lifestyle/how-to-take-the-best-picture-of-a-car-follow-a-pros-advice",
    "/en/lifestyle/into-the-freezing-water-with-the-iceman",
    "/en/lifestyle/la-dolce-vita-explore-the-surroundings-of-lake-como",
    "/en/lifestyle/ouninpohja-finlands-roller-coaster-stage",
    "/en/lifestyle/people/the-story-of-olive-oil-from-andalusia-to-the-czech-republic",
    "/en/lifestyle/road-trip-in-asturias-from-beaches-to-high-peaks",
    "/en/lifestyle/rs-four-ways-which-one-will-you-choose",
    "/en/lifestyle/skodas-smarter-wireless-charging-goes-beyond-phones",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-enduro-in-barcelona",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-skatepark-tricks-in-marseille",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-whitewater-in-switzerland",
    "/en/lifestyle/sports/hockey/this-years-skoda-ice-hockey-team-line-up",
    "/en/lifestyle/sports/miss-peaches-on-the-road-downhill-biking-in-champery-switzerland",
    "/en/lifestyle/sports/miss-peaches-on-the-road-surfing-in-san-sebastian",
    "/en/lifestyle/the-best-of-storyboard-pucks-wheels-seconds",
    "/en/lifestyle/this-years-skoda-auto-hockey-team-line-up",
    "/en/lifestyle/what-you-learn-on-the-circuit-can-save-you-on-the-road",
    "/en/media-cart",
    "/en/media-room",
    "/en/models/discovering-the-full-power-of-a-skoda-4x4",
    "/en/models/enyaq-rs-race-an-electric-coupe-on-steroids",
    "/en/models/first-glimpse-of-skodas-new-suv",
    "/en/models/kamiq/first-sketches-of-the-skoda-kamiq",
    "/en/models/kamiq/skodas-new-suv-christened-the-kamiq",
    "/en/models/kamiq/the-skoda-kamiq-your-travel-buddy-for-urban-adventuring",
    "/en/models/karoq/first-sketches-of-the-new-skoda-karoq",
    "/en/models/meet-the-skoda-kodiaq-sportline",
    "/en/models/millionth-skoda-suv",
    "/en/models/number-of-the-month-140",
    "/en/models/scala/number-of-the-month-40",
    "/en/models/scala/welcome-the-skoda-scala",
    "/en/models/skoda-4x4-your-best-bet-in-the-snow",
    "/en/models/skoda-elroq-through-designers-eyes",
    "/en/models/skoda-world-premieres-in-geneva",
    "/en/models/sporty-and-stylish-the-kodiaq-gets-the-rs-treatment",
    "/en/models/superb/sporty-flair-for-every-day-the-superb-sportline-will-get-you",
    "/en/news",
    "/en/newsletter",
    "/en/newsletter-terms-and-conditions",
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
    "/en/press-kits/design-and-technology-update-for-the-skoda-fabia",
    "/en/press-kits/enyaq-world-premiere",
    "/en/press-kits/lets-explore-albania-press-kit",
    "/en/press-kits/new-skoda-enyaq-press-kit-2",
    "/en/press-kits/press-kit-skoda-at-the-iaa-2019",
    "/en/press-kits/skoda-at-the-2018-geneva-motor-show",
    "/en/press-kits/skoda-at-the-2018-paris-motor-show",
    "/en/press-kits/skoda-auto-at-auto-shanghai-2019-press-kit",
    "/en/press-kits/skoda-citigo-iv-skoda-superb-iv-press-kit",
    "/en/press-kits/skoda-elroq-press-kit",
    "/en/press-kits/skoda-elroq-press-kit-2",
    "/en/press-kits/skoda-enyaq-iv-press-kit-2",
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
    "/en/press-kits/skoda-fabia-covered-drive-press-kit",
    "/en/press-kits/skoda-fabia-monte-carlo-press-kit",
    "/en/press-kits/skoda-fabia-press-kit",
    "/en/press-kits/skoda-iv-press-kit",
    "/en/press-kits/skoda-kamiq-gt-press-kit",
    "/en/press-kits/skoda-kamiq-press-kit",
    "/en/press-kits/skoda-karoq-media-launch-press-kit",
    "/en/press-kits/skoda-kodiaq-press-kit",
    "/en/press-kits/skoda-kodiaq-rs-press-kit",
    "/en/press-kits/skoda-octavia-media-launch-press-kit",
    "/en/press-kits/skoda-octavia-press-kit",
    "/en/press-kits/skoda-octavia-press-kit-2",
    "/en/press-kits/skoda-octavia-rs-245-sporty-spacious-practical-family-sportster-delivers-245-ps",
    "/en/press-kits/skoda-octavia-rs-and-octavia-scout-press-kit",
    "/en/press-kits/skoda-octavia-rs-skoda-octavia-combi-rs-press-kit",
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
    "/en/press-kits/skoda-scala",
    "/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit",
    "/en/press-kits/skoda-scala-and-skoda-kamiq-press-kit",
    "/en/press-kits/skoda-superb-press-kit",
    "/en/press-kits/skoda-vision-o-press-kit",
    "/en/press-kits/the-all-electric-skoda-elroq-breaking-new-ground-in-the-compactsuv-segment-with-a-covered-design",
    "/en/press-kits/the-all-new-skoda-kodiaq-press-kit",
    "/en/press-kits/the-all-new-skoda-superb-press-kit",
    "/en/press-kits/the-all-skoda-superb-press-kit-2",
    "/en/press-kits/the-enyaq-rs-race-a-new-motorsport-concept-with-sustainable-ideas-for-production-models",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-covered-drive-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-world-premiere-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-rs-iv-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-fabia-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-karoq-world-premiere-press-kit",
    "/en/press-kits/the-new-skoda-kodiaq-dynamic-press-launch-press-kit",
    "/en/press-kits/the-new-skoda-kodiaq-press-kit",
    "/en/press-releases/2026-iihf-ice-hockey-world-championship-roman-josi-wins-most-valuable-player-trophy-created-by-skoda-design",
    "/en/press-releases/30-years-since-the-foundation-stone-was-laid-m13-a-key-pillar-of-skodas-production",
    "/en/press-releases/936-km-without-recharging-skoda-peaq-sets-range-record-for-seven-seater-electric-suvs",
    "/en/press-releases/camp-mode-in-the-myskoda-app-comfortable-overnight-stays-in-electric-vehicles",
    "/en/press-releases/lorena-wiebes-receives-skoda-design-trophy-after-winning-tour-de-france-femmes-avec-zwift-points-classification",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-1-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-3-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-1-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-3-2026",
    "/en/press-releases/paris-motor-show-2018-two-skoda-presentations-live-online",
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
    "/en/press-releases/skoda-expands-electric-portfolio-the-new-epiq-sportlinedebuts-with-dynamic-exterior-styling",
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
    "/en/press-releases/world-premiere-of-the-all-new-skoda-superb-pictures-on-the-skoda-storyboard",
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
    "/en/server-status",
    "/en/simply-clever/do-you-have-a-qr-code-in-your-boot-it-will-show-you-all-the-smart-features",
    "/en/simply-clever/park-your-skoda-using-your-mobile-phone-well-show-you-how-how",
    "/en/skoda-media-services-application",
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
    "/en/skoda-world/can-you-recognise-skoda-models-from-their-silhouettes",
    "/en/skoda-world/cars-that-are-safe-for-pedestrians-as-well",
    "/en/skoda-world/children-painted-cars-for-medical-clowns",
    "/en/skoda-world/clever-luggage-solutions-for-your-boot",
    "/en/skoda-world/coca-cola-and-skoda-more-than-30-years-together",
    "/en/skoda-world/come-cheer-and-sing-along-meet-the-karaoke-car",
    "/en/skoda-world/drive-like-a-champion-on-tarmac-gravel-or-snow",
    "/en/skoda-world/enhanced-superb-iv-delivers-200-kw-of-power",
    "/en/skoda-world/enter-the-world-of-skoda-in-frankfurt",
    "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality",
    "/en/skoda-world/first-sketches-of-the-new-kodiaq",
    "/en/skoda-world/get-your-car-ready-for-summer-with-skoda-accessories",
    "/en/skoda-world/here-it-comes-the-skoda-elroq-a-compact-electric-suv",
    "/en/skoda-world/how-the-skoda-octavia-reached-365-km-h",
    "/en/skoda-world/how-to-get-a-kodiaq-into-a-metro-station",
    "/en/skoda-world/innovation-and-technology/enyaq-rs-race-an-electric-drive-with-motorsport-dna",
    "/en/skoda-world/kamiq-karoq-kodiaq-great-choices-for-the-city-and-countryside",
    "/en/skoda-world/king-of-space-and-long-distance-travel-skoda-superb-celebrates-25-years",
    "/en/skoda-world/klaus-drives-on-the-ice-with-a-rally-champion",
    "/en/skoda-world/legend-chris-froome-takes-you-behind-the-scenes-of-the-tour-de-france",
    "/en/skoda-world/life-with-a-plug-in-hybrid-a-versatile-companion",
    "/en/skoda-world/making-driving-easier-how-cruise-control-works",
    "/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain",
    "/en/skoda-world/oliver-solberg-behind-the-wheel-of-the-new-octavia-rs",
    "/en/skoda-world/peaq-inside-a-designblok",
    "/en/skoda-world/quiz-can-you-recognise-skoda-models-by-their-details",
    "/en/skoda-world/rally-champion-and-the-unique-skoda-fabia-motorsport-edition",
    "/en/skoda-world/rally-champion-fuel-efficiency-record-holder",
    "/en/skoda-world/rally-champion-presents-the-rs-family",
    "/en/skoda-world/rs-models-skodas-true-sporting-spirit",
    "/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator",
    "/en/skoda-world/skoda-kodiaq-will-get-you-in-60-seconds",
    "/en/skoda-world/skoda-octavia-rs-how-it-has-evolved",
    "/en/skoda-world/sliding-into-the-record-books",
    "/en/skoda-world/sportline-models-dynamic-elegance-for-every-day",
    "/en/skoda-world/the-approach-of-the-keyless-age",
    "/en/skoda-world/the-immortal-octavia-see-what-it-looks-like-after-one-million-kilometres",
    "/en/skoda-world/the-new-skoda-octavia-seen-through-its-designers-eyes",
    "/en/skoda-world/the-new-skoda-slavia-features-a-refreshed-look-and-an-exclusive-colour",
    "/en/skoda-world/the-skoda-stand-in-paris-360-tour",
    "/en/skoda-world/the-versatile-octavia-do-you-know-these-ones-too",
    "/en/skoda-world/what-was-racing-like-half-a-century-ago-skoda-120-s-rallye-delights-a-champion",
    "/en/soon-also-in-german",
    "/en/sustainable-offices",
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
    "/en/terms-and-conditions-2",
    "/en/videos",
    "/sk/emobilita-sk/skoda-epiq-si-vas-ziska-za-par-sekund",
    "/sr/emobilnost-sr/skoda-epiq-will-win-you-over-in-just-a-few-seconds"
  ];
  var DEMO_ALIASES = {
    "/en/skoda-world/innovation-and-technology/explore-the-new-skoda-models-in-mixed-reality": "/en/skoda-world/explore-the-new-skoda-models-in-mixed-reality"
  };
  var LIVE_ONLY_PATHS = [
    "/cs/category/e-mobilita-cs",
    "/cs/e-mobilita-cs/poznejte-peaq-snadne-a-pohodlne-ovladani",
    "/cs/e-mobilita-cs/skoda-epiq-nove-obleka-efektni-soupravu-sportline",
    "/cs/e-mobilita-cs/skoda-epiq-si-vas-ziska-za-par-sekund",
    "/cs/e-mobilita-cs/skoda-peaq-si-vas-ziska-behem-chvilky",
    "/cs/tiskove-zpravy",
    "/de/emobilitat-de/skoda-epiq-will-win-you-over-in-just-a-few-seconds",
    "/en/board-of-management",
    "/en/botas-x-skoda-guess-where-are-we-competition-terms-conditions",
    "/en/brand-group-core-bgc",
    "/en/company-logo",
    "/en/contacts",
    "/en/copyright",
    "/en/documents",
    "/en/documents/consent-to-personal-data-processing-information-on-personal-data-processing",
    "/en/documents/cookies",
    "/en/emobility/a-true-czech-from-spain",
    "/en/emobility/before-an-electric-car-starts-up-for-the-first-time",
    "/en/emobility/big-possibilities-in-a-small-package-the-new-skoda-epiq",
    "/en/emobility/come-and-play-skoda-is-heading-to-milan",
    "/en/emobility/discover-the-countryside-around-zell-am-see",
    "/en/emobility/electrifying-the-bear-driving-the-skoda-kodiaq-iv",
    "/en/emobility/enyaq-coupe-respectline-a-celebration-of-uniqueness",
    "/en/emobility/enyaq-rs-race-rally-technology-plus-sustainability",
    "/en/emobility/meet-peaq-safe-and-comfortable",
    "/en/emobility/meet-the-peaq-a-large-suv-with-outstanding-aerodynamics",
    "/en/emobility/meet-the-peaq-intuitive-and-comfortable-controls",
    "/en/emobility/modelling-clay-yoga-simply-epiq-skoda-returns-to-milan",
    "/en/emobility/skoda-enyaq-coupe-iv-will-get-you-in-60-seconds",
    "/en/emobility/teaser",
    "/en/emobility/the-little-prince-van-gogh-and-lavender-scent",
    "/en/emobility/the-skoda-peaq-will-win-you-over-fast",
    "/en/emobility/this-is-epiq-a-behind-the-scenes-look-at-the-premiere",
    "/en/emobility/watch-the-world-premiere-of-the-skoda-epiq-ev-live",
    "/en/emobility/whats-behind-epiq-design",
    "/en/iihf/lv/picture-guidelines",
    "/en/iihf/lv/terms-and-conditions",
    "/en/iihf/picture-guidelines",
    "/en/iihf/ru/gdpr",
    "/en/iihf/ru/picture-guidelines",
    "/en/iihf/ru/terms-and-conditions",
    "/en/iihf/terms-and-conditions",
    "/en/impressum",
    "/en/lifestyle/a-journey-you-will-never-forget-the-monumental-route-napoleon",
    "/en/lifestyle/exploring-the-magnificent-alps-in-rs-models",
    "/en/lifestyle/feeling-the-heat-skoda-cars-keep-both-passengers-and-their-snacks-cool",
    "/en/lifestyle/how-to-take-the-best-picture-of-a-car-follow-a-pros-advice",
    "/en/lifestyle/into-the-freezing-water-with-the-iceman",
    "/en/lifestyle/people/the-story-of-olive-oil-from-andalusia-to-the-czech-republic",
    "/en/lifestyle/road-trip-in-asturias-from-beaches-to-high-peaks",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-enduro-in-barcelona",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-skatepark-tricks-in-marseille",
    "/en/lifestyle/sports/cycling/miss-peaches-on-the-road-whitewater-in-switzerland",
    "/en/lifestyle/sports/hockey/this-years-skoda-ice-hockey-team-line-up",
    "/en/lifestyle/sports/miss-peaches-on-the-road-downhill-biking-in-champery-switzerland",
    "/en/lifestyle/sports/miss-peaches-on-the-road-surfing-in-san-sebastian",
    "/en/lifestyle/the-best-of-storyboard-pucks-wheels-seconds",
    "/en/lifestyle/this-years-skoda-auto-hockey-team-line-up",
    "/en/media-cart",
    "/en/media-room",
    "/en/models/discovering-the-full-power-of-a-skoda-4x4",
    "/en/models/enyaq-rs-race-an-electric-coupe-on-steroids",
    "/en/models/first-glimpse-of-skodas-new-suv",
    "/en/models/kamiq/first-sketches-of-the-skoda-kamiq",
    "/en/models/kamiq/skodas-new-suv-christened-the-kamiq",
    "/en/models/kamiq/the-skoda-kamiq-your-travel-buddy-for-urban-adventuring",
    "/en/models/karoq/first-sketches-of-the-new-skoda-karoq",
    "/en/models/meet-the-skoda-kodiaq-sportline",
    "/en/models/millionth-skoda-suv",
    "/en/models/number-of-the-month-140",
    "/en/models/scala/number-of-the-month-40",
    "/en/models/scala/welcome-the-skoda-scala",
    "/en/models/skoda-4x4-your-best-bet-in-the-snow",
    "/en/models/skoda-world-premieres-in-geneva",
    "/en/models/sporty-and-stylish-the-kodiaq-gets-the-rs-treatment",
    "/en/models/superb/sporty-flair-for-every-day-the-superb-sportline-will-get-you",
    "/en/news",
    "/en/newsletter",
    "/en/newsletter-terms-and-conditions",
    "/en/press-kits",
    "/en/press-kits/design-and-technology-update-for-the-skoda-fabia",
    "/en/press-kits/enyaq-world-premiere",
    "/en/press-kits/skoda-at-the-2018-geneva-motor-show",
    "/en/press-kits/skoda-at-the-2018-paris-motor-show",
    "/en/press-kits/skoda-auto-at-auto-shanghai-2019-press-kit",
    "/en/press-kits/skoda-citigo-iv-skoda-superb-iv-press-kit",
    "/en/press-kits/skoda-enyaq-iv-press-kit-2",
    "/en/press-kits/skoda-fabia-covered-drive-press-kit",
    "/en/press-kits/skoda-fabia-monte-carlo-press-kit",
    "/en/press-kits/skoda-fabia-press-kit",
    "/en/press-kits/skoda-iv-press-kit",
    "/en/press-kits/skoda-kamiq-gt-press-kit",
    "/en/press-kits/skoda-kamiq-press-kit",
    "/en/press-kits/skoda-karoq-media-launch-press-kit",
    "/en/press-kits/skoda-kodiaq-press-kit",
    "/en/press-kits/skoda-kodiaq-rs-press-kit",
    "/en/press-kits/skoda-octavia-rs-skoda-octavia-combi-rs-press-kit",
    "/en/press-kits/skoda-scala",
    "/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit",
    "/en/press-kits/skoda-scala-and-skoda-kamiq-press-kit",
    "/en/press-kits/skoda-superb-press-kit",
    "/en/press-kits/the-all-skoda-superb-press-kit-2",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-covered-drive-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-coupe-iv-world-premiere-press-kit",
    "/en/press-kits/the-new-skoda-enyaq-rs-iv-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-fabia-media-launch-press-kit",
    "/en/press-kits/the-new-skoda-karoq-world-premiere-press-kit",
    "/en/press-kits/the-new-skoda-kodiaq-dynamic-press-launch-press-kit",
    "/en/press-kits/the-new-skoda-kodiaq-press-kit",
    "/en/press-releases/2026-iihf-ice-hockey-world-championship-roman-josi-wins-most-valuable-player-trophy-created-by-skoda-design",
    "/en/press-releases/camp-mode-in-the-myskoda-app-comfortable-overnight-stays-in-electric-vehicles",
    "/en/press-releases/lorena-wiebes-receives-skoda-design-trophy-after-winning-tour-de-france-femmes-avec-zwift-points-classification",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-1-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-kvasiny-plant-3-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-1-2026",
    "/en/press-releases/newsletter-for-employees-and-residents-living-near-the-skoda-auto-vrchlabi-plant-3-2026",
    "/en/press-releases/paris-motor-show-2018-two-skoda-presentations-live-online",
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
    "/en/press-releases/world-premiere-of-the-all-new-skoda-superb-pictures-on-the-skoda-storyboard",
    "/en/search",
    "/en/series-2",
    "/en/server-status",
    "/en/simply-clever/do-you-have-a-qr-code-in-your-boot-it-will-show-you-all-the-smart-features",
    "/en/skoda-media-services-application",
    "/en/skoda-model/enyaq-iv-2/enyaq-coupe-iv",
    "/en/skoda-world/125-years-of-racing-history-in-one-place-come-visit-the-museum",
    "/en/skoda-world/can-you-recognise-skoda-models-from-their-silhouettes",
    "/en/skoda-world/cars-that-are-safe-for-pedestrians-as-well",
    "/en/skoda-world/children-painted-cars-for-medical-clowns",
    "/en/skoda-world/clever-luggage-solutions-for-your-boot",
    "/en/skoda-world/coca-cola-and-skoda-more-than-30-years-together",
    "/en/skoda-world/drive-like-a-champion-on-tarmac-gravel-or-snow",
    "/en/skoda-world/enhanced-superb-iv-delivers-200-kw-of-power",
    "/en/skoda-world/enter-the-world-of-skoda-in-frankfurt",
    "/en/skoda-world/first-sketches-of-the-new-kodiaq",
    "/en/skoda-world/get-your-car-ready-for-summer-with-skoda-accessories",
    "/en/skoda-world/here-it-comes-the-skoda-elroq-a-compact-electric-suv",
    "/en/skoda-world/how-to-get-a-kodiaq-into-a-metro-station",
    "/en/skoda-world/innovation-and-technology/enyaq-rs-race-an-electric-drive-with-motorsport-dna",
    "/en/skoda-world/kamiq-karoq-kodiaq-great-choices-for-the-city-and-countryside",
    "/en/skoda-world/king-of-space-and-long-distance-travel-skoda-superb-celebrates-25-years",
    "/en/skoda-world/klaus-drives-on-the-ice-with-a-rally-champion",
    "/en/skoda-world/life-with-a-plug-in-hybrid-a-versatile-companion",
    "/en/skoda-world/octavia-arrives-with-a-new-full-hybrid-powertrain",
    "/en/skoda-world/peaq-inside-a-designblok",
    "/en/skoda-world/rally-champion-and-the-unique-skoda-fabia-motorsport-edition",
    "/en/skoda-world/rally-champion-fuel-efficiency-record-holder",
    "/en/skoda-world/rally-champion-presents-the-rs-family",
    "/en/skoda-world/rs-models-skodas-true-sporting-spirit",
    "/en/skoda-world/skoda-classic-tour-through-the-eyes-of-a-spectator",
    "/en/skoda-world/skoda-kodiaq-will-get-you-in-60-seconds",
    "/en/skoda-world/skoda-octavia-rs-how-it-has-evolved",
    "/en/skoda-world/sliding-into-the-record-books",
    "/en/skoda-world/the-approach-of-the-keyless-age",
    "/en/skoda-world/the-new-skoda-octavia-seen-through-its-designers-eyes",
    "/en/skoda-world/the-skoda-stand-in-paris-360-tour",
    "/en/skoda-world/what-was-racing-like-half-a-century-ago-skoda-120-s-rallye-delights-a-champion",
    "/en/soon-also-in-german",
    "/en/sustainable-offices",
    "/en/terms-and-conditions-2",
    "/sk/emobilita-sk/skoda-epiq-si-vas-ziska-za-par-sekund",
    "/sr/emobilnost-sr/skoda-epiq-will-win-you-over-in-just-a-few-seconds"
  ];
  var ALLOWED = new Set(DEMO_PATHS);
  var LIVE_ONLY = new Set(LIVE_ONLY_PATHS);
  function edsPath(sourcePath) {
    let p = sourcePath || "/";
    try {
      p = decodeURIComponent(p);
    } catch (e) {
    }
    p = p.replace(/\.html?$/i, "").replace(/\/+$/, "");
    if (!p) return "/";
    return p.split("/").map((seg) => seg.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-")).join("/");
  }
  var SCHEMELESS_SOURCE = /^(?:(?:https?:)?\/\/(?:www\.)?skoda-storyboard\.com\/(?:[^?#]*\/)?)?(?:www\.)?skoda-storyboard\.com(?=\/)/i;
  function schemelessSource(href) {
    const m = href.match(SCHEMELESS_SOURCE);
    return m ? `${SOURCE_ORIGIN}${href.slice(m[0].length)}` : href;
  }
  function rewriteHref(href) {
    const m = href.match(SOURCE_HOST);
    if (!m) return null;
    const rest = href.slice(m[0].length);
    const cut = rest.search(/[?#]/);
    const tail = cut === -1 ? "" : rest.slice(cut);
    if (/^\?(?:[^#]*&)?(?:p|page_id)=\d/.test(tail)) return null;
    let target = edsPath(cut === -1 ? rest : rest.slice(0, cut));
    target = DEMO_ALIASES[target] || target;
    if (LIVE_ONLY.has(target) && /[?&]filter(?:\[|%5B)(?!search(?:\]|%5D))/i.test(tail.split("#")[0])) {
      return null;
    }
    return ALLOWED.has(target) ? `${target}${tail}` : null;
  }
  var NEWS_LISTINGS = {
    en: "news",
    cs: "tiskove-zpravy",
    de: "pressemitteilungen",
    sk: "tlacove-spravy",
    sr: "news"
  };
  var TAG_FILTER = new RegExp("^(?:(?:https?:)?//(?:www\\.)?skoda-storyboard\\.com)?/([a-z]{2})/([a-z0-9-]+)/?\\?filter(?:\\[|%5B)([a-z0-9-]+)(?:\\]|%5D)(?:\\[\\]|%5B%5D)=([^&#]+)$", "i");
  function tagPageHref(href) {
    const m = href.match(TAG_FILTER);
    if (!m) return null;
    const locale = m[1].toLowerCase();
    if (NEWS_LISTINGS[locale] !== m[2].toLowerCase()) return null;
    const slug = edsPath(`/${m[4]}`).slice(1);
    const exact = `/${locale}/tag/${m[3].toLowerCase()}/${slug}`;
    if (ALLOWED.has(exact)) return exact;
    const bySlug = DEMO_PATHS.filter((p) => p.startsWith(`/${locale}/tag/`) && p.endsWith(`/${slug}`) && p.split("/").length === 5);
    return bySlug.length === 1 ? bySlug[0] : null;
  }
  var RAIL_VIEWALL_KEYS = ["viewall", "view-all", "all"];
  function isRailViewAll(a) {
    const row = a.closest("tr");
    const table = row && row.closest("table");
    if (!table || row.cells.length < 2 || !RAIL_VIEWALL_KEYS.includes(row.cells[0].textContent.trim().toLowerCase())) return false;
    const head = table.rows[0] && table.rows[0].cells[0];
    return !!head && /^story rail\b/i.test(head.textContent.trim());
  }
  function transform(hookName, element, payload) {
    if (hookName !== TransformHook.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      let href = a.getAttribute("href").replace(/(?:\s|%20)+$/i, "");
      if (/#s_[ac]id=/.test(href)) href = href.split("#s_aid=")[0].split("#s_cid=")[0];
      href = schemelessSource(href);
      if (href.startsWith("/direct-download/")) href = `${SOURCE_ORIGIN}${href}`;
      else href = !isRailViewAll(a) && tagPageHref(href) || rewriteHref(href) || href;
      if (href !== a.getAttribute("href")) a.setAttribute("href", href);
    });
  }

  // tools/importer/import-sustainability-nav.js
  var import_sustainability_nav_default = {
    transform: ({ document, params }) => {
      const page = new URL(params.originalURL).pathname;
      const element = buildSectionNav(document, page);
      transform("afterTransform", element, { document });
      return [{ element, path: "/sustainability/nav", report: { fragment: "nav", page } }];
    }
  };
  return __toCommonJS(import_sustainability_nav_exports);
})();
