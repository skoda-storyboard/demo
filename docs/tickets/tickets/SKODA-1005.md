# SKODA-1005, Translation pairs after go-live: where pairs live, the author "link a translation" step, a reciprocity check

- **Epic:** E10, Localization
- **Type:** feature / authoring workflow
- **Phase:** D · **Milestone:** M2 (go-live, 2027-01-02)
- **Estimate:** 3 SP · AI-assisted 1–2d / manual 3–4d *(planning estimate, not a quote)*. The approach depends on **Q-10**.
- **GitHub issue:** [#400](https://github.com/skoda-storyboard/demo/issues/400) (created 2026-10-20) (sub-issue of #83)
- **Status (2026-10-20):** 🔵 TODO (M2), no owner. Source:
  [locale review](../../reviews/SKODA-M2-LOCALE-ADVERSARIAL-REVIEW-2026-10-20.md) L-X-02, L-X-07, L-CS-03, L-CS-09.

## Why
hreflang, and so the language switcher (COM05), comes from one central bulk metadata sheet built from the WordPress
heads:
- it holds 9,649 rows for all locales, 5,928 of them for EN + CS;
- when the other locales arrive, 4,524 EN/CS rows get rewritten.

Once WordPress is switched off, nothing creates or maintains pairs. Requirement 6.8 says translation is a manual copy
made by the author, and the source slugs and category bases are translated per locale. So a pair can't be derived from
the path.

## Scope
- **Decision Q-10:** where pairs live. The proposed default is a **translation-group id** in page metadata (e.g.
  `translation-group: tg-459771`), indexed per locale, which the switcher and hreflang resolve at runtime. The
  alternatives are per-page `hreflang:*` metadata, or per-locale sheets.
- **Migration:** the SKODA-1004 runs write the group id from the published Polylang pairs, so the central sheet goes
  away. Items that exist in only one locale get no group.
- **Author step in DA/EW:**
  - "Copy to locale" creates the target doc with the source's group id. Set the target path manually or via the 1001
    per-locale base map; don't keep the same path.
  - "Link a translation" adds an existing doc to a group.
  
  Use a DA library item or a small DA app, plus an author-guide page.
- **Switcher and hreflang:**
  - resolve the group from `/{locale}/query-index.json`, published docs only;
  - same fixed order and omit rule as today (303a);
  - x-default on the homes only, as on the source.
- **Check:** a nightly or on-demand report of groups with two docs in one locale, one-way links and unpublished
  targets, delivered to the author report channel.

## Acceptance criteria
- [ ] Q-10 decided and recorded in the register.
- [ ] A test story copied to CS through the author step shows EN ↔ CS in both switchers and in both hreflang heads
      after both are published, with no edit to any central sheet.
- [ ] Unpublishing the CS copy removes CS from the EN switcher after the next index refresh.
- [ ] The check report flags a planted duplicate and a one-way link.
- [ ] The central bulk hreflang rows are removed after the 1004 runs.

## Dependencies
Q-10; SKODA-1001 (per-locale index, base map), SKODA-303a (switcher), SKODA-1004 (writes the group ids), SKODA-842
(DA library), SKODA-1002 (authoring of new translations).
