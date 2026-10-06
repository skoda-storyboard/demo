# QA #266 - M1 / M2 triage and grouped ticket drafts

**Decision, 2026-10-06:** M1 must roughly hit the target; material demo failures are M1, minor differences are M2. **No publish yet.**

All seven spreadsheet pages are in the current M1 URL set, but that does not make every cosmetic discrepancy an M1 fix.
This register contains unpublished ticket proposals: no implementation issue, milestone, status or acceptance criterion has been changed. Versioning these documents in a PR does not authorize applying the proposals.

## Cut line

| Disposition | Meaning |
|---|---|
| M1 / P1 | Broken visible demo flows, dead-end navigation, lost essential controls/content, unreadable overlap, gross layout failures or a core-behavior diagnosis needed before the demo. |
| M2 / P2 | Non-blocking colors, glyphs, small gaps/type/tag/hover differences, optional click-surface/metadata parity, production SEO diagnosis and non-demo-page restoration. |
| No fix as stated | The reported presence is required/expected, or the statement alone is not evidence of a defect. Retain the source record and verify real regressions separately. |

Actual accessibility failures, broken existing PDF/MP4 downloads and major mobile whitespace/overflow are **promoted to M1** regardless of which minor-polish draft first mentions them.
Priorities are scheduling decisions, not a severity/confidence claim. Unverified observations remain unverified.

## Complete allocation

- **129 original observation records:** 24 M1-only, 100 M2-only, 1 mixed-phase, 4 no-fix-as-stated.
- **21 grouped drafts:** 10 M1 and 11 M2. Six reuse or propose moving existing open issues; 15 are new local follow-up/split/diagnostic drafts, not new GitHub issues.
- **Seven Lighthouse summaries / 28 scores** are separate from those 129 records. M1 baseline gates remain #42/#43/#44; one M2 diagnostic draft covers the reported SEO scores.
- **Two earlier user findings** (Series gap and Superb Twitter slot) are separately mapped to M2 and do not inflate the workbook count.

### M1: material demo failures

| Draft | Group | Source records | Proposed ownership |
|---|---|---:|---|
| [QA266-M1-01](../tickets/drafts/qa266/QA266-M1-01.md) | Restore image/video cart and rendition-download flows | 3 | New follow-up draft |
| [QA266-M1-02](../tickets/drafts/qa266/QA266-M1-02.md) | Remove search and Peaq-resource dead-end navigation | 4 | New follow-up draft |
| [QA266-M1-03](../tickets/drafts/qa266/QA266-M1-03.md) | Resolve the search/navigation overlap | 1 | [#144](https://github.com/skoda-storyboard/demo/issues/144) |
| [QA266-M1-04](../tickets/drafts/qa266/QA266-M1-04.md) | Prevent dates colliding with carousel navigation | 4 | New follow-up draft |
| [QA266-M1-05](../tickets/drafts/qa266/QA266-M1-05.md) | Verify and restore missing footer legal destinations | 1 | New follow-up draft |
| [QA266-M1-06](../tickets/drafts/qa266/QA266-M1-06.md) | Triage material Images/Videos filter mismatches | 2 | New follow-up draft |
| [QA266-M1-07](../tickets/drafts/qa266/QA266-M1-07.md) | Restore essential PR sidebar actions and quote layout | 4 | [#224](https://github.com/skoda-storyboard/demo/issues/224) |
| [QA266-M1-08](../tickets/drafts/qa266/QA266-M1-08.md) | Preserve the Zellmer grey FAQ/highlight panel | 1 | [#148](https://github.com/skoda-storyboard/demo/issues/148) |
| [QA266-M1-09](../tickets/drafts/qa266/QA266-M1-09.md) | Correct oversized/misaligned first-glimpse accordion media | 3 | [#68](https://github.com/skoda-storyboard/demo/issues/68) |
| [QA266-M1-10](../tickets/drafts/qa266/QA266-M1-10.md) | Restore first-glimpse Media Box/video action surfaces | 2 | New follow-up draft |

### M2: non-blocking parity and go-live follow-ups

| Draft | Group | Source records | Proposed ownership |
|---|---|---:|---|
| [QA266-M2-01](../tickets/drafts/qa266/QA266-M2-01.md) | Restore the small homepage promo lead inset | 2 | [#250](https://github.com/skoda-storyboard/demo/issues/250): move/extend proposal |
| [QA266-M2-02](../tickets/drafts/qa266/QA266-M2-02.md) | Polish listing sort colors and bottom spacing | 8 | [#248](https://github.com/skoda-storyboard/demo/issues/248): move/extend proposal |
| [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) | Polish shared teasers/rails and model-card ordering | 27 | New follow-up draft |
| [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) | Polish Media Box/file tiles and non-image action parity | 20 | New follow-up draft |
| [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) | Polish header/search/footer details | 16 | Split minor scope from #144 |
| [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) | Polish PR sidebar/prose and section separators | 14 | Split minor scope from #224 |
| [QA266-M2-07](../tickets/drafts/qa266/QA266-M2-07.md) | Polish press-kit/Series hero and bottom spacing | 4 + 1 separate finding | New follow-up draft |
| [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) | Polish first-glimpse sidebar/accordion/player details | 8 | New follow-up draft |
| [QA266-M2-09](../tickets/drafts/qa266/QA266-M2-09.md) | Reconcile caption backdrop and image-fit exceptions | 2 | New follow-up draft |
| [QA266-M2-10](../tickets/drafts/qa266/QA266-M2-10.md) | Preserve the non-M1 Superb kit Twitter fallback/slot | 0 + 1 separate finding | New follow-up draft |
| [QA266-M2-11](../tickets/drafts/qa266/QA266-M2-11.md) | Diagnose reported SEO scores before go-live | 0 + 7 audit summaries | New follow-up draft |

### Important triage calls

- The 8px promo inset, 4px listing-toolbar offset and 16px white-band separators are **M2**; they are not evidence of a broken page frame. Full-width green bands match origin.
- PR quote centering/the structured grey panel and repeated first-glimpse image misalignment are **M1** material component/layout concerns. Short quote rules, label colors and tiny gaps are M2.
- PDF add-to-cart/full-tile click parity is **M2** while direct file downloads work: closed #173 explicitly required direct file downloads and left the cart hook for later. A broken/missing existing PDF/MP4 download is M1.
- Generic filter complaints are **M1 diagnosis first**, not confirmed failures: preserve the curated-sample scope. If the issue is only an option label/color/layout detail, move that subcase to M2.
- Caption and image-fit requests need policy verification: do not remove the approved contrast backdrop or force distorted source image fitting without evidence/approval.
- The Superb kit is not in the current M1 set. Restore its Twitter fallback/slot in M2; a functioning full feed was not demonstrated on origin.

### Mixed source item: do not count it as two observations

`QA266-PK-ARTICLE-04` contains both video-control alignment and missing page-owned plus/download/page-link actions.
The missing toolbar is [QA266-M1-10](../tickets/drafts/qa266/QA266-M1-10.md) (**M1**); native-player alignment is [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) (**M2**). The original wording/ID stays one record; only ownership is split.

### No fix on the statement alone

| Source ID | Disposition |
|---|---|
| `QA266-HOME-01` | Pause/resume is explicitly required by SKODA-213 for accessibility. Retain it; presence is not a defect. |
| `QA266-HOME-06` | A declared fallback family alone does not prove the fallback is painted. No font-stack removal; verify actual glyph/metric problems under #44 and promote only a real material failure. |
| `QA266-HOME-39` | The statement itself says drawer-bottom languages are by design. No header-placement fix as stated; availability/routing follows #24/#243 and the approved locale scope, not all six production locales. |
| `QA266-IMAGES-04` | Original/1920 choices are part of the existing image-action contract. Retain the menu; the separate M1 action-flow reports determine whether selection actually works. |

## Existing-ticket handling: proposals only

- Keep #144 and #224 in M1 for material layout/actions; split their minor source-ID checklists into the M2 drafts.
- Keep #148 and the relevant shared #68 editorial-layout slice in M1. #68 currently has an M1 milestone despite its older M2 header; standalone FAQ measurements are not first-glimpse evidence.
- Propose moving cosmetic #250 and #248 to M2. #248 bottom pagination additions require an explicit checklist extension; they are not already covered.
- Closed implementation tickets are context, not open fixes. Do not blindly reopen #102/#130/#140/#173 or create duplicate blocks.
- The existing stricter visual acceptance gates are **unchanged**. At approved publication, record the rough-M1 decision and precise cosmetic deferrals rather than silently closing tickets under different criteria.

## Execution/collision order

Prioritize core navigation/media flows and readability. Integrate #148 before final #224 article-flow QA; address first-glimpse image layout through the existing shared primitive. Independent QA then measures rendered M1 pages.
M2 polish follows the M1 fixes on the same surfaces. All header, footer, teaser, downloads, accordion and PR drafts have explicit collision scopes; serialize uncertain overlap. A separate page/tab is not browser isolation.

## Per-observation ticket map

This is the complete source-ID allocation, not a list of confirmed defects. The [JSON dataset](SKODA-QA-266-OBSERVATIONS.json) retains original cells, line references, scores and the additive `triage` assignments.

| ID | Allocation | Draft ownership |
|---|---|---|
| `QA266-HOME-01` | no-fix-as-stated | No code fix as stated; retain under #266 / QA gates |
| `QA266-HOME-02` | M2 | [QA266-M2-01](../tickets/drafts/qa266/QA266-M2-01.md) |
| `QA266-HOME-03` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-HOME-04` | M2 | [QA266-M2-01](../tickets/drafts/qa266/QA266-M2-01.md) |
| `QA266-HOME-05` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-06` | no-fix-as-stated | No code fix as stated; retain under #266 / QA gates |
| `QA266-HOME-07` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-08` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-09` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-10` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-11` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-12` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-13` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-14` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-15` | M1 | [QA266-M1-04](../tickets/drafts/qa266/QA266-M1-04.md) |
| `QA266-HOME-16` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-17` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-18` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-19` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-20` | M1 | [QA266-M1-04](../tickets/drafts/qa266/QA266-M1-04.md) |
| `QA266-HOME-21` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-22` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-23` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-24` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-25` | M1 | [QA266-M1-04](../tickets/drafts/qa266/QA266-M1-04.md) |
| `QA266-HOME-26` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-27` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-28` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-29` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-30` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-31` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-32` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-HOME-33` | M1 | [QA266-M1-04](../tickets/drafts/qa266/QA266-M1-04.md) |
| `QA266-HOME-34` | M1 | [QA266-M1-05](../tickets/drafts/qa266/QA266-M1-05.md) |
| `QA266-HOME-35` | M1 | [QA266-M1-02](../tickets/drafts/qa266/QA266-M1-02.md) |
| `QA266-HOME-36` | M1 | [QA266-M1-03](../tickets/drafts/qa266/QA266-M1-03.md) |
| `QA266-HOME-37` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-HOME-38` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-HOME-39` | no-fix-as-stated | No code fix as stated; retain under #266 / QA gates |
| `QA266-IMAGES-01` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-IMAGES-02` | M1 | [QA266-M1-01](../tickets/drafts/qa266/QA266-M1-01.md) |
| `QA266-IMAGES-03` | M1 | [QA266-M1-01](../tickets/drafts/qa266/QA266-M1-01.md) |
| `QA266-IMAGES-04` | no-fix-as-stated | No code fix as stated; retain under #266 / QA gates |
| `QA266-IMAGES-05` | M1 | [QA266-M1-06](../tickets/drafts/qa266/QA266-M1-06.md) |
| `QA266-IMAGES-06` | M2 | [QA266-M2-09](../tickets/drafts/qa266/QA266-M2-09.md) |
| `QA266-IMAGES-07` | M2 | [QA266-M2-02](../tickets/drafts/qa266/QA266-M2-02.md) |
| `QA266-IMAGES-08` | M2 | [QA266-M2-02](../tickets/drafts/qa266/QA266-M2-02.md) |
| `QA266-IMAGES-09` | M2 | [QA266-M2-02](../tickets/drafts/qa266/QA266-M2-02.md) |
| `QA266-IMAGES-10` | M2 | [QA266-M2-02](../tickets/drafts/qa266/QA266-M2-02.md) |
| `QA266-IMAGES-11` | M1 | [QA266-M1-02](../tickets/drafts/qa266/QA266-M1-02.md) |
| `QA266-IMAGES-12` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-IMAGES-13` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-VIDEOS-01` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-VIDEOS-02` | M1 | [QA266-M1-01](../tickets/drafts/qa266/QA266-M1-01.md) |
| `QA266-VIDEOS-03` | M1 | [QA266-M1-06](../tickets/drafts/qa266/QA266-M1-06.md) |
| `QA266-VIDEOS-04` | M2 | [QA266-M2-02](../tickets/drafts/qa266/QA266-M2-02.md) |
| `QA266-VIDEOS-05` | M2 | [QA266-M2-02](../tickets/drafts/qa266/QA266-M2-02.md) |
| `QA266-VIDEOS-06` | M2 | [QA266-M2-02](../tickets/drafts/qa266/QA266-M2-02.md) |
| `QA266-VIDEOS-07` | M2 | [QA266-M2-02](../tickets/drafts/qa266/QA266-M2-02.md) |
| `QA266-VIDEOS-08` | M1 | [QA266-M1-02](../tickets/drafts/qa266/QA266-M1-02.md) |
| `QA266-VIDEOS-09` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-VIDEOS-10` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PR-ZELLMER-01-01` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-ZELLMER-01-02` | M1 | [QA266-M1-07](../tickets/drafts/qa266/QA266-M1-07.md) |
| `QA266-PR-ZELLMER-01-03` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-ZELLMER-01-04` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-ZELLMER-02-01` | M1 | [QA266-M1-07](../tickets/drafts/qa266/QA266-M1-07.md) |
| `QA266-PR-ZELLMER-02-02` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-ZELLMER-03` | M1 | [QA266-M1-08](../tickets/drafts/qa266/QA266-M1-08.md) |
| `QA266-PR-ZELLMER-04-01` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-ZELLMER-04-02` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-ZELLMER-04-03` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-ZELLMER-04-04` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-ZELLMER-04-05` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-ZELLMER-04-06` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-ZELLMER-04-07` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-ZELLMER-04-08` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-ZELLMER-05-01` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-PR-ZELLMER-05-02` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-PR-ZELLMER-05-03` | M2 | [QA266-M2-03](../tickets/drafts/qa266/QA266-M2-03.md) |
| `QA266-PR-ZELLMER-05-04` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-ZELLMER-06-01` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PR-ZELLMER-06-02` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PR-ZELLMER-06-03` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PR-SUPERB-01-01` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-SUPERB-01-02` | M1 | [QA266-M1-07](../tickets/drafts/qa266/QA266-M1-07.md) |
| `QA266-PR-SUPERB-01-03` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-SUPERB-01-04` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-SUPERB-02-01` | M1 | [QA266-M1-07](../tickets/drafts/qa266/QA266-M1-07.md) |
| `QA266-PR-SUPERB-02-02` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-SUPERB-03` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-SUPERB-04-01` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-SUPERB-04-02` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-SUPERB-04-03` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-SUPERB-04-04` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-SUPERB-04-05` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-SUPERB-04-06` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-SUPERB-04-07` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PR-SUPERB-04-08` | M2 | [QA266-M2-06](../tickets/drafts/qa266/QA266-M2-06.md) |
| `QA266-PR-SUPERB-05-01` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PR-SUPERB-05-02` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PR-SUPERB-05-03` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PK-HUB-01-01` | M2 | [QA266-M2-07](../tickets/drafts/qa266/QA266-M2-07.md) |
| `QA266-PK-HUB-02` | M2 | [QA266-M2-09](../tickets/drafts/qa266/QA266-M2-09.md) |
| `QA266-PK-HUB-03` | M2 | [QA266-M2-07](../tickets/drafts/qa266/QA266-M2-07.md) |
| `QA266-PK-HUB-04` | M1 | [QA266-M1-02](../tickets/drafts/qa266/QA266-M1-02.md) |
| `QA266-PK-HUB-05` | M2 | [QA266-M2-07](../tickets/drafts/qa266/QA266-M2-07.md) |
| `QA266-PK-HUB-06` | M2 | [QA266-M2-07](../tickets/drafts/qa266/QA266-M2-07.md) |
| `QA266-PK-HUB-07-01` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PK-HUB-07-02` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PK-HUB-07-03` | M2 | [QA266-M2-05](../tickets/drafts/qa266/QA266-M2-05.md) |
| `QA266-PK-ARTICLE-01-01` | M2 | [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) |
| `QA266-PK-ARTICLE-01-02` | M1 | [QA266-M1-10](../tickets/drafts/qa266/QA266-M1-10.md) |
| `QA266-PK-ARTICLE-01-03` | M2 | [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) |
| `QA266-PK-ARTICLE-01-04` | M2 | [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) |
| `QA266-PK-ARTICLE-02` | M2 | [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) |
| `QA266-PK-ARTICLE-03-01` | M2 | [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) |
| `QA266-PK-ARTICLE-03-02` | M1 | [QA266-M1-09](../tickets/drafts/qa266/QA266-M1-09.md) |
| `QA266-PK-ARTICLE-03-03` | M2 | [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) |
| `QA266-PK-ARTICLE-03-04` | M1 | [QA266-M1-09](../tickets/drafts/qa266/QA266-M1-09.md) |
| `QA266-PK-ARTICLE-03-05` | M1 | [QA266-M1-09](../tickets/drafts/qa266/QA266-M1-09.md) |
| `QA266-PK-ARTICLE-04` | mixed | [QA266-M1-10](../tickets/drafts/qa266/QA266-M1-10.md), [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) |
| `QA266-PK-ARTICLE-05` | M2 | [QA266-M2-08](../tickets/drafts/qa266/QA266-M2-08.md) |
| `QA266-PK-ARTICLE-06-01` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PK-ARTICLE-06-02` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PK-ARTICLE-06-03` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PK-ARTICLE-06-04` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PK-ARTICLE-06-05` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |
| `QA266-PK-ARTICLE-06-06` | M2 | [QA266-M2-04](../tickets/drafts/qa266/QA266-M2-04.md) |

## Provenance

Original issue: [#266](https://github.com/skoda-storyboard/demo/issues/266); [attachment](https://github.com/user-attachments/files/33109693/QA.Observations.xlsx); [intake](SKODA-QA-266-OBSERVATIONS.md).
Triage recorded at `2026-10-06T21:01:42.918423+00:00`. Original input before additive triage SHA-256: `15c161cd12b15515786936dacb94b8b2b9c6ebdad8c81d3948d799c8af677a02`.
No raw source statement, hyperlink, numbering, normalized observation ID or reported score was changed.
The local IDs are not assigned SKODA ticket IDs and there are no new implementation issue numbers. Ticket publication, milestone edits, scope amendments and runtime fixes remain outside this triage; the documentation may be committed in a PR for review.
