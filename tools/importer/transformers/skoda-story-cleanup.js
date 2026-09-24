/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda story-detail (single-post) extra cleanup.
 *
 * Layered ON TOP of skoda-page-cleanup (register both; this one handles what the
 * shared cleanup does not). The story is a two-column article shell
 * `.columns > .content (primary) + .sidebar (secondary)`. This pass strips:
 *   - `.btn-group.social` / `.social-container` — the floating share cluster
 *     (skoda-page-cleanup only targets `.social-share`/`.share-bar`, not these).
 *   - the in-body deferred-media shells inside `.content` (see below).
 *
 * ⚠️ THE SIDEBAR IS NO LONGER DROPPED HERE (SKODA-801). It is rebuilt into a
 * `Style: sidebar` section (Cards + Tags) by skoda-story-aside.js so it renders
 * beside the body via the grid-on-main story layout. This transformer must NOT
 * remove `.sidebar` — storyAside owns it now.
 *
 * ⚠️ FLATTEN pass, in-body media deferred to SKODA-604. In-body galleries
 * (`a.colorbox`, `.sb-gallery`), embeds (`.embed-controller-wrapper`, `.page-embed`),
 * and the Media Box (`.search-results.media-box`) inside `.content` are the must-keep
 * content SKODA-604 restores full-fidelity on the hero demo stories. They are removed
 * here (with a LOG so the drop is never silent) so the common story flattens to clean
 * body content; the SKODA-801 flatten parser handles the SiteOrigin WIDGET tree.
 *
 * Selectors verified against .migration/work/samples/story-live.html + story.html.
 *
 * ⚠️ ORDERING: `.sidebar` holds the story's `ol.entry-tags` (the tag links the
 * shared metadata transformer derives `tags`/facets from). Both this transformer and
 * skoda-story-aside act in `afterTransform` and MUST be registered AFTER
 * skoda-metadata.js so the Metadata block is built (from the still-present tags)
 * before the sidebar is restructured. The floating social cluster carries no
 * metadata, so it goes early (beforeTransform).
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
    // In-body galleries / embeds / Media Box are the must-keep content this
    // flatten pass does NOT reconstruct (→ SKODA-604 full restore). Remove them
    // from the flattened body so the story is clean linear default content, and
    // LOG the counts so the drop is never silent. The sidebar is intentionally
    // left untouched here — skoda-story-aside rebuilds it.
    //
    // `div.cover-box.dark .related-stories` is the FULL-WIDTH bottom related band
    // (a sibling of `.columns`, outside the two-column article body). The canonical
    // related surface on the story is the sidebar `.related` (rebuilt by
    // skoda-story-aside → Cards); this bottom band is index-derivable duplicate
    // related content, so it is dropped for M1 (a dedicated related-rail block is
    // SKODA-604/rail work). Without this it would fall through as raw default content
    // and leak below the aside.
    const deferredSelectors = [
      '.search-results.media-box', '.sb-gallery', 'a.colorbox',
      '.embed-controller-wrapper', '.page-embed',
      '.cover-box .related-stories', '.cover-box.dark',
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
