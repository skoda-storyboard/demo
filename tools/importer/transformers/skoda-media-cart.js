/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Škoda media cart page (`page-template-template-media-cart`, /en/media-cart/).
 *
 * The source page is a `.page-header` title ("Your downloads") over the client-rendered cart
 * widget (`.mr-media-cart`: Download package / Empty package / Your packages + the
 * `.media-cart-items` list) and the package history table (`#media-cart-history`). Nothing
 * below the title is authorable: the cart lives in the visitor's browser (SKODA-505a store).
 *
 * Output (SKODA-505b authoring contract, blocks/media-cart/media-cart.js):
 *   section 1  `Style: page-header`  h1 "Your downloads" (the source's 240px grey title band)
 *   section 2  an empty `Media Cart` block (the block renders the device's cart)
 * Package history is out of scope (SKODA-505b deviations), so `#media-cart-history` is dropped.
 * Runs after the listing chrome cleanup; the metadata transformer appends the Metadata block.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;
  const document = element.ownerDocument || payload.document;
  const cart = element.querySelector('.mr-media-cart, .media-cart-items');
  if (!cart) {
    console.warn('[media-cart] no .mr-media-cart on the page; left as is');
    return;
  }
  const sourceTitle = element.querySelector('.page-header h1, h1');
  const h1 = document.createElement('h1');
  h1.textContent = ((sourceTitle && sourceTitle.textContent) || '').trim() || 'Your downloads';

  const nodes = [
    h1,
    WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { Style: 'page-header' } }),
    document.createElement('hr'),
    WebImporter.DOMUtils.createTable([['Media Cart'], ['']], document),
  ];
  // everything else on the page is chrome or client-rendered cart UI
  element.replaceChildren(...nodes);
}
