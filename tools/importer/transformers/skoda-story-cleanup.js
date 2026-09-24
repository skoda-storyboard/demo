/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda story-detail (single-post) extra cleanup.
 *
 * Layered ON TOP of skoda-page-cleanup (register both; this one handles what the
 * shared cleanup does not). The story is a two-column article shell
 * `.columns > .content (primary) + .sidebar (secondary)`. For the flatten-to-default
 * pass we keep the primary `.content` rich text and DROP:
 *   - `.sidebar` — the whole secondary column (subscribe + related "Explore more"
 *     cards + tags + promo); these become separate blocks under SKODA-604.
 *   - `.btn-group.social` / `.social-container` — the floating share cluster
 *     (skoda-page-cleanup only targets `.social-share`/`.share-bar`, not these).
 *
 * ⚠️ FLATTEN-TO-DEFAULT, NOT RECONSTRUCTION. In-body galleries (`a.colorbox`,
 * `.sb-gallery`), embeds (`.embed-controller-wrapper`, `.page-embed`), and the
 * Media Box (`.search-results.media-box`) inside `.content` are the must-keep
 * content this pass intentionally drops → logged for SKODA-801/814/604. They are
 * NOT removed here (they fall out of the default-content selection in the template),
 * so this transformer only strips the sidebar + floating social chrome.
 *
 * Selectors verified against .migration/work/samples/story-live.html + story.html.
 *
 * ⚠️ ORDERING: `.sidebar` holds the story's `ol.entry-tags` (the tag links the
 * shared metadata transformer derives `tags`/facets from). If we dropped the sidebar
 * in `beforeTransform`, those tags would be gone before metadata runs and the page
 * would ship tag-less (gate failure). So the sidebar is removed in `afterTransform`,
 * and this transformer MUST be registered AFTER skoda-metadata.js so the Metadata
 * block is built (from the still-present tags) before the sidebar is stripped from
 * the output. The floating social cluster carries no metadata, so it goes early.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    WebImporter.DOMUtils.remove(element, [
      '.btn-group.social',
      '.social-container',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Drop the secondary column AFTER metadata has read its entry-tags.
    WebImporter.DOMUtils.remove(element, ['.sidebar']);

    // In-body galleries / embeds / Media Box are the must-keep content this
    // flatten-to-default pass does NOT reconstruct (→ SKODA-801/814/604). Remove
    // them from the flattened body so the story is clean linear default content,
    // and LOG the counts so the drop is never silent.
    const deferredSelectors = [
      '.search-results.media-box', '.sb-gallery', 'a.colorbox',
      '.embed-controller-wrapper', '.page-embed',
    ];
    const dropped = {};
    deferredSelectors.forEach((sel) => {
      const n = element.querySelectorAll(sel).length;
      if (n) dropped[sel] = n;
    });
    if (Object.keys(dropped).length) {
      console.warn(
        `[story-cleanup] flatten-to-default dropped in-body media (deferred to SKODA-801/814/604): ${JSON.stringify(dropped)}`,
      );
    }
    WebImporter.DOMUtils.remove(element, deferredSelectors);
  }
}
