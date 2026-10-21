# SKODA-516 model-page rail sweep (2026-10-16)

Re-run for the SKODA-516 acceptance criteria. Every rail on the 23 model pages is evaluated as the
Story Rail block selects (scope, AND facets, newest, limit) against the published indexes
(`main--demo--skoda-storyboard.aem.live`). Each result is compared with the live source rail's card count.
For every rail shorter than live, or hidden, each live card ours lacks is listed with its cause.

## Per page (ours / live cards)

```
elroq                                press_release 8/10 short | press_kit 3/3 | story 10/10 | image 20/20 | video 14/18 short
enyaq-iv-2                           press_release 1/10 short | press_kit 6/7 short | story 2/2 | image 20/20 | video 17/20 short
epiq                                 press_release 10/10 | press_kit 2/3 short | story 10/10 | image 20/20 | video 6/10 short
kamiq                                press_release 0/10 HIDDEN | press_kit 4/4 | story 6/6 | image 0/20 HIDDEN | video 0/6 HIDDEN
karoq-6                              press_release 2/10 short | press_kit 6/7 short | story 10/10 | image 20/20 | video 10/12 short
new-fabia                            press_kit 6/6 | image 20/20 | video 20/20
new-kodiaq                           press_release 1/10 short | press_kit 9/10 short | story 10/10 | image 20/20 | video 20/20
new-superb                           press_release 8/10 short | press_kit 7/10 short | story 10/10 | image 20/20 | video 20/20
octavia                              press_release 10/10 | press_kit 10/10 | story 10/10 | image 20/20 | video 20/20
peaq                                 press_release 10/10 | press_kit 2/3 short | story 10/10 | image 20/20 | video 8/13 short
scala                                press_release 0/1 HIDDEN | press_kit 2/2 | story 2/2 | image 0/20 HIDDEN | video 0/12 HIDDEN
elroq/elroq-rs                       press_release 0/3 HIDDEN | image 20/20 | video 2/4 short
elroq/elroq-sportline                press_kit 2/2 | story 3/3 | image 20/20 | video 1/1
enyaq-iv-2/enyaq-rs                  press_release 0/7 HIDDEN | press_kit 4/4 | story 10/10 | image 20/20 | video 14/16 short
enyaq-iv-2/enyaq-sportline-iv        press_release 0/4 HIDDEN | press_kit 1/1 | story 1/1 | image 20/20 | video 8/9 short
karoq-6/karoq-sportline              press_release 1/4 short | press_kit 3/4 short | story 1/1 | image 20/20 | video 2/2
new-kodiaq/kodiaq-rs                 press_release 0/10 HIDDEN | press_kit 5/5 | story 10/10 | image 20/20 | video 10/14 short
new-kodiaq/new-kodiaq-iv             press_release 0/3 HIDDEN | press_kit 1/1 | story 2/2 | image 20/20 | video 2/2
new-kodiaq/new-kodiaq-sportline      press_release 1/9 short | press_kit 3/4 short | story 7/7 | image 20/20 | video 2/2
new-superb/new-superb-iv             press_release 1/4 short | image 20/20 | video 2/2
octavia/octavia-rs                   press_release 2/10 short | press_kit 5/8 short | story 10/10 | image 20/20 | video 13/16 short
octavia/octavia-sportline            press_release 2/3 short | press_kit 2/3 short | story 4/4 | image 20/20 | video 1/1
enyaq-iv-2/enyaq-coupe-iv            press_release 1/10 short | press_kit 6/7 short | image 20/20 | video 20/20
107 rails: 11 hidden, 32 shorter than live, 64 as many as live (ours/live cards)
```

## Causes

- **Imported, held at the push gate:** the release or kit is imported, but its PDF / MP4 links aren't on AEM
  Assets yet, so the push tool holds it before preview. It shows once the DAM ingest (a developer machine) lands
  and the page is pushed (see `tools/importer/media/README.md`, "PDF/MP4 links").
- **Feed build dropped it:** the media feed leaves out a video it can't serve. Either Vimeo restricts it to
  skoda-storyboard.com, so it doesn't play on the demo, or it has no thumbnail. The reason is logged per item by
  `build-media-items.mjs`.
- **Kamiq and Scala Images / Videos (hidden):** their live versions predate the media-feed rails. The re-imports
  are held at the push gate by their Technical Data PDFs. Evaluated against the published feed, the re-imports
  show image 20/20 and video 6/6 (Kamiq), and image 20/20 and video 12/12 (Scala), as many as live.
- **Not migrated:** a kit outside the import lists.
- **Not in the media feed:** one Peaq video the source Videos library (the feed's source) does not list.
- **Not an English page:** the source card links to another locale.

## Every missing card

107 rails, 64 as many as live. 203 live cards missing, by cause:
- 112 × imported, held at the push gate (PDF/MP4 links await the DAM ingest)
- 58 × Kamiq / Scala: the live version predates the media-feed rails (re-import held)
- 15 × feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
- 14 × feed build dropped it: no thumbnail
- 2 × not an English page
- 1 × not migrated (not imported)
- 1 × not in the media feed: not listed by the source Videos library

- `elroq`
  - **press_release** 8/10
    - Škoda adds AirConsole, Škoda Play and Spotify to BEV infotai (/en/press-releases/skoda-adds-airconsole-skoda-play-and-spotify-to-bev-infotainment): imported, held at the push gate (3 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto produces 100,000th all-electric Elroq (/en/press-releases/skoda-auto-produces-100000th-all-electric-elroq): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **video** 14/18
    - Škoda Elroq RS | Footage (/en/press-kits/skoda-elroq-press-kit/the-all-new-elroq-rs-the-sportiest-version-of-skodas-electric-compact-suv-2/attachment/skoda_elroq_rs_61f5f024): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Škoda Elroq RS | Footage II (407818): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Škoda Elroq RS | Footage III (/en/press-kits/skoda-elroq-press-kit/the-all-new-elroq-rs-the-sportiest-version-of-skodas-electric-compact-suv-2/attachment/skoda_elroq_rs_polygon_7637ef01): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Škoda Elroq | Remote Park Assist | Park-in | Park-out (/en/skoda_elroq_remote_park_assist_park-in_park-out_c61be630): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
- `enyaq-iv-2`
  - **press_release** 1/10
    - Four million SUVs built, seven model series: Škoda Auto’s br (/en/press-releases/four-million-suvs-built-seven-model-series-skoda-autos-broadest-suv-line-up-to-date): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto marks 32nd year as IIHF World Championship offici (/en/press-releases/skoda-auto-marks-32nd-year-as-iihf-world-championship-official-main-sponsor-with-world-premiere-of-new-enyaq-rs-family): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Exterior sketches of the new Škoda Enyaq family: Modern Soli (/en/press-releases/exterior-sketches-of-the-new-skoda-enyaq-family-modern-solid-update-for-the-electric-best-seller): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Škoda’s Enyaq family surpasses 200,000 production milestone (/en/press-releases/skodas-enyaq-family-surpasses-200000-production-milestone): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Three million and counting: Škoda Auto’s SUV success story c (/en/press-releases/three-million-and-counting-skoda-autos-suv-success-story-continues): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Affordable e-SUV: Škoda Enyaq iV 50 for less than 40,000 eur (/en/press-releases/affordable-e-suv-skoda-enyaq-iv-50-for-less-than-40000-euros): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA ENYAQ RS iV: Sustainability meets high-performance dri (/en/press-releases/skoda-enyaq-rs-iv-sustainability-meets-high-performance-driving): imported, held at the push gate (5 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA AUTO resumes production of the ŠKODA ENYAQ iV (/en/press-releases/skoda-auto-resumes-production-of-the-skoda-enyaq-iv): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA ENYAQ iV wins Golden Steering Wheel 2021 for Best Elec (/en/press-releases/skoda-enyaq-iv-wins-golden-steering-wheel-2021-for-best-electric-suv): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **press_kit** 6/7
    - Laurin & Klement version expands Enyaq series (/en/press-kits/new-skoda-enyaq-laurin-klement-press-kit): imported, held at the push gate (12 PDF/MP4 link(s) await the DAM ingest)
  - **video** 17/20
    - New Škoda Enyaq and Škoda Enyaq Coupé | Clip (/en/press-kits/new-skoda-enyaq-press-kit-2/videos/attachment/new_skoda_enyaq_clip_6e04e29a): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Enyaq RS Race | Rally technology plus sustainability (386480): feed build dropped it: no thumbnail
    - Enyaq RS Race | Idea & Design (386482): feed build dropped it: no thumbnail
- `epiq`
  - **press_kit** 2/3
    - Škoda Epiq: najdostupnejší elektromobil značky Škoda v predp (/sk/press_kit/skoda-epiq-najdostupnejsi-elektromobil-znacky-skoda-v-predpremiere): not an English page (/sk/press_kit/skoda-epiq-najdostupnejsi-elektromobil-znacky-skoda-v-predpremiere)
  - **video** 6/10
    - Video | Škoda Epiq Sportline - Colour Animation (/en/press-releases/skoda-expands-electric-portfolio-the-new-epiq-sportlinedebuts-with-dynamic-exterior-styling/attachment/skoda-epiq-sportline-colour-animation_b059a4d0): feed build dropped it: no thumbnail
    - Footage | Dr. Johannes Neft (/en/press-kits/skoda-epiq-press-kit-2/videos/attachment/zdravice-neft-epiq_peaq_uhd_0b964d21): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Footage | Škoda Epiq & Peaq (/en/press-kits/skoda-peaq-press-kit-2/videos/attachment/klip_epiq_peaq_uhd_201c18c6): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Footage | Škoda Epiq (/en/press-kits/skoda-epiq-press-kit-2/videos/attachment/footage_innsbruck_epiq_uhd_d6cfe9d1): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
- `kamiq`
  - **press_release** 0/10 (hidden)
    - Four million SUVs built, seven model series: Škoda Auto’s br (/en/press-releases/four-million-suvs-built-seven-model-series-skoda-autos-broadest-suv-line-up-to-date): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto launches production of upgraded Scala and Kamiq (/en/press-releases/skoda-auto-launches-production-of-upgraded-scala-and-kamiq): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Three million and counting: Škoda Auto’s SUV success story c (/en/press-releases/three-million-and-counting-skoda-autos-suv-success-story-continues): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Sketches reveal design details of new Škoda Scala and Kamiq  (/en/press-releases/sketches-reveal-design-details-of-new-skoda-scala-and-kamiq-headlights): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - First glimpse of refreshed Škoda Scala and Škoda Kamiq (/en/press-releases/first-glimpse-of-refreshed-skoda-scala-and-skoda-kamiq): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA AUTO wins seven titles in ‘Company Car of the Year 202 (/en/press-releases/skoda-auto-wins-seven-titles-in-company-car-of-the-year-2021-competition): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA AUTO looks back on a successful 2020 despite the… (/en/press-releases/skoda-auto-looks-back-on-a-successful-2020-despite-the-coronavirus-pandemic): imported, held at the push gate (11 PDF/MP4 link(s) await the DAM ingest)
    - Momentous milestone at ŠKODA AUTO’s main plant: 15 million c (/en/press-releases/momentous-milestone-at-skoda-autos-main-plant-15-million-cars-from-mlada-boleslav-since-1905): imported, held at the push gate (3 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA AUTO produces two millionth SUV (/en/press-releases/skoda-auto-produces-two-millionth-suv): imported, held at the push gate (3 PDF/MP4 link(s) await the DAM ingest)
    - Video presentation: The new ŠKODA KAMIQ SCOUTLINE (/en/press-releases/video-presentation-the-new-skoda-kamiq-scoutline): imported, held at the push gate (3 PDF/MP4 link(s) await the DAM ingest)
  - **image** 0/20 (hidden)
    - Škoda Kamiq Monte Carlo (353190): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - The updated Škoda Kamiq | Infographic Colours (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/exterior-even-more-distinctive-design-and-matrix-technology-premiere-for-both-models/attachment/the_updated_skoda_kamiq_colours_7252d396): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353224): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353217): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353218): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/technical-data/attachment/41_skoda_kamiq_f6ada261): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353221): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/technical-data/attachment/45_skoda_kamiq_8602cea4): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353215): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353213): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353214): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353212): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353216): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353209): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353210): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353208): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353228): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353229): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (353211): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/exterior-even-more-distinctive-design-and-matrix-technology-premiere-for-both-models/attachment/43_skoda_kamiq_9029b6a2): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
  - **video** 0/6 (hidden)
    - Škoda Kamiq | Footage (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/videos/attachment/kamiq-footages-ver2_3022299b): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq Monte Carlo | Footage (/en/kamiq-mc-footage-ver2_8345bb4d): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Kamiq | Footage (/en/press-kits/skoda-scala-and-skoda-kamiq-press-kit/videos/attachment/skoda_kamiq_footage_7248a073): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - The updated Škoda Kamiq | World Premiere (/en/press-kits/skoda-scala-and-skoda-kamiq-press-kit/videos/attachment/world_premiere_skoda_kamiq_a02e8ddb): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - ŠKODA KAMIQ Driving teaser (/en/koda-kamiq-footage-teaser): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - SKODA-KAMIQ-sketch-video (/en/models/kamiq/first-sketches-of-the-skoda-kamiq/attachment/skoda-kamiq-sketch-video): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
- `karoq-6`
  - **press_release** 2/10
    - Four million SUVs built, seven model series: Škoda Auto’s br (/en/press-releases/four-million-suvs-built-seven-model-series-skoda-autos-broadest-suv-line-up-to-date): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto enters Brunei market, advancing its international (/en/press-releases/skoda-auto-enters-brunei-market-advancing-its-internationalisation-strategy-across-asean): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Three million and counting: Škoda Auto’s SUV success story c (/en/press-releases/three-million-and-counting-skoda-autos-suv-success-story-continues): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA KAROQ: A mainstay of the model range (/en/press-releases/skoda-karoq-a-mainstay-of-the-model-range): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA AUTO wins seven titles in ‘Company Car of the Year 202 (/en/press-releases/skoda-auto-wins-seven-titles-in-company-car-of-the-year-2021-competition): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Milestone in key market: ŠKODA AUTO has manufactured 750,000 (/en/press-releases/milestone-in-key-market-skoda-auto-has-manufactured-750000-vehicles-in-russia): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA AUTO looks back on a successful 2020 despite the… (/en/press-releases/skoda-auto-looks-back-on-a-successful-2020-despite-the-coronavirus-pandemic): imported, held at the push gate (11 PDF/MP4 link(s) await the DAM ingest)
    - Momentous milestone at ŠKODA AUTO’s main plant: 15 million c (/en/press-releases/momentous-milestone-at-skoda-autos-main-plant-15-million-cars-from-mlada-boleslav-since-1905): imported, held at the push gate (3 PDF/MP4 link(s) await the DAM ingest)
  - **press_kit** 6/7
    - ŠKODA AT IAA FRANKFURT 2017 - Press Kit (/en/press-kits/skoda-iaa-frankfurt-2017): imported, held at the push gate (4 PDF/MP4 link(s) await the DAM ingest)
  - **video** 10/12
    - ŠKODA KAROQ SCOUT Footage (/en/skoda_karoq_scout_footage): feed build dropped it: no thumbnail
    - Extreme Polar Circle Challenge (/en/skoda-world/extreme-polar-circle-challenge/attachment/nordenskioldsloppet_eng-version): feed build dropped it: no thumbnail
- `new-kodiaq`
  - **press_release** 1/10
    - Four million SUVs built, seven model series: Škoda Auto’s br (/en/press-releases/four-million-suvs-built-seven-model-series-skoda-autos-broadest-suv-line-up-to-date): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto marks 32nd year as IIHF World Championship offici (/en/press-releases/skoda-auto-marks-32nd-year-as-iihf-world-championship-official-main-sponsor-with-world-premiere-of-new-enyaq-rs-family): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Advancing internationalisation: Škoda Auto launches in Oman, (/en/press-releases/advancing-internationalisation-skoda-auto-launches-in-oman-strengthening-its-presence-in-the-middle-east): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Car safety: All-new models Škoda Kodiaq and Superb achieve f (/en/press-releases/car-safety-all-new-models-skoda-kodiaq-and-superb-achieve-five-star-euro-ncap-rating): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto enters Brunei market, advancing its international (/en/press-releases/skoda-auto-enters-brunei-market-advancing-its-internationalisation-strategy-across-asean): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto launches production of the all-new Kodiaq in Kvas (/en/press-releases/skoda-auto-launches-production-of-the-all-new-kodiaq-in-kvasiny): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - World premiere of the all-new Škoda Kodiaq: Pictures on the  (/en/press-releases/world-premiere-of-the-all-new-skoda-kodiaq-pictures-on-the-skoda-storyboard): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto reveals exterior sketches of the all-new Kodiaq (/en/press-releases/skoda-auto-reveals-exterior-sketches-of-the-all-new-kodiaq): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Three million and counting: Škoda Auto’s SUV success story c (/en/press-releases/three-million-and-counting-skoda-autos-suv-success-story-continues): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
  - **press_kit** 9/10
    - ŠKODA AT IAA FRANKFURT 2017 - Press Kit (/en/press-kits/skoda-iaa-frankfurt-2017): imported, held at the push gate (4 PDF/MP4 link(s) await the DAM ingest)
- `new-superb`
  - **press_release** 8/10
    - Superb Hatch version receives a plug-in hybrid powertrain wi (/en/press-releases/superb-hatch-version-receives-a-plug-in-hybrid-powertrain-with-200-kw-output): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Tour de France Femmes avec Zwift Finale: New Škoda Design tr (/en/press-releases/tour-de-femmes-avec-zwift-finale-new-skoda-design-trophy-commemorates-brands-130th-anniversary): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **press_kit** 7/10
    - ŠKODA CITIGOᵉ iV, ŠKODA SUPERB iV – Press Kit (/en/press-kits/skoda-citigo%e1%b5%89-iv-skoda-superb-iv-press-kit): not migrated (not imported)
    - 4×4 Winter Discovery - Press Kit (/en/press-kits/4x4-winter-discovery-press-kit): imported, held at the push gate (9 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA at the IAA - Press Kit (/en/press-kits/skoda-iaa-press-kit-2): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
- `peaq`
  - **press_kit** 2/3
    - Škoda Peaq: prvý pohľad na nový vrcholný elektrický model zn (/sk/press_kit/skoda-peaq-prvy-pohlad-na-novy-vrcholny-elektricky-model-znacky-skoda): not an English page (/sk/press_kit/skoda-peaq-prvy-pohlad-na-novy-vrcholny-elektricky-model-znacky-skoda)
  - **video** 8/13
    - Footage | Dr. Johannes Neft (/en/press-kits/skoda-epiq-press-kit-2/videos/attachment/zdravice-neft-epiq_peaq_uhd_0b964d21): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Footage | Škoda Epiq & Peaq (/en/press-kits/skoda-peaq-press-kit-2/videos/attachment/klip_epiq_peaq_uhd_201c18c6): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Footage | Škoda Peaq (/en/press-kits/skoda-peaq-press-kit-2/videos/attachment/skoda_peaq_footage_innsbruck_v1-1440p_23903b04): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Footage | Škoda Peaq Covered Drive (436720): not in the media feed: it plays on Vimeo and is dated 30. 3. 2026, but the source Videos library the feed is built from does not list it
    - Footage | Škoda Peaq Covered Drive (436546): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
- `scala`
  - **press_release** 0/1 (hidden)
    - Innovative individualisation option for the new ŠKODA SCALA: (/en/press-releases/innovative-individualisation-option-for-the-new-skoda-scala-a-personalised-name-at-the-rear): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **image** 0/20 (hidden)
    - Škoda Scala (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/exterior-even-more-distinctive-design-and-matrix-technology-premiere-for-both-models/attachment/16_skoda_scala_5d840447): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/technical-data/attachment/17_skoda_scala_3fefb0c7): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/exterior-even-more-distinctive-design-and-matrix-technology-premiere-for-both-models/attachment/20_skoda_scala_6dc26b8f): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (353226): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (353166): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/skoda-scala-and-kamiq-comprehensive-upgrade-for-dynamic-compact-duo/attachment/19_skoda_scala_ecc4bfa6): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/skoda-scala-and-kamiq-comprehensive-upgrade-for-dynamic-compact-duo/attachment/18_skoda_scala_23e525b2): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/skoda-scala-and-kamiq-comprehensive-upgrade-for-dynamic-compact-duo/attachment/14_skoda_scala_1be6a47e): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala Monte Carlo (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/skoda-scala-and-kamiq-comprehensive-upgrade-for-dynamic-compact-duo/attachment/56_skoda_scala_monte_carlo_50997d9c): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (353231): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/interior-six-design-selections-sustainable-materials-and-8-inch-digital-display-as-standard/attachment/49_skoda_scala_interior_7d59ebca): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (353181): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala Monte Carlo (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/powertrains-even-more-efficient-tsi-petrol-engines-from-the-latest-evo2-generation/attachment/79_skoda_scala_monte_carlo_04476727): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala and Škoda Kamiq (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/safety-new-safety-equipment-and-assistance-systems-from-higher-vehicle-classes/attachment/10_skoda_scala_and_kamiq_6af32a51): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala (353165): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala Monte Carlo (353261): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala Monte Carlo (353262): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala Monte Carlo (353256): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala Monte Carlo (353257): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala Monte Carlo (353259): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
  - **video** 0/12 (hidden)
    - Škoda Scala | Footage (/en/press-kits/skoda-scala-and-skoda-kamiq-media-launch-press-kit/videos/attachment/scala-footages-ver2_9601b715): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala Monte Carlo | Footage (/en/scala-mc-footage-ver2_9f286127): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala | Monte Carlo (/en/press-kits/skoda-scala-and-skoda-kamiq-press-kit/videos/attachment/skoda_scala_monte_carlo_9b2c5041): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - Škoda Scala | Footage (/en/press-kits/skoda-scala-and-skoda-kamiq-press-kit/videos/attachment/skoda_scala_footage_01f868a8): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - The updated Škoda Scala | World Premiere (/en/press-kits/skoda-scala-and-skoda-kamiq-press-kit/videos/attachment/world_premiere_skoda_scala_7a91a7b2): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - ŠKODA SCALA (/en/press-kits/skoda-scala/five-engines-and-three-chassis-available/attachment/skoda_scala_opf): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - ŠKODA SCALA (/cs/modely-cs/scala-cs/cislo-mesice-40/attachment/skoda_scala_driving_footage_teaser): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - SKODA SCALA DRIVING FOOTAGE (/en/press-kits/skoda-scala/videos/attachment/skoda_scala_driving_footage): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - SKODA SCALA (/en/press-kits/skoda-scala/five-engines-and-three-chassis-available/attachment/skoda_scala_sport_chassis_control_): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - ŠKODA SCALA (/en/skoda_scala_assistance_systems): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - ŠKODA SCALA (/en/press-kits/skoda-scala-press-kit/videos/attachment/skoda_scala_studio_footage): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
    - ŠKODA SCALA (/en/press-kits/skoda-scala-press-kit/skoda-redefines-its-compact-car-range-with-the-scala/attachment/skoda_scala_studio_footage_teaser): the live version predates the media-feed rails (the re-import is held at the push gate by its Technical Data PDFs)
- `elroq/elroq-rs`
  - **press_release** 0/3 (hidden)
    - Škoda Auto produces 100,000th all-electric Elroq (/en/press-releases/skoda-auto-produces-100000th-all-electric-elroq): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - IIHF Ice Hockey World Championship: Newly designed MVP Troph (/en/press-releases/iihf-ice-hockey-world-championship-newly-designed-mvp-trophy-created-by-skoda-design-presented-to-leonardo-genoni): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Elroq RS: First teaser, world premiere details and pub (/en/press-releases/skoda-elroq-rs-first-teaser-world-premiere-details-and-public-debut-at-milan-design-week): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
  - **video** 2/4
    - Škoda Elroq RS | Footage (/en/press-kits/skoda-elroq-press-kit/the-all-new-elroq-rs-the-sportiest-version-of-skodas-electric-compact-suv-2/attachment/skoda_elroq_rs_61f5f024): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
    - Škoda Elroq RS | Footage II (407818): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
- `enyaq-iv-2/enyaq-rs`
  - **press_release** 0/7 (hidden)
    - IIHF Ice Hockey World Championship: Newly designed MVP Troph (/en/press-releases/iihf-ice-hockey-world-championship-newly-designed-mvp-trophy-created-by-skoda-design-presented-to-leonardo-genoni): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto marks 32nd year as IIHF World Championship offici (/en/press-releases/skoda-auto-marks-32nd-year-as-iihf-world-championship-official-main-sponsor-with-world-premiere-of-new-enyaq-rs-family): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - First sketches of Škoda Enyaq RS Race: Concept study combine (/en/press-releases/first-sketches-of-skoda-enyaq-rs-race-concept-study-combines-motorsport-dna-and-sustainability): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Enyaq RS iV sets two GUINNESS WORLD RECORDS™ titles wi (/en/press-releases/skoda-enyaq-rs-iv-sets-two-guinness-world-records-titles-with-7-351-km-ice-drift): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Hat-trick for ŠKODA: ENYAQ COUPÉ RS iV named ‘Switzerland’s  (/en/press-releases/hat-trick-for-skoda-enyaq-coupe-rs-iv-named-switzerlands-favourite-car-2023): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA ENYAQ RS iV: Sustainability meets high-performance dri (/en/press-releases/skoda-enyaq-rs-iv-sustainability-meets-high-performance-driving): imported, held at the push gate (5 PDF/MP4 link(s) await the DAM ingest)
    - Awards for ‘The Way of Life’ film accompanying the world pre (/en/press-releases/awards-for-the-way-of-life-film-accompanying-the-world-premiere-of-the-skoda-enyaq-coupe-rs-iv): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
  - **video** 14/16
    - Enyaq RS Race | Rally technology plus sustainability (386480): feed build dropped it: no thumbnail
    - Enyaq RS Race | Footage (386355): feed build dropped it: no thumbnail
- `enyaq-iv-2/enyaq-sportline-iv`
  - **press_release** 0/4 (hidden)
    - Škoda’s Enyaq family surpasses 200,000 production milestone (/en/press-releases/skodas-enyaq-family-surpasses-200000-production-milestone): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Three million and counting: Škoda Auto’s SUV success story c (/en/press-releases/three-million-and-counting-skoda-autos-suv-success-story-continues): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA ENYAQ SPORTLINE iV: electric, emotive and dynamic (/en/press-releases/skoda-enyaq-sportline-iv-electric-emotive-and-dynamic): imported, held at the push gate (28 PDF/MP4 link(s) await the DAM ingest)
    - The ŠKODA ENYAQ SPORTLINE iV: dynamic and sporty (/en/press-releases/the-skoda-enyaq-sportline-iv-dynamic-and-sporty): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
  - **video** 8/9
    - New Škoda Enyaq and Škoda Enyaq Coupé | Clip (/en/press-kits/new-skoda-enyaq-press-kit-2/videos/attachment/new_skoda_enyaq_clip_6e04e29a): feed build dropped it: Vimeo domain-restricted (plays only on skoda-storyboard.com)
- `karoq-6/karoq-sportline`
  - **press_release** 1/4
    - Škoda Auto enters Brunei market, advancing its international (/en/press-releases/skoda-auto-enters-brunei-market-advancing-its-internationalisation-strategy-across-asean): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Three million and counting: Škoda Auto’s SUV success story c (/en/press-releases/three-million-and-counting-skoda-autos-suv-success-story-continues): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - New sporting spirit with the ŠKODA KAROQ SPORTLINE (/en/press-releases/new-sporting-spirit-with-the-skoda-karoq-sportline): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **press_kit** 3/4
    - ŠKODA AT IAA FRANKFURT 2017 - Press Kit (/en/press-kits/skoda-iaa-frankfurt-2017): imported, held at the push gate (4 PDF/MP4 link(s) await the DAM ingest)
- `new-kodiaq/kodiaq-rs`
  - **press_release** 0/10 (hidden)
    - Škoda Auto marks 32nd year as IIHF World Championship offici (/en/press-releases/skoda-auto-marks-32nd-year-as-iihf-world-championship-official-main-sponsor-with-world-premiere-of-new-enyaq-rs-family): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Digital world premiere of the revised ŠKODA KODIAQ on 13 Apr (/en/press-releases/digital-world-premiere-of-the-revised-skoda-kodiaq-on-13-april): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Countless new features introduced to ŠKODA portfolio for 202 (/en/press-releases/countless-new-features-introduced-to-skoda-portfolio-for-2021-model-year): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - RS – two letters that “electrify” ŠKODA fans (/en/press-releases/rs-two-letters-that-electrify-skoda-fans): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - IIHF Ice Hockey World Championship in Slovakia: ŠKODA featur (/en/press-releases/iihf-ice-hockey-world-championship-in-slovakia-skoda-featured-on-the-ice-as-the-official-main-sponsor-for-27th-time): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - 2018 Paris Motor Show: Pictures from ŠKODA AUTO at the exhib (/en/press-releases/2018-paris-motor-show-pictures-from-skoda-auto-at-the-exhibition): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - The new ŠKODA KODIAQ RS: Sportiness, everyday comfort and a… (/en/press-releases/the-new-skoda-kodiaq-rs-sportiness-everyday-comfort-and-a-generous-amount-of-space): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA offers first overall impression of design for new KODI (/en/press-releases/skoda-offers-first-overall-impression-of-design-for-new-kodiaq-rs): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA reveals further details of its new high-performance SU (/en/press-releases/skoda-reveals-further-details-of-its-new-high-performance-suv-the-kodiaq-rs): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Video: First details about the ŠKODA KODIAQ RS (/en/press-releases/video-first-details-about-the-skoda-kodiaq-rs): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **video** 10/14
    - Rally World Champion Tests the KODIAQ RS (/en/models/kodiaq/rally-world-champion-tests-the-kodiaq-rs/attachment/skoda-kodiaq-rs-vs-rally-jan-kopecky): feed build dropped it: no thumbnail
    - ŠKODA KODIAQ RS (/en/press-kits/skoda-kodiaq-rs-press-kit/videos/attachment/skoda_kodiaq_rs_footage-2): feed build dropped it: no thumbnail
    - ŠKODA KODIAQ RS Teaser (/en/press-kits/skoda-at-the-2018-paris-motor-show/videos/attachment/191001_skoda_kodiaq_16_9_1080p_25fps_30mbit): feed build dropped it: no thumbnail
    - A first taste of the race against the clock in the ‘Green He (/en/180612-skoda-kodiaq-rs-at-nurburgring-teaser): feed build dropped it: no thumbnail
- `new-kodiaq/new-kodiaq-iv`
  - **press_release** 0/3 (hidden)
    - Škoda Auto marks 32nd year as IIHF World Championship offici (/en/press-releases/skoda-auto-marks-32nd-year-as-iihf-world-championship-official-main-sponsor-with-world-premiere-of-new-enyaq-rs-family): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - World premiere of the all-new Škoda Kodiaq: Pictures on the  (/en/press-releases/world-premiere-of-the-all-new-skoda-kodiaq-pictures-on-the-skoda-storyboard): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA test mules: The art of camouflage (/en/press-releases/skoda-test-mules-the-art-of-camouflage): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
- `new-kodiaq/new-kodiaq-sportline`
  - **press_release** 1/9
    - Škoda Auto enters Brunei market, advancing its international (/en/press-releases/skoda-auto-enters-brunei-market-advancing-its-internationalisation-strategy-across-asean): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - World premiere of the all-new Škoda Kodiaq: Pictures on the  (/en/press-releases/world-premiere-of-the-all-new-skoda-kodiaq-pictures-on-the-skoda-storyboard): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Three million and counting: Škoda Auto’s SUV success story c (/en/press-releases/three-million-and-counting-skoda-autos-suv-success-story-continues): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Digital world premiere of the revised ŠKODA KODIAQ on 13 Apr (/en/press-releases/digital-world-premiere-of-the-revised-skoda-kodiaq-on-13-april): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Countless new features introduced to ŠKODA portfolio for 202 (/en/press-releases/countless-new-features-introduced-to-skoda-portfolio-for-2021-model-year): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - 2018 Paris Motor Show: Pictures from ŠKODA AUTO at the exhib (/en/press-releases/2018-paris-motor-show-pictures-from-skoda-auto-at-the-exhibition): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA with three attractive SUVs and VISION E study at IAA i (/en/press-releases/skoda-three-attractive-suvs-vision-e-study-iaa-frankfurt): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA KODIAQ SPORTLINE and ŠKODA KODIAQ SCOUT at the IAA… (/en/press-releases/skoda-kodiaq-sportline-skoda-kodiaq-scout-iaa-2017): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **press_kit** 3/4
    - ŠKODA AT IAA FRANKFURT 2017 - Press Kit (/en/press-kits/skoda-iaa-frankfurt-2017): imported, held at the push gate (4 PDF/MP4 link(s) await the DAM ingest)
- `new-superb/new-superb-iv`
  - **press_release** 1/4
    - Škoda Superb: 90 years since the historic first model entere (/en/press-releases/skoda-superb-90-years-since-the-historic-first-model-entered-production): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA ENYAQ iV and ŠKODA SUPERB COMBI win six awards in “Fam (/en/press-releases/skoda-enyaq-iv-and-skoda-superb-combi-win-six-awards-in-family-cars-of-the-year-readers-poll): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - World premieres in Bratislava: ŠKODA presents e-mobility sub (/en/press-releases/world-premieres-in-bratislava-skoda-presents-e-mobility-sub-brand-iv-as-well-as-citigoe-iv-and-superb-iv): imported, held at the push gate (10 PDF/MP4 link(s) await the DAM ingest)
- `octavia/octavia-rs`
  - **press_release** 2/10
    - Mild hybrid, plug-in hybrid and natural gas: new powertrain  (/en/press-releases/mild-hybrid-plug-in-hybrid-and-natural-gas-new-powertrain-variants-for-the-skoda-octavia): imported, held at the push gate (25 PDF/MP4 link(s) await the DAM ingest)
    - Virtual premiere of OCTAVIA RS and OCTAVIA SCOUT (/en/press-releases/virtual-premiere-of-octavia-rs-and-octavia-scout): imported, held at the push gate (37 PDF/MP4 link(s) await the DAM ingest)
    - Countless new features introduced to ŠKODA portfolio for 202 (/en/press-releases/countless-new-features-introduced-to-skoda-portfolio-for-2021-model-year): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA OCTAVIA RS iV: sustainable yet sporty (/en/press-releases/skoda-octavia-rs-iv-sustainable-yet-sporty): imported, held at the push gate (5 PDF/MP4 link(s) await the DAM ingest)
    - Online world premiere of the new ŠKODA OCTAVIA RS iV (/en/press-releases/online-world-premiere-of-the-new-skoda-octavia-rs-iv): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA teases first sketches of all-new OCTAVIA RS iV (/en/press-releases/skoda-teases-first-sketches-of-all-new-octavia-rs-iv): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - RS – two letters that “electrify” ŠKODA fans (/en/press-releases/rs-two-letters-that-electrify-skoda-fans): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA AUTO CEO Bernhard Maier presents trophy to Most Valuab (/en/press-releases/skoda-auto-ceo-bernhard-maier-presents-trophy-to-most-valuable-player-of-2018-iihf-ice-hockey-world-championship): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **press_kit** 5/8
    - ŠKODA OCTAVIA: bestseller with a comprehensive upgrade - Pre (/en/press-kits/skoda-octavia-bestseller-comprehensive-upgrade): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - 4×4 Winter Discovery - Press Kit (/en/press-kits/4x4-winter-discovery-press-kit): imported, held at the push gate (9 PDF/MP4 link(s) await the DAM ingest)
    - ŠKODA at the IAA - Press Kit (/en/press-kits/skoda-iaa-press-kit-2): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
  - **video** 13/16
    - VIDEO: ŠKODA OCTAVIA RS iV (/en/skoda-octavia-rs-iv-2): feed build dropped it: no thumbnail
    - VIDEO: ŠKODA OCTAVIA RS iV (/en/press-releases/skoda-octavia-rs-iv-sustainable-yet-sporty/attachment/skoda-octavia-rs-iv-geneva-hd_h264): feed build dropped it: no thumbnail
    - Video: ŠKODA at Geneva Motor Show 2016 – Highlights (/en/highlight-skoda_visions_press_conference_mp4-2): feed build dropped it: no thumbnail
- `octavia/octavia-sportline`
  - **press_release** 2/3
    - Countless new features introduced to ŠKODA portfolio for 202 (/en/press-releases/countless-new-features-introduced-to-skoda-portfolio-for-2021-model-year): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **press_kit** 2/3
    - ŠKODA at the IAA - Press Kit (/en/press-kits/skoda-iaa-press-kit-2): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
- `enyaq-iv-2/enyaq-coupe-iv`
  - **press_release** 1/10
    - Škoda Auto marks 32nd year as IIHF World Championship offici (/en/press-releases/skoda-auto-marks-32nd-year-as-iihf-world-championship-official-main-sponsor-with-world-premiere-of-new-enyaq-rs-family): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto begins production of the new Enyaq and Enyaq Coup (/en/press-releases/skoda-auto-begins-production-of-the-new-enyaq-and-enyaq-coupe): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Unveiling the new Škoda Enyaq: World Premiere this Wednesday (/en/press-releases/unveiling-the-new-skoda-enyaq-world-premiere-this-wednesday): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Exterior sketches of the new Škoda Enyaq family: Modern Soli (/en/press-releases/exterior-sketches-of-the-new-skoda-enyaq-family-modern-solid-update-for-the-electric-best-seller): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - First sketches of Škoda Enyaq RS Race: Concept study combine (/en/press-releases/first-sketches-of-skoda-enyaq-rs-race-concept-study-combines-motorsport-dna-and-sustainability): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Škoda’s Enyaq family surpasses 200,000 production milestone (/en/press-releases/skodas-enyaq-family-surpasses-200000-production-milestone): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Three million and counting: Škoda Auto’s SUV success story c (/en/press-releases/three-million-and-counting-skoda-autos-suv-success-story-continues): imported, held at the push gate (2 PDF/MP4 link(s) await the DAM ingest)
    - Škoda Auto supports Tour de France Femmes avec ZWIFT for the (/en/press-releases/skoda-auto-supports-tour-de-france-femmes-avec-zwift-for-the-second-time): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
    - Celebrating each person’s uniqueness: Škoda Auto presents th (/en/press-releases/celebrating-each-persons-uniqueness-skoda-auto-presents-the-skoda-enyaq-coupe-respectline): imported, held at the push gate (1 PDF/MP4 link(s) await the DAM ingest)
  - **press_kit** 6/7
    - Laurin & Klement version expands Enyaq series (/en/press-kits/new-skoda-enyaq-laurin-klement-press-kit): imported, held at the push gate (12 PDF/MP4 link(s) await the DAM ingest)
