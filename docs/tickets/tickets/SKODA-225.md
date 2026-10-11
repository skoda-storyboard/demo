# SKODA-225, Columns: unequal split + intrinsic portrait (story 2-cell rows)
- **Epic:** E02, Core Blocks
- **Type:** block variant + import
- **Phase:** A/B · **Milestone:** M1 (cosmetic) / M2
- **GitHub issue:** [#142](https://github.com/skoda-storyboard/demo/issues/142)
- **Estimate:** 1 SP · AI-assisted 0.5d / manual 1d *(planning estimate, not a quote)*
- **Status (2026-10-01):** 🟡 Ready for QA on branch `skoda-225-columns-split`. Verified on DA drafts copies of the four
  stories (`/drafts/skoda-225/<slug>`). The real story pages are re-imported after merge.

## Origin
Demo URL/block sweep, 2026-09-25 (report §5; eMobility-B + Lifestyle groups).

## Problem (measured)
- 2-cell SiteOrigin rows (text | portrait card): the source cells are **518 | 320** on an 839 row (charging 629 | 210), top-aligned.
  The portrait shows at its **intrinsic size** (235×235; 150×224 in charging) centred, with the name 13px/600/19.5 and role
  13.33px/20 centred beneath. At 390 the cells stack and the portrait stays 235 wide, centred.
- EDS `columns`: 356 | 356 (flex:1), `align-items: center`, and the portrait is stretched to 356 wide (`.columns img { width:100% }`). At 390 it's
  342 wide at x=24.
- Measured on graffiti, Kylaq, charging (Lifestyle) and Peaq comfort (eMobility).

## Scope
- The importer (`story-flatten.js`) carries the source cell-width ratio into the Columns block (e.g. `Columns (split-62)` or a
  width hint).
- A Columns variant (scoped, so other templates keep the boilerplate): unequal widths, top alignment, portrait at its
  intrinsic size, centred caption.

## Acceptance Criteria
- [x] 1440: cells 518/320 (±4px), top-aligned; portrait 235×235 centred in its cell. *(518.3 / 320.4, 235×235 at +42.7 on
      graffiti, Kylaq and Peaq: identical to live; the portrait sits 24px higher, see Known differences.)*
- [x] 390: stacked, portrait 235 centred. *(235 at x77.5, as live.)*
- [x] Default Columns rendering elsewhere unchanged. *(20 of 20 blocks identical to `main` in markup and geometry at 1440 / 992 /
      768 / 390: press kit `callout`, `banners` and plain, a story row, model `stats`.)*

## Implementation (2026-10-01, developer-verified; QA pending)
Spec: [`columns-split.md`](../../ui-specs/columns-split.md). Contract `columns-split` **shape 2** adds `portrait-NNN`.

**Live findings that shaped it:**
- The cell widths are plain percentages in the head CSS (`#pgc-…{width:61.8%}`).
- The portraits are **500px files shown at an authored `width="235"`**, so "intrinsic" means the authored width, which DA
  drops. The importer carries it as `portrait-235`.
- The charging image fills its cell (`sow-image` at file size): `split-75`, no token.
- The source stacks at **780** (SiteOrigin's collapse), not 992.

**Importer:**
- `markCellWidths()` in `import-story-detail.js` `preprocess`;
- `emitMultiColumn()` emits `Columns (split-62, portrait-235)` (graffiti, Kylaq, Peaq) and `Columns (split-75)` (charging);
- equal, unmeasured and 3+ cell rows stay plain `Columns`;
- bundle rebuilt.

**Block:** `decorateSplit()` plus scoped `.columns.split` CSS:
- cell shares, 10px cell padding, −10px margin, top alignment;
- side by side from 781, source order when stacked;
- the authored-width or full-cell image;
- the 13 / 19.5 600 name and 10pt role, each on a 24px line.

**Verified on the branch preview vs live** (4 stories × 12 widths, 1440 → 375):
- Row, cells, image size and centring, the name / role line positions and the portrait-cell height (323) all match
  within ±2px.
- `npm run import:validate-blocks`: 0 errors.
- `npm test`: 799 / 803 (3 skipped). The 1 failure is the SKODA-303 header test, which also fails on `main` (see
  below).
- Lighthouse (local, graffiti): mobile 72–96 on the branch vs 79–95 on `main` (noise); desktop 97 vs 99.

**Known differences, owned elsewhere:**
- **Spacers (SKODA-801):** the importer drops the desktop spacer widgets and whitespace-only lines on every story, so the
  portrait sits 24px higher at ≥781, and when stacked the second cell starts 24px (graffiti) or 44px (Peaq) earlier.
- **Charging (SKODA-824):** the highlight panel's 32px top and 15px inner padding are 824's runtime half. Until then the
  image fills the cell (189.7 vs 149.7 @1440).

**Found on `main`** (not this ticket): SKODA-609's link containment (`scripts/links.js`) rewrites the nav's `/cs` … to
`https://www.skoda-storyboard.com/cs` before the header runs. The language switcher therefore links the live locale
home in a new tab instead of the current page in that locale (SKODA-303), and the SKODA-303 header test fails.

## Dependencies
SKODA-801 (flatten), SKODA-824 (rows inside the highlight panel).

## Import contract (SKODA-603)
Contract(s) `columns-split` in [`SKODA-PENDING-BLOCK-CONTRACTS.md`](../../planning/SKODA-PENDING-BLOCK-CONTRACTS.md). Pinned shape: `Columns (split-NN)`, where NN is the first cell's width share in % (518 | 320 → `split-62`). If this ticket needs a different DA shape, change the contract (and bump `shape`) in the same PR.
